/**
 * @font-face rules of the card fonts with the font files inlined as data URLs, for the
 * 300-dpi rendering (html-to-image draws the card inside an SVG foreignObject, which cannot
 * load external fonts).
 *
 * html-to-image can collect these rules itself (getFontEmbedCSS), but reads the family with
 * `CSSFontFaceRule.style.fontFamily`, which is undefined in Firefox ("font is undefined").
 * The card fonts are known, so the rules are built here directly. Keep in sync with the
 * @font-face rules in src/render/card.css.
 */
import alegreyaBold from '../render/fonts/alegreya-latin-700-normal.woff2?url';
import alegreyaBoldItalic from '../render/fonts/alegreya-latin-700-italic.woff2?url';
import alegreyaItalic from '../render/fonts/alegreya-latin-400-italic.woff2?url';
import alegreyaRegular from '../render/fonts/alegreya-latin-400-normal.woff2?url';
import grenzeGotischBold from '../render/fonts/grenze-gotisch-latin-700-normal.woff2?url';

export interface CardFontFace {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
  url: string;
}

/** Every face the card uses: Alegreya for the text, Grenze Gotisch for the title and the shield. */
export const CARD_FONT_FACES: readonly CardFontFace[] = [
  { family: 'Alegreya', weight: 400, style: 'normal', url: alegreyaRegular },
  { family: 'Alegreya', weight: 700, style: 'normal', url: alegreyaBold },
  { family: 'Alegreya', weight: 400, style: 'italic', url: alegreyaItalic },
  { family: 'Alegreya', weight: 700, style: 'italic', url: alegreyaBoldItalic },
  { family: 'Grenze Gotisch', weight: 700, style: 'normal', url: grenzeGotischBold },
];

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function fontFaceRule(face: Omit<CardFontFace, 'url'>, dataUrl: string): string {
  return `@font-face { font-family: '${face.family}'; src: url(${dataUrl}) format('woff2'); font-weight: ${face.weight}; font-style: ${face.style}; font-display: block; }`;
}

let cached: Promise<string> | undefined;

/** The embedded font CSS (loaded once per session). */
export function cardFontEmbedCSS(): Promise<string> {
  cached ??= Promise.all(
    CARD_FONT_FACES.map(async (face) => {
      const res = await fetch(face.url);
      if (!res.ok) throw new Error(`Font ${face.url}: HTTP ${res.status}`);
      return fontFaceRule(face, await blobToDataUrl(await res.blob()));
    }),
  )
    .then((rules) => rules.join('\n'))
    .catch((err) => {
      cached = undefined;
      throw err;
    });
  return cached;
}
