/** Sample cards for tests (texts from SRD 5.2.1, CC BY 4.0). */
import type { Card } from '../model/schema';

export const fireball: Card = {
  id: 'fireball-1',
  srdKey: 'srd-2024_fireball',
  type: 'spell',
  source: 'srd-5.2.1',
  name: { de: 'Feuerball', en: 'Fireball' },
  description: {
    de: 'Du verschießt einen hellen Lichtstrahl auf einen Punkt deiner Wahl in Reichweite, wo er unter dumpfem Grollen zu einer Flammenexplosion detoniert. Jede Kreatur in einer Kugel mit einem Radius von sechs Metern um diesen Punkt führt einen Geschicklichkeitsrettungswurf aus. Misslingt der Wurf, so erleidet sie 8W6 Feuerschaden, anderenfalls die Hälfte.\n\nBrennbare Gegenstände im Bereich, die nicht getragen oder gehalten werden, beginnen zu brennen.',
    en: 'A bright streak flashes from you to a point you choose within range and then blossoms with a low roar into a fiery explosion. Each creature in a 20-foot-radius Sphere centered on that point makes a Dexterity saving throw, taking 8d6 Fire damage on a failed save or half as much damage on a successful one.\n\nFlammable objects in the area that aren’t being worn or carried start burning.',
  },
  spell: {
    level: 3,
    school: 'evocation',
    castingTime: { unit: 'action' },
    ritual: false,
    range: { kind: 'distance', feet: 150 },
    components: {
      verbal: true, somatic: true, material: true,
      materialText: { de: 'eine Kugel aus Fledermaus-Guano und Schwefel', en: 'a ball of bat guano and sulfur' },
    },
    duration: { kind: 'instantaneous' },
    concentration: false,
    attack: false,
    save: 'dex',
    damage: { dice: '8d6', types: ['fire'] },
    classes: ['sorcerer', 'wizard'],
    higherLevels: {
      de: 'Für jeden Zauberplatzgrad über dem 3. wird der Schaden um 1W6 erhöht.',
      en: 'The damage increases by 1d6 for each spell slot level above 3.',
    },
  },
};

export const longsword: Card = {
  id: 'longsword-1',
  srdKey: 'srd-2024_longsword',
  type: 'action',
  source: 'srd-5.2.1',
  name: { de: 'Langschwert', en: 'Longsword' },
  description: { de: 'Angriff mit einem Langschwert.', en: 'Attack with a longsword.' },
  action: {
    actionType: 'action',
    weapon: { key: 'srd-2024_longsword', category: 'martial', kind: 'melee', versatileDice: '1d10', properties: ['versatile'] },
    damage: { dice: '1d8', types: ['slashing'] },
    reach: 5,
    mastery: 'sap',
    masteryText: { de: 'Das Ziel ist bei seinem nächsten Angriffswurf im Nachteil.', en: 'The target has Disadvantage on its next attack roll.' },
  },
};

export const longbow: Card = {
  id: 'longbow-1',
  type: 'action',
  source: 'srd-5.2.1',
  name: { de: 'Langbogen', en: 'Longbow' },
  description: { en: 'Attack with a longbow.' },
  action: {
    actionType: 'action',
    weapon: { category: 'martial', kind: 'ranged', properties: ['ammunition', 'heavy', 'two-handed'], ammunition: 'arrow' },
    damage: { dice: '1d8', types: ['piercing'] },
    range: { normal: 150, long: 600 },
    mastery: 'slow',
  },
};

export const blinded: Card = {
  id: 'blinded-1',
  srdKey: 'srd-2024_condition_blinded',
  type: 'condition',
  source: 'srd-5.2.1',
  name: { de: 'Blind', en: 'Blinded' },
  description: {
    de: '- **Nicht sehfähig:** Du kannst nicht sehen.\n- **Beeinträchtigte Angriffe:** Angriffswürfe gegen dich sind im Vorteil.',
    en: "- **Can't See.** You can't see.\n- **Attacks Affected.** Attack rolls against you have Advantage.",
  },
};

export const actionSurge: Card = {
  id: 'action-surge-1',
  type: 'feature',
  source: 'srd-5.2.1',
  name: { de: 'Tatendrang', en: 'Action Surge' },
  description: { en: 'You can push yourself beyond your normal limits for a moment.' },
  feature: { origin: { kind: 'class', classKey: 'fighter', level: 2 }, activation: 'passive', recovery: 'short-rest' },
};

export const bagOfHolding: Card = {
  id: 'bag-1',
  type: 'item',
  source: 'srd-5.2.1',
  name: { de: 'Nimmervoller Beutel', en: 'Bag of Holding' },
  description: { en: 'This bag has an interior space considerably larger than its outside dimensions.' },
  item: { category: 'wondrous-item', rarity: 'uncommon', attunement: false },
};

export const wandOfMagicMissiles: Card = {
  id: 'wand-1',
  type: 'item',
  source: 'srd-5.2.1',
  name: { en: 'Wand of Magic Missiles' },
  description: { en: 'This wand has 7 charges.' },
  item: {
    category: 'wand', rarity: 'uncommon', attunement: true,
    attunementDetail: { en: 'by a Spellcaster' },
    charges: { count: 7, recharge: { en: '1d6 + 1 at dawn' } },
  },
};

export const ALL_FIXTURES: Card[] = [fireball, longsword, longbow, blinded, actionSurge, bagOfHolding, wandOfMagicMissiles];
