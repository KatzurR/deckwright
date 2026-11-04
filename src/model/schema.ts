/**
 * Card data model (SPEC §4) as zod schemas.
 *
 * The schemas are the single source of truth: TypeScript types are inferred from them,
 * the editor validates with them, and deck files are checked against them on import.
 *
 * Conventions
 * - Structured values are stored as language-neutral keys (e.g. `school: 'evocation'`)
 *   and translated when rendering. Only free text is stored per language.
 * - Distances are stored in feet (the unit of the English SRD). German cards render them
 *   in metres using the SRD conversion 5 ft = 1.5 m (1 mile = 1.6 km).
 * - Dice are stored in English notation (`8d6`) and localised when rendering (`8W6`).
 */
import { z } from 'zod';

export const LANGS = ['de', 'en'] as const;
export const langSchema = z.enum(LANGS);
export type Lang = z.infer<typeof langSchema>;

/** Free text per language. SRD cards have both languages, custom cards at least one. */
export const localizedTextSchema = z
  .object({ de: z.string().optional(), en: z.string().optional() })
  .strict();
export type LocalizedText = z.infer<typeof localizedTextSchema>;

/** Localized text that must contain at least one non-empty language. */
export const requiredTextSchema = localizedTextSchema.refine(
  (t) => Boolean(t.de?.trim() || t.en?.trim()),
  { message: 'required' },
);

export const CARD_TYPES = ['spell', 'action', 'feature', 'item', 'condition'] as const;
export const cardTypeSchema = z.enum(CARD_TYPES);
export type CardType = z.infer<typeof cardTypeSchema>;

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
export const abilitySchema = z.enum(ABILITIES);
export type Ability = z.infer<typeof abilitySchema>;

export const DAMAGE_TYPES = [
  'acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic',
  'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder',
] as const;
export const damageTypeSchema = z.enum(DAMAGE_TYPES);
export type DamageType = z.infer<typeof damageTypeSchema>;

export const SCHOOLS = [
  'abjuration', 'conjuration', 'divination', 'enchantment',
  'evocation', 'illusion', 'necromancy', 'transmutation',
] as const;
export const schoolSchema = z.enum(SCHOOLS);
export type School = z.infer<typeof schoolSchema>;

export const CLASSES = [
  'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
  'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard',
] as const;
export const classSchema = z.enum(CLASSES);
export type ClassKey = z.infer<typeof classSchema>;

/** Dice expression in English notation, e.g. `1d8`, `2d6 + 4`, `1`. */
export const diceSchema = z.string().regex(/^\s*\d*d?\d+(\s*[+-]\s*\d+)?\s*$/i, 'dice');

export const damageSchema = z
  .object({
    dice: diceSchema.optional(),
    types: z.array(damageTypeSchema).default([]),
  })
  .strict();
export type Damage = z.infer<typeof damageSchema>;

// ---------------------------------------------------------------------------
// Spell (SPEC §4.1)

export const CASTING_UNITS = ['action', 'bonus', 'reaction', 'minute', 'hour'] as const;
export const castingTimeSchema = z
  .object({
    unit: z.enum(CASTING_UNITS),
    /** Only for minute/hour, e.g. 10 minutes. */
    amount: z.number().int().positive().optional(),
    /** Reaction trigger, e.g. "which you take when …". */
    trigger: localizedTextSchema.optional(),
  })
  .strict();
export type CastingTime = z.infer<typeof castingTimeSchema>;

export const RANGE_KINDS = ['self', 'touch', 'distance', 'sight', 'unlimited', 'special'] as const;
export const rangeSchema = z
  .object({
    kind: z.enum(RANGE_KINDS),
    /** Distance in feet, required for kind = distance. */
    feet: z.number().positive().optional(),
  })
  .strict()
  .refine((r) => r.kind !== 'distance' || r.feet !== undefined, { message: 'feet' });
export type Range = z.infer<typeof rangeSchema>;

export const componentsSchema = z
  .object({
    verbal: z.boolean(),
    somatic: z.boolean(),
    material: z.boolean(),
    materialText: localizedTextSchema.optional(),
    /** Cost in GP if the material has a cost. */
    materialCost: z.number().nonnegative().optional(),
    materialConsumed: z.boolean().optional(),
  })
  .strict();
export type Components = z.infer<typeof componentsSchema>;

