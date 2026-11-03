import { describe, expect, it } from 'vitest';
import { contrastRatio, PALETTE, SCHOOL_ACCENT, TYPE_ACCENT } from './theme';
import { ICONS } from './icons';
import { SCHOOL_ICON, TYPE_ICON } from './theme';

describe('theme', () => {
  it('keeps every accent readable on parchment (WCAG AA, 4.5:1)', () => {
    for (const color of [...Object.values(TYPE_ACCENT), ...Object.values(SCHOOL_ACCENT)]) {
      expect(contrastRatio(color, PALETTE.parchment)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('gives each card type its own accent colour', () => {
    expect(new Set(Object.values(TYPE_ACCENT)).size).toBe(5);
    expect(new Set(Object.values(SCHOOL_ACCENT)).size).toBe(8);
  });
  it('has an icon for every type and school', () => {
    for (const name of [...Object.values(TYPE_ICON), ...Object.values(SCHOOL_ICON)]) {
      expect(ICONS[name].path.length).toBeGreaterThan(50);
    }
  });
});
