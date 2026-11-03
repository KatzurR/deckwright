/**
 * Turns positioned text elements into lines in reading order (two-column layout)
 * and classifies them by typographic role.
 */
import type { Segment, TextElement, XmlPage } from './xml';

export type Role =
  | 'footer'
  | 'title' // chapter title (≥ 30 pt)
  | 'h1' // 27 pt section heading
  | 'h2' // 21 pt
  | 'h3' // 18 pt red – entry headings (spells, items, glossary entries, features …)
  | 'h4' // 16 pt black semibold
  | 'statname' // 23 pt stat block name
  | 'body' // Cambria running text
  | 'sans' // GillSans tables and sidebars
  | 'stat'; // Optima stat blocks

export interface Line {
  page: number;
  col: number; // 0 = left, 1 = right, -1 = full width
  top: number;
  left: number;
  right: number;
  role: Role;
  size: number;
  segments: Segment[];
  text: string;
  /** The positioned text elements of the line (used to split table cells by column). */
  cells: { left: number; text: string }[];
}

export function classify(el: TextElement, pageHeight: number): Role {
  const { size, family, color } = el.font;
  const isRed = /^#8[0-9a-f]{5}$/.test(color) && color !== '#808285' && color !== '#8b8989' && color !== '#8e9193';
  const isGrey = color === '#808285' || color === '#7b7879';
  if (isGrey && size === 17 && el.top > pageHeight - 100) return 'footer';
  if (family.startsWith('Optima')) return 'stat';
  if (size >= 30) return 'title';
  // Small-caps heading glitch in the EN PDF ("Acid Splash" set in red small caps).
  if (family.includes('SC700') && isRed && size >= 13) return 'h3';
  if (family.startsWith('GillSans-SemiBold') && !family.includes('SC700')) {
    if (size === 27) return 'h1';
    if (size === 21) return 'h2';
    if (size === 23) return 'statname';
    if (size === 18 && isRed) return 'h3';
    if (size === 16) return 'h4';
  }
  if (family.startsWith('Cambria') || family.startsWith('ScalaSans')) return 'body';
  return 'sans';
}

const ROLE_RANK: Record<Role, number> = {
  title: 0, h1: 1, h2: 2, statname: 3, h3: 4, h4: 5, body: 6, sans: 7, stat: 8, footer: 9,
};

/** Horizontal gap (px) between elements of one line that separates words / table cells. */
const WORD_GAP = 1.5;
const CELL_GAP = 9;
/** Minimum distance of a table cell from the page middle to be merged across columns. */
const TABLE_CELL_OFFSET = 150;

function plain(segments: Segment[]): string {
  return segments.map((s) => s.text).join('');
}

function mergeSegments(a: Segment[], b: Segment[]): Segment[] {
  const out = a.map((s) => ({ ...s }));
  for (const s of b) {
    const last = out[out.length - 1];
    if (last && last.bold === s.bold && last.italic === s.italic) last.text += s.text;
    else out.push({ ...s });
  }
  return out;
}

/**
 * Group the elements of one page into lines and return them in reading order:
 * the page is cut into horizontal bands at full-width lines; within a band the
 * left column is read before the right column.
 */
