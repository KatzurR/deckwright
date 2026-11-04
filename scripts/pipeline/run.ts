/**
 * Data pipeline (SPEC §6): builds the SRD 5.2.1 catalog in German and English.
 *
 *   npm run pipeline            download Open5e, extract the PDFs, build data/catalog
 *   npm run pipeline:offline    same, but only from data/cache
 *
 * Outputs: data/catalog/<type>.json, data/mapping/<type>.json, data/pipeline-report.md.
 * Exits with code 1 if an SRD entry has no German assignment, a German entry is assigned
 * twice, or a card does not validate.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATALOG_FORMAT_VERSION, catalogFileSchema, cardSchema, type Card, type CatalogFile } from '../../src/model/schema';
import { hasProblems, MAPPING_DIR, type ReportSection, type TypeResult } from './build/common';
import { buildActions, type Open5eWeapon } from './build/actions';
import { buildConditions } from './build/conditions';
import { buildFeatures, type Open5eClass, type Open5eFeat, type Open5eSpecies } from './build/features';
import { buildItems, type Open5eMagicItem } from './build/items';
import { buildSpells, type Open5eSpell } from './build/spells';
import { addCards, emptyDict } from './concepts';
import { makeDoc } from './doc';
import { writeMapping } from './mapping';
import { renderReport } from './report';
import { loadOpen5e, loadPdf, ROOT, type SourceOptions } from './sources';

export const CATALOG_DIR = join(ROOT, 'data', 'catalog');
export const REPORT_FILE = join(ROOT, 'data', 'pipeline-report.md');

/** Problems of a single card beyond the schema: both languages must be present. */
export function cardIssues(card: Card): string[] {
  const issues: string[] = [];
  const parsed = cardSchema.safeParse(card);
  if (!parsed.success) issues.push(...parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
  for (const lang of ['de', 'en'] as const) {
    if (!card.name[lang]?.trim()) issues.push(`name.${lang} missing`);
    if (!card.description[lang]?.trim()) issues.push(`description.${lang} missing`);
  }
  if (card.id !== card.srdKey) issues.push('id must equal srdKey');
  if (card.source !== 'srd-5.2.1') issues.push('source must be srd-5.2.1');
  return issues;
}

export interface BuiltType {
  result: TypeResult;
  /** Cards failing {@link cardIssues}. */
  invalid: { card: Card; issues: string[] }[];
  /** Missing/duplicate assignments or invalid cards – the catalog file must not be written. */
  failed: boolean;
}

/**
 * Build all card types from the sources without writing anything.
 * Matched spells and conditions serve as cross-language anchors for the free-text types.
 */
export async function buildCatalog(opts: SourceOptions): Promise<BuiltType[]> {
  const log = opts.log ?? (() => {});
  const [spells, weapons, magicitems, classes, species, feats] = await Promise.all([
    loadOpen5e('spells', opts),
    loadOpen5e('weapons', opts),
    loadOpen5e('magicitems', opts),
    loadOpen5e('classes', opts),
    loadOpen5e('species', opts),
    loadOpen5e('feats', opts),
  ]);
  log('Parsing PDFs …');
  const en = makeDoc('en', loadPdf('en', opts).lines);
  const de = makeDoc('de', loadPdf('de', opts).lines);

  const dict = emptyDict();
  const builders: [string, () => TypeResult][] = [
    ['spell', () => buildSpells(spells as Open5eSpell[], en, de)],
    ['condition', () => buildConditions(en, de)],
    ['action', () => buildActions(weapons as Open5eWeapon[], en, de)],
    ['item', () => buildItems(magicitems as Open5eMagicItem[], en, de, dict)],
    [
      'feature',
      () => buildFeatures(classes as Open5eClass[], species as Open5eSpecies[], feats as Open5eFeat[], en, de, dict),
    ],
  ];

  const out: BuiltType[] = [];
  for (const [type, build] of builders) {
    log(`Building ${type} …`);
    const result = build();
    if (type === 'spell') addCards(dict, result.entries, 'spell');
    if (type === 'condition') addCards(dict, result.entries, 'cond');
    const invalid = result.entries
      .map((card) => ({ card, issues: cardIssues(card) }))
      .filter((x) => x.issues.length > 0);
    for (const { card, issues } of invalid) result.report.warnings.unshift(`INVALID ${card.srdKey}: ${issues.join('; ')}`);
    out.push({ result, invalid, failed: hasProblems(result.report.problems) || invalid.length > 0 });
  }
  return out;
}

export function catalogFile(result: TypeResult): CatalogFile {
  return catalogFileSchema.parse({
    formatVersion: CATALOG_FORMAT_VERSION,
    type: result.type,
    source: 'srd-5.2.1',
    entries: result.entries,
  });
}

export async function runPipeline(opts: SourceOptions): Promise<{ ok: boolean; sections: ReportSection[] }> {
  const start = Date.now();
  const log = opts.log ?? (() => {});
  const built = await buildCatalog(opts);

  let ok = true;
  const sections: ReportSection[] = [];
  mkdirSync(CATALOG_DIR, { recursive: true });
  for (const { result, invalid, failed } of built) {
    const type = result.type;
    writeMapping(join(MAPPING_DIR, `${type}.json`), result.mapping);
    if (failed) {
      ok = false;
      log(`  ✗ ${type}: ${result.report.problems.missing.length} missing, ${result.report.problems.duplicates.length} duplicate, ${invalid.length} invalid – catalog not written`);
    } else {
      writeFileSync(join(CATALOG_DIR, `${type}.json`), `${JSON.stringify(catalogFile(result), null, 1)}\n`);
      log(`  ✓ ${type}: ${result.entries.length} cards`);
    }
    sections.push(result.report);
  }

  writeFileSync(
    REPORT_FILE,
    renderReport(sections, { generatedAt: new Date().toISOString(), offline: opts.offline, durationMs: Date.now() - start }),
  );
  log(`Report: ${REPORT_FILE}`);
  return { ok, sections };
}

const isMain = process.argv[1] && new URL(import.meta.url).pathname === process.argv[1];
if (isMain) {
  const offline = process.argv.includes('--offline');
  runPipeline({ offline, log: (m) => console.log(m) })
    .then(({ ok }) => {
      if (!ok) {
        console.error('Pipeline failed – see data/pipeline-report.md');
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
