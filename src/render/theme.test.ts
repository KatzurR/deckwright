import { describe, expect, it } from 'vitest';
import { CARD_COLORS } from '../model/schema';
import { CARD_COLOR_THEMES, contrastRatio, PALETTE, SCHOOL_ACCENT, SCHOOL_ICON, TYPE_ICON } from './theme';
import { ICONS } from './icons';

describe('theme', () => {
  it('keeps every accent readable on parchment (WCAG AA, 4.5:1)', () => {
    const accents = [...CARD_COLORS.map((c) => CARD_COLOR_THEMES[c].accent), ...Object.values(SCHOOL_ACCENT)];
    for (const color of accents) expect(contrastRatio(color, PALETTE.parchment)).toBeGreaterThanOrEqual(4.5);
  });
  it('keeps the gold level shield readable on every frame colour', () => {
    for (const c of CARD_COLORS) expect(contrastRatio(PALETTE.gold, CARD_COLOR_THEMES[c].frame)).toBeGreaterThanOrEqual(4.5);
  });
  it('has a distinct theme per card colour and a distinct accent per school', () => {
    expect(new Set(CARD_COLORS.map((c) => CARD_COLOR_THEMES[c].accent)).size).toBe(CARD_COLORS.length);
    expect(new Set(Object.values(SCHOOL_ACCENT)).size).toBe(8);
  });
  it('has an icon for every type and school', () => {
    for (const name of [...Object.values(TYPE_ICON), ...Object.values(SCHOOL_ICON)]) {
      expect(ICONS[name].path.length).toBeGreaterThan(50);
    }
  });
});
