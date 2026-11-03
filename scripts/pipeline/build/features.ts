/**
 * Feature cards: class and subclass features, class options (Metamagic, Eldritch
 * Invocations), species traits and feats. All texts come from the PDFs; Open5e is used as
 * a cross-check (its class data contains typos and gaps) and for feat keys.
 *
 * German names repeat across classes ("Zusätzlicher Angriff"), so the German identifiers in
 * data/mapping/feature.json are qualified: "Kämpfer: Zusätzlicher Angriff",
 * "Champion: Verbesserter kritischer Treffer", "Zwerg: Dunkelsicht", "Talent: Wachsam".
 */
import type { ClassKey, FeatureCard, FeatureData } from '../../../src/model/schema';
import { conceptTokens, emptyDict, type ConceptDict } from '../concepts';
import type { Doc } from '../doc';
import { matchCandidates, type Candidate } from '../match';
import { parseClassFeatures, parseFeats, parseSpeciesTraits, type ParsedFeature } from '../parse/features';
import { CLASS_NAMES } from '../parse/spells';
import { normaliseName, slugify } from '../text';
import { assignGerman, assignmentReport, byEnglishName, type TypeResult } from './common';

export interface Open5eClass {
  key: string;
  name: string;
  subclass_of: { key: string; name: string } | null;
  features: { key: string; name: string; feature_type: string; gained_at: { level: number }[] }[];
}
export interface Open5eSpecies {
  key: string;
  name: string;
  traits: { name: string }[];
}
export interface Open5eFeat {
  key: string;
  name: string;
  type: string;
}

const DE_CLASS_NAME: Record<ClassKey, string> = Object.fromEntries(
  Object.entries(CLASS_NAMES.de).map(([name, key]) => [key, name.charAt(0).toUpperCase() + name.slice(1)]),
) as Record<ClassKey, string>;

function prereqLevel(text: string | undefined): string {
  if (!text) return '';
  const m = text.match(/Level (\d+)\+/) ?? text.match(/(\d+)\.\s*\p{L}*[Ss]tufe/u);
  return m ? m[1] : '';
}

/** Activation, recovery and uses inferred conservatively from the English text. */
export function inferUsage(en: string): Pick<FeatureData, 'activation' | 'recovery' | 'uses'> {
  const t = en.replace(/\*\*/g, '');
  let activation: FeatureData['activation'] = 'passive';
  if (/\b(?:as|take) a Bonus Action\b/i.test(t)) activation = 'bonus';
  else if (/\b(?:as|take) a Reaction\b/i.test(t)) activation = 'reaction';
  else if (/\b(?:as|take) (?:a Magic action|an action|the Magic action)\b/i.test(t)) activation = 'action';
  let recovery: FeatureData['recovery'];
  if (/\bfinish a Short or Long Rest\b/i.test(t)) recovery = 'short-rest';
  else if (/\bfinish a Long Rest\b/i.test(t)) recovery = 'long-rest';
  let uses: FeatureData['uses'];
  if (/a number of times equal to your Proficiency Bonus/i.test(t)) uses = { en: 'Proficiency Bonus', de: 'Übungsbonus' };
  else if (/\bOnce you use this (?:feature|benefit|trait)\b/i.test(t)) uses = { en: '1', de: '1' };
  return { activation, ...(recovery ? { recovery } : {}), ...(uses ? { uses } : {}) };
}

function enKey(f: ParsedFeature): string {
  switch (f.kind) {
    case 'class':
    case 'option':
      return `srd-2024_${f.classKey}_${slugify(f.name)}`;
    case 'subclass':
      return `srd-2024_${slugify(f.group ?? '')}_${slugify(f.name)}`;
    case 'species':
      return `srd-2024_${slugify(f.group ?? '')}_${slugify(f.name)}`;
    case 'feat':
      return `srd-2024_${slugify(f.name)}`;
  }
}

/** Qualified German identifier used in the mapping file. */
export function deId(f: ParsedFeature): string {
  switch (f.kind) {
    case 'class':
    case 'option':
      return `${DE_CLASS_NAME[f.classKey!]}: ${f.name}`;
    case 'subclass':
    case 'species':
      return `${f.group}: ${f.name}`;
    case 'feat':
      return `Talent: ${f.name}`;
  }
}

