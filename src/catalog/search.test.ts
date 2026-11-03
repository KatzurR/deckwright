import { describe, expect, it } from 'vitest';
import { EMPTY_FILTER, matchesFilter, normalise, searchCatalog } from './search';
import { actionSurge, bagOfHolding, blinded, fireball, longsword } from '../test/fixtures';
import type { Card } from '../model/schema';

const entries: Card[] = [fireball, longsword, blinded, actionSurge, bagOfHolding];
const ids = (cards: Card[]) => cards.map((c) => c.id);

describe('catalog search', () => {
  it('normalises case, accents, ß and apostrophes', () => {
    expect(normalise('  Größe  ÄÖÜ ’s ')).toBe("grosse aou 's");
  });

  it('finds by German and English name regardless of the language', () => {
    expect(ids(searchCatalog(entries, { ...EMPTY_FILTER, query: 'feuer' }, 'en'))).toEqual([fireball.id]);
    expect(ids(searchCatalog(entries, { ...EMPTY_FILTER, query: 'FIREBALL' }, 'de'))).toEqual([fireball.id]);
    expect(ids(searchCatalog(entries, { ...EMPTY_FILTER, query: 'nimmervoll beutel' }, 'de'))).toEqual([bagOfHolding.id]);
  });

  it('filters by type, spell level, school and class', () => {
    expect(ids(searchCatalog(entries, { ...EMPTY_FILTER, types: ['condition'] }, 'de'))).toEqual([blinded.id]);
    expect(ids(searchCatalog(entries, { ...EMPTY_FILTER, levels: [3] }, 'de'))).toEqual([fireball.id]);
    expect(searchCatalog(entries, { ...EMPTY_FILTER, levels: [1] }, 'de')).toEqual([]);
    expect(ids(searchCatalog(entries, { ...EMPTY_FILTER, schools: ['evocation'] }, 'de'))).toEqual([fireball.id]);
    expect(ids(searchCatalog(entries, { ...EMPTY_FILTER, classes: ['fighter'] }, 'de'))).toEqual([actionSurge.id]);
    expect(ids(searchCatalog(entries, { ...EMPTY_FILTER, classes: ['wizard', 'fighter'] }, 'de')).sort()).toEqual([actionSurge.id, fireball.id].sort());
  });

  it('sorts prefix matches first, then alphabetically in the UI language', () => {
    const result = searchCatalog(entries, { ...EMPTY_FILTER, query: 'b' }, 'de');
    expect(result[0].name.de).toBe('Blind');
    const all = searchCatalog(entries, EMPTY_FILTER, 'de').map((c) => c.name.de);
    expect(all).toEqual(['Blind', 'Feuerball', 'Langschwert', 'Nimmervoller Beutel', 'Tatendrang']);
  });

  it('matches everything with an empty filter', () => {
    expect(entries.every((c) => matchesFilter(c, EMPTY_FILTER))).toBe(true);
  });
});
