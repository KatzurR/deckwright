/**
 * Text cleanup and conversion of PDF lines into the card Markdown subset
 * (paragraphs separated by a blank line, **bold** run-in headings, "- " bullet lists).
 */
import type { Line } from './pdf/layout';
import type { Segment } from './pdf/xml';

const HYPHENS = '-\u00ad\u2011\u2010';
/** Words after a suspended hyphen ("Stärke- und Geschicklichkeitswürfe", "pre- and post-"). */
const SUSPENDED_HYPHEN_FOLLOWERS: Record<'de' | 'en', Set<string>> = {
  de: new Set(['und', 'oder', 'bzw.', 'sowie', 'als']),
  en: new Set(['and', 'or', 'nor', 'to']),
};

/** Normalise characters that vary between the PDFs. */
export function normaliseChars(s: string): string {
  return (
    s
      .replace(/[\u2011\u2010]/g, '-')
      .replace(/\u00a0/g, ' ')
      // Inside a line the German PDF uses U+00AD as a real hyphen ("Yuan\u00adti",
      // "Barbaren\u00adUnterklasse", "Karten\u00ad oder"), except directly before a
      // lower-case letter (discretionary break). At the end of a line it is resolved by joinBroken.
      .replace(/\u00ad(?=\p{Ll})/gu, '')
      .replace(/\u00ad(?=.)/g, '-')
      .replace(/\ufb01/g, 'fi')
      .replace(/\ufb02/g, 'fl')
      .replace(/[ \t]+/g, ' ')
  );
}

/** Collapse whitespace and normalise characters of a finished text. */
export function tidy(s: string): string {
  return normaliseChars(s)
    .replace(/\u00ad/g, '-')
    .replace(/ +([,.;:!?)\]])/g, '$1')
    .replace(/([(\[„]) +/g, '$1')
    .replace(/ {2,}/g, ' ')
    .trim();
}

/** All hyphenated words that occur inside lines (not at a line break), lower-cased. */
export function collectHyphenatedWords(texts: Iterable<string>): Set<string> {
  const set = new Set<string>();
  const re = /[\p{L}\d]+(?:-[\p{L}\d]+)+/gu;
  for (const raw of texts) {
    const t = normaliseChars(raw).replace(/[-\u00ad]\s*$/, ' ');
    for (const m of t.matchAll(re)) set.add(m[0].toLowerCase());
  }
  return set;
}

export interface JoinContext {
  /** Hyphenated words seen elsewhere in the document (see {@link collectHyphenatedWords}). */
  hyphenated: Set<string>;
  /** Language of the text (selects the suspended-hyphen words); both when unknown. */
  lang?: 'de' | 'en';
}

/**
 * Join two pieces of text that were separated by a line break, resolving hyphenation:
 * - hyphen + uppercase continuation → real compound hyphen ("Fledermaus-" + "Guano")
 * - hyphen + "und"/"oder" … → suspended hyphen, keep it with a space ("Stärke-" + "und")
 * - hyphen + lowercase → soft break, unless the hyphenated form occurs elsewhere in the text
 * - hyphen after a digit → keep ("20-" + "foot")
 */
export function joinBroken(left: string, right: string, ctx: JoinContext): string {
  const l = left.replace(/\s+$/, '');
  const r = right.replace(/^\s+/, '');
  if (!l) return left ? ` ${r}` : r;
  if (!r) return l;
  const last = l[l.length - 1];
  if (HYPHENS.includes(last) && l.length > 1) {
    const before = l[l.length - 2];
    const stem = l.slice(0, -1);
    const firstWord = r.match(/^[^\s,.;:!?)]*/)?.[0] ?? '';
    if (/[\p{L}]/u.test(before)) {
      const followers = ctx.lang ? [SUSPENDED_HYPHEN_FOLLOWERS[ctx.lang]] : Object.values(SUSPENDED_HYPHEN_FOLLOWERS);
      if (followers.some((f) => f.has(firstWord.toLowerCase()))) return `${stem}- ${r}`;
      if (/^\p{Lu}/u.test(r)) return `${stem}-${r}`;
      if (/^\p{Ll}/u.test(r)) {
        const leftWord = stem.match(/[\p{L}\d-]+$/u)?.[0] ?? '';
        const candidate = `${leftWord}-${firstWord.replace(/[^\p{L}\d-].*$/u, '')}`.toLowerCase();
        if (ctx.hyphenated.has(candidate)) return `${stem}-${r}`;
        return stem + r;
      }
    }
    if (/\d/.test(before)) return `${stem}-${r}`;
    if (/^\d/.test(r)) return `${stem}-${r}`; // "10-foot-by-" + "10-foot"
  }
  return `${l} ${r}`;
}

