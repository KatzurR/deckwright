/**
 * Local storage in IndexedDB via Dexie (SPEC §7). Decks are stored as whole documents
 * (a deck is an ordered list of cards), saved automatically on every change.
 */
import Dexie, { type Table } from 'dexie';
import { deckSchema, type Deck } from '../model/schema';

export const DB_NAME = 'open-tabletop-cards';

export class CardsDatabase extends Dexie {
  decks!: Table<Deck, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({ decks: '&id, name, updatedAt' });
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

  /** Ask the browser not to evict our data under storage pressure (best effort). */
  static async requestPersistence(): Promise<boolean> {
    try {
      return (await navigator.storage?.persist?.()) ?? false;
    } catch {
      return false;
    }
  }
}
