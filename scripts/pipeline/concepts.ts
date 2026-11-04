/**
 * Language-independent "concept tokens" for EN ↔ DE matching of free-text entries
 * (magic items, features). A token is emitted for every rules concept found in a text:
 * referenced spells (via the already built spell mapping), conditions, damage types,
 * abilities, dice, bonuses, DCs, charges and durations. Matching texts in both languages
 * share most of their tokens even when their wording differs.
 */
import type { Card, Lang } from '../../src/model/schema';
import { FEET_PER_MILE, KM_PER_MILE, METRES_PER_FOOT } from '../../src/model/units';
import { diceTokens } from './match';

const NUMBER_WORDS: Record<Lang, Record<string, number>> = {
  en: {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, twenty: 20, thirty: 30, hundred: 100,
  },
  de: {
    eins: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10,
    elf: 11, zwölf: 12, zwanzig: 20, dreißig: 30, hundert: 100,
  },
};

/** Replace number words ("sieben Ladungen" → "7 Ladungen"). */
export function numberWordsToDigits(text: string, lang: Lang): string {
  const words = NUMBER_WORDS[lang];
  const re = new RegExp(`\\b(${Object.keys(words).join('|')})\\b`, 'gi');
  return text.replace(re, (m) => String(words[m.toLowerCase()]));
}

const DAMAGE: Record<Lang, [RegExp, string][]> = {
  en: [
    ['acid', 'Acid'], ['bludgeoning', 'Bludgeoning'], ['cold', 'Cold'], ['fire', 'Fire'], ['force', 'Force'],
    ['lightning', 'Lightning'], ['necrotic', 'Necrotic'], ['piercing', 'Piercing'], ['poison', 'Poison'],
    ['psychic', 'Psychic'], ['radiant', 'Radiant'], ['slashing', 'Slashing'], ['thunder', 'Thunder'],
  ].map(([k, w]) => [new RegExp(`\\b${w} damage`, 'g'), k] as [RegExp, string]),
  de: [
    ['acid', 'Säureschaden'], ['bludgeoning', 'Wuchtschaden'], ['cold', 'Kälteschaden'], ['fire', 'Feuerschaden'],
    ['force', 'Energieschaden'], ['lightning', 'Blitzschaden'], ['necrotic', 'nekrotische\\w* Schaden'],
    ['piercing', 'Stichschaden'], ['poison', 'Giftschaden'], ['psychic', 'psychische\\w* Schaden'],
    ['radiant', 'gleißende\\w* Schaden'], ['slashing', 'Hiebschaden'], ['thunder', 'Schallschaden'],
  ].map(([k, w]) => [new RegExp(w, 'g'), k] as [RegExp, string]),
};

const ABILITY: Record<Lang, [RegExp, string][]> = {
  en: [
    [/\bStrength\b/g, 'str'], [/\bDexterity\b/g, 'dex'], [/\bConstitution\b/g, 'con'],
    [/\bIntelligence\b/g, 'int'], [/\bWisdom\b/g, 'wis'], [/\bCharisma\b/g, 'cha'],
  ],
  de: [
    [/Stärke/g, 'str'], [/Geschicklichkeit/g, 'dex'], [/Konstitution/g, 'con'],
    [/Intelligenz/g, 'int'], [/Weisheit/g, 'wis'], [/Charisma/g, 'cha'],
  ],
};

const DURATION: Record<Lang, [RegExp, Record<string, string>]> = {
  en: [/\b(\d+) (minute|hour|day|round)s?\b/gi, { minute: 'min', hour: 'h', day: 'd', round: 'r' }],
  de: [/\b(\d+) (Minute|Stunde|Tag|Runde)(?:n|e)?\b/gi, { minute: 'min', stunde: 'h', tag: 'd', runde: 'r' }],
};

/** Rules terms with a fixed translation (SRD 5.2.1 terminology). */
const TERMS: Record<Lang, [RegExp, string][]> = {
  en: [
    [/\bShort Rest\b/g, 'rest:short'], [/\bLong Rest\b/g, 'rest:long'], [/\bShort or Long Rest\b/g, 'rest:either'],
    [/\bBonus Action\b/g, 'act:bonus'], [/\bReaction\b/g, 'act:reaction'], [/\bMagic action\b/g, 'act:magic'],
    [/\bProficiency Bonus\b/g, 'pb'], [/\bTemporary Hit Points\b/g, 'thp'], [/\bHit Point/g, 'hp'],
    [/\bAdvantage\b/g, 'adv'], [/\bDisadvantage\b/g, 'dis'], [/\bResistance\b/g, 'res'], [/\bImmunity\b/g, 'imm'],
    [/\bsaving throws?\b/gi, 'save'], [/\bspell slot/gi, 'slot'], [/\bInitiative\b/g, 'init'], [/\bSpeed\b/g, 'speed'],
    [/\bArmor Class\b|\bAC\b/g, 'ac'], [/\bcantrips?\b/gi, 'cantrip'], [/\bTruesight\b/g, 'truesight'],
    [/\bDarkvision\b/g, 'darkvision'], [/\bBlindsight\b/g, 'blindsight'], [/\bTremorsense\b/g, 'tremorsense'],
    [/\bExhaustion\b/g, 'exhaustion'], [/\bHeroic Inspiration\b/g, 'inspiration'], [/\bcritical hit/gi, 'crit'],
    [/\bOpportunity Attack/g, 'oa'], [/\bUnarmed Strike/g, 'unarmed'], [/\bFly Speed\b/g, 'fly'],
    [/\bteleport/gi, 'teleport'], [/\bExtra Attack\b/g, 'extra-attack'], [/\bSneak Attack\b/g, 'sneak'],
  ],
  de: [
    [/\bkurze[nr]? Rast\b/gi, 'rest:short'], [/\blange[nr]? Rast\b/gi, 'rest:long'], [/\bkurze[nr]? oder lange[nr]? Rast\b/gi, 'rest:either'],
    [/Bonusaktion/g, 'act:bonus'], [/Reaktion/g, 'act:reaction'], [/Magie-Aktion|Magieaktion/g, 'act:magic'],
    [/Übungsbonus/g, 'pb'], [/temporäre\w* Trefferpunkte/g, 'thp'], [/Trefferpunkt/g, 'hp'],
    [/\bVorteil\b/g, 'adv'], [/\bNachteil\b/g, 'dis'], [/\bresisten|Resistenz/g, 'res'], [/\bimmun|Immunität/g, 'imm'],
    [/[Rr]ettungsw[uü]rf/g, 'save'], [/Zauberpl[aä]tz/g, 'slot'], [/Initiative/g, 'init'], [/Bewegungsrate\b/g, 'speed'],
    [/\bRüstungsklasse\b|\bRK\b/g, 'ac'], [/Zaubertri(?:ck|cks)\b/g, 'cantrip'], [/Wahrsicht/g, 'truesight'],
    [/Dunkelsicht/g, 'darkvision'], [/Blindsicht/g, 'blindsight'], [/Erschütterungssinn/g, 'tremorsense'],
    [/Erschöpfung/g, 'exhaustion'], [/Heldische\w* Inspiration/g, 'inspiration'], [/kritische\w* Treffer/gi, 'crit'],
    [/Gelegenheitsangriff/g, 'oa'], [/waffenlose\w* Angriff/g, 'unarmed'], [/Flugbewegungsrate/g, 'fly'],
    [/teleport/gi, 'teleport'], [/Zusätzliche\w* Angriff/g, 'extra-attack'], [/Hinterhältige\w* Angriff/g, 'sneak'],
  ],
};

