/**
 * Card vocabulary per card language (SPEC §9).
 *
 * These are the labels and translated keys printed on cards. They follow the deck's card
 * language, not the UI language. German terms follow the official German SRD 5.2.1.
 */
import type {
  Ability, ClassKey, DamageType, Lang, Mastery, Rarity, School, WeaponProperty,
} from '../model/schema';
import {
  ACTIVATIONS, AMMUNITION, ACTION_TYPES, FEAT_CATEGORIES, ITEM_CATEGORIES, ORIGIN_KINDS, RECOVERY,
} from '../model/schema';

type Dict<K extends string> = Record<K, string>;

export interface CardTerms {
  labels: {
    castingTime: string; range: string; components: string; duration: string;
    save: string; attack: string; saveOrAttack: string; damage: string;
    actionType: string; properties: string; mastery: string; reach: string; trigger: string;
    origin: string; activation: string; uses: string; recovery: string; prerequisite: string;
    category: string; rarity: string; attunement: string; charges: string;
  };
  schools: Dict<School>;
  /** Subtitle of a levelled spell: "Hervorrufungszauber 3. Grades" / "Level 3 Evocation". */
  spellSubtitle: (school: School, level: number) => string;
  classes: Dict<ClassKey>;
  abilities: Dict<Ability>;
  abilityShort: Dict<Ability>;
  damageTypes: Dict<DamageType>;
  castingUnits: { action: string; bonus: string; reaction: string; minute: (n: number) => string; hour: (n: number) => string };
  orRitual: string;
  ranges: { self: string; touch: string; sight: string; unlimited: string; special: string };
  componentLetters: { verbal: string; somatic: string; material: string };
  durations: {
    instantaneous: string; round: (n: number) => string; minute: (n: number) => string;
    hour: (n: number) => string; day: (n: number) => string;
    'until-dispelled': string; 'until-dispelled-or-triggered': string; special: string;
    concentration: (inner: string) => string;
    /** Compact form for the property block. */
    concentrationShort: (inner: string) => string;
  };
  spellAttack: string;
  higherLevels: string;
  cantripUpgrade: string;
  actionTypes: Dict<(typeof ACTION_TYPES)[number]>;
  activations: Dict<(typeof ACTIVATIONS)[number]>;
  recovery: Dict<(typeof RECOVERY)[number]>;
  weaponCategory: (category: 'simple' | 'martial', kind: 'melee' | 'ranged') => string;
  weaponProperties: Dict<WeaponProperty>;
  ammunition: Dict<(typeof AMMUNITION)[number]>;
  masteries: Dict<Mastery>;
  versatile: string;
  originKinds: Dict<(typeof ORIGIN_KINDS)[number]>;
  featCategories: Dict<(typeof FEAT_CATEGORIES)[number]>;
  levelFrom: (level: number) => string;
  itemCategories: Dict<(typeof ITEM_CATEGORIES)[number]>;
  rarities: Dict<Rarity>;
  rarityShort: Dict<Rarity>;
  requiresAttunement: string;
  yes: string;
  no: string;
  condition: string;
  action: string;
  feature: string;
  sources: { 'srd-5.2.1': string; custom: string };
  continued: (part: number, total: number) => string;
}

