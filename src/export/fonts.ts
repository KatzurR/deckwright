/**
 * @font-face rules of the card font with the font files inlined as data URLs, for the
 * 300-dpi rendering (html-to-image draws the card inside an SVG foreignObject, which cannot
 * load external fonts).
 *
 * html-to-image can collect these rules itself (getFontEmbedCSS), but reads the family with
 * `CSSFontFaceRule.style.fontFamily`, which is undefined in Firefox ("font is undefined").
 * The card font is known, so the rules are built here directly. Keep in sync with the
 * @font-face rules in src/render/card.css.
 */
import bold from '../render/fonts/texgyreschola-bold.otf?url';
import boldItalic from '../render/fonts/texgyreschola-bolditalic.otf?url';
import italic from '../render/fonts/texgyreschola-italic.otf?url';
import regular from '../render/fonts/texgyreschola-regular.otf?url';

export const CARD_FONT_FAMILY = 'TeX Gyre Schola';

const FACES = [
  { url: regular, weight: 400, style: 'normal' },
  { url: bold, weight: 700, style: 'normal' },
  { url: italic, weight: 400, style: 'italic' },
  { url: boldItalic, weight: 700, style: 'italic' },
] as const;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function fontFaceRule(dataUrl: string, weight: number, style: string): string {
  return `@font-face { font-family: '${CARD_FONT_FAMILY}'; src: url(${dataUrl}) format('opentype'); font-weight: ${weight}; font-style: ${style}; font-display: block; }`;
}

let cached: Promise<string> | undefined;

/** The embedded font CSS (loaded once per session). */
export function cardFontEmbedCSS(): Promise<string> {
  cached ??= Promise.all(
    FACES.map(async (face) => {
      const res = await fetch(face.url);
      if (!res.ok) throw new Error(`Font ${face.url}: HTTP ${res.status}`);
      return fontFaceRule(await blobToDataUrl(await res.blob()), face.weight, face.style);
    }),
  )
    .then((rules) => rules.join('\n'))
    .catch((err) => {
      cached = undefined;
      throw err;
    });
  return cached;
}
