import { describe, expect, it } from 'vitest';
import { blocksToMarkdown, blocksToPlainText, parseInline, parseMarkdown } from './markdown';

describe('parseInline', () => {
  it('parses bold, italic and bold italic', () => {
    expect(parseInline('a **b** *c* ***d*** _e_')).toEqual([
      { text: 'a ' }, { text: 'b', bold: true }, { text: ' ' }, { text: 'c', italic: true }, { text: ' ' },
      { text: 'd', bold: true, italic: true }, { text: ' ' }, { text: 'e', italic: true },
    ]);
  });
  it('keeps unmatched markers and snake_case literal', () => {
    expect(parseInline('V, G, M *')).toEqual([{ text: 'V, G, M *' }]);
    expect(parseInline('snake_case_word')).toEqual([{ text: 'snake_case_word' }]);
    expect(parseInline('2 * 3 = 6')).toEqual([{ text: '2 * 3 = 6' }]);
  });
  it('supports nested emphasis', () => {
    expect(parseInline('**bold *both***')).toEqual([{ text: 'bold ', bold: true }, { text: 'both', bold: true, italic: true }]);
  });
});

describe('parseMarkdown', () => {
  it('splits paragraphs at blank lines and keeps line breaks inside', () => {
    const blocks = parseMarkdown('First line\nsecond line\n\nNext paragraph');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ kind: 'p', inlines: [{ text: 'First line\nsecond line' }] });
  });
  it('parses bullet lists with run-in headings', () => {
    const blocks = parseMarkdown("Intro\n- **Can't See.** You can't see.\n- **Attacks Affected.** Advantage.\n  continued\n\nAfter");
    expect(blocks.map((b) => b.kind)).toEqual(['p', 'ul', 'p']);
    const list = blocks[1];
    expect(list.kind === 'ul' && list.items).toEqual([
      [{ text: "Can't See.", bold: true }, { text: " You can't see." }],
      [{ text: 'Attacks Affected.', bold: true }, { text: ' Advantage. continued' }],
    ]);
  });
  it('accepts *, - and • bullets and CRLF', () => {
    const blocks = parseMarkdown('* a\r\n- b\r\n• c');
    expect(blocks).toEqual([{ kind: 'ul', items: [[{ text: 'a' }], [{ text: 'b' }], [{ text: 'c' }]] }]);
  });
  it('returns no blocks for empty text', () => {
    expect(parseMarkdown('  \n\n ')).toEqual([]);
  });
  it('round-trips to markdown and plain text', () => {
    const md = 'Hello **world**\n\n- *one*\n- two';
    expect(blocksToMarkdown(parseMarkdown(md))).toBe(md);
    expect(blocksToPlainText(parseMarkdown(md))).toBe('Hello world\n\none\ntwo');
  });
});