export const DURATION_KINDS = [
  'instantaneous', 'round', 'minute', 'hour', 'day',
  'until-dispelled', 'until-dispelled-or-triggered', 'special',
] as const;
export const durationSchema = z
  .object({
    kind: z.enum(DURATION_KINDS),
    /** Number of rounds/minutes/hours/days. */
    amount: z.number().int().positive().optional(),
  })
  .strict();
export type Duration = z.infer<typeof durationSchema>;

export const spellDataSchema = z
  .object({
    level: z.number().int().min(0).max(9),
    school: schoolSchema,
    castingTime: castingTimeSchema,
    ritual: z.boolean().default(false),
    range: rangeSchema,
    components: componentsSchema,
    duration: durationSchema,
    concentration: z.boolean().default(false),
    /** Spell attack roll (no number – the card is not bound to a character). */
    attack: z.boolean().default(false),
    save: abilitySchema.optional(),
    damage: damageSchema.optional(),
    classes: z.array(classSchema).default([]),
    higherLevels: localizedTextSchema.optional(),
  })
  .strict();
export type SpellData = z.infer<typeof spellDataSchema>;

// ---------------------------------------------------------------------------
// Action (SPEC §4.2)

export const ACTION_TYPES = ['action', 'bonus', 'reaction'] as const;
export const actionTypeSchema = z.enum(ACTION_TYPES);
export type ActionType = z.infer<typeof actionTypeSchema>;

export const WEAPON_PROPERTIES = [
  'ammunition', 'finesse', 'heavy', 'light', 'loading',
  'reach', 'thrown', 'two-handed', 'versatile',
] as const;
export const weaponPropertySchema = z.enum(WEAPON_PROPERTIES);
export type WeaponProperty = z.infer<typeof weaponPropertySchema>;

export const MASTERIES = ['cleave', 'graze', 'nick', 'push', 'sap', 'slow', 'topple', 'vex'] as const;
export const masterySchema = z.enum(MASTERIES);
export type Mastery = z.infer<typeof masterySchema>;

export const AMMUNITION = ['arrow', 'bolt', 'firearm-bullet', 'sling-bullet', 'needle'] as const;

export const weaponDataSchema = z
  .object({
    /** srdKey of the weapon the values were taken from. */
    key: z.string().optional(),
    category: z.enum(['simple', 'martial']),
    kind: z.enum(['melee', 'ranged']),
    versatileDice: diceSchema.optional(),
    properties: z.array(weaponPropertySchema).default([]),
    ammunition: z.enum(AMMUNITION).optional(),
  })
  .strict();
export type WeaponData = z.infer<typeof weaponDataSchema>;

export const actionDataSchema = z
  .object({
    actionType: actionTypeSchema,
    weapon: weaponDataSchema.optional(),
    damage: damageSchema.optional(),
    /** Normal and long range in feet (ranged or thrown weapons). */
    range: z
      .object({ normal: z.number().positive(), long: z.number().positive().optional() })
      .strict()
      .optional(),
    /** Reach in feet for melee attacks (5 ft, 10 ft with the Reach property). */
    reach: z.number().positive().optional(),
    mastery: masterySchema.optional(),
    masteryText: localizedTextSchema.optional(),
    trigger: localizedTextSchema.optional(),
  })
  .strict();
export type ActionData = z.infer<typeof actionDataSchema>;

// ---------------------------------------------------------------------------
// Feature (SPEC §4.3)

export const ORIGIN_KINDS = ['class', 'subclass', 'species', 'feat', 'background', 'other'] as const;
export const FEAT_CATEGORIES = ['origin', 'general', 'fighting-style', 'epic-boon'] as const;

export const featureOriginSchema = z
  .object({
    kind: z.enum(ORIGIN_KINDS),
    classKey: classSchema.optional(),
    /** Subclass, species, background or free origin name. */
    name: localizedTextSchema.optional(),
    /** Level at which the feature is gained. */
    level: z.number().int().min(1).max(20).optional(),
    featCategory: z.enum(FEAT_CATEGORIES).optional(),
  })
  .strict();
export type FeatureOrigin = z.infer<typeof featureOriginSchema>;

export const ACTIVATIONS = ['action', 'bonus', 'reaction', 'passive'] as const;
export const RECOVERY = ['short-rest', 'long-rest', 'none'] as const;

