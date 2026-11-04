/**
 * Action cards: the general actions of the Rules Glossary and one weapon-attack card per
 * SRD weapon (values from Open5e, names and rule texts from both PDFs).
 */
import type { ActionCard, DamageType, Lang, Mastery, WeaponProperty } from '../../../src/model/schema';
import { AMMUNITION, DAMAGE_TYPES, MASTERIES, WEAPON_PROPERTIES } from '../../../src/model/schema';
import { METRES_PER_FOOT } from '../../../src/model/units';
import type { Doc } from '../doc';
import type { Candidate } from '../match';
import { parseWeaponRules, parseWeaponTable, type PropertyRule, type TableWeapon } from '../parse/weapons';
import { normaliseName } from '../text';
import { assignGerman, assignmentReport, byEnglishName, type TypeResult } from './common';
import { assignGlossary } from './conditions';

export interface Open5eWeapon {
  key: string;
  name: string;
  damage_dice: string;
  damage_type: { key: string };
  range: number;
  long_range: number;
  is_simple: boolean;
  properties: { property: { name: string; type: string | null }; detail: string | null }[];
}

/** Display names of the properties on German cards (as in the German Weapons table). */
const PROPERTY_DISPLAY: Record<Lang, Record<PropertyRule, string>> = {
  en: {
    ammunition: 'Ammunition', finesse: 'Finesse', heavy: 'Heavy', light: 'Light', loading: 'Loading',
    range: 'Range', reach: 'Reach', thrown: 'Thrown', 'two-handed': 'Two-Handed', versatile: 'Versatile',
  },
  de: {
    ammunition: 'Geschosse', finesse: 'Finesse', heavy: 'Schwer', light: 'Leicht', loading: 'Laden',
    range: 'Reichweite', reach: 'Weitreichend', thrown: 'Wurfwaffe', 'two-handed': 'Zweihändig', versatile: 'Vielseitig',
  },
};

export function weaponFingerprint(w: TableWeapon): string {
  const toFeet = (n: number) => (w.lang === 'de' ? Math.round(n / METRES_PER_FOOT) : n);
  return [
    w.category,
    w.kind,
    w.dice,
    w.damageType,
    w.properties.join('+'),
    w.mastery,
    w.range ? `${toFeet(w.range[0])}/${toFeet(w.range[1])}` : '',
    w.versatileDice ?? '',
  ].join('|');
}

function ammunitionOf(o: Open5eWeapon): (typeof AMMUNITION)[number] | undefined {
  const detail = o.properties.find((p) => p.property.name === 'Ammunition')?.detail ?? '';
  if (/arrow/i.test(detail)) return 'arrow';
  if (/bolt/i.test(detail)) return 'bolt';
  if (/needle/i.test(detail)) return 'needle';
  if (/bullet/i.test(detail)) return o.is_simple ? 'sling-bullet' : 'firearm-bullet';
  return undefined;
}

/** Rule paragraphs of a weapon's properties in one language. */
export function weaponDescription(
  props: WeaponProperty[],
  hasRange: boolean,
  rules: Map<PropertyRule, string>,
  lang: Lang,
  fallback: string,
): string {
  const keys: PropertyRule[] = [...props];
  if (hasRange) keys.push('range');
  const sep = lang === 'en' ? '.' : ':';
  const paragraphs = keys
    .filter((k) => rules.get(k))
    .map((k) => `**${PROPERTY_DISPLAY[lang][k]}${sep}** ${rules.get(k)!.replace(/\n\n/g, ' ')}`);
  return paragraphs.length ? paragraphs.join('\n\n') : fallback;
}

