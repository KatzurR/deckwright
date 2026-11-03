/**
 * Deck exchange file (SPEC §7): versioned JSON so that other tools can produce it.
 * The format is documented in docs/deck-format.md, the JSON Schema in docs/deck-format.schema.json.
 */
import { z } from 'zod';
import { deckSchema, type Deck } from './schema';

export const DECK_FORMAT_VERSION = 1;
export const DECK_FILE_GENERATOR = 'open-tabletop-cards';

export const deckFileSchema = z
  .object({
    formatVersion: z.literal(DECK_FORMAT_VERSION),
    generator: z.string().optional(),
    exportedAt: z.string().optional(),
    deck: deckSchema,
  })
  .strict();
export type DeckFile = z.infer<typeof deckFileSchema>;

export function serializeDeck(deck: Deck, exportedAt = new Date()): string {
  const file: DeckFile = {
    formatVersion: DECK_FORMAT_VERSION,
    generator: DECK_FILE_GENERATOR,
    exportedAt: exportedAt.toISOString(),
    deck,
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

export class DeckFileError extends Error {
  constructor(
    message: string,
    readonly code: 'json' | 'version' | 'invalid',
    readonly issues: string[] = [],
  ) {
    super(message);
    this.name = 'DeckFileError';
  }
}

/** Parse and validate a deck file. Throws {@link DeckFileError} with readable issue paths. */
export function parseDeckFile(text: string): Deck {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new DeckFileError(`Not a JSON file: ${(e as Error).message}`, 'json');
  }
  const version = (raw as { formatVersion?: unknown } | null)?.formatVersion;
  if (typeof version !== 'number') throw new DeckFileError('Missing formatVersion', 'version');
  if (version > DECK_FORMAT_VERSION) {
    throw new DeckFileError(`formatVersion ${version} is newer than supported (${DECK_FORMAT_VERSION})`, 'version');
  }
  const result = deckFileSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new DeckFileError(`Invalid deck file (${issues.length} problems)`, 'invalid', issues);
  }
  return result.data.deck;
}

/** File name for a deck export, e.g. "magierzauber-grad-1-3.otc.json". */
export function deckFileName(deck: Deck, extension = 'otc.json'): string {
  const slug = deck.name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/ß/g, 'ss')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'deck'}.${extension}`;
}

/** JSON Schema of the deck file (published as docs/deck-format.schema.json). */
export function deckFileJsonSchema(): unknown {
  return z.toJSONSchema(deckFileSchema, { target: 'draft-2020-12', io: 'input' });
}