export const featureDataSchema = z
  .object({
    origin: featureOriginSchema,
    activation: z.enum(ACTIVATIONS).default('passive'),
    /** Uses as stated in the rules, e.g. "Number = Proficiency Bonus". */
    uses: localizedTextSchema.optional(),
    recovery: z.enum(RECOVERY).optional(),
    prerequisite: localizedTextSchema.optional(),
  })
  .strict();
export type FeatureData = z.infer<typeof featureDataSchema>;

// ---------------------------------------------------------------------------
// Item (SPEC §4.4)

export const ITEM_CATEGORIES = [
  'weapon', 'armor', 'shield', 'ammunition', 'wondrous-item', 'potion', 'ring',
  'rod', 'scroll', 'staff', 'wand', 'adventuring-gear', 'other',
] as const;
export const RARITIES = ['common', 'uncommon', 'rare', 'very-rare', 'legendary', 'artifact', 'varies'] as const;
export const raritySchema = z.enum(RARITIES);
export type Rarity = z.infer<typeof raritySchema>;

export const itemDataSchema = z
  .object({
    category: z.enum(ITEM_CATEGORIES),
    /** Qualifier of the category, e.g. "any Sword". */
    categoryDetail: localizedTextSchema.optional(),
    rarity: raritySchema,
    /** Free text for "varies" or graded rarities, e.g. "+1 uncommon, +2 rare, +3 very rare". */
    rarityText: localizedTextSchema.optional(),
    attunement: z.boolean().default(false),
    attunementDetail: localizedTextSchema.optional(),
    charges: z
      .object({
        count: z.number().int().positive().optional(),
        recharge: localizedTextSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type ItemData = z.infer<typeof itemDataSchema>;

// ---------------------------------------------------------------------------
// Cards

export const SOURCES = ['srd-5.2.1', 'custom'] as const;

const baseCardShape = {
  id: z.string().min(1),
  srdKey: z.string().optional(),
  name: requiredTextSchema,
  description: requiredTextSchema,
  source: z.enum(SOURCES).optional(),
  tags: z.array(z.string()).optional(),
};

export const spellCardSchema = z.object({ ...baseCardShape, type: z.literal('spell'), spell: spellDataSchema }).strict();
export const actionCardSchema = z.object({ ...baseCardShape, type: z.literal('action'), action: actionDataSchema }).strict();
export const featureCardSchema = z.object({ ...baseCardShape, type: z.literal('feature'), feature: featureDataSchema }).strict();
export const itemCardSchema = z.object({ ...baseCardShape, type: z.literal('item'), item: itemDataSchema }).strict();
export const conditionCardSchema = z.object({ ...baseCardShape, type: z.literal('condition') }).strict();

export const cardSchema = z.discriminatedUnion('type', [
  spellCardSchema,
  actionCardSchema,
  featureCardSchema,
  itemCardSchema,
  conditionCardSchema,
]);

export type SpellCard = z.infer<typeof spellCardSchema>;
export type ActionCard = z.infer<typeof actionCardSchema>;
export type FeatureCard = z.infer<typeof featureCardSchema>;
export type ItemCard = z.infer<typeof itemCardSchema>;
export type ConditionCard = z.infer<typeof conditionCardSchema>;
export type Card = z.infer<typeof cardSchema>;
/** Card before defaults are applied (what callers may pass in). */
export type CardInput = z.input<typeof cardSchema>;

// ---------------------------------------------------------------------------
// Decks

export const deckSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
    /** Card language: labels and texts follow it, independent of the UI language (SPEC §9). */
    lang: langSchema,
    options: z
      .object({
        /** Spell cards take the accent colour of their school instead of the spell colour (SPEC §5). */
        colorBySchool: z.boolean().optional(),
      })
      .strict()
      .optional(),
    cards: z.array(cardSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();
export type Deck = z.infer<typeof deckSchema>;

// ---------------------------------------------------------------------------
// Catalog files produced by the data pipeline (data/catalog/*.json)

export const CATALOG_FORMAT_VERSION = 1;

export const catalogFileSchema = z
  .object({
    formatVersion: z.literal(CATALOG_FORMAT_VERSION),
    type: cardTypeSchema,
    source: z.literal('srd-5.2.1'),
    /** Every entry has `srdKey` set and `id === srdKey`. */
    entries: z.array(cardSchema),
  })
  .strict();
export type CatalogFile = z.infer<typeof catalogFileSchema>;