// ---------------------------------------------------------------------------
// Styled text handling

/** A run of text with style, after line joining. */
export type Run = Segment;

function pushRun(runs: Run[], seg: Run) {
  const last = runs[runs.length - 1];
  if (last && last.bold === seg.bold && last.italic === seg.italic) last.text += seg.text;
  else runs.push({ ...seg });
}

/** Join the segments of several lines into one run list, resolving line-break hyphenation. */
export function joinLineSegments(lines: Segment[][], ctx: JoinContext): Run[] {
  const runs: Run[] = [];
  for (const segs of lines) {
    const clean = segs.map((s) => ({ ...s, text: s.text.replace(/\t/g, ' ') })).filter((s) => s.text !== '');
    if (clean.length === 0) continue;
    if (runs.length === 0) {
      clean.forEach((s) => pushRun(runs, s));
      continue;
    }
    // Join the last run's text with the first segment of the new line.
    const last = runs[runs.length - 1];
    const first = clean[0];
    const joined = joinBroken(last.text, first.text, ctx);
    if (last.bold === first.bold && last.italic === first.italic) {
      last.text = joined;
    } else {
      // joinBroken returns "<resolved left part><right text>": keep the styles apart.
      const right = first.text.replace(/^\s+/, '');
      last.text = joined.slice(0, joined.length - right.length);
      runs.push({ ...first, text: right });
    }
    clean.slice(1).forEach((s) => pushRun(runs, s));
  }
  return runs.map((r) => ({ ...r, text: normaliseChars(r.text) }));
}

export function runsText(runs: Run[]): string {
  return tidy(runs.map((r) => r.text).join(''));
}

/** Escape characters that would be read as Markdown emphasis. */
export function escapeMd(s: string): string {
  return s.replace(/\*/g, '\\*');
}

/**
 * Render runs as Markdown. A bold (or bold-italic) run at the start becomes a bold
 * run-in heading; other bold runs stay bold; italics are dropped (the SRD uses them only
 * for references to spells and items, which Open5e-style plain text does not have either).
 */
export function runsToMarkdown(runs: Run[]): string {
  const merged: Run[] = [];
  for (const r of runs) pushRun(merged, { text: r.text, bold: r.bold, italic: false });
  let out = '';
  for (const r of merged) {
    const text = escapeMd(r.text);
    if (r.bold && text.trim()) {
      const lead = text.match(/^\s*/)![0];
      const trail = text.match(/\s*$/)![0];
      out += `${lead}**${text.trim()}**${trail}`;
    } else out += text;
  }
  return tidy(out).replace(/\*\*\s*\*\*/g, '');
}

// ---------------------------------------------------------------------------
// Blocks: paragraphs, lists and tables from a run of PDF lines

export interface BlockOptions extends JoinContext {
  /** Left edge of the text column per "page:col" (for indentation detection). */
  baseLeft: Map<string, number>;
}

export function computeBaseLeft(lines: Line[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const l of lines) {
    if (l.role !== 'body') continue;
    const key = `${l.page}:${l.col}`;
    const cur = map.get(key);
    if (cur === undefined || l.left < cur) map.set(key, l.left);
  }
  return map;
}

