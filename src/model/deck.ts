/**
 * Pure, immutable deck operations (SPEC §7). Storage is handled separately in src/storage.
 */
import type { Card, CardInput, Deck, Lang } from './schema';
import { cardSchema } from './schema';
import { terms } from '../i18n/terms';

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Fallback for non-secure contexts (RFC 4122 v4 layout)
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const now = () => new Date().toISOString();

export function createDeck(name: string, lang: Lang): Deck {
  const ts = now();
  return { id: newId(), name: name.trim(), lang, cards: [], createdAt: ts, updatedAt: ts };
}

function touch(deck: Deck, cards: Card[], extra: Partial<Deck> = {}): Deck {
  return { ...deck, ...extra, cards, updatedAt: now() };
}

/** Deep copy of a card with a fresh id (catalog adoption, duplication, copying between decks). */
export function cloneCard(card: CardInput | Card): Card {
  const copy = cardSchema.parse(structuredClone(card));
  return { ...copy, id: newId() };
}

/** Take catalog entries over into a deck: new ids, srdKey is kept (SPEC §6.3). */
export function adoptCatalogCards(deck: Deck, entries: Card[]): Deck {
  return touch(deck, [...deck.cards, ...entries.map(cloneCard)]);
}

export function addCard(deck: Deck, card: Card, index = deck.cards.length): Deck {
  const cards = [...deck.cards];
  cards.splice(index, 0, card);
  return touch(deck, cards);
}

export function updateCard(deck: Deck, card: Card): Deck {
  if (!deck.cards.some((c) => c.id === card.id)) throw new Error(`Card ${card.id} is not in deck ${deck.id}`);
  return touch(deck, deck.cards.map((c) => (c.id === card.id ? card : c)));
}

export function removeCards(deck: Deck, ids: Iterable<string>): Deck {
  const set = new Set(ids);
  return touch(deck, deck.cards.filter((c) => !set.has(c.id)));
}

/** Duplicate cards in place: each copy is inserted right after its original. */
export function duplicateCards(deck: Deck, ids: Iterable<string>): Deck {
  const set = new Set(ids);
  const cards: Card[] = [];
  for (const card of deck.cards) {
    cards.push(card);
    if (set.has(card.id)) cards.push(cloneCard(card));
  }
  return touch(deck, cards);
}

/** Move one card to a new position (drag and drop, up/down buttons). */
export function moveCard(deck: Deck, from: number, to: number): Deck {
  if (from === to || from < 0 || from >= deck.cards.length) return deck;
  const cards = [...deck.cards];
  const [card] = cards.splice(from, 1);
  cards.splice(Math.max(0, Math.min(to, cards.length)), 0, card);
  return touch(deck, cards);
}

export const SORT_KEYS = ['name', 'type', 'level'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

const TYPE_ORDER: Record<Card['type'], number> = { spell: 0, action: 1, feature: 2, item: 3, condition: 4 };

export function cardName(card: Card, lang: Lang): string {
  return card.name[lang]?.trim() || card.name[lang === 'de' ? 'en' : 'de']?.trim() || '';
}

function levelOf(card: Card): number {
  if (card.type === 'spell') return card.spell.level;
  if (card.type === 'feature') return card.feature.origin.level ?? 0;
  return -1;
}

/** Stable sort by the given key, ties broken by name in the deck language. */
export function sortCards(deck: Deck, key: SortKey): Deck {
  const collator = new Intl.Collator(deck.lang, { sensitivity: 'base', numeric: true });
  const byName = (a: Card, b: Card) => collator.compare(cardName(a, deck.lang), cardName(b, deck.lang));
  const compare: Record<SortKey, (a: Card, b: Card) => number> = {
    name: byName,
    type: (a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || byName(a, b),
    level: (a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || levelOf(a) - levelOf(b) || byName(a, b),
  };
  return touch(deck, [...deck.cards].sort(compare[key]));
}

/** Copy cards from one deck into another (new ids, originals stay). */
export function copyCardsToDeck(source: Deck, target: Deck, ids: Iterable<string>): Deck {
  const set = new Set(ids);
  return touch(target, [...target.cards, ...source.cards.filter((c) => set.has(c.id)).map(cloneCard)]);
}

export function duplicateDeck(deck: Deck, lang: Lang = deck.lang): Deck {
  const copy = createDeck(`${deck.name} (${lang === 'de' ? 'Kopie' : 'copy'})`, deck.lang);
  return { ...copy, options: deck.options ? { ...deck.options } : undefined, cards: deck.cards.map(cloneCard) };
}

export function renameDeck(deck: Deck, name: string): Deck {
  return touch(deck, deck.cards, { name: name.trim() || deck.name });
}

export function setDeckLanguage(deck: Deck, lang: Lang): Deck {
  return touch(deck, deck.cards, { lang });
}

/** Cards whose texts are missing in the deck language (shown as a hint in the UI). */
export function cardsMissingLanguage(deck: Deck): Card[] {
  return deck.cards.filter((c) => !c.name[deck.lang]?.trim() || !c.description[deck.lang]?.trim());
}

/** Text of a card in the deck language, falling back to the other language. */
export function localized(text: { de?: string; en?: string } | undefined, lang: Lang): string {
  if (!text) return '';
  return text[lang]?.trim() || text[lang === 'de' ? 'en' : 'de']?.trim() || '';
}

export function sourceLabel(card: Card, lang: Lang): string {
  return terms(lang).sources[card.source ?? 'custom'];
}
