/**
 * Integration test of the data pipeline (SPEC §6.2): builds every card type from the
 * cached sources and checks the totals per type against both PDFs.
 *
 * Needs the Open5e downloads in data/cache/open5e (created by `npm run pipeline`) and either
 * the cached PDF extracts (data/cache/srd-*.xml) or Poppler to create them. Skipped otherwise.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CardType } from '../../src/model/schema';
import { EXPECTED_COUNTS } from './expected';
import { buildCatalog, catalogFile, type BuiltType } from './run';
import { CACHE, hasPoppler, OPEN5E_ENDPOINTS, ROOT } from './sources';

const haveOpen5e = OPEN5E_ENDPOINTS.every((e) => existsSync(join(CACHE, 'open5e', `${e}.json`)));
const havePdfText = ['de', 'en'].every((l) => existsSync(join(CACHE, `srd-${l}.xml`))) || hasPoppler();

/** Report count keys that hold the number of entries found in each PDF, per type. */
const PDF_COUNT_KEYS: Record<CardType, [string, string][]> = {
  spell: [['EN PDF', 'DE PDF']],
  condition: [['EN PDF', 'DE PDF']],
  action: [
    ['EN PDF glossary actions', 'DE PDF glossary actions'],
    ['EN PDF weapons', 'DE PDF weapons'],
  ],
  item: [['EN PDF', 'DE PDF']],
  feature: [
    ['EN PDF class features', 'DE PDF class features'],
    ['EN PDF subclass features', 'DE PDF subclass features'],
    ['EN PDF class options', 'DE PDF class options'],
    ['EN PDF species traits', 'DE PDF species traits'],
    ['EN PDF feats', 'DE PDF feats'],
  ],
};

describe.skipIf(!haveOpen5e || !havePdfText)('pipeline against both SRD PDFs', () => {
  let built: Map<CardType, BuiltType>;

  beforeAll(async () => {
    const list = await buildCatalog({ offline: true });
    built = new Map(list.map((b) => [b.result.type, b]));
  }, 180_000);

  it.each(Object.keys(EXPECTED_COUNTS).map((t) => [t as CardType]))('%s: totals agree in both PDFs', (type) => {
    const { result } = built.get(type)!;
    const counts = result.report.counts;
    let pdfTotal = 0;
    for (const [en, de] of PDF_COUNT_KEYS[type]) {
      expect(counts[en], `${en}`).toBeGreaterThan(0);
      expect(counts[de], `${de} = ${en}`).toBe(counts[en]);
      pdfTotal += counts[en];
    }
    expect(pdfTotal).toBe(EXPECTED_COUNTS[type]);
    expect(counts.catalog).toBe(EXPECTED_COUNTS[type]);
    expect(result.entries).toHaveLength(EXPECTED_COUNTS[type]);
  });

  it('matches the Open5e counts where Open5e has one entry per PDF entry', () => {
    expect(built.get('spell')!.result.report.counts['Open5e']).toBe(EXPECTED_COUNTS.spell);
    expect(built.get('action')!.result.report.counts['Open5e weapons']).toBe(38);
    expect(built.get('feature')!.result.report.counts['Open5e feats']).toBe(17);
  });

  it.each(Object.keys(EXPECTED_COUNTS).map((t) => [t as CardType]))('%s: every entry assigned exactly once', (type) => {
    const { result, invalid, failed } = built.get(type)!;
    expect(result.report.problems).toEqual({ missing: [], duplicates: [], unknownDe: [] });
    expect(invalid).toEqual([]);
    expect(failed).toBe(false);
  });

  it.each(Object.keys(EXPECTED_COUNTS).map((t) => [t as CardType]))('%s: committed catalog is up to date', (type) => {
    const committed = JSON.parse(readFileSync(join(ROOT, 'data', 'catalog', `${type}.json`), 'utf8'));
    expect(catalogFile(built.get(type)!.result)).toEqual(committed);
  });
});