export function buildActions(open5e: Open5eWeapon[], en: Doc, de: Doc): TypeResult {
  const warnings: string[] = [];

  // --- General actions from the glossary
  const glossary = assignGlossary('action', 'action', en, de);
  const general: ActionCard[] = glossary.pairs.map(({ key, e, d }) => ({
    id: key,
    srdKey: key,
    type: 'action',
    source: 'srd-5.2.1',
    name: { en: e.name, de: d.name },
    description: { en: e.markdown, de: d.markdown },
    action: { actionType: 'action' },
  }));
  const attack = glossary.pairs.find((p) => p.key === 'srd-2024_action_attack');
  const attackIntro = { en: attack?.e.markdown.split('\n\n')[0] ?? '', de: attack?.d.markdown.split('\n\n')[0] ?? '' };

  // --- Weapons
  const enTable = parseWeaponTable(en);
  const deTable = parseWeaponTable(de);
  const enRules = parseWeaponRules(en);
  const deRules = parseWeaponRules(de);
  const enByName = new Map(enTable.map((w) => [normaliseName(w.name), w]));
  const pairs: { o: Open5eWeapon; t: TableWeapon }[] = [];
  for (const o of open5e) {
    const t = enByName.get(normaliseName(o.name));
    if (!t) warnings.push(`Open5e weapon "${o.name}" not in the English Weapons table`);
    else pairs.push({ o, t });
  }
  // Same mapping file as the glossary actions (data/mapping/action.json).
  const weaponAssignment = assignGerman(
    'action',
    pairs.map(({ o, t }) => ({ id: o.key, primary: weaponFingerprint(t), tokens: [], length: 0 }) satisfies Candidate),
    deTable.map((w) => ({ id: w.name, primary: weaponFingerprint(w), tokens: [], length: 0 }) satisfies Candidate),
  );
  const deByName = new Map(deTable.map((w) => [w.name, w]));

  const weapons: ActionCard[] = [];
  for (const { o, t } of pairs) {
    const deName = weaponAssignment.mapping[o.key]?.de;
    const d = deName ? deByName.get(deName) : undefined;
    if (!d) continue;
    const props = o.properties
      .filter((p) => p.property.type !== 'Mastery')
      .map((p) => p.property.name.toLowerCase() as WeaponProperty)
      .filter((p) => (WEAPON_PROPERTIES as readonly string[]).includes(p))
      .sort();
    const masteryName = o.properties.find((p) => p.property.type === 'Mastery')?.property.name.toLowerCase();
    const mastery = (MASTERIES as readonly string[]).includes(masteryName ?? '') ? (masteryName as Mastery) : undefined;
    if (props.join() !== t.properties.join()) warnings.push(`${o.name}: properties Open5e ${props.join()} ≠ PDF ${t.properties.join()}`);
    if (mastery !== t.mastery) warnings.push(`${o.name}: mastery Open5e ${mastery} ≠ PDF ${t.mastery}`);
    const damageType = o.damage_type.key as DamageType;
    if (!(DAMAGE_TYPES as readonly string[]).includes(damageType)) warnings.push(`${o.name}: damage type ${damageType}`);
    const versatile = o.properties.find((p) => p.property.name === 'Versatile')?.detail ?? undefined;
    const ranged = props.includes('ammunition');
    const hasRange = o.range > 0;
    const ammunition = ammunitionOf(o);
    weapons.push({
      id: o.key,
      srdKey: o.key,
      type: 'action',
      source: 'srd-5.2.1',
      name: { en: o.name, de: d.name },
      description: {
        en: weaponDescription(props, hasRange, enRules.properties, 'en', attackIntro.en),
        de: weaponDescription(props, hasRange, deRules.properties, 'de', attackIntro.de),
      },
      action: {
        actionType: 'action',
        weapon: {
          key: o.key,
          category: o.is_simple ? 'simple' : 'martial',
          kind: ranged ? 'ranged' : 'melee',
          ...(versatile ? { versatileDice: versatile } : {}),
          properties: props,
          ...(ammunition ? { ammunition } : {}),
        },
        damage: { dice: o.damage_dice, types: [damageType] },
        ...(hasRange ? { range: { normal: o.range, long: o.long_range || undefined } } : {}),
        ...(!ranged ? { reach: props.includes('reach') ? 10 : 5 } : {}),
        ...(mastery
          ? {
              mastery,
              masteryText: { en: enRules.masteries.get(mastery), de: deRules.masteries.get(mastery) },
            }
          : {}),
      },
    });
  }

  // One mapping file for the whole action type (general actions + weapons).
  const mapping = { ...glossary.assignment.mapping, ...weaponAssignment.mapping };
  const problems = {
    missing: [...glossary.assignment.problems.missing, ...weaponAssignment.problems.missing],
    duplicates: [...glossary.assignment.problems.duplicates, ...weaponAssignment.problems.duplicates],
    unknownDe: [...glossary.assignment.problems.unknownDe, ...weaponAssignment.problems.unknownDe],
  };
  const entries = [...general, ...weapons].sort(byEnglishName);
  const g = assignmentReport(glossary.assignment);
  const w = assignmentReport(weaponAssignment);
  return {
    type: 'action',
    entries,
    mapping,
    report: {
      type: 'action',
      counts: {
        'EN PDF glossary actions': glossary.enEntries.length,
        'DE PDF glossary actions': glossary.deEntries.length,
        'Open5e weapons': open5e.length,
        'EN PDF weapons': enTable.length,
        'DE PDF weapons': deTable.length,
        catalog: entries.length,
      },
      autoMatches: g.autoMatches + w.autoMatches,
      manualMatches: g.manualMatches + w.manualMatches,
      ambiguous: [...g.ambiguous, ...w.ambiguous],
      unmatchedEn: [...g.unmatchedEn, ...w.unmatchedEn],
      unmatchedDe: [...g.unmatchedDe, ...w.unmatchedDe],
      problems,
      warnings,
    },
  };
}
