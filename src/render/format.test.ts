import { describe, expect, it } from 'vitest';
import { displayCard } from './format';
import { actionSurge, bagOfHolding, blinded, fireball, longbow, longsword, wandOfMagicMissiles } from '../test/fixtures';
import type { Card } from '../model/schema';

const props = (card: Card, lang: 'de' | 'en') =>
  Object.fromEntries(displayCard(card, lang).properties.map((p) => [p.label, p.value]));

describe('displayCard – spell (design reference "Feuerball")', () => {
  it('matches the German reference card', () => {
    const d = displayCard(fireball, 'de');
    expect(d.title).toBe('Feuerball');
    expect(d.subtitle).toBe('Hervorrufungszauber 3. Grades');
    expect(props(fireball, 'de')).toEqual({
      Zeitaufwand: 'Aktion', Reichweite: '45 m', Komponenten: 'V, G, M *', Wirkungsdauer: 'Unmittelbar',
      Rettungswurf: 'GES', Schaden: '8W6 Feuer',
    });
    expect(d.footnotes).toEqual(['* eine Kugel aus Fledermaus-Guano und Schwefel']);
    expect(d.closing).toEqual({ label: 'Auf höheren Graden.', text: 'Für jeden Zauberplatzgrad über dem 3. wird der Schaden um 1W6 erhöht.' });
    expect(d.footerLeft).toBe('Zauberer, Magier');
    expect(d.footerRight).toBe('SRD 5.2.1');
    expect(d.badge).toBe('3');
    expect(d.icon).toBe('fireball');
  });

  it('renders English with feet and English terms', () => {
    const d = displayCard(fireball, 'en');
    expect(d.subtitle).toBe('Level 3 Evocation');
    expect(props(fireball, 'en')).toMatchObject({ Range: '150 ft.', Components: 'V, S, M *', 'Saving Throw': 'DEX', Damage: '8d6 Fire' });
    expect(d.closing?.label).toBe('Using a Higher-Level Spell Slot.');
  });

  it('handles cantrips, rituals, concentration, reactions and attacks', () => {
    if (fireball.type !== 'spell') throw new Error();
    const spell: Card = {
      ...fireball,
      spell: {
        ...fireball.spell, level: 0, ritual: true, concentration: true, attack: true, save: undefined,
        castingTime: { unit: 'reaction', trigger: { de: 'wenn du getroffen wirst', en: 'when you are hit' } },
        duration: { kind: 'minute', amount: 10 }, range: { kind: 'self' },
        components: { verbal: true, somatic: false, material: false },
      },
    };
    const d = displayCard(spell, 'de');
    expect(d.subtitle).toBe('Zaubertrick der Hervorrufung');
    expect(d.closing?.label).toBe('Verbesserung des Zaubertricks.');
    expect(props(spell, 'de')).toMatchObject({
      Zeitaufwand: 'Reaktion oder Ritual †', Reichweite: 'Selbst', Komponenten: 'V',
      Wirkungsdauer: 'Konz., bis zu 10 Minuten', Angriff: 'Zauberangriff',
    });
    expect(d.footnotes).toEqual(['† wenn du getroffen wirst']);
    expect(displayCard(spell, 'en').subtitle).toBe('Evocation Cantrip');
  });

  it('colours spells by school only when enabled', () => {
    if (fireball.type !== 'spell') throw new Error();
    const illusion: Card = { ...fireball, spell: { ...fireball.spell, school: 'illusion' } };
    expect(displayCard(illusion, 'de').accent).toBe('#8a2a12');
    expect(displayCard(illusion, 'de', { colorBySchool: true }).accent).not.toBe('#8a2a12');
    expect(displayCard(illusion, 'de').icon).toBe('domino-mask');
  });
});

describe('displayCard – other types', () => {
  it('weapon attacks show damage, versatile, reach, properties and mastery', () => {
    expect(props(longsword, 'de')).toEqual({
      Aktionsart: 'Aktion', Schaden: '1W8 Hieb (vielseitig 1W10)', Reichweite: '1,5 m',
      Eigenschaften: 'Vielseitig', Meisterschaft: 'Auslaugen',
    });
    const d = displayCard(longsword, 'de');
    expect(d.subtitle).toBe('Kriegswaffe (Nahkampf)');
    expect(d.closing).toEqual({ label: 'Auslaugen.', text: 'Das Ziel ist bei seinem nächsten Angriffswurf im Nachteil.' });
    expect(props(longbow, 'de')).toMatchObject({ Reichweite: '45/180 m', Eigenschaften: 'Geschosse (Pfeil), Schwer, Zweihändig' });
    expect(props(longbow, 'en')).toMatchObject({ Range: '150/600 ft.', Damage: '1d8 Piercing' });
    expect(displayCard(longsword, 'en').subtitle).toBe('Martial Melee Weapon');
  });

  it('features show origin, activation and recovery', () => {
    expect(props(actionSurge, 'de')).toEqual({ Herkunft: 'Kämpfer, ab Stufe 2', Aktionsart: 'Passiv', Erholung: 'Kurze Rast' });
    expect(displayCard(actionSurge, 'en').badge).toBe('2');
  });

  it('items show category, rarity, attunement and charges', () => {
    expect(props(bagOfHolding, 'de')).toEqual({ Kategorie: 'Wundersamer Gegenstand', Seltenheit: 'Ungewöhnlich', Einstimmung: 'Nein' });
    expect(displayCard(bagOfHolding, 'de').subtitle).toBe('Wundersamer Gegenstand, ungewöhnlich');
    expect(displayCard(bagOfHolding, 'de').badge).toBe('U');
    expect(props(wandOfMagicMissiles, 'en')).toMatchObject({ Attunement: 'by a Spellcaster', Charges: '7 · 1d6 + 1 at dawn' });
    expect(displayCard(wandOfMagicMissiles, 'en').subtitle).toBe('Wand, uncommon (requires attunement)');
  });

  it('conditions have no property block', () => {
    const d = displayCard(blinded, 'de');
    expect(d.properties).toEqual([]);
    expect(d.subtitle).toBe('Zustand');
    expect(d.badge).toBeUndefined();
  });

  it('falls back to the other language and labels custom cards', () => {
    const custom: Card = { ...blinded, source: 'custom', name: { en: 'Dazed' }, description: { en: 'x' } };
    const d = displayCard(custom, 'de');
    expect(d.title).toBe('Dazed');
    expect(d.footerRight).toBe('Eigene Eingabe');
  });
});