const de: CardTerms = {
  labels: {
    castingTime: 'Zeitaufwand', range: 'Reichweite', components: 'Komponenten', duration: 'Wirkungsdauer',
    save: 'Rettungswurf', attack: 'Angriff', saveOrAttack: 'Rettungswurf/Angriff', damage: 'Schaden',
    actionType: 'Aktionsart', properties: 'Eigenschaften', mastery: 'Meisterschaft', reach: 'Reichweite',
    trigger: 'Auslöser', origin: 'Herkunft', activation: 'Aktionsart', uses: 'Nutzungen', recovery: 'Erholung',
    prerequisite: 'Voraussetzung', category: 'Kategorie', rarity: 'Seltenheit', attunement: 'Einstimmung',
    charges: 'Ladungen',
  },
  schools: {
    abjuration: 'Bannmagie', conjuration: 'Beschwörungsmagie', divination: 'Erkenntnismagie',
    enchantment: 'Verzauberungsmagie', evocation: 'Hervorrufungsmagie', illusion: 'Illusionsmagie',
    necromancy: 'Nekromantie', transmutation: 'Verwandlungsmagie',
  },
  spellSubtitle: (school, level) => {
    if (level === 0) {
      const cantrip: Dict<School> = {
        abjuration: 'Bannmagie', conjuration: 'Beschwörung', divination: 'Erkenntnis',
        enchantment: 'Verzauberung', evocation: 'Hervorrufung', illusion: 'Illusion',
        necromancy: 'Nekromantie', transmutation: 'Verwandlung',
      };
      return `Zaubertrick der ${cantrip[school]}`;
    }
    const prefix: Dict<School> = {
      abjuration: 'Bannzauber', conjuration: 'Beschwörungszauber', divination: 'Erkenntniszauber',
      enchantment: 'Verzauberungszauber', evocation: 'Hervorrufungszauber', illusion: 'Illusionszauber',
      necromancy: 'Nekromantiezauber', transmutation: 'Verwandlungszauber',
    };
    return `${prefix[school]} ${level}. Grades`;
  },
  classes: {
    barbarian: 'Barbar', bard: 'Barde', cleric: 'Kleriker', druid: 'Druide', fighter: 'Kämpfer',
    monk: 'Mönch', paladin: 'Paladin', ranger: 'Waldläufer', rogue: 'Schurke', sorcerer: 'Zauberer',
    warlock: 'Hexenmeister', wizard: 'Magier',
  },
  abilities: {
    str: 'Stärke', dex: 'Geschicklichkeit', con: 'Konstitution', int: 'Intelligenz', wis: 'Weisheit', cha: 'Charisma',
  },
  abilityShort: { str: 'STÄ', dex: 'GES', con: 'KON', int: 'INT', wis: 'WEI', cha: 'CHA' },
  damageTypes: {
    acid: 'Säure', bludgeoning: 'Wucht', cold: 'Kälte', fire: 'Feuer', force: 'Energie', lightning: 'Blitz',
    necrotic: 'nekrotisch', piercing: 'Stich', poison: 'Gift', psychic: 'psychisch', radiant: 'gleißend',
    slashing: 'Hieb', thunder: 'Schall',
  },
  castingUnits: {
    action: 'Aktion', bonus: 'Bonusaktion', reaction: 'Reaktion',
    minute: (n) => `${n} ${n === 1 ? 'Minute' : 'Minuten'}`,
    hour: (n) => `${n} ${n === 1 ? 'Stunde' : 'Stunden'}`,
  },
  orRitual: 'oder Ritual',
  ranges: { self: 'Selbst', touch: 'Berührung', sight: 'Sicht', unlimited: 'Unbegrenzt', special: 'Besonders' },
  componentLetters: { verbal: 'V', somatic: 'G', material: 'M' },
  durations: {
    instantaneous: 'Unmittelbar',
    round: (n) => `${n} ${n === 1 ? 'Runde' : 'Runden'}`,
    minute: (n) => `${n} ${n === 1 ? 'Minute' : 'Minuten'}`,
    hour: (n) => `${n} ${n === 1 ? 'Stunde' : 'Stunden'}`,
    day: (n) => `${n} ${n === 1 ? 'Tag' : 'Tage'}`,
    'until-dispelled': 'Bis der Zauber gebannt wird',
    'until-dispelled-or-triggered': 'Bis gebannt oder ausgelöst',
    special: 'Besonders',
    concentration: (inner) => `Konzentration, bis zu ${inner}`,
    concentrationShort: (inner) => `Konz., bis zu ${inner}`,
  },
  spellAttack: 'Zauberangriff',
  higherLevels: 'Auf höheren Graden.',
  cantripUpgrade: 'Verbesserung des Zaubertricks.',
  actionTypes: { action: 'Aktion', bonus: 'Bonusaktion', reaction: 'Reaktion' },
  activations: { action: 'Aktion', bonus: 'Bonusaktion', reaction: 'Reaktion', passive: 'Passiv' },
  recovery: { 'short-rest': 'Kurze Rast', 'long-rest': 'Lange Rast', none: 'Keine' },
  weaponCategory: (category, kind) => {
    const range = kind === 'melee' ? 'Nahkampf' : 'Fernkampf';
    return category === 'simple' ? `Einfache ${range}waffe` : `Kriegswaffe (${range})`;
  },
  weaponProperties: {
    ammunition: 'Geschosse', finesse: 'Finesse', heavy: 'Schwer', light: 'Leicht', loading: 'Laden',
    reach: 'Weitreichend', thrown: 'Wurfwaffe', 'two-handed': 'Zweihändig', versatile: 'Vielseitig',
  },
  ammunition: { arrow: 'Pfeil', bolt: 'Bolzen', 'firearm-bullet': 'Kugel', 'sling-bullet': 'Kugel', needle: 'Blasrohrpfeil' },
  masteries: {
    cleave: 'Spalten', graze: 'Streifen', nick: 'Einkerben', push: 'Stoßen', sap: 'Auslaugen',
    slow: 'Verlangsamen', topple: 'Umstoßen', vex: 'Plagen',
  },
  versatile: 'vielseitig',
  originKinds: {
    class: 'Klasse', subclass: 'Unterklasse', species: 'Spezies', feat: 'Talent', background: 'Hintergrund', other: 'Sonstiges',
  },
  featCategories: { origin: 'Herkunftstalent', general: 'Allgemeines Talent', 'fighting-style': 'Kampfstiltalent', 'epic-boon': 'Epische Gabe' },
  levelFrom: (level) => `ab Stufe ${level}`,
  itemCategories: {
    weapon: 'Waffe', armor: 'Rüstung', shield: 'Schild', ammunition: 'Munition', 'wondrous-item': 'Wundersamer Gegenstand',
    potion: 'Trank', ring: 'Ring', rod: 'Zepter', scroll: 'Schriftrolle', staff: 'Stab', wand: 'Zauberstab',
    'adventuring-gear': 'Abenteuerausrüstung', other: 'Gegenstand',
  },
  rarities: {
    common: 'Gewöhnlich', uncommon: 'Ungewöhnlich', rare: 'Selten', 'very-rare': 'Sehr selten',
    legendary: 'Legendär', artifact: 'Artefakt', varies: 'Variiert',
  },
  rarityShort: { common: 'G', uncommon: 'U', rare: 'S', 'very-rare': 'SS', legendary: 'L', artifact: 'A', varies: '*' },
  requiresAttunement: 'erfordert Einstimmung',
  yes: 'Ja',
  no: 'Nein',
  condition: 'Zustand',
  action: 'Aktion',
  feature: 'Fähigkeit',
  sources: { 'srd-5.2.1': 'SRD 5.2.1', custom: 'Eigene Eingabe' },
  continued: (part, total) => `(${part}/${total})`,
};

