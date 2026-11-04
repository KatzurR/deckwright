// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { CardsDatabase, DeckStore } from './db';
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