export function buildFeatures(
  classes: Open5eClass[],
  species: Open5eSpecies[],
  feats: Open5eFeat[],
  en: Doc,
  de: Doc,
  dict: ConceptDict = emptyDict(),
): TypeResult {
  const warnings: string[] = [];
  const parse = (doc: Doc) => [...parseClassFeatures(doc), ...parseSpeciesTraits(doc), ...parseFeats(doc)];
  const enAll = parse(en);
  const deAll = parse(de);

  // Species pairing (needed to group the traits): by number of traits and shared concepts.
  const speciesOf = (list: ParsedFeature[]) => {
    const m = new Map<string, ParsedFeature[]>();
    for (const f of list.filter((x) => x.kind === 'species')) m.set(f.group!, [...(m.get(f.group!) ?? []), f]);
    return m;
  };
  const enSpecies = speciesOf(enAll);
  const deSpecies = speciesOf(deAll);
  const speciesCand = (name: string, traits: ParsedFeature[], lang: 'en' | 'de'): Candidate => {
    const text = traits.map((t) => t.description).join('\n');
    return { id: name, primary: String(traits.length), tokens: conceptTokens(text, lang, dict), length: text.length };
  };
  const speciesMatch = matchCandidates(
    [...enSpecies].map(([n, t]) => speciesCand(n, t, 'en')),
    [...deSpecies].map(([n, t]) => speciesCand(n, t, 'de')),
  );
  const speciesDeToEn = new Map([...speciesMatch.pairs].map(([e, d]) => [d, e]));
  for (const a of speciesMatch.ambiguous) warnings.push(`species ambiguous: ${a.en.join(', ')} ↔ ${a.de.join(', ')}`);

  const primary = (f: ParsedFeature): string => {
    switch (f.kind) {
      case 'class':
      case 'subclass':
        return `${f.kind}|${f.classKey}|${f.level}`;
      case 'option':
        return `option|${f.classKey}|${prereqLevel(f.prerequisite)}`;
      case 'species':
        return `species|${f.lang === 'en' ? f.group : speciesDeToEn.get(f.group!) ?? `?${f.group}`}`;
      case 'feat':
        return `feat|${f.featCategory}|${prereqLevel(f.prerequisite)}`;
    }
  };
  const candidate = (f: ParsedFeature, id: string): Candidate => ({
    id,
    primary: primary(f),
    tokens: conceptTokens(f.description, f.lang, dict, f.refs),
    length: f.description.length,
  });

  // Keys and German identifiers must be unique; a name repeated within a class
  // (Improved Brutal Strike at levels 13 and 17) is qualified with its level.
  const repeated = <T,>(list: ParsedFeature[], id: (f: ParsedFeature) => T) => {
    const counts = new Map<T, number>();
    for (const f of list) counts.set(id(f), (counts.get(id(f)) ?? 0) + 1);
    return (f: ParsedFeature) => (counts.get(id(f)) ?? 0) > 1;
  };
  const enRepeated = repeated(enAll, enKey);
  const keyed = enAll.map((f) => ({ key: enRepeated(f) ? `${enKey(f)}-${f.level}` : enKey(f), f }));
  const deRepeated = repeated(deAll, deId);
  const deById = new Map<string, ParsedFeature>();
  for (const f of deAll) {
    const id = deRepeated(f) ? `${deId(f)} (${f.level}. Stufe)` : deId(f);
    if (deById.has(id)) warnings.push(`duplicate German identifier "${id}"`);
    deById.set(id, f);
  }
  for (const k of keyed.filter((k, i) => keyed.findIndex((x) => x.key === k.key) !== i)) {
    warnings.push(`duplicate key ${k.key}`);
  }

  const assignment = assignGerman(
    'feature',
    keyed.map(({ key, f }) => candidate(f, key)),
    [...deById].map(([id, f]) => candidate(f, id)),
  );

  // Cross-checks with Open5e.
  const pdfNames = new Set(enAll.map((f) => normaliseName(f.name)));
  for (const c of classes) {
    for (const f of c.features) {
      if (f.feature_type !== 'CLASS_LEVEL_FEATURE' || f.gained_at.length === 0) continue;
      if (/Subclass/.test(f.name)) continue;
      if (!pdfNames.has(normaliseName(f.name))) warnings.push(`Open5e ${c.name} feature "${f.name}" not found in the PDF (typo or renamed)`);
    }
  }
  for (const s of species) {
    for (const t of s.traits) {
      if (['Size', 'Speed', 'Creature Type'].includes(t.name)) continue;
      if (!pdfNames.has(normaliseName(t.name))) warnings.push(`Open5e ${s.name} trait "${t.name}" not found in the PDF`);
    }
  }
  const featKeys = new Map(feats.map((f) => [normaliseName(f.name), f.key]));
  for (const { key, f } of keyed) {
    if (f.kind === 'feat' && featKeys.get(normaliseName(f.name)) !== key) warnings.push(`feat "${f.name}" has no Open5e key ${key}`);
  }

  const entries: FeatureCard[] = [];
  for (const { key, f: e } of keyed) {
    const id = assignment.mapping[key]?.de;
    const d = id ? deById.get(id) : undefined;
    if (!d) continue;
    const origin: FeatureData['origin'] =
      e.kind === 'class' || e.kind === 'option'
        ? { kind: 'class', classKey: e.classKey, ...(e.level ? { level: e.level } : {}) }
        : e.kind === 'subclass'
          ? { kind: 'subclass', classKey: e.classKey, name: { en: e.group, de: d.group }, level: e.level }
          : e.kind === 'species'
            ? { kind: 'species', name: { en: e.group, de: d.group } }
            : { kind: 'feat', featCategory: e.featCategory };
    entries.push({
      id: key,
      srdKey: key,
      type: 'feature',
      source: 'srd-5.2.1',
      name: { en: e.name, de: d.name },
      description: { en: e.description, de: d.description },
      feature: {
        origin,
        ...inferUsage(e.description),
        ...(e.prerequisite || d.prerequisite ? { prerequisite: { en: e.prerequisite, de: d.prerequisite } } : {}),
      },
    });
  }
  entries.sort(byEnglishName);

  const count = (list: ParsedFeature[], kind: ParsedFeature['kind']) => list.filter((f) => f.kind === kind).length;
  return {
    type: 'feature',
    entries,
    mapping: assignment.mapping,
    report: {
      type: 'feature',
      counts: {
        'EN PDF class features': count(enAll, 'class'),
        'DE PDF class features': count(deAll, 'class'),
        'EN PDF subclass features': count(enAll, 'subclass'),
        'DE PDF subclass features': count(deAll, 'subclass'),
        'EN PDF class options': count(enAll, 'option'),
        'DE PDF class options': count(deAll, 'option'),
        'EN PDF species traits': count(enAll, 'species'),
        'DE PDF species traits': count(deAll, 'species'),
        'EN PDF feats': count(enAll, 'feat'),
        'DE PDF feats': count(deAll, 'feat'),
        'Open5e feats': feats.length,
        catalog: entries.length,
      },
      ...assignmentReport(assignment),
      warnings,
    },
  };
}
