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

export function makeDoc(lang: Lang, allLines: Line[]): Doc {
  const lines = stripSidebars(allLines);
  return {
    lang,
    lines,
    baseLeft: computeBaseLeft(lines),
    hyphenated: collectHyphenatedWords(lines.map((l) => l.text)),
  };
}

/**
 * Remove sidebars ("Breaking Your Oath" / "Einen Schwur brechen"). They are boxed GillSans text
 * with a small-caps title: 17 pt capitals and 12 pt small caps on a baseline a few points lower.
 * Poppler emits the title as one line or as two lines (capitals, then small caps). A sidebar is
 * never part of an entry, but its sans lines would otherwise be read as a table of the entry it
 * is printed next to. The box ends at the first line of another role, column or page.
 */
export function stripSidebars(lines: Line[]): Line[] {
  const capitals = (l: Line) => l.role === 'sans' && l.cells.some((c) => c.size >= 16 && c.text.trim());
  const smallCaps = (l: Line) => l.role === 'sans' && l.cells.some((c) => c.size <= 13 && c.text.trim());
  const out: Line[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const next = lines[i + 1];
    let bodyStart = -1;
    if (capitals(l) && smallCaps(l)) bodyStart = i + 1;
    else if (
      capitals(l) &&
      next &&
      smallCaps(next) &&
      next.page === l.page &&
      next.col === l.col &&
      next.top > l.top &&
      next.top - l.top <= 10
    )
      bodyStart = i + 2;
    if (bodyStart < 0) {
      out.push(l);
      continue;
    }
    let j = bodyStart;
    // A second title line ("Erweitern oder" / "ersetzen") is set in small caps as well.
    while (j < lines.length && smallCaps(lines[j]) && !lines[j].cells.some((c) => c.size > 13) && lines[j].page === l.page) j++;
    while (j < lines.length && lines[j].role === 'sans' && lines[j].page === l.page && lines[j].col === l.col) j++;
    i = j - 1;
  }
  return out;
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
