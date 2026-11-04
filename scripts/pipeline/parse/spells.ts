/**
 * Spell entries from the "Spell Descriptions" / "Beschreibungen der Zauber" chapter.
 *
 * Entry layout (both languages):
 *   Name (h3)
 *   Subtitle (italic): "Level 3 Evocation (Sorcerer, Wizard)" / "Hervorrufungszauber 3. Grades (Magier, Zauberer)"
 *   Casting Time: … / Zeitaufwand: …
 *   Range: … / Reichweite: …
 *   Components: … / Komponenten: …
 *   Duration: … / Wirkungsdauer: …
 *   Body text; last paragraph optionally "Using a Higher-Level Spell Slot." / "Cantrip Upgrade."
 */
import type { CastingTime, ClassKey, Duration, Lang, Range, School } from '../../../src/model/schema';
import { FEET_PER_MILE, KM_PER_MILE, METRES_PER_FOOT } from '../../../src/model/units';
import { bodyMarkdown, plainText, section, splitEntries, type Doc, type Entry } from '../doc';
import type { Line } from '../pdf/layout';
import { tidy } from '../text';

export interface ParsedSpell {
  lang: Lang;
  name: string;
  page: number;
  level: number;
  school: School;
  classes: ClassKey[];
  ritual: boolean;
  castingTime: Omit<CastingTime, 'trigger'> & { trigger?: string };
  range: Range;
  components: { verbal: boolean; somatic: boolean; material: boolean; materialText?: string };
  duration: Duration;
  concentration: boolean;
  raw: { subtitle: string; castingTime: string; range: string; components: string; duration: string };
  description: string;
  higherLevels?: string;
}

export const SCHOOL_NAMES: Record<Lang, Record<string, School>> = {
  en: {
    abjuration: 'abjuration', conjuration: 'conjuration', divination: 'divination', enchantment: 'enchantment',
    evocation: 'evocation', illusion: 'illusion', necromancy: 'necromancy', transmutation: 'transmutation',
  },
  de: {
    // "Bannzauber 2. Grades" / "Zaubertrick der Bannmagie"
    bann: 'abjuration', banns: 'abjuration', bannmagie: 'abjuration',
    beschwörung: 'conjuration', beschwörungs: 'conjuration',
    erkenntnis: 'divination', erkenntnismagie: 'divination', erkenntniszauber: 'divination',
    verzauberung: 'enchantment', verzauberungs: 'enchantment',
    hervorrufung: 'evocation', hervorrufungs: 'evocation',
    illusion: 'illusion', illusions: 'illusion',
    nekromantie: 'necromancy',
    verwandlung: 'transmutation', verwandlungs: 'transmutation',
  },
};

export const CLASS_NAMES: Record<Lang, Record<string, ClassKey>> = {
  en: {
    barbarian: 'barbarian', bard: 'bard', cleric: 'cleric', druid: 'druid', fighter: 'fighter', monk: 'monk',
    paladin: 'paladin', ranger: 'ranger', rogue: 'rogue', sorcerer: 'sorcerer', warlock: 'warlock', wizard: 'wizard',
  },
  de: {
    barbar: 'barbarian', barde: 'bard', kleriker: 'cleric', druide: 'druid', kämpfer: 'fighter', mönch: 'monk',
    paladin: 'paladin', waldläufer: 'ranger', schurke: 'rogue', zauberer: 'sorcerer', hexenmeister: 'warlock', magier: 'wizard',
  },
};

type FieldKey = 'casting' | 'range' | 'components' | 'duration';
const LABELS: Record<Lang, Record<FieldKey, RegExp>> = {
  en: { casting: /^Casting Time:\s*/, range: /^Range:\s*/, components: /^Components?:\s*/, duration: /^Duration:\s*/ },
  de: { casting: /^Zeitaufwand:\s*/, range: /^Reichweite:\s*/, components: /^Komponenten?:\s*/, duration: /^Wirkungsdauer:\s*/ },
};
const FIELD_ORDER: FieldKey[] = ['casting', 'range', 'components', 'duration'];

