/**
 * Weapons from the Equipment chapter: the Weapons table and the rule texts of the
 * weapon properties and mastery properties.
 */
import type { DamageType, Lang, Mastery, WeaponProperty } from '../../../src/model/schema';
import { bodyMarkdown, lineText, section, splitEntries, type Doc } from '../doc';
import type { Line } from '../pdf/layout';
import { tidy } from '../text';

export type PropertyRule = WeaponProperty | 'range';

export const PROPERTY_NAMES: Record<Lang, Record<string, PropertyRule>> = {
  en: {
    ammunition: 'ammunition', finesse: 'finesse', heavy: 'heavy', light: 'light', loading: 'loading',
    range: 'range', reach: 'reach', thrown: 'thrown', 'two-handed': 'two-handed', versatile: 'versatile',
  },
  de: {
    geschosse: 'ammunition', finesse: 'finesse', schwer: 'heavy', leicht: 'light', laden: 'loading',
    fernkampfreichweite: 'range', nahkampfreichweite: 'reach', weitreichend: 'reach', wurfwaffe: 'thrown',
    zweihändig: 'two-handed', vielseitig: 'versatile',
  },
};

export const MASTERY_NAMES: Record<Lang, Record<string, Mastery>> = {
  en: { cleave: 'cleave', graze: 'graze', nick: 'nick', push: 'push', sap: 'sap', slow: 'slow', topple: 'topple', vex: 'vex' },
  de: {
    spalten: 'cleave', streifen: 'graze', einkerben: 'nick', stoßen: 'push',
    auslaugen: 'sap', verlangsamen: 'slow', umstoßen: 'topple', plagen: 'vex',
  },
};

export const DAMAGE_NAMES: Record<Lang, Record<string, DamageType>> = {
  en: { bludgeoning: 'bludgeoning', piercing: 'piercing', slashing: 'slashing' },
  de: { wucht: 'bludgeoning', stich: 'piercing', hieb: 'slashing' },
};

const SECTIONS: Record<Lang, { weapons: string; properties: string; mastery: RegExp }> = {
  en: { weapons: 'Weapons', properties: 'Properties', mastery: /^Mastery Properties/ },
  de: { weapons: 'Waffen', properties: 'Eigenschaften', mastery: /^Meisterschaftseigenschaft/ },
};

const CATEGORY_LINES: Record<Lang, Record<string, { category: 'simple' | 'martial'; kind: 'melee' | 'ranged' }>> = {
  en: {
    'Simple Melee Weapons': { category: 'simple', kind: 'melee' },
    'Simple Ranged Weapons': { category: 'simple', kind: 'ranged' },
    'Martial Melee Weapons': { category: 'martial', kind: 'melee' },
    'Martial Ranged Weapons': { category: 'martial', kind: 'ranged' },
  },
  de: {
    'Einfache Nahkampfwaffen': { category: 'simple', kind: 'melee' },
    'Einfache Fernkampfwaffen': { category: 'simple', kind: 'ranged' },
    'Nahkampf-Kriegswaffen': { category: 'martial', kind: 'melee' },
    'Fernkampf-Kriegswaffen': { category: 'martial', kind: 'ranged' },
  },
};

export interface TableWeapon {
  lang: Lang;
  name: string;
  category: 'simple' | 'martial';
  kind: 'melee' | 'ranged';
  dice: string; // English notation
  damageType: DamageType;
  properties: WeaponProperty[];
  /** Raw properties text, e.g. "Ammunition (Range 80/320; Arrow), Loading". */
  propertiesText: string;
  mastery: Mastery;
  /** Normal/long range as printed (feet or metres). */
  range?: [number, number];
  versatileDice?: string;
}

function parseNumber(s: string): number {
  return Number(s.replace(',', '.'));
}

