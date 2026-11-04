import { describe, expect, it } from 'vitest';
import {
  collectHyphenatedWords,
  escapeMd,
  joinBroken,
  joinLineSegments,
  normaliseChars,
  normaliseName,
  runsToMarkdown,
  slugify,
  tableToMarkdown,
  tidy,
} from './text';

const ctx = { hyphenated: new Set<string>() };

describe('character normalisation', () => {
  it('replaces non-breaking hyphens, spaces and ligatures', () => {
    expect(normaliseChars('Yuan‑ti Maﬁa ﬂow')).toBe('Yuan-ti Mafia flow');
  });

  it('treats U+00AD as a real hyphen except before lower-case letters', () => {
    expect(normaliseChars('Barbaren­Unterklasse')).toBe('Barbaren-Unterklasse');
    expect(normaliseChars('Karten­ oder')).toBe('Karten- oder');
    expect(normaliseChars('Zauber­platz')).toBe('Zauberplatz');
  });

  it('tidies whitespace around punctuation and quotes', () => {
    expect(tidy('  Hello ,  world ( yes ) „ Zitat“ ')).toBe('Hello, world (yes) „Zitat“');
  });
});

describe('joinBroken (line-break hyphenation)', () => {
  it('joins plain words with a space', () => {
    expect(joinBroken('magic', 'missile', ctx)).toBe('magic missile');
  });

  it('removes a soft hyphen before a lower-case continuation', () => {
    expect(joinBroken('Zauber-', 'platz', ctx)).toBe('Zauberplatz');
  });

  it('keeps a compound hyphen before an upper-case continuation', () => {
    expect(joinBroken('Fledermaus-', 'Guano', ctx)).toBe('Fledermaus-Guano');
  });

  it('keeps suspended hyphens with a space', () => {
    expect(joinBroken('Stärke-', 'und Geschicklichkeitswürfe', { ...ctx, lang: 'de' })).toBe(
      'Stärke- und Geschicklichkeitswürfe',
    );
    expect(joinBroken('pre-', 'and post-combat', { ...ctx, lang: 'en' })).toBe('pre- and post-combat');
  });

  it('keeps the hyphen when the hyphenated word occurs elsewhere in the document', () => {
    const hyphenated = collectHyphenatedWords(['a self-contained spell', 'line end self-']);
    expect(hyphenated.has('self-contained')).toBe(true);
    expect(joinBroken('self-', 'contained', { hyphenated })).toBe('self-contained');
  });

  it('keeps hyphens next to digits', () => {
    expect(joinBroken('20-', 'foot', ctx)).toBe('20-foot');
    expect(joinBroken('10-foot-by-', '10-foot', ctx)).toBe('10-foot-by-10-foot');
  });

  it('handles empty sides', () => {
    expect(joinBroken('', 'word', ctx)).toBe('word');
    expect(joinBroken('word', '', ctx)).toBe('word');
  });
});

describe('styled runs → Markdown', () => {
  it('keeps bold run-in headings apart from the following text across a line break', () => {
    const runs = joinLineSegments(
      [
        [{ text: 'Alarm.', bold: true, italic: false }],
        [{ text: 'You set an alarm.', bold: false, italic: false }],
      ],
      ctx,
    );
    expect(runsToMarkdown(runs)).toBe('**Alarm.** You set an alarm.');
  });

  it('drops italics and escapes asterisks', () => {
    const md = runsToMarkdown([
      { text: 'See ', bold: false, italic: false },
      { text: 'Fireball', bold: false, italic: true },
      { text: ' *1', bold: false, italic: false },
    ]);
    expect(md).toBe('See Fireball \\*1');
    expect(escapeMd('a*b')).toBe('a\\*b');
  });
});

describe('tables → bullet lists', () => {
  it('renders key/value rows', () => {
    const md = tableToMarkdown({ rows: [['d4', 'Effect'], ['1', 'Nothing happens.'], ['2–3', 'You fly.']] });
    expect(md).toBe('- **1:** Nothing happens.\n- **2–3:** You fly.');
  });

  it('labels the values of multi-column rows with the header', () => {
    const md = tableToMarkdown({ rows: [['Level', 'Damage', 'Range'], ['1', '2d6', '30 ft.']] });
    expect(md).toBe('- **1:** Damage 2d6; Range 30 ft.');
  });

  it('splits a leading number range off fixed-width rows without a wide gap', () => {
    const md = tableToMarkdown({ rows: [['d6', 'Effect'], ['2–6 The target is pushed.'], ['1 Nothing.'], ['No key here.']] });
    expect(md).toBe('- **2–6:** The target is pushed.\n- **1:** Nothing.\n- No key here.');
  });

  it('returns the header alone for a one-row table', () => {
    expect(tableToMarkdown({ rows: [['Only', 'Header']] })).toBe('Only Header');
    expect(tableToMarkdown({ rows: [] })).toBe('');
  });
});

describe('keys and names', () => {
  it.each([
    ["Heroes' Feast", 'heroes-feast'],
    ['Weapon, +1, +2, or +3', 'weapon-plus1-plus2-or-plus3'],
    ['Größe ändern', 'grosse-andern'],
    ['  Acid   Splash ', 'acid-splash'],
  ])('slugify(%s) = %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('normalises names for comparisons', () => {
    expect(normaliseName("Heroes' Feast")).toBe('heroes feast');
  });
});
