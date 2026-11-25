/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CARD_FONT_FACES, fontFaceRule } from './fonts';

describe('embedded card fonts', () => {
  it('builds @font-face rules like those in card.css', () => {
    expect(fontFaceRule({ family: 'Alegreya', weight: 700, style: 'italic' }, 'data:font/woff2;base64,AAAA')).toBe(
      "@font-face { font-family: 'Alegreya'; src: url(data:font/woff2;base64,AAAA) format('woff2'); font-weight: 700; font-style: italic; font-display: block; }",
    );
  });

  it('embeds exactly the families, weights and styles declared in card.css', () => {
    const css = readFileSync(new URL('../render/card.css', import.meta.url), 'utf8');
    const declared = [...css.matchAll(/@font-face \{ font-family: '([^']+)'; src: url\('\.\/fonts\/([^']+)'\) format\('woff2'\); font-weight: (\d+); font-style: (\w+);/g)]
      .map((m) => `${m[1]}|${m[3]}|${m[4]}|${m[2]}`);
    const embedded = CARD_FONT_FACES.map((f) => `${f.family}|${f.weight}|${f.style}|${f.url.split('/').pop()}`);
    expect(declared).toHaveLength(5);
    expect(embedded.sort()).toEqual(declared.sort());
  });
});