/** Parse one table row (cells separated by tabs, sometimes merged). */
export function parseWeaponRow(row: string, lang: Lang, cat: { category: 'simple' | 'martial'; kind: 'melee' | 'ranged' }): TableWeapon {
  const text = tidy(row.replace(/\t/g, ' | '));
  const dmgWords = Object.keys(DAMAGE_NAMES[lang]).join('|');
  const dm = text.match(new RegExp(`^(.*?)\\s*\\|?\\s*(\\d+(?:[dW]\\d+)?) (${dmgWords})\\b`, 'i'));
  if (!dm) throw new Error(`Weapon row without damage: "${text}"`);
  const name = tidy(dm[1].replace(/\|/g, ''));
  const rest = text.slice(dm[0].length);
  const masteryWords = Object.keys(MASTERY_NAMES[lang]);
  const mm = [...rest.matchAll(new RegExp(`(?:^|[|\\s])(${masteryWords.join('|')})(?=\\s*\\||\\s+[\\d−—-])`, 'gi'))].pop();
  if (!mm) throw new Error(`Weapon row without mastery: "${text}"`);
  const mastery = MASTERY_NAMES[lang][mm[1].toLowerCase()];
  const propertiesText = tidy(rest.slice(0, mm.index).replace(/\|/g, ' ')).replace(/^[−—-]$/, '');
  const properties: WeaponProperty[] = [];
  for (const part of propertiesText.split(/,\s*(?![^()]*\))/)) {
    const word = part.replace(/\s*\(.*$/, '').trim().toLowerCase();
    if (!word) continue;
    const p = PROPERTY_NAMES[lang][word];
    if (!p || p === 'range') throw new Error(`Unknown weapon property "${part}" in "${text}"`);
    properties.push(p);
  }
  const rm = propertiesText.match(/(?:Range|Reichweite) ([\d,]+)\/([\d,]+)/);
  const vm = propertiesText.match(/(?:Versatile|Vielseitig) \((\d+[dW]\d+)\)/i);
  return {
    lang,
    name,
    ...cat,
    dice: dm[2].replace('W', 'd'),
    damageType: DAMAGE_NAMES[lang][dm[3].toLowerCase()],
    properties: properties.sort(),
    propertiesText,
    mastery,
    range: rm ? [parseNumber(rm[1]), parseNumber(rm[2])] : undefined,
    versatileDice: vm ? vm[1].replace('W', 'd') : undefined,
  };
}

/** The Weapons table: category lines (italic) followed by rows; overflow lines are appended. */
export function parseWeaponTable(doc: Doc): TableWeapon[] {
  const chapter = section(doc.lines, SECTIONS[doc.lang].weapons, 'h1');
  const cats = CATEGORY_LINES[doc.lang];
  const out: TableWeapon[] = [];
  let cat: (typeof cats)[string] | undefined;
  let pending: string | undefined;
  const flush = () => {
    if (pending && cat) out.push(parseWeaponRow(pending, doc.lang, cat));
    pending = undefined;
  };
  for (const l of chapter) {
    if (l.role !== 'sans') continue;
    const t = lineText(l);
    if (cats[t]) {
      flush();
      cat = cats[t];
      continue;
    }
    if (!cat) continue;
    if (l.text.includes('\t')) {
      flush();
      pending = l.text;
    } else if (pending && l.col === 0) {
      // Overflow of the properties cell ("Two-Handed" on its own line). Insert it before the mastery.
      const cells = pending.split('\t');
      const masteryIdx = cells.findIndex((c) => MASTERY_NAMES[doc.lang][c.trim().toLowerCase()] !== undefined);
      const idx = masteryIdx > 0 ? masteryIdx - 1 : cells.length - 1;
      cells[idx] = `${cells[idx].trim()} ${t}`;
      pending = cells.join('\t');
    }
  }
  flush();
  return out;
}

/** Rule texts of the weapon properties and mastery properties (body text only). */
export function parseWeaponRules(doc: Doc): { properties: Map<PropertyRule, string>; masteries: Map<Mastery, string> } {
  const chapter = section(doc.lines, SECTIONS[doc.lang].weapons, 'h1');
  const pick = (lines: Line[]) => splitEntries(lines.slice(1), 'h3', ['title', 'h1', 'h2']);
  const properties = new Map<PropertyRule, string>();
  for (const e of pick(section(chapter, SECTIONS[doc.lang].properties, 'h2'))) {
    const key = PROPERTY_NAMES[doc.lang][e.name.toLowerCase()];
    if (key) properties.set(key, bodyMarkdown(doc, e.lines.filter((l) => l.role === 'body')));
  }
  const masteries = new Map<Mastery, string>();
  for (const e of pick(section(chapter, SECTIONS[doc.lang].mastery, 'h2'))) {
    const key = MASTERY_NAMES[doc.lang][e.name.toLowerCase()];
    if (key) masteries.set(key, bodyMarkdown(doc, e.lines.filter((l) => l.role === 'body')));
  }
  return { properties, masteries };
}

/** Display names of properties/masteries as printed in the PDF headings. */
export function ruleHeadings(doc: Doc): Map<string, string> {
  const chapter = section(doc.lines, SECTIONS[doc.lang].weapons, 'h1');
  const out = new Map<string, string>();
  for (const l of chapter) {
    if (l.role !== 'h3') continue;
    const name = lineText(l);
    const key = PROPERTY_NAMES[doc.lang][name.toLowerCase()] ?? MASTERY_NAMES[doc.lang][name.toLowerCase()];
    if (key) out.set(key, name);
  }
  return out;
}