const en: CardTerms = {
  labels: {
    castingTime: 'Casting Time', range: 'Range', components: 'Components', duration: 'Duration',
    save: 'Saving Throw', attack: 'Attack', saveOrAttack: 'Save/Attack', damage: 'Damage',
    actionType: 'Action Type', properties: 'Properties', mastery: 'Mastery', reach: 'Reach', trigger: 'Trigger',
    origin: 'Origin', activation: 'Activation', uses: 'Uses', recovery: 'Recovery', prerequisite: 'Prerequisite',
    category: 'Category', rarity: 'Rarity', attunement: 'Attunement', charges: 'Charges',
  },
  schools: {
    abjuration: 'Abjuration', conjuration: 'Conjuration', divination: 'Divination', enchantment: 'Enchantment',
    evocation: 'Evocation', illusion: 'Illusion', necromancy: 'Necromancy', transmutation: 'Transmutation',
  },
  spellSubtitle: (school, level) =>
    level === 0 ? `${en.schools[school]} Cantrip` : `Level ${level} ${en.schools[school]}`,
  classes: {
    barbarian: 'Barbarian', bard: 'Bard', cleric: 'Cleric', druid: 'Druid', fighter: 'Fighter', monk: 'Monk',
    paladin: 'Paladin', ranger: 'Ranger', rogue: 'Rogue', sorcerer: 'Sorcerer', warlock: 'Warlock', wizard: 'Wizard',
  },
  abilities: {
    str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
  },
  abilityShort: { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' },
  damageTypes: {
    acid: 'Acid', bludgeoning: 'Bludgeoning', cold: 'Cold', fire: 'Fire', force: 'Force', lightning: 'Lightning',
    necrotic: 'Necrotic', piercing: 'Piercing', poison: 'Poison', psychic: 'Psychic', radiant: 'Radiant',
    slashing: 'Slashing', thunder: 'Thunder',
  },
  castingUnits: {
    action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction',
    minute: (n) => `${n} ${n === 1 ? 'minute' : 'minutes'}`,
    hour: (n) => `${n} ${n === 1 ? 'hour' : 'hours'}`,
  },
  orRitual: 'or Ritual',
  ranges: { self: 'Self', touch: 'Touch', sight: 'Sight', unlimited: 'Unlimited', special: 'Special' },
  componentLetters: { verbal: 'V', somatic: 'S', material: 'M' },
  durations: {
    instantaneous: 'Instantaneous',
    round: (n) => `${n} ${n === 1 ? 'round' : 'rounds'}`,
    minute: (n) => `${n} ${n === 1 ? 'minute' : 'minutes'}`,
    hour: (n) => `${n} ${n === 1 ? 'hour' : 'hours'}`,
    day: (n) => `${n} ${n === 1 ? 'day' : 'days'}`,
    'until-dispelled': 'Until dispelled',
    'until-dispelled-or-triggered': 'Until dispelled or triggered',
    special: 'Special',
    concentration: (inner) => `Concentration, up to ${inner}`,
    concentrationShort: (inner) => `Conc., up to ${inner}`,
  },
  spellAttack: 'Spell attack',
  higherLevels: 'Using a Higher-Level Spell Slot.',
  cantripUpgrade: 'Cantrip Upgrade.',
  actionTypes: { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction' },
  activations: { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction', passive: 'Passive' },
  recovery: { 'short-rest': 'Short Rest', 'long-rest': 'Long Rest', none: 'None' },
  weaponCategory: (category, kind) =>
    `${category === 'simple' ? 'Simple' : 'Martial'} ${kind === 'melee' ? 'Melee' : 'Ranged'} Weapon`,
  weaponProperties: {
    ammunition: 'Ammunition', finesse: 'Finesse', heavy: 'Heavy', light: 'Light', loading: 'Loading',
    reach: 'Reach', thrown: 'Thrown', 'two-handed': 'Two-Handed', versatile: 'Versatile',
  },
  ammunition: { arrow: 'Arrow', bolt: 'Bolt', 'firearm-bullet': 'Bullet', 'sling-bullet': 'Bullet', needle: 'Needle' },
  masteries: {
    cleave: 'Cleave', graze: 'Graze', nick: 'Nick', push: 'Push', sap: 'Sap', slow: 'Slow', topple: 'Topple', vex: 'Vex',
  },
  versatile: 'versatile',
  originKinds: {
    class: 'Class', subclass: 'Subclass', species: 'Species', feat: 'Feat', background: 'Background', other: 'Other',
  },
  featCategories: { origin: 'Origin Feat', general: 'General Feat', 'fighting-style': 'Fighting Style Feat', 'epic-boon': 'Epic Boon Feat' },
  levelFrom: (level) => `level ${level}+`,
  itemCategories: {
    weapon: 'Weapon', armor: 'Armor', shield: 'Shield', ammunition: 'Ammunition', 'wondrous-item': 'Wondrous Item',
    potion: 'Potion', ring: 'Ring', rod: 'Rod', scroll: 'Scroll', staff: 'Staff', wand: 'Wand',
    'adventuring-gear': 'Adventuring Gear', other: 'Item',
  },
  rarities: {
    common: 'Common', uncommon: 'Uncommon', rare: 'Rare', 'very-rare': 'Very Rare',
    legendary: 'Legendary', artifact: 'Artifact', varies: 'Varies',
  },
  rarityShort: { common: 'C', uncommon: 'U', rare: 'R', 'very-rare': 'VR', legendary: 'L', artifact: 'A', varies: '*' },
  requiresAttunement: 'requires attunement',
  yes: 'Yes',
  no: 'No',
  condition: 'Condition',
  action: 'Action',
  feature: 'Feature',
  sources: { 'srd-5.2.1': 'SRD 5.2.1', custom: 'Custom' },
  continued: (part, total) => `(${part}/${total})`,
};

export const TERMS: Record<Lang, CardTerms> = { de, en };

export function terms(lang: Lang): CardTerms {
  return TERMS[lang];
}
