import { describe, expect, it } from 'vitest';
import { CARD_MM, cardPixels, PAPERS, PRINTER_MARGIN_MM, sheetLayout, toSheets, type Paper, type Rect } from './layout';

const inside = (r: Rect, page: { w: number; h: number }) => r.x >= 0 && r.y >= 0 && r.x + r.w <= page.w + 1e-9 && r.y + r.h <= page.h + 1e-9;
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9;

describe('card pixel size at 300 dpi', () => {
  it('is 744 × 1039 px for 63 × 88 mm (SPEC §8)', () => {
    expect(cardPixels()).toEqual({ w: 744, h: 1039 });
  });
  it('includes 3 mm bleed on each side', () => {
    expect(cardPixels(3)).toEqual({ w: 815, h: 1110 });
  });
});

describe.each([
  ['a4', 0], ['a4', 3], ['letter', 0], ['letter', 3],
] as [Paper, number][])('sheet layout %s, bleed %i mm', (paper, bleed) => {
  const layout = sheetLayout(paper, bleed);

  it('uses the exact paper size', () => {
    expect(layout.page).toEqual(PAPERS[paper]);
  });

  it('places 3 × 3 cards of exactly 63 × 88 mm, centred, without gaps', () => {
    expect(layout.slots).toHaveLength(9);
    for (const s of layout.slots) {
      expect(s.trim.w).toBe(CARD_MM.w);
      expect(s.trim.h).toBe(CARD_MM.h);
      expect(s.trim.x).toBeCloseTo(layout.grid.x + s.col * 63, 6);
      expect(s.trim.y).toBeCloseTo(layout.grid.y + s.row * 88, 6);
    }
    expect(layout.grid.x * 2 + layout.grid.w).toBeCloseTo(layout.page.w, 6);
    expect(layout.grid.y * 2 + layout.grid.h).toBeCloseTo(layout.page.h, 6);
  });

  it('renders each card with bleed and clips the bleed to the outer sides of the grid', () => {
    for (const s of layout.slots) {
      expect(s.image.w).toBe(63 + 2 * bleed);
      expect(s.image.h).toBe(88 + 2 * bleed);
      expect(inside(s.clip, layout.page)).toBe(true);
      // clip contains trim, image contains clip
      expect(s.clip.x).toBeLessThanOrEqual(s.trim.x);
      expect(s.clip.x + s.clip.w).toBeGreaterThanOrEqual(s.trim.x + s.trim.w);
      expect(s.image.x).toBeLessThanOrEqual(s.clip.x + 1e-9);
    }
    for (const a of layout.slots) for (const b of layout.slots) if (a !== b) expect(overlap(a.clip, b.clip)).toBe(false);
    const corner = layout.slots[0];
    expect(corner.clip.x).toBeCloseTo(corner.trim.x - bleed, 6);
    expect(layout.slots[4].clip).toEqual(layout.slots[4].trim);
  });

  it('draws cut marks on every trim line, outside the bleed area and on the page', () => {
    const outer = { l: layout.grid.x - bleed, r: layout.grid.x + layout.grid.w + bleed, t: layout.grid.y - bleed, b: layout.grid.y + layout.grid.h + bleed };
    const xs = new Set(layout.cutMarks.filter((m) => m.x1 === m.x2).map((m) => m.x1));
    const ys = new Set(layout.cutMarks.filter((m) => m.y1 === m.y2).map((m) => m.y1));
    expect(xs.size).toBe(4);
    expect(ys.size).toBe(4);
    expect(layout.cutMarks).toHaveLength(16);
    for (const m of layout.cutMarks) {
      for (const [x, y] of [[m.x1, m.y1], [m.x2, m.y2]]) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x <= outer.l || x >= outer.r || y <= outer.t || y >= outer.b).toBe(true);
      }
    }
  });

  it('reserves a printable area for the attribution outside the cut marks', () => {
    const a = layout.attribution;
    expect(inside(a, layout.page)).toBe(true);
    for (const s of layout.slots) expect(overlap(a, s.clip)).toBe(false);
    // enough room for the attribution at ~4 pt: at least 3 lines (rotated) or 2 lines (horizontal)
    const thickness = a.rotation === 0 ? a.h : a.w;
    expect(thickness).toBeGreaterThanOrEqual(a.rotation === 0 ? 3.7 : 1.9);
    if (a.rotation === 0) expect(a.y + a.h).toBeLessThanOrEqual(layout.page.h - PRINTER_MARGIN_MM + 1e-9);
    else expect(a.x).toBeGreaterThanOrEqual(PRINTER_MARGIN_MM);
  });
});

describe('toSheets', () => {
  it('splits into pages of nine', () => {
    expect(toSheets([...Array(20).keys()]).map((s) => s.length)).toEqual([9, 9, 2]);
    expect(toSheets([])).toEqual([]);
  });
});
