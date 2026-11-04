import { describe, expect, it } from 'vitest';
import { ICONS } from '../render/icons';
import { ICON_ATTRIBUTION, NOTICE_FILE_NAME, SRD_ATTRIBUTION, SRD_CHANGES, noticeText, sheetCredits } from './legal';

describe('legal notices', () => {
  it('credits every icon author', () => {
    const authors = new Set(Object.values(ICONS).map((i) => i.author));
    for (const lang of ['de', 'en'] as const) {
      for (const author of authors) expect(ICON_ATTRIBUTION[lang]).toContain(author);
    }
  });

  it('puts the change note and icon credits on the sheet', () => {
    expect(sheetCredits('en')).toBe(`${SRD_CHANGES.en} ${ICON_ATTRIBUTION.en}`);
  });

  it('builds the text file for the PNG export in the deck language', () => {
    for (const lang of ['de', 'en'] as const) {
      const text = noticeText(lang);
      for (const part of [SRD_ATTRIBUTION[lang], SRD_CHANGES[lang], ICON_ATTRIBUTION[lang]]) expect(text).toContain(part);
      expect(NOTICE_FILE_NAME[lang]).toMatch(/\.txt$/);
    }
  });
});