const HIGHER_LEVEL_LABELS = [
  /^Using a Higher-Level Spell Slot\.\s*/,
  /^Cantrip Upgrade\.\s*/,
  /^Verwenden von Zauberplätzen höheren Grades:\s*/,
  /^Verbesserung des Zaubertricks:\s*/,
  /^Zaubertrick-Verbesserung:\s*/,
  /^Zaubertrick-Aufwertung:\s*/,
];

export function parseSubtitle(text: string, lang: Lang): { level: number; school: School; classes: ClassKey[] } {
  const t = tidy(text);
  const m = t.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (!m) throw new Error(`Unrecognised spell subtitle "${t}"`);
  const head = m[1];
  const classes = m[2].split(/,\s*/).map((c) => {
    const key = CLASS_NAMES[lang][c.trim().toLowerCase()];
    if (!key) throw new Error(`Unknown class "${c}" in "${t}"`);
    return key;
  });
  let level: number;
  let schoolWord: string;
  if (lang === 'en') {
    const lm = head.match(/^Level (\d) (\w+)$/) ?? null;
    const cm = head.match(/^(\w+) Cantrip$/);
    if (lm) [level, schoolWord] = [Number(lm[1]), lm[2]];
    else if (cm) [level, schoolWord] = [0, cm[1]];
    else throw new Error(`Unrecognised spell subtitle "${t}"`);
  } else {
    const lm = head.match(/^(\p{L}+?)-?zauber (\d)\. Grades$/u);
    const cm = head.match(/^Zaubertrick de[rs] (\p{L}+)$/u) ?? head.match(/^(\p{L}+?)-?zaubertrick$/u);
    if (lm) [level, schoolWord] = [Number(lm[2]), lm[1]];
    else if (cm) [level, schoolWord] = [0, cm[1]];
    else throw new Error(`Unrecognised spell subtitle "${t}"`);
  }
  const school = SCHOOL_NAMES[lang][schoolWord.toLowerCase()];
  if (!school) throw new Error(`Unknown school "${schoolWord}" in "${t}"`);
  return { level, school, classes };
}

const NUMBER_WORDS: Record<string, number> = { one: 1, eins: 1, ein: 1, eine: 1 };

function num(s: string): number {
  return NUMBER_WORDS[s.toLowerCase()] ?? Number(s.replace(',', '.'));
}