export function pageLines(page: XmlPage): Line[] {
  const mid = page.width / 2;
  const els = page.elements
    .map((el) => ({ el, role: classify(el, page.height) }))
    .filter((x) => x.role !== 'footer')
    // Page numbers of the running footer.
    .filter((x) => !(x.el.top > page.height - 100 && /^\s*\d+\s*$/.test(plain(x.el.segments))));

  // Small-caps headings mix two glyph sizes on slightly different baselines: align them
  // and fix the letter case ("A" "cid" " S" "plASh" → "Acid Splash").
  const smallCaps = els.filter((x) => x.role === 'h3' && x.el.font.family.includes('SC700'));
  for (const x of smallCaps) {
    const top = Math.min(...smallCaps.filter((y) => Math.abs(y.el.top - x.el.top) <= 8).map((y) => y.el.top));
    x.el = { ...x.el, top, segments: x.el.segments.map((s) => ({ ...s, text: s.text.toLowerCase() })) };
  }

  const colOf = (el: TextElement): number => {
    if (el.left >= mid - 10) return 1;
    if (el.left + el.width > mid + 35) return -1;
    return 0;
  };

  // Group elements to lines: same column and (nearly) same top.
  type Acc = { col: number; top: number; left: number; right: number; items: { el: TextElement; role: Role }[] };
  const groups: Acc[] = [];
  const sorted = [...els].sort((a, b) => a.el.top - b.el.top || a.el.left - b.el.left);
  for (const x of sorted) {
    const col = colOf(x.el);
    const g = groups.find(
      (g) =>
        Math.abs(g.top - x.el.top) <= 3 &&
        x.el.left >= g.left - 2 &&
        (g.col === col || (col !== 1 && g.col !== 1)),
    );
    if (g) {
      g.items.push(x);
      g.right = Math.max(g.right, x.el.left + x.el.width);
      if (col === -1) g.col = -1;
    } else {
      groups.push({ col, top: x.el.top, left: x.el.left, right: x.el.left + x.el.width, items: [x] });
    }
  }
  // Table rows spanning both columns: a sans line in the right column that does not start at
  // the column edge (but further right, like a table cell) continues the sans line on its left.
  for (const right of groups.filter((g) => g.col === 1 && g.left > mid + TABLE_CELL_OFFSET)) {
    if (!right.items.every((it) => it.role === 'sans')) continue;
    const left = groups.find(
      (g) => g.col !== 1 && Math.abs(g.top - right.top) <= 3 && g.items.every((it) => it.role === 'sans'),
    );
    if (!left) continue;
    left.items.push(...right.items);
    left.right = Math.max(left.right, right.right);
    left.col = -1;
    right.items = [];
  }
  for (let i = groups.length - 1; i >= 0; i--) if (groups[i].items.length === 0) groups.splice(i, 1);

  // A line whose elements together span the middle is full width.
  for (const g of groups) if (g.col === 0 && g.right > mid + 35) g.col = -1;

  const lines: Line[] = groups.map((g) => {
    g.items.sort((a, b) => a.el.left - b.el.left);
    let segments: Segment[] = [];
    let prevRight = -Infinity;
    for (const it of g.items) {
      const gap = it.el.left - prevRight;
      const prevText = segments.length ? segments[segments.length - 1].text : '';
      const nextText = it.el.segments[0]?.text ?? '';
      if (segments.length && gap > CELL_GAP) {
        // Wide gap: separate table cells with a tab.
        segments = mergeSegments(segments, [{ text: '\t', bold: false, italic: false }]);
      } else if (segments.length && gap > WORD_GAP && !/\s$/.test(prevText) && !/^\s/.test(nextText)) {
        segments = mergeSegments(segments, [{ text: ' ', bold: false, italic: false }]);
      }
      segments = mergeSegments(segments, it.el.segments);
      prevRight = it.el.left + it.el.width;
    }
    // The dominant role is the "most heading-like" one carrying real text.
    const main = g.items
      .filter((it) => plain(it.el.segments).trim())
      .sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role])[0] ?? g.items[0];
    if (g.items.some((it) => it.el.font.family.includes('SC700') && it.role === 'h3')) {
      segments = segments.map((s) => ({ ...s, text: s.text.replace(/(^|\s)(\p{Ll})/gu, (_m, a: string, b: string) => a + b.toUpperCase()) }));
    }
    return {
      page: page.number,
      col: g.col,
      top: g.top,
      left: g.left,
      right: g.right,
      role: main.role,
      size: main.el.font.size,
      segments,
      text: plain(segments),
      cells: g.items.map((it) => ({ left: it.el.left, text: plain(it.el.segments) })),
    };
  });

  // Reading order with bands separated by full-width lines.
  const full = lines.filter((l) => l.col === -1).sort((a, b) => a.top - b.top);
  const out: Line[] = [];
  let bandStart = -Infinity;
  const emitBand = (end: number) => {
    for (const col of [0, 1]) {
      out.push(...lines.filter((l) => l.col === col && l.top >= bandStart && l.top < end).sort((a, b) => a.top - b.top));
    }
  };
  for (const f of full) {
    emitBand(f.top);
    out.push(f);
    bandStart = f.top + 0.5;
  }
  emitBand(Infinity);
  return out.filter((l) => l.text.trim() !== '');
}

export function documentLines(pages: XmlPage[]): Line[] {
  return pages.flatMap(pageLines);
}
