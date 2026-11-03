import { describe, expect, it } from 'vitest';
import { UI_RESOURCES } from './ui';
import { TERMS } from './terms';
import { CLASSES, DAMAGE_TYPES, MASTERIES, RARITIES, SCHOOLS, WEAPON_PROPERTIES } from '../model/schema';

function keys(obj: unknown, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe('UI translations', () => {
  it('German and English have exactly the same keys', () => {
    expect(keys(UI_RESOURCES.de).sort()).toEqual(keys(UI_RESOURCES.en).sort());
  });
  it('has no empty strings', () => {
    for (const lang of ['de', 'en'] as const) {
      const flat = keys(UI_RESOURCES[lang]);
      for (const k of flat) {
        const value = k.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], UI_RESOURCES[lang]);
        expect(String(value).trim(), `${lang}:${k}`).not.toBe('');
      }
    }
  });
});

describe('card terms', () => {
  it.each(['de', 'en'] as const)('%s covers every key of the data model', (lang) => {
    const t = TERMS[lang];
    for (const s of SCHOOLS) expect(t.schools[s]).toBeTruthy();
    for (const c of CLASSES) expect(t.classes[c]).toBeTruthy();
    for (const d of DAMAGE_TYPES) expect(t.damageTypes[d]).toBeTruthy();
    for (const m of MASTERIES) expect(t.masteries[m]).toBeTruthy();
    for (const p of WEAPON_PROPERTIES) expect(t.weaponProperties[p]).toBeTruthy();
    for (const r of RARITIES) expect(t.rarities[r]).toBeTruthy();
  });

  it('uses the terminology of the German SRD 5.2.1', () => {
    const de = TERMS.de;
    expect(de.spellSubtitle('evocation', 3)).toBe('Hervorrufungszauber 3. Grades');
    expect(de.spellSubtitle('abjuration', 1)).toBe('Bannzauber 1. Grades');
    expect(de.spellSubtitle('necromancy', 0)).toBe('Zaubertrick der Nekromantie');
    expect(de.weaponCategory('simple', 'ranged')).toBe('Einfache Fernkampfwaffe');
    expect(de.weaponCategory('martial', 'melee')).toBe('Kriegswaffe (Nahkampf)');
    expect(de.durations.concentration('1 Minute')).toBe('Konzentration, bis zu 1 Minute');
    expect(de.castingUnits.hour(8)).toBe('8 Stunden');
    expect(TERMS.en.spellSubtitle('evocation', 0)).toBe('Evocation Cantrip');
  });
});
