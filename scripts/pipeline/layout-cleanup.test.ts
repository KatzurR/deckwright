/**
 * Removal of sidebars and class tables, and tables with hanging indents or multi-line headers –
 * tested on synthetic lines shaped like Poppler's output of the SRD PDFs.
 */
import { describe, expect, it } from 'vitest';
import { stripSidebars } from './doc';
import { stripClassTables } from './parse/features';
import type { Line, Role } from './pdf/layout';
import { parseTable, tableToMarkdown } from './text';

const ctx = { hyphenated: new Set<string>() };

function line(
  text: string,
  opts: { role?: Role; page?: number; col?: number; top: number; left?: number; size?: number; cells?: [number, string, number?][] },
): Line {
  const left = opts.left ?? 100;
  const size = opts.size ?? 14;
  const cells = (opts.cells ?? [[left, text]]).map(([l, t, s]) => ({ left: l, text: t, size: s ?? size }));
  return {
    page: opts.page ?? 1,
    col: opts.col ?? 0,
    top: opts.top,
    left,
    right: left + 300,
    role: opts.role ?? 'sans',
    size,
    segments: [{ text: cells.map((c) => c.text).join('\t'), bold: false, italic: false }],
    text: cells.map((c) => c.text).join('\t'),
    cells,
  };
}

/** Table rows every 22.5 px from `from` to `to` (inclusive). */
function rows(from: number, to: number, text: (n: number) => string, col = 0): Line[] {
  const out: Line[] = [];
  for (let top = from, n = 1; top <= to; top += 22.5, n++) out.push(line(text(n), { top, col }));
  out[out.length - 1].top = to;
  return out;
}

describe('stripSidebars', () => {
  it('removes a sidebar with a two-line small-caps title up to the column change', () => {
    const lines = [
      line('Body before.', { role: 'body', top: 100 }),
      line('B y o', { top: 724, size: 17 }),
      line('rEakinG our atH', { top: 730, size: 12 }),
      line('A Paladin tries to hold to the highest standards', { top: 750 }),
      line('of conduct.', { top: 768 }),
      line('Table in the next column', { top: 80, col: 1 }),
      line('Body after.', { role: 'body', top: 100, col: 1 }),
    ];
    expect(stripSidebars(lines).map((l) => l.text)).toEqual(['Body before.', 'Table in the next column', 'Body after.']);
  });

  it('detects a title whose capitals and small caps are on one line', () => {
    const lines = [
      line('As\tAuberbuch erweitern oder', { top: 561, size: 12, cells: [[122, 'As', 17], [140, 'Auberbuch erweitern oder', 12]] }),
      line('ersetzen', { top: 579, size: 12 }),
      line('Die Zauber, die du deinem Zauberbuch …', { top: 600 }),
      line('Einen Zauber kopieren:\tWenn du', { top: 726, cells: [[118, 'Einen Zauber kopieren:'], [300, 'Wenn du']] }),
      line('Die Zauberplätze dürfen …', { role: 'body', top: 800 }),
    ];
    expect(stripSidebars(lines).map((l) => l.text)).toEqual(['Die Zauberplätze dürfen …']);
  });

  it('keeps stat block headings (17 pt without small caps) and ordinary tables', () => {
    const lines = [line('Traits', { top: 100, size: 17 }), line('1\tSomething', { top: 120 }), line('2\tElse', { top: 140 })];
    expect(stripSidebars(lines)).toHaveLength(3);
  });
});

