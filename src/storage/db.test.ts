// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { CardsDatabase, DB_NAME, DeckStore, LEGACY_DB_NAME } from './db';
import { addCard, createDeck } from '../model/deck';
import { fireball } from '../test/fixtures';

let db: CardsDatabase;
afterEach(async () => {
  await db?.delete();
});

function store() {
  db = new CardsDatabase(`test-${Math.random()}`);
  return new DeckStore(db);
}

describe('DeckStore (IndexedDB)', () => {
  it('saves, lists (newest first), loads and deletes decks', async () => {
    const s = store();
    const a = await s.save({ ...createDeck('A', 'de'), updatedAt: '2026-01-01T00:00:00Z' });
    const b = await s.save(addCard({ ...createDeck('B', 'en'), updatedAt: '2026-01-01T00:00:00Z' }, fireball));
    expect((await s.list()).map((d) => d.name)).toEqual(['B', 'A']);
    expect(await s.get(b.id)).toEqual(b);
    await s.delete(a.id);
    expect((await s.list()).map((d) => d.name)).toEqual(['B']);
  });

  it('refuses to store invalid decks', async () => {
    const s = store();
    await expect(s.save({ ...createDeck('A', 'de'), name: '' })).rejects.toThrow();
    expect(await s.list()).toEqual([]);
  });

  it('skips broken records instead of failing the whole list', async () => {
    const s = store();
    await s.save(createDeck('ok', 'de'));
    await db.decks.put({ id: 'broken', name: 'x' } as never);
    expect((await s.list()).map((d) => d.name)).toEqual(['ok']);
  });

  it('imports with a new id when the id already exists', async () => {
    const s = store();
    const deck = await s.save(createDeck('A', 'de'));
    const imported = await s.import(deck, () => 'new-id');
    expect(imported.id).toBe('new-id');
    expect((await s.list())).toHaveLength(2);
    const fresh = await s.import(createDeck('C', 'de'), () => 'unused');
    expect(fresh.id).not.toBe('unused');
  });
});

describe('DeckStore.migrateLegacy (rename from open-tabletop-cards)', () => {
  const legacyName = () => `legacy-${Math.random()}`;

  /** Creates a database with the schema the app used before the rename. */
  async function legacyDb(name: string, decks: unknown[]) {
    const old = new Dexie(name);
    old.version(1).stores({ decks: '&id, name, updatedAt' });
    await old.table('decks').bulkPut(decks);
    old.close();
    return old;
  }

  it('uses the new database name and remembers the old one', () => {
    expect(DB_NAME).toBe('deckwright');
    expect(LEGACY_DB_NAME).toBe('open-tabletop-cards');
  });

  it('copies decks from the old database once and leaves the old database intact', async () => {
    const name = legacyName();
    const a = addCard(createDeck('Alt A', 'de'), fireball);
    const b = createDeck('Alt B', 'en');
    const old = await legacyDb(name, [a, b, { id: 'broken', name: 'x' }]);
    const s = store();
    expect(await s.migrateLegacy(name)).toBe(2);
    expect((await s.list()).map((d) => d.name).sort()).toEqual(['Alt A', 'Alt B']);
    expect(await s.get(a.id)).toEqual(a);
    // runs only once: decks deleted afterwards do not come back
    await s.delete(b.id);
    expect(await s.migrateLegacy(name)).toBe(0);
    expect((await s.list()).map((d) => d.name)).toEqual(['Alt A']);
    expect(await Dexie.exists(name)).toBe(true);
    await old.delete();
  });

  it('keeps decks that already exist in the new database', async () => {
    const name = legacyName();
    const s = store();
    const current = await s.save(createDeck('Neu', 'de'));
    const old = await legacyDb(name, [{ ...current, name: 'Alt' }]);
    expect(await s.migrateLegacy(name)).toBe(0);
    expect((await s.get(current.id))?.name).toBe('Neu');
    await old.delete();
  });

  it('copies only once when called concurrently', async () => {
    const name = legacyName();
    const old = await legacyDb(name, [createDeck('Alt', 'de')]);
    const s = store();
    expect(await Promise.all([s.migrateLegacy(name), s.migrateLegacy(name)])).toEqual([1, 1]);
    expect(await s.list()).toHaveLength(1);
    await old.delete();
  });

  it('does nothing when there is no old database', async () => {
    const s = store();
    const name = legacyName();
    expect(await s.migrateLegacy(name)).toBe(0);
    expect(await Dexie.exists(name)).toBe(false);
    expect(await s.list()).toEqual([]);
  });
});
