import { describe, expect, it } from 'vitest';
import { inferUsage } from '../build/features';
import { materialConsumed, materialCost } from '../build/spells';
import { distanceTokens, numberWordsToDigits } from '../concepts';
import { effectsAsList, parseTaggedName } from './glossary';
import { parseCharges, parseItemHeader } from './items';
import { parseCastingTime, parseComponents, parseDuration, parseRange, parseSubtitle } from './spells';
import { parseWeaponRow } from './weapons';

describe('spell fields', () => {
  it('parses subtitles in both languages', () => {
    expect(parseSubtitle('Level 3 Evocation (Sorcerer, Wizard)', 'en')).toEqual({
      level: 3, school: 'evocation', classes: ['sorcerer', 'wizard'],
    });
    expect(parseSubtitle('Hervorrufungszauber 3. Grades (Magier, Zauberer)', 'de')).toEqual({
      level: 3, school: 'evocation', classes: ['wizard', 'sorcerer'],
    });
    expect(parseSubtitle('Conjuration Cantrip (Sorcerer, Wizard)', 'en').level).toBe(0);
    expect(parseSubtitle('Zaubertrick der Bannmagie (Kleriker)', 'de')).toMatchObject({ level: 0, school: 'abjuration' });
    expect(() => parseSubtitle('Level 3 Evocation (Pirate)', 'en')).toThrow(/Unknown class/);
  });

  it('parses casting times, triggers and rituals', () => {
    expect(parseCastingTime('Action', 'en')).toEqual({ castingTime: { unit: 'action' }, ritual: false });
    expect(parseCastingTime('1 minute or Ritual', 'en')).toEqual({ castingTime: { unit: 'minute', amount: 1 }, ritual: true });
    expect(parseCastingTime('Reaction, which you take when you are hit', 'en').castingTime).toEqual({
      unit: 'reaction', trigger: 'which you take when you are hit',
    });
    expect(parseCastingTime('10 Minuten oder Ritual', 'de')).toEqual({ castingTime: { unit: 'minute', amount: 10 }, ritual: true });
    expect(parseCastingTime('Bonusaktion', 'de').castingTime).toEqual({ unit: 'bonus', trigger: undefined });
    expect(parseCastingTime('8 Stunden', 'de').castingTime).toEqual({ unit: 'hour', amount: 8 });
  });

  it('converts German ranges back to feet (0.3 m per foot, 1.6 km per mile)', () => {
    expect(parseRange('150 feet', 'en')).toEqual({ kind: 'distance', feet: 150 });
    expect(parseRange('45 Meter', 'de')).toEqual({ kind: 'distance', feet: 150 });
    expect(parseRange('1 mile', 'en')).toEqual({ kind: 'distance', feet: 5280 });
    expect(parseRange('1,6 Kilometer', 'de')).toEqual({ kind: 'distance', feet: 5280 });
    expect(parseRange('Self (15-foot Cone)', 'en')).toEqual({ kind: 'self' });
    expect(parseRange('Berührung', 'de')).toEqual({ kind: 'touch' });
  });

  it('parses components, including the German "S" for somatic', () => {
    expect(parseComponents('V, S, M (a pinch of sulfur)', 'en')).toEqual({
      verbal: true, somatic: true, material: true, materialText: 'a pinch of sulfur',
    });
    expect(parseComponents('V, G', 'de')).toMatchObject({ verbal: true, somatic: true, material: false });
    expect(parseComponents('V, S', 'de').somatic).toBe(true);
  });

  it('parses durations and concentration', () => {
    expect(parseDuration('Concentration, up to 1 minute', 'en')).toEqual({
      duration: { kind: 'minute', amount: 1 }, concentration: true,
    });
    expect(parseDuration('Konzentration, bis zu 1 Stunde', 'de')).toEqual({
      duration: { kind: 'hour', amount: 1 }, concentration: true,
    });
    expect(parseDuration('Instantaneous', 'en').duration).toEqual({ kind: 'instantaneous' });
    expect(parseDuration('Bis der Zauber gebannt oder ausgelöst wird', 'de').duration).toEqual({
      kind: 'until-dispelled-or-triggered',
    });
    expect(parseDuration('Up to 8 hours', 'en')).toEqual({ duration: { kind: 'hour', amount: 8 }, concentration: false });
    expect(() => parseDuration('Forever and a day', 'en')).toThrow();
  });

  it('reads material cost and consumption', () => {
    expect(materialCost('a diamond worth 300+ GP, which the spell consumes')).toBe(300);
    expect(materialCost('ein Diamant im Wert von mindestens 1.000 GM')).toBe(1000);
    expect(materialCost('a feather')).toBeUndefined();
    expect(materialConsumed('which the spell consumes', 'en')).toBe(true);
    expect(materialConsumed('den der Zauber verbraucht', 'de')).toBe(true);
    expect(materialConsumed('a feather', 'en')).toBe(false);
  });
});

