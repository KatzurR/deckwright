import { describe, expect, it } from 'vitest';
import { parseMarkdown, blocksToPlainText, type Block } from '../model/markdown';
import { buildBlock, closingBlock, fontSteps, paginate, tokenize, FONT, type FitsFn } from './paginate';

/** Fake measurement: a page holds `capacity(fontSize)` characters, continuation pages 1.5× as many. */
function charFits(firstCapacity: number): FitsFn {
  return ({ first, blocks, fontSize }) => {
    const scale = (FONT.max / fontSize) ** 2;
    const capacity = firstCapacity * scale * (first ? 1 : 1.5);
    return blocksToPlainText(blocks).length <= capacity;
  };
}

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

describe('fontSteps', () => {
  it('steps from 6.0 down to the minimum', () => {
    expect(fontSteps()).toEqual([6, 5.8, 5.6, 5.4, 5.2, 5, 4.8]);
    expect(fontSteps({ max: 6, min: 5, step: 0.3 })).toEqual([6, 5.7, 5.4, 5.1, 5]);
  });
});

describe('paginate', () => {
  it('keeps short texts at the design size', () => {
    const blocks = parseMarkdown('Short text.');
    const result = paginate(blocks, charFits(500));
    expect(result.overflow).toBe('none');
    expect(result.pages).toEqual([{ part: 1, total: 1, first: true, blocks, fontSize: 6 }]);
  });

  it('shrinks the font before splitting', () => {
    const blocks = parseMarkdown(words(80)); // ~ 560 chars
    const result = paginate(blocks, charFits(500));
    expect(result.overflow).toBe('shrunk');
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].fontSize).toBeLessThan(6);
    expect(result.pages[0].fontSize).toBeGreaterThanOrEqual(FONT.min);
  });

  it('splits into continuation cards at the minimum size without losing text', () => {
    const text = `${words(150)}\n\n- **A.** ${words(40)}\n- **B.** ${words(40)}\n\n${words(200)}`;
    const blocks = [...parseMarkdown(text), closingBlock('Auf höheren Graden.', 'mehr Schaden')];
    const result = paginate(blocks, charFits(500));
    expect(result.overflow).toBe('split');
    expect(result.pages.length).toBeGreaterThan(1);
    result.pages.forEach((p, i) => {
      expect(p.part).toBe(i + 1);
      expect(p.total).toBe(result.pages.length);
      expect(p.first).toBe(i === 0);
      expect(p.fontSize).toBe(FONT.min);
      expect(charFits(500)(p)).toBe(true);
    });
    const joined = result.pages.map((p) => blocksToPlainText(p.blocks)).join(' ').replace(/\s+/g, ' ');
    expect(joined).toBe(blocksToPlainText(blocks).replace(/\s+/g, ' '));
  });

  it('marks list items that continue on the next card', () => {
    const blocks = parseMarkdown(`- ${words(300)}`);
    const result = paginate(blocks, charFits(400));
    expect(result.pages.length).toBeGreaterThan(2);
    for (const page of result.pages.slice(1)) {
      const first = page.blocks[0];
      expect(first.kind === 'ul' && first.continued).toBe(true);
    }
    expect(result.pages[0].blocks[0].kind === 'ul' && result.pages[0].blocks[0].continued).toBeFalsy();
  });

  it('starts a continuation list item with a bullet when split between items', () => {
    const items = Array.from({ length: 30 }, (_, i) => `- item ${i} ${words(8)}`).join('\n');
    const result = paginate(parseMarkdown(items), charFits(500));
    for (const page of result.pages.slice(1)) {
      const first = page.blocks[0];
      if (first.kind === 'ul' && first.continued) {
        // continued only if the first token is not the start of an item
        expect(first.items[0][0].text.startsWith('item')).toBe(false);
      }
    }
  });

  it('always makes progress even if nothing fits', () => {
    const blocks = parseMarkdown(words(5));
    const result = paginate(blocks, () => false);
    expect(result.overflow).toBe('split');
    expect(result.pages.length).toBe(5);
  });
});

describe('tokenize / buildBlock', () => {
  it('preserves styles across a split', () => {
    const [block] = parseMarkdown('**Bold lead.** plain *italic tail*') as Block[];
    const tokens = tokenize(block);
    const head = buildBlock(block, tokens.slice(0, 3));
    const tail = buildBlock(block, tokens.slice(3), true);
    // whitespace stays attached to the preceding word
    expect(head).toEqual({ kind: 'p', inlines: [{ text: 'Bold lead. ', bold: true }, { text: 'plain' }] });
    expect(tail).toEqual({ kind: 'p', inlines: [{ text: 'italic tail', italic: true }] });
  });
});
