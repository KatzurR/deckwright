/**
 * Markdown subset used for card rule texts (SPEC §4): paragraphs, **bold**, *italic*
 * (also _italic_ and ***bold italic***) and bullet lists ("- " or "* ").
 * Everything else is kept as literal text.
 */

export interface Inline {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export type Block =
  | { kind: 'p'; inlines: Inline[] }
  /** `continued`: the first item continues an item from the previous card (rendered without bullet). */
  | { kind: 'ul'; items: Inline[][]; continued?: boolean };

const BULLET = /^\s*[-*•]\s+/;

/** Split a text into blocks. Blank lines separate paragraphs; single newlines inside a paragraph become line breaks. */
export function parseMarkdown(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ kind: 'p', inlines: parseInline(paragraph.join('\n')) });
    paragraph = [];
  };
  const flushList = () => {
    if (list?.length) blocks.push({ kind: 'ul', items: list.map(parseInline) });
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    if (BULLET.test(line)) {
      flushParagraph();
      list ??= [];
      list.push(line.replace(BULLET, ''));
      continue;
    }
    if (list && /^\s{2,}\S/.test(raw)) {
      // indented continuation of a list item
      list[list.length - 1] += ` ${line.trim()}`;
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

/** Parse emphasis markers into styled runs. Unmatched markers stay literal. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /(\*\*\*|\*\*|\*|_)(?=\S)([\s\S]*?\S)\1(?![*_])/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m[1] === '_' && /\w/.test(text[m.index - 1] ?? '')) continue; // snake_case is not emphasis
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    const marker = m[1];
    const style = { bold: marker === '**' || marker === '***', italic: marker !== '**' };
    for (const inner of parseInline(m[2])) {
      out.push(clean({ text: inner.text, bold: style.bold || inner.bold, italic: style.italic || inner.italic }));
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return mergeRuns(out);
}

function clean(inline: Inline): Inline {
  const result: Inline = { text: inline.text };
  if (inline.bold) result.bold = true;
  if (inline.italic) result.italic = true;
  return result;
}

function mergeRuns(runs: Inline[]): Inline[] {
  const merged: Inline[] = [];
  for (const run of runs) {
    const prev = merged[merged.length - 1];
    if (prev && Boolean(prev.bold) === Boolean(run.bold) && Boolean(prev.italic) === Boolean(run.italic)) {
      prev.text += run.text;
    } else {
      merged.push({ ...run });
    }
  }
  return merged.filter((r) => r.text.length > 0);
}

/** Plain text of blocks (used for searching and length estimates). */
export function blocksToPlainText(blocks: Block[]): string {
  return blocks
    .map((b) => (b.kind === 'p' ? b.inlines.map((i) => i.text).join('') : b.items.map((it) => it.map((i) => i.text).join('')).join('\n')))
    .join('\n\n');
}

/** Serialise blocks back to the markdown subset (inverse of {@link parseMarkdown} for well-formed input). */
export function blocksToMarkdown(blocks: Block[]): string {
  const inline = (runs: Inline[]) =>
    runs.map((r) => {
      if (r.bold && r.italic) return `***${r.text}***`;
      if (r.bold) return `**${r.text}**`;
      if (r.italic) return `*${r.text}*`;
      return r.text;
    }).join('');
  return blocks.map((b) => (b.kind === 'p' ? inline(b.inlines) : b.items.map((it) => `- ${inline(it)}`).join('\n'))).join('\n\n');
}