describe('stripClassTables', () => {
  it('removes both halves of a class table split across the columns', () => {
    const lines = [
      line('Paladin Features', { role: 'h4', top: 542 }),
      line('Level\tBonus\tClass Features', { top: 589 }),
      ...rows(612, 1061, (n) => `${n}\t+2\tFeature`),
      line('Level 1: Lay On Hands', { role: 'h3', col: 1, top: 368 }),
      line('Your blessed touch can heal wounds.', { role: 'body', col: 1, top: 390 }),
      line('Channel\tPrepared', { col: 1, top: 573 }),
      ...rows(612, 1061, (n) => `—\t${n}\t2`, 1),
      line('As a Bonus Action …', { role: 'body', page: 2, top: 59 }),
    ];
    expect(stripClassTables(lines, 'en').map((l) => l.text)).toEqual([
      'Level 1: Lay On Hands',
      'Your blessed touch can heal wounds.',
      'As a Bonus Action …',
    ]);
  });

  it('finds the rows geometrically when full-width rows interrupt the reading order', () => {
    const lines = [
      line('Barbarenmerkmale', { role: 'h4', top: 565 }),
      line('Stufe\tÜbungsbonus', { top: 605 }),
      line('1. Stufe: Kampfrausch', { role: 'h3', col: 1, top: 464 }),
      line('Kampfrausch-\tWaffen-', { col: 1, top: 589 }),
      line('1\t+2\tKampfrausch', { col: -1, top: 627 }),
      ...rows(650, 1054, (n) => `${n}\t+3\tMerkmal`),
      line('Eine andere Tabelle weit unten', { top: 1060, page: 2 }),
    ];
    expect(stripClassTables(lines, 'de').map((l) => l.text)).toEqual(['1. Stufe: Kampfrausch', 'Eine andere Tabelle weit unten']);
  });
});

describe('tables', () => {
  it('joins hanging-indent rows even when justified continuation lines contain wide gaps', () => {
    const lines = [
      line('1d100 Effect', { top: 84, left: 103 }),
      line('01–20 You cast a spell from the', { top: 106, left: 103 }),
      line('chosen\tpoint.', { top: 125, left: 152, cells: [[152, 'chosen'], [260, 'point.']] }),
      line('21–25 Nothing happens.', { top: 204, left: 103 }),
      // The table continues in the next column with a repeated header.
      line('1d100 Effect', { top: 60, left: 470, col: 1 }),
      line('26–30 You cast Gust of Wind. The', { top: 80, left: 470, col: 1 }),
      line('Line extends from you.', { top: 98, left: 519, col: 1 }),
    ];
    expect(tableToMarkdown(parseTable(lines, ctx))).toBe(
      [
        '- **01–20:** You cast a spell from the chosen point.',
        '- **21–25:** Nothing happens.',
        '- **26–30:** You cast Gust of Wind. The Line extends from you.',
      ].join('\n'),
    );
  });

  it('accepts right-aligned keys in hanging-indent tables', () => {
    const lines = [
      line('1d10 Behavior', { top: 414, left: 478 }),
      line('1\tThe target does not act and', { top: 436, left: 488, cells: [[488, '1'], [500, 'The target does not act and']] }),
      line('moves randomly.', { top: 455, left: 519 }),
      line('2–6 The target does not move.', { top: 496, left: 480 }),
      line('9–10 The target chooses.', { top: 598, left: 477 }),
    ];
    expect(tableToMarkdown(parseTable(lines, ctx))).toBe(
      ['- **1:** The target does not act and moves randomly.', '- **2–6:** The target does not move.', '- **9–10:** The target chooses.'].join('\n'),
    );
  });

  it('merges a multi-line header with open parentheses', () => {
    const lines = [
      line('1d100\t1d100', { top: 664, cells: [[129, '1d100'], [225, '1d100']] }),
      line('(13-Card\t(22-Card\tCard', { top: 680, cells: [[120, '(13-Card'], [225, '(22-Card'], [341, 'Card']] }),
      line('Deck)\tDeck)', { top: 696, cells: [[129, 'Deck)'], [235, 'Deck)']] }),
      line('—\t01–05\tBalance', { top: 719, cells: [[140, '—'], [235, '01–05'], [341, 'Balance']] }),
    ];
    expect(parseTable(lines, ctx).rows).toEqual([
      ['1d100 (13-Card Deck)', '1d100 (22-Card Deck)', 'Card'],
      ['—', '01–05', 'Balance'],
    ]);
  });

  it('keeps single-line headers and wrapped cells as before', () => {
    const lines = [
      line('Level\tSpells', { top: 189, cells: [[129, 'Level'], [201, 'Spells']] }),
      line('3\tAlter Self, Command,', { top: 211, cells: [[141, '3'], [200, 'Alter Self, Command,']] }),
      line('Dragon’s Breath', { top: 230, left: 200 }),
      line('5\tFear, Fly', { top: 253, cells: [[141, '5'], [200, 'Fear, Fly']] }),
    ];
    expect(parseTable(lines, ctx).rows).toEqual([
      ['Level', 'Spells'],
      ['3', 'Alter Self, Command, Dragon’s Breath'],
      ['5', 'Fear, Fly'],
    ]);
  });
});
