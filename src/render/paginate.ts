/**
 * Text overflow handling (SPEC §5):
 * 1. If the rule text does not fit, the font is reduced step by step down to a minimum size.
 * 2. If it still does not fit, the text is split over continuation cards ("Name (2/2)").
 *    Continuation cards repeat the header but have no property block, so they hold more text.
 *
 * The algorithm is pure: whether a page fits is decided by an injected `fits` function
 * (in the browser it renders the card off-screen and checks for overflow).
 */
import { parseInline, type Block, type Inline } from '../model/markdown';

export const FONT = {
  /** Rule text size of the design (pt). */
  max: 6.0,
  /** Smallest rule text size before a continuation card is created (pt). */
  min: 4.8,
  step: 0.2,
} as const;

export interface PageCandidate {
  /** First page shows the property block, continuation pages don't. */
  first: boolean;
  blocks: Block[];
  fontSize: number;
}

export type FitsFn = (page: PageCandidate) => boolean;

export interface CardPage {
  part: number;
  total: number;
  first: boolean;
  blocks: Block[];
  fontSize: number;
}

export type OverflowState = 'none' | 'shrunk' | 'split';

export interface Pagination {
  pages: CardPage[];
  overflow: OverflowState;
}

export interface FontRange {
  max: number;
  min: number;
  step: number;
}

export function fontSteps(range: FontRange = FONT): number[] {
  const steps: number[] = [];
  for (let size = range.max; size >= range.min - 1e-9; size -= range.step) steps.push(Math.round(size * 100) / 100);
  if (steps[steps.length - 1] !== range.min) steps.push(range.min);
  return steps;
}

export function paginate(blocks: Block[], fits: FitsFn, range: FontRange = FONT): Pagination {
  const steps = fontSteps(range);
  for (const fontSize of steps) {
    if (fits({ first: true, blocks, fontSize })) {
      return {
        pages: [{ part: 1, total: 1, first: true, blocks, fontSize }],
        overflow: fontSize === range.max ? 'none' : 'shrunk',
      };
    }
  }

  const fontSize = range.min;
  const pages: Omit<CardPage, 'total'>[] = [];
  let remaining = blocks;
  let first = true;
  // Hard cap protects against a `fits` function that never accepts anything.
  while (remaining.length && pages.length < 50) {
    const page = fillPage(remaining, first, fontSize, fits);
    pages.push({ part: pages.length + 1, first, blocks: page.taken, fontSize });
    remaining = page.rest;
    first = false;
  }
  return { pages: pages.map((p) => ({ ...p, total: pages.length })), overflow: 'split' };
}

/** Largest n in [lo, hi] with ok(n) true, assuming ok is monotone (true…true false…false). */
function maxTrue(lo: number, hi: number, ok: (n: number) => boolean): number {
  let best = lo - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ok(mid)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

function fillPage(blocks: Block[], first: boolean, fontSize: number, fits: FitsFn): { taken: Block[]; rest: Block[] } {
  const fitsBlocks = (b: Block[]) => fits({ first, blocks: b, fontSize });
  const whole = Math.max(0, maxTrue(1, blocks.length, (n) => fitsBlocks(blocks.slice(0, n))));
  if (whole === blocks.length) return { taken: blocks, rest: [] };

  const prefix = blocks.slice(0, whole);
  const next = blocks[whole];
  const tokens = tokenize(next);
  const words = Math.max(0, maxTrue(1, tokens.length - 1, (n) => fitsBlocks([...prefix, buildBlock(next, tokens.slice(0, n))])));

  if (words > 0) {
    return {
      taken: [...prefix, buildBlock(next, tokens.slice(0, words))],
      rest: [buildBlock(next, tokens.slice(words), true), ...blocks.slice(whole + 1)],
    };
  }
  if (whole > 0) return { taken: prefix, rest: blocks.slice(whole) };
  // Not even one word fits on an empty page: take one word anyway to guarantee progress.
  return {
    taken: [buildBlock(next, tokens.slice(0, 1))],
    rest: tokens.length > 1 ? [buildBlock(next, tokens.slice(1), true), ...blocks.slice(1)] : blocks.slice(1),
  };
}

interface Token {
  item: number;
  text: string;
  bold?: boolean;
  italic?: boolean;
}

/** Split a block into word tokens (whitespace stays attached to the preceding word). */
export function tokenize(block: Block): Token[] {
  const lines = block.kind === 'p' ? [block.inlines] : block.items;
  const tokens: Token[] = [];
  lines.forEach((inlines, item) => {
    for (const run of inlines) {
      const parts = run.text.match(/\S+\s*|\s+/g) ?? [];
      for (const text of parts) {
        const prev = tokens[tokens.length - 1];
        if (/^\s+$/.test(text) && prev && prev.item === item) {
          prev.text += text;
          continue;
        }
        const token: Token = { item, text };
        if (run.bold) token.bold = true;
        if (run.italic) token.italic = true;
        tokens.push(token);
      }
    }
  });
  return tokens;
}

/** Rebuild a block from a token slice. `continuation` marks a list whose first item was split. */
export function buildBlock(template: Block, tokens: Token[], continuation = false): Block {
  const runsOf = (ts: Token[]): Inline[] => {
    const runs: Inline[] = [];
    for (const t of ts) {
      const prev = runs[runs.length - 1];
      if (prev && Boolean(prev.bold) === Boolean(t.bold) && Boolean(prev.italic) === Boolean(t.italic)) {
        prev.text += t.text;
      } else {
        const run: Inline = { text: t.text };
        if (t.bold) run.bold = true;
        if (t.italic) run.italic = true;
        runs.push(run);
      }
    }
    if (runs.length) runs[runs.length - 1].text = runs[runs.length - 1].text.trimEnd();
    return runs;
  };
  if (template.kind === 'p') return { kind: 'p', inlines: runsOf(tokens) };
  const grouped = new Map<number, Token[]>();
  for (const t of tokens) grouped.set(t.item, [...(grouped.get(t.item) ?? []), t]);
  const list: Block = { kind: 'ul', items: [...grouped.values()].map(runsOf) };
  // The first item of a list continued from the previous card is the rest of an item: no bullet.
  if (continuation ? isMidItem(template, tokens) : template.kind === 'ul' && template.continued) list.continued = true;
  return list;
}

function isMidItem(template: Block, tokens: Token[]): boolean {
  if (template.kind !== 'ul' || !tokens.length) return false;
  const all = tokenize(template);
  const firstIndex = all.findIndex((t) => t.item === tokens[0].item);
  const offset = all.length - tokens.length;
  return offset > firstIndex;
}

/** Text of a closing paragraph ("Auf höheren Graden. …") as a block with a bold italic lead-in. */
export function closingBlock(label: string, text: string): Block {
  return { kind: 'p', inlines: [{ text: label, bold: true, italic: true }, ...parseInline(` ${text}`)] };
}
