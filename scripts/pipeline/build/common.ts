/**
 * Shared building blocks for the per-type builders: assignment of German entries and
 * the report section structure.
 */
import { join } from 'node:path';
import type { Card, CardType } from '../../../src/model/schema';
import { matchCandidates, type Candidate } from '../match';
import { checkMapping, manualEntries, mergeMapping, readMapping, type Mapping, type MappingProblems } from '../mapping';
import { ROOT } from '../sources';

export const MAPPING_DIR = join(ROOT, 'data', 'mapping');

export interface ReportSection {
  type: CardType;
  counts: Record<string, number>;
  autoMatches: number;
  manualMatches: number;
  ambiguous: { primary: string; en: string[]; de: string[] }[];
  /** Entries without any fingerprint partner (before manual entries are applied). */
  unmatchedEn: string[];
  unmatchedDe: string[];
  problems: MappingProblems;
  warnings: string[];
}

export interface TypeResult {
  type: CardType;
  entries: Card[];
  mapping: Mapping;
  report: ReportSection;
}

export interface Assignment {
  mapping: Mapping;
  autoMatches: number;
  manualMatches: number;
  ambiguous: ReportSection['ambiguous'];
  unmatchedEn: string[];
  unmatchedDe: string[];
  problems: MappingProblems;
}

/**
 * Resolve srdKey → German name for one type: manual entries from the existing mapping file
 * first, then automatic fingerprint matching for the rest.
 */
export function assignGerman(
  type: string,
  en: Candidate[],
  de: Candidate[],
  existing: Mapping = readMapping(join(MAPPING_DIR, `${type}.json`)),
): Assignment {
  const manual = manualEntries(existing);
  const manualDe = new Set(Object.values(manual).map((m) => m.de));
  const result = matchCandidates(
    en.filter((c) => !manual[c.id]),
    de.filter((c) => !manualDe.has(c.id)),
  );
  const { mapping } = mergeMapping(result.pairs, existing);
  const srdKeys = en.map((c) => c.id);
  // Only keep entries for keys that still exist.
  for (const k of Object.keys(mapping)) if (!srdKeys.includes(k) && !mapping[k].manual) delete mapping[k];
  const problems = checkMapping(mapping, srdKeys, de.map((c) => c.id));
  return {
    mapping,
    autoMatches: Object.values(mapping).filter((m) => !m.manual).length,
    manualMatches: srdKeys.filter((k) => mapping[k]?.manual).length,
    ambiguous: result.ambiguous,
    unmatchedEn: result.unmatchedEn,
    unmatchedDe: result.unmatchedDe,
    problems,
  };
}

/** Report fields that come straight from an {@link Assignment}. */
export function assignmentReport(a: Assignment) {
  return {
    autoMatches: a.autoMatches,
    manualMatches: a.manualMatches,
    ambiguous: a.ambiguous,
    unmatchedEn: a.unmatchedEn,
    unmatchedDe: a.unmatchedDe,
    problems: a.problems,
  };
}

export function hasProblems(p: MappingProblems): boolean {
  return p.missing.length > 0 || p.duplicates.length > 0 || p.unknownDe.length > 0;
}

export function byEnglishName(a: Card, b: Card): number {
  return (a.name.en ?? '').localeCompare(b.name.en ?? '', 'en');
}
