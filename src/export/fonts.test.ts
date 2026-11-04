/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CARD_FONT_FAMILY, fontFaceRule } from './fonts';

describe('embedded card font', () => {
  it('builds @font-face rules like those in card.css', () => {
    expect(fontFaceRule('data:font/otf;base64,AAAA', 700, 'italic')).toBe(
      "@font-face { font-family: 'TeX Gyre Schola'; src: url(data:font/otf;base64,AAAA) format('opentype'); font-weight: 700; font-style: italic; font-display: block; }",
    );
  });

  it('uses the family, weights and styles declared in card.css', () => {
    const css = readFileSync(new URL('../render/card.css', import.meta.url), 'utf8');
    const faces = [...css.matchAll(/@font-face \{ font-family: '([^']+)'; src: [^;]+; font-weight: (\d+); font-style: (\w+);/g)].map((m) => `${m[1]}|${m[2]}|${m[3]}`);
    expect(faces.sort()).toEqual(
      [`${CARD_FONT_FAMILY}|400|normal`, `${CARD_FONT_FAMILY}|700|normal`, `${CARD_FONT_FAMILY}|400|italic`, `${CARD_FONT_FAMILY}|700|italic`].sort(),
    );
  });
});
