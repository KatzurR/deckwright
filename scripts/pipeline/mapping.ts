/**
 * Mapping files data/mapping/<type>.json: the binding assignment srdKey → German name
 * (SPEC §6.2 step 3). Automatic entries are rewritten on every run; entries marked
 * `"manual": true` are kept and take precedence over the automatic result.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface MappingEntry {
  de: string;
  manual?: true;
  /** Optional note for manual entries (why it was set by hand). */
  note?: string;
}
export type Mapping = Record<string, MappingEntry>;

export function readMapping(file: string): Mapping {
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, 'utf8')) as Mapping;
}

export function manualEntries(mapping: Mapping): Mapping {
  return Object.fromEntries(Object.entries(mapping).filter(([, v]) => v.manual));
}

/**
 * Merge automatic pairs with the manual entries of an existing mapping.
 * Manual entries win; automatic pairs that would reuse a German name taken by a manual
 * entry are dropped (and reported by the caller as unmatched).
 */
export function mergeMapping(auto: Map<string, string>, existing: Mapping): { mapping: Mapping; dropped: string[] } {
  const manual = manualEntries(existing);
  const takenDe = new Set(Object.values(manual).map((v) => v.de));
  const mapping: Mapping = { ...manual };
  const dropped: string[] = [];
  for (const [key, de] of auto) {
    if (manual[key]) continue;
    if (takenDe.has(de)) {
      dropped.push(key);
      continue;
    }
    mapping[key] = { de };
  }
  return { mapping: sortMapping(mapping), dropped };
}

export function sortMapping(mapping: Mapping): Mapping {
  return Object.fromEntries(Object.entries(mapping).sort(([a], [b]) => a.localeCompare(b)));
}

export interface MappingProblems {
  /** srdKeys without a German assignment. */
  missing: string[];
  /** German names assigned to more than one srdKey. */
  duplicates: { de: string; keys: string[] }[];
  /** German names in the mapping that do not exist in the German PDF. */
  unknownDe: { key: string; de: string }[];
}

export function checkMapping(mapping: Mapping, srdKeys: string[], deNames: Iterable<string>): MappingProblems {
  const known = new Set(deNames);
  const missing = srdKeys.filter((k) => !mapping[k]);
  const byDe = new Map<string, string[]>();
  for (const [k, v] of Object.entries(mapping)) {
    if (!srdKeys.includes(k)) continue;
    byDe.set(v.de, [...(byDe.get(v.de) ?? []), k]);
  }
  const duplicates = [...byDe].filter(([, keys]) => keys.length > 1).map(([de, keys]) => ({ de, keys }));
  const unknownDe = Object.entries(mapping)
    .filter(([k, v]) => srdKeys.includes(k) && !known.has(v.de))
    .map(([key, v]) => ({ key, de: v.de }));
  return { missing, duplicates, unknownDe };
}

export function writeMapping(file: string, mapping: Mapping) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(sortMapping(mapping), null, 2)}\n`);
}
