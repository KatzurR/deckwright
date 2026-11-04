/**
 * The committed catalog files (data/catalog) are what the app ships: they must be
 * schema-valid, bilingual and consistent with the mapping files.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CARD_TYPES, catalogFileSchema, type CardType } from '../../src/model/schema';
import { EXPECTED_COUNTS } from './expected';
import { readMapping } from './mapping';
import { cardIssues } from './run';
import { ROOT } from './sources';

function readCatalog(type: CardType) {
  return catalogFileSchema.parse(JSON.parse(readFileSync(join(ROOT, 'data', 'catalog', `${type}.json`), 'utf8')));
}

describe.each(CARD_TYPES.map((t) => [t]))('catalog %s', (type) => {
  const file = readCatalog(type);
  const mapping = readMapping(join(ROOT, 'data', 'mapping', `${type}.json`));

  it('is schema-valid, of the right type and complete', () => {
    expect(file.type).toBe(type);
    expect(file.entries).toHaveLength(EXPECTED_COUNTS[type]);
  });

  it('has both languages for every card and no further issues', () => {
    const problems = file.entries.flatMap((c) => cardIssues(c).map((i) => `${c.srdKey}: ${i}`));
    expect(problems).toEqual([]);
  });

  it('has unique keys and assigns every German entry only once', () => {
    const keys = file.entries.map((c) => c.srdKey);
    expect(new Set(keys).size).toBe(keys.length);
    // German card names may repeat (every class has "Attributswerterhöhung"); the qualified
    // German identifiers in the mapping ("Barde: Attributswerterhöhung") may not.
    const de = keys.map((k) => mapping[k!]?.de);
    expect(de.filter((n, i) => de.indexOf(n) !== i)).toEqual([]);
  });

  it('has a mapping entry for every card', () => {
    const missing = file.entries.filter((c) => !mapping[c.srdKey!]).map((c) => c.srdKey);
    expect(missing).toEqual([]);
  });

  it('contains no leftover extraction artefacts', () => {
    const bad = file.entries.filter((c) =>
      [c.name.de, c.name.en, c.description.de, c.description.en].some((t) => /­|ﬁ|ﬂ|\t| {2,}/.test(t ?? '')),
    );
    expect(bad.map((c) => c.srdKey)).toEqual([]);
  });
});
