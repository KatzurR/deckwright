/**
 * Local storage in IndexedDB via Dexie (SPEC §7). Decks are stored as whole documents
 * (a deck is an ordered list of cards), saved automatically on every change.
 */
import Dexie, { type Table } from 'dexie';
import { deckSchema, type Deck } from '../model/schema';

export const DB_NAME = 'deckwright';

/** Database name used before the project was renamed to Deckwright; read once by {@link DeckStore.migrateLegacy}. */
export const LEGACY_DB_NAME = 'open-tabletop-cards';

const LEGACY_MIGRATION_KEY = 'legacyMigration';

interface MetaEntry {
  key: string;
  value: string;
}

export class CardsDatabase extends Dexie {
  decks!: Table<Deck, string>;
  meta!: Table<MetaEntry, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({ decks: '&id, name, updatedAt', meta: '&key' });
  }
}

export class DeckStore {
  constructor(readonly db: CardsDatabase = new CardsDatabase()) {}

  /** All decks, most recently changed first. Invalid records are skipped, not thrown. */
  async list(): Promise<Deck[]> {
    const raw = await this.db.decks.orderBy('updatedAt').reverse().toArray();
    return raw.flatMap((d) => {
      const parsed = deckSchema.safeParse(d);
      return parsed.success ? [parsed.data] : [];
    });
  }

  async get(id: string): Promise<Deck | undefined> {
    const raw = await this.db.decks.get(id);
    return raw ? deckSchema.parse(raw) : undefined;
  }

  /** Validates before writing so that broken data never reaches the database. */
  async save(deck: Deck): Promise<Deck> {
    const valid = deckSchema.parse(deck);
    await this.db.decks.put(valid);
    return valid;
  }

  async delete(id: string): Promise<void> {
    await this.db.decks.delete(id);
  }

  /** Import a deck; if a deck with the same id exists, the import gets a new id. */
  async import(deck: Deck, newId: () => string): Promise<Deck> {
    const exists = await this.db.decks.get(deck.id);
    return this.save(exists ? { ...deck, id: newId() } : deck);
  }

  /**
   * One-time migration after the rename: copies the decks from the old database
   * ({@link LEGACY_DB_NAME}) into this one. Runs at most once per database (a marker in the
   * `meta` table records it), skips decks whose id already exists and invalid records, and
   * leaves the old database untouched as a backup. Returns the number of copied decks.
   */
  migrateLegacy(legacyName = LEGACY_DB_NAME): Promise<number> {
    // single flight while running (React StrictMode runs the start-up effect twice in
    // development); afterwards the marker in `meta` prevents a second copy
    this.migrations[legacyName] ??= this.copyLegacy(legacyName).finally(() => {
      delete this.migrations[legacyName];
    });
    return this.migrations[legacyName];
  }

  private readonly migrations: Record<string, Promise<number>> = {};

  private async copyLegacy(legacyName: string): Promise<number> {
    if (await this.db.meta.get(LEGACY_MIGRATION_KEY)) return 0;
    let legacyDecks: Deck[] = [];
    if (await Dexie.exists(legacyName)) {
      const legacy = new Dexie(legacyName);
      try {
        await legacy.open();
        const raw = legacy.tables.some((t) => t.name === 'decks') ? await legacy.table('decks').toArray() : [];
        legacyDecks = raw.flatMap((d) => {
          const parsed = deckSchema.safeParse(d);
          return parsed.success ? [parsed.data] : [];
        });
      } finally {
        legacy.close();
      }
    }
    let copied = 0;
    await this.db.transaction('rw', this.db.decks, this.db.meta, async () => {
      for (const deck of legacyDecks) {
        if (await this.db.decks.get(deck.id)) continue;
        await this.db.decks.put(deck);
        copied++;
      }
      await this.db.meta.put({ key: LEGACY_MIGRATION_KEY, value: `${legacyName}: ${copied} decks` });
    });
    return copied;
  }

  /** Ask the browser not to evict our data under storage pressure (best effort). */
  static async requestPersistence(): Promise<boolean> {
    try {
      return (await navigator.storage?.persist?.()) ?? false;
    } catch {
      return false;
    }
  }
}