/** Distances in feet: "120 feet", "20-foot" / "36 Metern", "1,5 m", "1,6 Kilometer". */
export function distanceTokens(text: string, lang: Lang): string[] {
  const out: string[] = [];
  if (lang === 'en') {
    for (const m of text.matchAll(/\b(\d+)[- ](?:feet|foot|ft\.)/g)) out.push(`dist:${m[1]}`);
    for (const m of text.matchAll(/\b(\d+)[- ]miles?\b/g)) out.push(`dist:${Number(m[1]) * FEET_PER_MILE}`);
  } else {
    for (const m of text.matchAll(/\b(\d+(?:,\d+)?)[- ]?(?:Metern?|m)\b/g)) {
      out.push(`dist:${Math.round(Number(m[1].replace(',', '.')) / METRES_PER_FOOT)}`);
    }
    for (const m of text.matchAll(/\b(\d+(?:,\d+)?)[- ]?(?:Kilometern?|km)\b/g)) {
      out.push(`dist:${Math.round((Number(m[1].replace(',', '.')) / KM_PER_MILE) * FEET_PER_MILE)}`);
    }
  }
  return out;
}

/** Names of already matched entries (spells, conditions) per language → concept key. */
export interface ConceptDict {
  names: Record<Lang, Map<string, string>>;
}

export function emptyDict(): ConceptDict {
  return { names: { en: new Map(), de: new Map() } };
}

/** Add the names of bilingual cards (e.g. the spell or condition catalog) to the dictionary. */
export function addCards(dict: ConceptDict, cards: Card[], prefix: string): ConceptDict {
  for (const c of cards) {
    for (const lang of ['en', 'de'] as const) {
      const n = c.name[lang];
      if (n) dict.names[lang].set(n, `${prefix}:${c.srdKey}`);
    }
  }
  return dict;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Concept tokens of a text. `refs` are explicit references (italic runs in the PDF, which
 * the SRD uses for spell and item names); they are looked up exactly. Condition names are
 * searched in the text (they are capitalised game terms in both languages).
 */
export function conceptTokens(text: string, lang: Lang, dict: ConceptDict, refs: string[] = []): string[] {
  const t = numberWordsToDigits(text.replace(/\*\*/g, ''), lang);
  const tokens: string[] = [];
  for (const r of refs) {
    const key = dict.names[lang].get(r.trim());
    if (key) tokens.push(key);
  }
  for (const [name, key] of dict.names[lang]) {
    if (!key.startsWith('cond:')) continue;
    const re = new RegExp(`(^|[^\\p{L}])${escapeRe(name)}(?![\\p{L}])`, 'gu');
    for (const _ of t.matchAll(re)) tokens.push(key);
  }
  for (const [re, key] of DAMAGE[lang]) for (const _ of t.matchAll(re)) tokens.push(`dmg:${key}`);
  for (const [re, key] of ABILITY[lang]) for (const _ of t.matchAll(re)) tokens.push(`ab:${key}`);
  for (const [re, key] of TERMS[lang]) for (const _ of t.matchAll(re)) tokens.push(key);
  tokens.push(...distanceTokens(t, lang));
  const [dre, units] = DURATION[lang];
  for (const m of t.matchAll(dre)) tokens.push(`t:${m[1]}${units[m[2].toLowerCase()]}`);
  tokens.push(...diceTokens(t));
  for (const m of t.matchAll(/(^|[\s(])([+−-]\d+)\b/g)) tokens.push(`b${m[2].replace('−', '-')}`);
  for (const m of t.matchAll(/\b(?:DC|SG)[ -](\d+)/g)) tokens.push(`dc${m[1]}`);
  for (const m of t.matchAll(/\b(\d+) (?:charges?|Ladungen?)\b/gi)) tokens.push(`c${m[1]}`);
  return tokens.sort();
}