export function parseCastingTime(text: string, lang: Lang): { castingTime: ParsedSpell['castingTime']; ritual: boolean } {
  let t = tidy(text);
  let ritual = false;
  const ritualRe = lang === 'en' ? /\s+or Ritual$/i : /\s+oder Ritual$/i;
  if (ritualRe.test(t)) {
    ritual = true;
    t = t.replace(ritualRe, '');
  }
  if (lang === 'en') {
    if (/^Action$/i.test(t)) return { castingTime: { unit: 'action' }, ritual };
    const b = t.match(/^Bonus Action(?:,\s*(.*))?$/i);
    if (b) return { castingTime: { unit: 'bonus', trigger: b[1] }, ritual };
    // "Action (Overgrowth) or 8 hours (Enrichment)" – the fastest option is the structured value.
    if (/^Action \(/i.test(t)) return { castingTime: { unit: 'action' }, ritual };
    const r = t.match(/^Reaction(?:,\s*(.*))?$/i);
    if (r) return { castingTime: { unit: 'reaction', trigger: r[1] }, ritual };
    const m = t.match(/^(\d+) (minute|hour)s?$/i);
    if (m) return { castingTime: { unit: m[2].toLowerCase() as 'minute' | 'hour', amount: Number(m[1]) }, ritual };
  } else {
    if (/^Aktion$/i.test(t)) return { castingTime: { unit: 'action' }, ritual };
    const b = t.match(/^Bonusaktion(?:,\s*(.*))?$/i);
    if (b) return { castingTime: { unit: 'bonus', trigger: b[1] }, ritual };
    if (/^Aktion \(/i.test(t)) return { castingTime: { unit: 'action' }, ritual };
    const r = t.match(/^Reaktion(?:,\s*(.*))?$/i);
    if (r) return { castingTime: { unit: 'reaction', trigger: r[1] }, ritual };
    const m = t.match(/^(\d+) (Minuten?|Stunden?)$/i);
    if (m)
      return {
        castingTime: { unit: m[2].toLowerCase().startsWith('min') ? 'minute' : 'hour', amount: Number(m[1]) },
        ritual,
      };
  }
  throw new Error(`Unrecognised casting time "${t}" (${lang})`);
}

export function parseRange(text: string, lang: Lang): Range {
  const t = tidy(text).replace(/\s*\(.*\)$/, '');
  const kinds: Record<string, Range['kind']> =
    lang === 'en'
      ? { self: 'self', touch: 'touch', sight: 'sight', unlimited: 'unlimited', special: 'special' }
      : { selbst: 'self', berührung: 'touch', sicht: 'sight', unbegrenzt: 'unlimited', speziell: 'special', besonders: 'special' };
  const k = kinds[t.toLowerCase()];
  if (k) return { kind: k };
  if (lang === 'en') {
    const m = t.match(/^([\d,]+) (feet|foot|miles?)$/i);
    if (m) {
      const n = Number(m[1].replace(',', ''));
      return { kind: 'distance', feet: /mile/i.test(m[2]) ? n * FEET_PER_MILE : n };
    }
  } else {
    const m = t.match(/^([\d.,]+) (Meter|Kilometer|km|m)$/i);
    if (m) {
      const n = Number(m[1].replace('.', '').replace(',', '.'));
      const feet = /^k/i.test(m[2]) ? Math.round((n / KM_PER_MILE) * FEET_PER_MILE) : Math.round(n / METRES_PER_FOOT);
      return { kind: 'distance', feet };
    }
  }
  throw new Error(`Unrecognised range "${t}" (${lang})`);
}

export function parseComponents(text: string, lang: Lang): ParsedSpell['components'] {
  const t = tidy(text);
  const m = t.match(/^([^(]*?)(?:\s*\((.*)\))?$/s);
  const letters = (m?.[1] ?? t).split(/,\s*/).map((s) => s.trim().toUpperCase());
  // The German PDF writes "S" instead of "G" in a few entries (Demiplane, Mind Spike, Mislead).
  const somaticLetters = lang === 'en' ? ['S'] : ['G', 'S'];
  return {
    verbal: letters.includes('V'),
    somatic: letters.some((l) => somaticLetters.includes(l)),
    material: letters.includes('M'),
    materialText: m?.[2] ? tidy(m[2]) : undefined,
  };
}

export function parseDuration(text: string, lang: Lang): { duration: Duration; concentration: boolean } {
  let t = tidy(text);
  let concentration = false;
  const conc = lang === 'en' ? /^Concentration,?\s*up to\s*/i : /^Konzentration,?\s*bis zu\s*/i;
  if (conc.test(t)) {
    concentration = true;
    t = t.replace(conc, '');
  }
  // "Up to 8 hours" without Concentration: the card shows the maximum duration.
  t = t.replace(lang === 'en' ? /^Up to\s+/i : /^Bis zu\s+/i, '');
  if (lang === 'de' && /^Bis der Zauber gebannt oder .*ausgelöst wird$/i.test(t)) {
    return { duration: { kind: 'until-dispelled-or-triggered' }, concentration };
  }
  const fixed: Record<string, Duration['kind']> =
    lang === 'en'
      ? {
          instantaneous: 'instantaneous',
          'until dispelled': 'until-dispelled',
          'until dispelled or triggered': 'until-dispelled-or-triggered',
          special: 'special',
        }
      : {
          unmittelbar: 'instantaneous',
          'bis der zauber gebannt wird': 'until-dispelled',
          'bis gebannt': 'until-dispelled',
          'bis der zauber gebannt oder ausgelöst wird': 'until-dispelled-or-triggered',
          'bis gebannt oder ausgelöst': 'until-dispelled-or-triggered',
          speziell: 'special',
          besonders: 'special',
        };
  const k = fixed[t.toLowerCase()];
  if (k) return { duration: { kind: k }, concentration };
  const units: Record<string, Duration['kind']> =
    lang === 'en'
      ? { round: 'round', rounds: 'round', minute: 'minute', minutes: 'minute', hour: 'hour', hours: 'hour', day: 'day', days: 'day' }
      : { runde: 'round', runden: 'round', minute: 'minute', minuten: 'minute', stunde: 'hour', stunden: 'hour', tag: 'day', tage: 'day' };
  const m = t.match(/^(\w+) (\p{L}+)$/u);
  if (m && units[m[2].toLowerCase()]) {
    return { duration: { kind: units[m[2].toLowerCase()], amount: num(m[1]) }, concentration };
  }
  throw new Error(`Unrecognised duration "${t}" (${lang})`);
}

function fieldLines(
  lines: Line[],
  lang: Lang,
): { fields: Partial<Record<FieldKey, Line[]>>; rest: Line[]; subtitle: Line[] } {
  const labels = LABELS[lang];
  const fields: Partial<Record<FieldKey, Line[]>> = {};
  const subtitle: Line[] = [];
  let current: FieldKey | undefined;
  let i = 0;
  for (; i < lines.length; i++) {
    const l = lines[i];
    const t = tidy(l.text);
    const label = FIELD_ORDER.find((k) => labels[k].test(t));
    if (label) {
      current = label;
      const value = t.replace(labels[label], '');
      fields[label] = [{ ...l, segments: [{ text: value, bold: false, italic: false }], text: value }];
      continue;
    }
    if (current === undefined) {
      subtitle.push(l);
      continue;
    }
    // Continuation of a field (hanging indent, small sans font) – the body starts with running text.
    if (l.role !== 'sans') break;
    fields[current]!.push(l);
  }
  return { fields, rest: lines.slice(i), subtitle };
}

export function parseSpellEntry(doc: Doc, entry: Entry): ParsedSpell {
  const lang = doc.lang;
  const { fields, rest, subtitle } = fieldLines(entry.lines, lang);
  const field = (k: FieldKey) => {
    const f = fields[k];
    if (!f) throw new Error(`Spell "${entry.name}": missing field "${k}"`);
    return plainText(doc, f);
  };
  const raw = {
    subtitle: plainText(doc, subtitle),
    castingTime: field('casting'),
    range: field('range'),
    components: field('components'),
    duration: field('duration'),
  };
  const sub = parseSubtitle(raw.subtitle, lang);
  const ct = parseCastingTime(raw.castingTime, lang);
  const dur = parseDuration(raw.duration, lang);
  const md = bodyMarkdown(doc, rest);
  const paragraphs = md.split('\n\n');
  let higherLevels: string | undefined;
  const lastIdx = paragraphs.findIndex((p) => HIGHER_LEVEL_LABELS.some((re) => re.test(p.replace(/\*\*/g, ''))));
  if (lastIdx >= 0) {
    const tail = paragraphs.splice(lastIdx).join('\n\n');
    higherLevels = tidy(tail.replace(/^\*\*[^*]+\*\*\s*/, ''));
  }
  return {
    lang,
    name: entry.name,
    page: entry.page,
    ...sub,
    ritual: ct.ritual,
    castingTime: ct.castingTime,
    range: parseRange(raw.range, lang),
    components: parseComponents(raw.components, lang),
    duration: dur.duration,
    concentration: dur.concentration,
    raw,
    description: paragraphs.join('\n\n'),
    higherLevels,
  };
}

export const SPELL_CHAPTER: Record<Lang, string> = { en: 'Spell Descriptions', de: 'Beschreibungen der Zauber' };

export function spellEntries(doc: Doc): Entry[] {
  const lines = section(doc.lines, SPELL_CHAPTER[doc.lang], 'h1');
  // The chapter ends where the Rules Glossary title begins; section() stops at the next h1/title.
  return splitEntries(lines.slice(1), 'h3', ['title', 'h1']);
}

export function parseSpells(doc: Doc): { spells: ParsedSpell[]; errors: string[] } {
  const spells: ParsedSpell[] = [];
  const errors: string[] = [];
  for (const e of spellEntries(doc)) {
    try {
      spells.push(parseSpellEntry(doc, e));
    } catch (err) {
      errors.push((err as Error).message);
    }
  }
  return { spells, errors };
}
