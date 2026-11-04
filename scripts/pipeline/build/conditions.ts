/**
 * Condition cards from the Rules Glossary of both PDFs (Open5e has no 2024 conditions).
 */
import type { ConditionCard } from '../../../src/model/schema';
import type { Doc } from '../doc';
import { diceTokens, type Candidate } from '../match';
import { effectsAsList, parseGlossary, type GlossaryEntry, type GlossaryTag } from '../parse/glossary';
import { slugify } from '../text';
import { assignGerman, assignmentReport, byEnglishName, type TypeResult } from './common';

export function glossaryKey(tag: GlossaryTag, enName: string): string {
  return `srd-2024_${tag}_${slugify(enName)}`;
}

export function glossaryCandidate(e: GlossaryEntry, id: string): Candidate {
  return {
    id,
    primary: `${e.tag}|${e.runIns}`,
    tokens: [...diceTokens(e.markdown), ...(e.markdown.match(/\b\d+\b/g) ?? [])].sort(),
    length: e.markdown.length,
  };
}

/** Shared by conditions and glossary actions. */
export function assignGlossary(type: 'condition' | 'action', tag: GlossaryTag, en: Doc, de: Doc) {
  const enEntries = parseGlossary(en).filter((e) => e.tag === tag);
  const deEntries = parseGlossary(de).filter((e) => e.tag === tag);
  const assignment = assignGerman(
    type,
    enEntries.map((e) => glossaryCandidate(e, glossaryKey(tag, e.name))),
    deEntries.map((e) => glossaryCandidate(e, e.name)),
  );
  const deByName = new Map(deEntries.map((e) => [e.name, e]));
  const pairs = enEntries
    .map((e) => ({ key: glossaryKey(tag, e.name), e, d: deByName.get(assignment.mapping[glossaryKey(tag, e.name)]?.de ?? '') }))
    .filter((p): p is { key: string; e: GlossaryEntry; d: GlossaryEntry } => p.d !== undefined);
  return { enEntries, deEntries, assignment, pairs };
}

export function buildConditions(en: Doc, de: Doc): TypeResult {
  const { enEntries, deEntries, assignment, pairs } = assignGlossary('condition', 'condition', en, de);
  const entries: ConditionCard[] = pairs.map(({ key, e, d }) => ({
    id: key,
    srdKey: key,
    type: 'condition',
    source: 'srd-5.2.1',
    name: { en: e.name, de: d.name },
    description: { en: effectsAsList(e.markdown), de: effectsAsList(d.markdown) },
  }));
  entries.sort(byEnglishName);
  return {
    type: 'condition',
    entries,
    mapping: assignment.mapping,
    report: {
      type: 'condition',
      counts: { 'EN PDF': enEntries.length, 'DE PDF': deEntries.length, catalog: entries.length },
      ...assignmentReport(assignment),
      warnings: [],
    },
  };
}