function indentOf(line: Line, base: Map<string, number>): number {
  const b = base.get(`${line.page}:${line.col}`) ?? line.left;
  return line.left - b;
}

const BULLET = /^\s*[•●▪]\s*/;

/**
 * New paragraph? English lines start with leading spaces; German paragraphs use a first-line
 * indent. A block with a hanging indent (run-in line at the margin, following lines indented)
 * must not be split, so an indented line only starts a paragraph after an unindented line that
 * is not itself the start of a run-in paragraph.
 */
function startsParagraph(line: Line, prev: Line | undefined, opts: BlockOptions): boolean {
  if (/^\s{2,}/.test(line.text) || (/^ \S/.test(line.segments[0]?.text ?? '') && line.segments[0].bold)) return true;
  if (indentOf(line, opts.baseLeft) < 8) return false;
  if (!prev) return true;
  const prevIndent = indentOf(prev, opts.baseLeft);
  if (prevIndent >= 8) return false;
  return !startsWithRunIn(prev);
}

/** A line that begins with a bold run-in heading ("**Alarm.** …"). */
function startsWithRunIn(line: Line): boolean {
  const first = line.segments.find((s) => s.text.trim() !== '');
  if (!first || !first.bold) return false;
  return /[.:!?]\s*$/.test(first.text.trim()) || line.segments.length > 1;
}

interface Table {
  rows: string[][];
}

function splitCells(segments: Segment[]): string[] {
  return segments
    .map((s) => s.text)
    .join('')
    .split('\t')
    .map((c) => tidy(c))
    .filter((c) => c !== '');
}

/** Column of an element: the last header column starting at or before it. */
function columnOf(left: number, starts: number[]): number {
  let col = 0;
  for (let i = 0; i < starts.length; i++) if (left + 6 >= starts[i]) col = i;
  return col;
}

/**
 * Convert table lines (role "sans") into rows. When the first line (header) has several
 * cells, every element is assigned to the header column it starts in; a line without text in
 * the first column continues the previous row (wrapped cells). Side-by-side copies of a table
 * (header "Dragon, Damage Type, Dragon, Damage Type") are split into separate rows.
 */
export function parseTable(lines: Line[], ctx: JoinContext): Table {
  if (lines.length === 0) return parseTableByGaps(lines, ctx);
  // Multi-line header ("1d100" / "(13-Card" / "Deck)"): only when the first line is visibly
  // incomplete (an empty cell, an open parenthesis, or only dice followed by an open
  // parenthesis); it continues while a parenthesis is open.
  const depth = (l: Line) => (l.text.match(/\(/g)?.length ?? 0) - (l.text.match(/\)/g)?.length ?? 0);
  const filled = (l: Line) => (l.cells ?? []).filter((c) => c.text.trim());
  const first = lines[0];
  let headerLines = 1;
  const onlyDice = filled(first).length > 0 && filled(first).every((c) => /^\d*[dW]\d+$/.test(c.text.trim()));
  if (
    filled(first).length < (first.cells ?? []).length ||
    depth(first) > 0 ||
    (onlyDice && lines.length > 1 && depth(lines[1]) > 0)
  ) {
    let open = depth(first);
    while (headerLines < Math.min(3, lines.length - 1) && (open > 0 || depth(lines[headerLines]) > 0)) {
      open += depth(lines[headerLines]);
      headerLines++;
    }
  }
  const widest =
    headerLines === 1 ? first : lines.slice(0, headerLines).reduce((a, b) => (filled(b).length > filled(a).length ? b : a));
  const starts = (headerLines === 1 ? (first.cells ?? []) : filled(widest)).map((c) => c.left).sort((a, b) => a - b);
  if (starts.length < 2) return parseTableByGaps(lines, ctx);
  const width = starts.length;
  const rows: string[][] = [];
  lines.forEach((l, lineIndex) => {
    const cells: string[] = Array(width).fill('');
    for (const c of l.cells ?? []) {
      const i = columnOf(c.left, starts);
      cells[i] = cells[i] ? joinBroken(cells[i], c.text, ctx) : c.text;
    }
    const clean = cells.map((c) => tidy(c.replace(/\t/g, ' ')));
    const prev = rows[rows.length - 1];
    if (prev && lineIndex < headerLines) {
      clean.forEach((c, i) => {
        if (c) prev[i] = prev[i] ? `${prev[i]} ${c}` : c;
      });
      return;
    }
    if (prev && !clean[0] && clean.some(Boolean)) {
      clean.forEach((c, i) => {
        if (c) prev[i] = prev[i] ? joinBroken(prev[i], c, ctx) : c;
      });
      return;
    }
    rows.push(clean);
  });
  // Repeated header → two tables side by side.
  const half = width / 2;
  const h = rows[0];
  if (width % 2 === 0 && width >= 4 && h.slice(0, half).join('|') === h.slice(half).join('|')) {
    const left = rows.map((r) => r.slice(0, half));
    const right = rows.slice(1).map((r) => r.slice(half));
    return { rows: [...left, ...right].filter((r) => r.some(Boolean)) };
  }
  return { rows };
}

