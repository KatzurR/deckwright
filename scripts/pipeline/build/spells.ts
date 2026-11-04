/**
 * Spell cards: structure and keys from Open5e, English text from the English SRD PDF,
 * German text from the German SRD PDF.
 */
import type { Ability, ClassKey, DamageType, SpellCard } from '../../../src/model/schema';
import { ABILITIES, CLASSES, DAMAGE_TYPES } from '../../../src/model/schema';
import type { Doc } from '../doc';
import { diceTokens, type Candidate } from '../match';
import { parseSpells, type ParsedSpell } from '../parse/spells';
import { normaliseName } from '../text';
import { assignGerman, assignmentReport, byEnglishName, type TypeResult } from './common';

export interface Open5eSpell {
  key: string;
  name: string;
  level: number;
  school: { key: string };
  classes: { key: string }[];
  casting_time: string;
  reaction_condition: string | null;
  ritual: boolean;
  range_text: string;
  range: number;
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  material_specified: string | null;
  material_consumed: boolean;
  duration: string;
  concentration: boolean;
  attack_roll: boolean;
  saving_throw_ability: string;
  damage_roll: string;
  damage_types: string[];
}

const ABILITY_KEYS: Record<string, Ability> = {
  strength: 'str', dexterity: 'dex', constitution: 'con', intelligence: 'int', wisdom: 'wis', charisma: 'cha',
};

const OPEN5E_CASTING: Record<string, { unit: 'action' | 'bonus' | 'reaction' | 'minute' | 'hour'; amount?: number }> = {
  action: { unit: 'action' },
  'bonus-action': { unit: 'bonus' },
  reaction: { unit: 'reaction' },
  '1minute': { unit: 'minute', amount: 1 },
  '10minutes': { unit: 'minute', amount: 10 },
  '1hour': { unit: 'hour', amount: 1 },
  '8hours': { unit: 'hour', amount: 8 },
  '12hours': { unit: 'hour', amount: 12 },
  '24hours': { unit: 'hour', amount: 24 },
};

export function spellFingerprint(s: ParsedSpell): string {
  return [
    s.level,
    s.school,
    [...s.classes].sort().join('+'),
    s.castingTime.unit + (s.castingTime.amount ?? ''),
    s.ritual ? 'R' : '',
    s.range.kind + (s.range.feet ?? ''),
    (s.components.verbal ? 'V' : '') + (s.components.somatic ? 'S' : '') + (s.components.material ? 'M' : ''),
    s.duration.kind + (s.duration.amount ?? ''),
    s.concentration ? 'C' : '',
  ].join('|');
}

export function spellCandidate(s: ParsedSpell, id: string): Candidate {
  const text = `${s.description}\n${s.higherLevels ?? ''}`;
  return { id, primary: spellFingerprint(s), tokens: diceTokens(text).sort(), length: text.length };
}

/** Material cost in GP from the material text ("worth 300+ GP" / "im Wert von mindestens 300 GM"). */
export function materialCost(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const m = text.match(/([\d,.]+)\+?\s*(GP|GM)/i);
  return m ? Number(m[1].replace(/[.,]/g, '')) : undefined;
}

export function materialConsumed(text: string | undefined, lang: 'en' | 'de'): boolean {
  if (!text) return false;
  return lang === 'en' ? /\bconsumes?\b/i.test(text) : /verbraucht|verzehrt/i.test(text);
}

function toClassKey(key: string): ClassKey {
  const k = key.replace(/^srd-2024_/, '') as ClassKey;
  if (!CLASSES.includes(k)) throw new Error(`Unknown class key ${key}`);
  return k;
}

