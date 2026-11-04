/** Catalog search and filters (SPEC §6.3): name in both languages, type, spell level, school, class. */
import type { Card, CardType, ClassKey, Lang, School } from '../model/schema';
import { cardName } from '../model/deck';

export interface CatalogFilter {
  query: string;
  types: CardType[];
  levels: number[];
  schools: School[];
  classes: ClassKey[];
}

export const EMPTY_FILTER: CatalogFilter = { query: '', types: [], levels: [], schools: [], classes: [] };

/** Case- and accent-insensitive normalisation ("Ä" → "a", "ß" → "ss"). */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function classesOf(card: Card): ClassKey[] {
  if (card.type === 'spell') return card.spell.classes;
  if (card.type === 'feature' && card.feature.origin.classKey) return [card.feature.origin.classKey];
  return [];
}

export function matchesFilter(card: Card, filter: CatalogFilter): boolean {
  if (filter.types.length && !filter.types.includes(card.type)) return false;
  if (filter.levels.length && !(card.type === 'spell' && filter.levels.includes(card.spell.level))) return false;
  if (filter.schools.length && !(card.type === 'spell' && filter.schools.includes(card.spell.school))) return false;
  if (filter.classes.length && !classesOf(card).some((c) => filter.classes.includes(c))) return false;
  const query = normalise(filter.query);
  if (query) {
    const haystack = normalise(`${card.name.de ?? ''} | ${card.name.en ?? ''}`);
    if (!query.split(' ').every((word) => haystack.includes(word))) return false;
  }
  return true;
}

/**
 * Filter and rank: names starting with the query come first, then alphabetical in the
 * given language.
 */
export function searchCatalog(entries: Card[], filter: CatalogFilter, lang: Lang): Card[] {
  const query = normalise(filter.query);
  const collator = new Intl.Collator(lang, { sensitivity: 'base', numeric: true });
  const starts = (c: Card) =>
    query && [c.name.de, c.name.en].some((n) => n && normalise(n).startsWith(query)) ? 0 : 1;
  return entries
    .filter((c) => matchesFilter(c, filter))
    .sort((a, b) => starts(a) - starts(b) || collator.compare(cardName(a, lang), cardName(b, lang)));
}
