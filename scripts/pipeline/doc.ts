/**
 * Document-level helpers on top of the line stream: section slicing and entry splitting.
 */
import type { Lang } from '../../src/model/schema';
import type { Line, Role } from './pdf/layout';
import {
  blocksToMarkdown,
  collectHyphenatedWords,
  computeBaseLeft,
  joinBroken,
  joinLineSegments,
  linesToBlocks,
  tidy,
  type BlockOptions,
} from './text';

export interface Doc extends BlockOptions {
  lang: Lang;
  lines: Line[];
}

export function makeDoc(lang: Lang, lines: Line[]): Doc {
  return {
    lang,
    lines,
    baseLeft: computeBaseLeft(lines),
    hyphenated: collectHyphenatedWords(lines.map((l) => l.text)),
  };
}

const HEADING_RANK: Partial<Record<Role, number>> = { title: 0, h1: 1, h2: 2, h3: 3, h4: 4 };

export function lineText(l: Line): string {
  return tidy(l.text);
}

/**
 * Lines of the section whose heading (role `role`) starts with `heading`, up to the next
 * heading of the same or a higher rank. Multi-line headings are matched on the first line.
 */
export function section(lines: Line[], heading: string | RegExp, role: Role, from = 0): Line[] {
  const matches = (l: Line) =>
    l.role === role && (typeof heading === 'string' ? lineText(l).startsWith(heading) : heading.test(lineText(l)));
  const start = lines.findIndex((l, i) => i >= from && matches(l));
  if (start < 0) throw new Error(`Section "${heading}" (${role}) not found`);
  const rank = HEADING_RANK[role]!;
  let i = start + 1;
  while (i < lines.length && lines[i].role === role) i++; // heading continuation lines
  let end = i;
  while (end < lines.length) {
    const r = HEADING_RANK[lines[end].role];
    if (r !== undefined && r <= rank) break;
    end++;
  }
  return lines.slice(start, end);
}

export interface Entry {
  name: string;
  /** Lines after the heading. */
  lines: Line[];
  page: number;
}

/**
 * Split lines into entries at headings of the given role. Consecutive heading lines
 * (a wrapped heading) are joined. Lines before the first heading are dropped.
 */
export function splitEntries(lines: Line[], role: Role = 'h3', stopRoles: Role[] = ['title', 'h1', 'h2']): Entry[] {
  const out: Entry[] = [];
  let cur: Entry | undefined;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (stopRoles.includes(l.role)) {
      cur = undefined;
      continue;
    }
    if (l.role === role) {
      if (cur && cur.lines.length === 0) {
        cur.name = tidy(joinBroken(cur.name, l.text, { hyphenated: new Set() }));
        continue;
      }
      cur = { name: lineText(l), lines: [], page: l.page };
      out.push(cur);
      continue;
    }
    cur?.lines.push(l);
  }
  return out;
}

/** Markdown of body lines (stat blocks and headings removed). */
export function bodyMarkdown(doc: Doc, lines: Line[]): string {
  const usable = lines.filter((l) => l.role === 'body' || l.role === 'sans');
  return blocksToMarkdown(linesToBlocks(usable, doc));
}

/** Plain text of a run of lines, joined with hyphenation handling. */
export function plainText(doc: Doc, lines: Line[]): string {
  return blocksToMarkdown(linesToBlocks(lines.map((l) => ({ ...l, role: 'body' as const, left: -1 })), doc))
    .replace(/\*\*/g, '')
    .replace(/\n+/g, ' ');
}

/**
 * Italic runs of body text (the SRD sets references to spells and magic items in italics),
 * joined across line breaks. Bold-italic run-in headings are excluded.
 */
export function italicRefs(doc: Doc, lines: Line[]): string[] {
  const body = lines.filter((l) => l.role === 'body' || l.role === 'sans');
  const runs = joinLineSegments(body.map((l) => l.segments), doc);
  return runs
    .filter((r) => r.italic && !r.bold)
    .flatMap((r) => r.text.split(/,\s*|\s+(?:and|or|und|oder)\s+/))
    .map((t) => tidy(t).replace(/[.,;:]$/, ''))
    .filter((t) => t.length > 1);
}