export function buildSpells(open5e: Open5eSpell[], enDoc: Doc, deDoc: Doc): TypeResult {
  const warnings: string[] = [];
  const en = parseSpells(enDoc);
  const de = parseSpells(deDoc);
  warnings.push(...en.errors.map((e) => `EN PDF: ${e}`), ...de.errors.map((e) => `DE PDF: ${e}`));

  // Open5e ↔ English PDF by name.
  const enByName = new Map(en.spells.map((s) => [normaliseName(s.name), s]));
  const pairs: { o: Open5eSpell; e: ParsedSpell }[] = [];
  for (const o of open5e) {
    const e = enByName.get(normaliseName(o.name));
    if (!e) warnings.push(`Open5e spell "${o.name}" not found in the English PDF`);
    else pairs.push({ o, e });
  }

  const deByName = new Map(de.spells.map((s) => [s.name, s]));
  const assignment = assignGerman(
    'spell',
    pairs.map(({ o, e }) => spellCandidate(e, o.key)),
    de.spells.map((s) => spellCandidate(s, s.name)),
  );

  let refinedCasting = 0;
  const entries: SpellCard[] = [];
  for (const { o, e } of pairs) {
    const m = assignment.mapping[o.key];
    const d = m ? deByName.get(m.de) : undefined;
    if (!d) continue;

    // Consistency checks Open5e ↔ PDF.
    const classes = o.classes.map((c) => toClassKey(c.key)).sort();
    if (o.level !== e.level) warnings.push(`${o.name}: level Open5e ${o.level} ≠ PDF ${e.level}`);
    if (o.school.key !== e.school) warnings.push(`${o.name}: school Open5e ${o.school.key} ≠ PDF ${e.school}`);
    if (classes.join() !== [...e.classes].sort().join()) {
      warnings.push(`${o.name}: classes Open5e ${classes.join(', ')} ≠ PDF ${[...e.classes].sort().join(', ')}`);
    }
    if (o.concentration !== e.concentration) warnings.push(`${o.name}: concentration Open5e ${o.concentration} ≠ PDF`);
    if (o.ritual !== e.ritual) warnings.push(`${o.name}: ritual Open5e ${o.ritual} ≠ PDF ${e.ritual}`);

    // Casting time: Open5e flattens some values ("1hour" for "8 hours"); the PDF is precise.
    const oc = OPEN5E_CASTING[o.casting_time];
    if (!oc) warnings.push(`${o.name}: unknown Open5e casting time "${o.casting_time}"`);
    const castingTime = { unit: e.castingTime.unit, amount: e.castingTime.amount };
    if (oc && (oc.unit !== castingTime.unit || oc.amount !== castingTime.amount)) {
      refinedCasting++;
      warnings.push(
        `${o.name}: casting time Open5e "${o.casting_time}" refined to PDF "${e.raw.castingTime}" (DE "${d.raw.castingTime}")`,
      );
    }
    const trigger =
      e.castingTime.trigger || d.castingTime.trigger
        ? { en: e.castingTime.trigger ?? o.reaction_condition ?? undefined, de: d.castingTime.trigger }
        : undefined;

    const save = o.saving_throw_ability ? ABILITY_KEYS[o.saving_throw_ability] : undefined;
    if (o.saving_throw_ability && !save) warnings.push(`${o.name}: unknown save "${o.saving_throw_ability}"`);
    const types = o.damage_types.filter((t): t is DamageType => (DAMAGE_TYPES as readonly string[]).includes(t));
    const dice = o.damage_roll?.trim() || undefined;
    const damage = dice || types.length ? { dice, types } : undefined;

    const materialTextEn = e.components.materialText;
    const materialTextDe = d.components.materialText;
    const consumed = materialConsumed(materialTextEn, 'en');
    if (consumed !== Boolean(o.material_consumed) && o.material) {
      warnings.push(`${o.name}: material consumed Open5e ${o.material_consumed} ≠ text (${consumed}) – text used`);
    }
    const cost = materialCost(materialTextEn);

    entries.push({
      id: o.key,
      srdKey: o.key,
      type: 'spell',
      source: 'srd-5.2.1',
      name: { en: e.name, de: d.name },
      description: { en: e.description, de: d.description },
      spell: {
        level: o.level,
        school: e.school,
        castingTime: trigger ? { ...castingTime, trigger } : castingTime,
        ritual: e.ritual,
        range: e.range,
        components: {
          verbal: o.verbal,
          somatic: o.somatic,
          material: o.material,
          ...(materialTextEn || materialTextDe ? { materialText: { en: materialTextEn, de: materialTextDe } } : {}),
          ...(cost !== undefined ? { materialCost: cost } : {}),
          ...(consumed ? { materialConsumed: true } : {}),
        },
        duration: e.duration,
        concentration: e.concentration,
        attack: o.attack_roll,
        ...(save && (ABILITIES as readonly string[]).includes(save) ? { save } : {}),
        ...(damage ? { damage } : {}),
        classes,
        ...(e.higherLevels || d.higherLevels ? { higherLevels: { en: e.higherLevels, de: d.higherLevels } } : {}),
      },
    });
  }
  entries.sort(byEnglishName);

  return {
    type: 'spell',
    entries,
    mapping: assignment.mapping,
    report: {
      type: 'spell',
      counts: {
        'Open5e': open5e.length,
        'EN PDF': en.spells.length,
        'DE PDF': de.spells.length,
        catalog: entries.length,
        'casting time refined from PDF': refinedCasting,
      },
      ...assignmentReport(assignment),
      warnings,
    },
  };
}