/** Leading key of a fixed-width row: number range ("2–6", "01–20", "10+") or dice ("1d100"). */
const ROW_KEY = /^(\d+(?:\s*[–-]\s*\d+)?\+?|\d*[dW]\d+)\s+(.+)$/;

/** Continuation lines of a row with a hanging indent are indented further than this (px); keys
 * of a row can be right-aligned ("1" vs "10") and indented a little. */
const HANGING_INDENT = 20;

/** Fallback without a usable header: cells separated by wide gaps (tabs). */
function parseTableByGaps(lines: Line[], ctx: JoinContext): Table {
  const rows: string[][] = [];
  // Indentation relative to the table's left edge in each column (a table can continue in the
  // next column or on the next page).
  const edge = new Map<string, number>();
  for (const l of lines) {
    const k = `${l.page}:${l.col}`;
    edge.set(k, Math.min(edge.get(k) ?? Infinity, l.left));
  }
  const indent = (l: Line) => l.left - edge.get(`${l.page}:${l.col}`)!;
  const contIndent = Math.max(...lines.map(indent));
  // Rows with a hanging indent ("01–20 You cast …" / indented continuation lines): the
  // indentation alone decides. Justified continuation lines can contain wide gaps that would
  // otherwise look like cell separators.
  const keyed = (l: Line) => ROW_KEY.test(tidy(l.text.replace(/\t/g, ' ')));
  const hanging =
    lines.filter((l) => indent(l) > HANGING_INDENT).length > 1 &&
    lines.filter((l) => indent(l) <= HANGING_INDENT && keyed(l)).length > 1;
  for (const l of lines) {
    const cells = splitCells(l.segments);
    // Repeated header where the table continues in the next column.
    if (rows.length > 0 && cells.join('|') === rows[0].join('|')) continue;
    const prev = rows[rows.length - 1];
    if (prev && !hanging && cells.length > 1 && cells.length === prev.length && /^[\p{Ll}(]/u.test(cells[0])) {
      cells.forEach((c, i) => (prev[i] = joinBroken(prev[i], c, ctx)));
      continue;
    }
    const isStart =
      rows.length === 0 || (hanging ? indent(l) <= HANGING_INDENT : cells.length > 1 || indent(l) < contIndent - 10);
    if (isStart) rows.push(cells);
    else if (rows.length) {
      const row = rows[rows.length - 1];
      row[row.length - 1] = joinBroken(row[row.length - 1], cells.join(' '), ctx);
    }
  }
  return { rows };
}

export function tableToMarkdown(table: Table): string {
  let [header, ...rows] = table.rows;
  if (!header) return '';
  // Header without a wide gap ("1d100 Effect" / "W100 Effekt"): split off the dice column.
  if (header.length === 1) {
    const m = header[0].match(ROW_KEY);
    if (m && rows.some((r) => r.length === 1 && ROW_KEY.test(r[0]))) header = [m[1], m[2]];
  }
  if (rows.length === 0) return header.join(' ');
  const out: string[] = [];
  for (let row of rows) {
    if (row.length === 0) continue;
    // Key cell not separated by a wide gap ("2–6 The target …"): split off a leading number range.
    if (row.filter(Boolean).length === 1 && row[0] && header.length >= 2) {
      const m = row[0].match(ROW_KEY);
      if (m) row = [m[1], m[2]];
    }
    const [key, ...restRaw] = row;
    const rest = restRaw.filter(Boolean);
    if (!key && rest.length === 0) continue;
    if (rest.length === 0) {
      out.push(`- ${escapeMd(key)}`);
    } else if (rest.length === 1 || header.length !== row.length || restRaw.some((c) => !c)) {
      out.push(`- **${escapeMd(key)}:** ${escapeMd(rest.join(' '))}`);
    } else {
      out.push(`- **${escapeMd(key)}:** ${rest.map((v, i) => `${escapeMd(header[i + 1])} ${escapeMd(v)}`).join('; ')}`);
    }
  }
  return out.join('\n');
}

/**
 * Convert the body lines of an entry to Markdown blocks.
 * - body lines are joined into paragraphs (new paragraph on indentation or run-in heading)
 * - bullet lines ("• …") become list items
 * - "sans" lines (tables) become bullet lists
 * Lines of other roles (stat blocks, headings) must be removed by the caller.
 */
export function linesToBlocks(lines: Line[], opts: BlockOptions): string[] {
  const blocks: string[] = [];
  let para: Segment[][] = [];
  let paraIsBullet = false;
  let listBuffer: string[] = [];
  let table: Line[] = [];

  const flushPara = () => {
    if (para.length) {
      const md = runsToMarkdown(joinLineSegments(para, opts));
      if (md) {
        if (paraIsBullet) listBuffer.push(`- ${md}`);
        else {
          flushList();
          blocks.push(md);
        }
      }
    }
    para = [];
    paraIsBullet = false;
  };
  const flushList = () => {
    if (listBuffer.length) blocks.push(listBuffer.join('\n'));
    listBuffer = [];
  };
  const flushTable = () => {
    if (table.length) {
      const md = tableToMarkdown(parseTable(table, opts));
      if (md) blocks.push(md);
    }
    table = [];
  };

  let prevLine: Line | undefined;
  for (const line of lines) {
    const before = prevLine;
    prevLine = line;
    if (line.role === 'sans' && !BULLET.test(line.text)) {
      flushPara();
      flushList();
      table.push(line);
      continue;
    }
    flushTable();
    if (BULLET.test(line.text)) {
      flushPara();
      paraIsBullet = true;
      const segs = line.segments.map((s, i) => (i === 0 ? { ...s, text: s.text.replace(BULLET, '') } : s));
      para.push(segs);
      continue;
    }
    // Indented continuation lines of a bullet item belong to the item.
    const continuesBullet = paraIsBullet && indentOf(line, opts.baseLeft) > 2 && !startsWithRunIn(line);
    if (para.length && !continuesBullet && (paraIsBullet || startsParagraph(line, before, opts) || startsWithRunIn(line))) {
      flushPara();
      if (!paraIsBullet) flushList();
    }
    if (!para.length && !paraIsBullet) flushList();
    para.push(line.segments);
  }
  flushPara();
  flushList();
  flushTable();
  return blocks;
}

export function blocksToMarkdown(blocks: string[]): string {
  return blocks.filter((b) => b.trim()).join('\n\n');
}

/** Slug for keys: lower-case ASCII, words joined by "-". */
export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Lower-cased, punctuation-free form of a name for comparisons. */
export function normaliseName(s: string): string {
  return slugify(s).replace(/-/g, ' ');
}