describe('magic item headers and charges', () => {
  it('parses category, rarity and attunement', () => {
    expect(parseItemHeader('Wondrous Item, Rare (Requires Attunement by a Wizard)', 'en')).toMatchObject({
      category: 'wondrous-item', rarity: 'rare', attunement: true, attunementDetail: 'by a Wizard',
    });
    expect(parseItemHeader('Armor (Shield), Uncommon', 'en')).toMatchObject({ category: 'shield', categoryDetail: undefined });
  });

  it('marks graded items as "varies"', () => {
    const h = parseItemHeader('Weapon (Any Simple or Martial), Uncommon (+1), Rare (+2), or Very Rare (+3)', 'en');
    expect(h.rarity).toBe('varies');
    expect(h.rarities).toEqual(['uncommon', 'rare', 'very-rare']);
    expect(h.rarityText).toBe('Uncommon (+1), Rare (+2), or Very Rare (+3)');
  });

  it('finds charges and recharge in both languages', () => {
    expect(parseCharges('This wand has 7 charges. It regains 1d6 + 1 expended charges daily at dawn.', 'en')).toEqual({
      count: 7, recharge: '1d6 + 1 daily at dawn',
    });
    expect(parseCharges('Der Zauberstab hat sieben Ladungen und erhält täglich im Morgengrauen 1W6+1 verbrauchte Ladungen zurück.', 'de')).toEqual({
      count: 7, recharge: '1W6 + 1 täglich im Morgengrauen',
    });
    expect(parseCharges('No charges at all.', 'en')).toBeUndefined();
  });
});

describe('weapon table rows', () => {
  it('parses damage, properties, range and mastery', () => {
    const w = parseWeaponRow('Longbow\t1d8 Piercing\tAmmunition (Range 150/600; Arrow), Heavy, Two-Handed\tSlow\t2 lb.\t50 GP', 'en', {
      category: 'martial', kind: 'ranged',
    });
    expect(w).toMatchObject({
      name: 'Longbow', dice: '1d8', damageType: 'piercing', mastery: 'slow', range: [150, 600],
      properties: ['ammunition', 'heavy', 'two-handed'],
    });
  });

  it('reads versatile dice', () => {
    const w = parseWeaponRow('Longsword\t1d8 Slashing\tVersatile (1d10)\tSap\t3 lb.\t15 GP', 'en', { category: 'martial', kind: 'melee' });
    expect(w.versatileDice).toBe('1d10');
    expect(w.mastery).toBe('sap');
  });
});

describe('glossary entries', () => {
  it('reads the tag of a heading in both languages', () => {
    expect(parseTaggedName('Blinded [Condition]', 'en')).toEqual({ name: 'Blinded', tag: 'condition' });
    expect(parseTaggedName('Blind (Zustand)', 'de')).toEqual({ name: 'Blind', tag: 'condition' });
    expect(parseTaggedName('Attack [Action]', 'en')).toEqual({ name: 'Attack', tag: 'action' });
    expect(parseTaggedName('Bloodied', 'en')).toBeUndefined();
  });

  it('turns run-in paragraphs into a bullet list after the intro', () => {
    expect(effectsAsList('While blinded:\n\n**Can’t See.** You fail.\n\n**Attacks.** Disadvantage.\n\nMore text.')).toBe(
      'While blinded:\n\n- **Can’t See.** You fail.\n- **Attacks.** Disadvantage. More text.',
    );
  });
});

describe('concept tokens', () => {
  it('replaces number words', () => {
    expect(numberWordsToDigits('has seven charges', 'en')).toBe('has 7 charges');
    expect(numberWordsToDigits('sieben Ladungen', 'de')).toBe('7 Ladungen');
  });

  it('normalises distances to feet in both languages', () => {
    expect(distanceTokens('within 120 feet and a 20-foot cube', 'en')).toEqual(['dist:120', 'dist:20']);
    expect(distanceTokens('im Umkreis von 36 Metern, ein Würfel von 6 m', 'de')).toEqual(['dist:120', 'dist:20']);
    expect(distanceTokens('1,5 m', 'de')).toEqual(['dist:5']);
  });
});

describe('feature usage heuristics', () => {
  it('infers activation, recovery and uses from the English text', () => {
    expect(inferUsage('As a Bonus Action, you can … Once you use this feature, you can’t do so again until you finish a Long Rest.')).toEqual({
      activation: 'bonus', recovery: 'long-rest', uses: { en: '1', de: '1' },
    });
    expect(inferUsage('You can use it a number of times equal to your Proficiency Bonus, and you regain all uses when you finish a Short or Long Rest.')).toEqual({
      activation: 'passive', recovery: 'short-rest', uses: { en: 'Proficiency Bonus', de: 'Übungsbonus' },
    });
    expect(inferUsage('You have Darkvision.')).toEqual({ activation: 'passive' });
  });
});
