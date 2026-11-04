/**
 * Rasterises card faces to 300 dpi PNGs in the browser (html-to-image), for PNG/ZIP and PDF export.
 */
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import { cardFontEmbedCSS } from './fonts';
import { CardFace } from '../render/CardFace';
import type { LaidOutCard } from '../render/measure';
import { cardPixels, DPI } from './layout';
import { dataUrlToBytes, setPngDpi } from './png';

export interface RenderedImage {
  /** File name without extension, e.g. "03-feuerball" or "03-feuerball-2" for a continuation card. */
  name: string;
  bytes: Uint8Array;
}

export interface Progress {
  done: number;
  total: number;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'card';
}

/** File names for all pages of all cards, numbered in deck order. */
export function imageNames(cards: LaidOutCard[]): string[] {
  const width = String(cards.length).length < 2 ? 2 : String(cards.length).length;
  return cards.flatMap((c, i) => {
    const base = `${String(i + 1).padStart(width, '0')}-${slugify(c.display.title)}`;
    return c.pagination.pages.map((p) => (p.total > 1 ? `${base}-${p.part}` : base));
  });
}

/**
 * Extra rules for the rendered clone. html-to-image copies every computed style, including the
 * heights of the text blocks. Firefox rasterises the SVG image with slightly different line
 * breaks than its live layout, so a paragraph can need one more line than its copied height
 * and overlap the next one. Letting the blocks grow with their content avoids that; in
 * Chromium the result is identical.
 */
const EXPORT_CSS = '.otc-card__body > *, .otc-card__body li { height: auto !important; block-size: auto !important; }';

export async function renderCardImages(
  cards: LaidOutCard[],
  options: { bleed: number; onProgress?: (p: Progress) => void },
): Promise<RenderedImage[]> {
  const names = imageNames(cards);
  const pages = cards.flatMap((c) => c.pagination.pages.map((page) => ({ card: c, page })));
  const px = cardPixels(options.bleed, DPI);

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-20000px;top:0;pointer-events:none;';
  document.body.appendChild(host);
  const root = createRoot(host);
  const images: RenderedImage[] = [];
  let fontEmbedCSS: string | undefined;
  try {
    for (let i = 0; i < pages.length; i++) {
      const { card, page } = pages[i];
      flushSync(() => {
        root.render(
          <CardFace
            display={card.display}
            blocks={page.blocks}
            fontSize={page.fontSize}
            first={page.first}
            part={page.part}
            total={page.total}
            bleed={options.bleed}
          />,
        );
      });
      const node = host.firstElementChild as HTMLElement;
      fontEmbedCSS ??= `${await cardFontEmbedCSS()}\n${EXPORT_CSS}`;
      const dataUrl = await toPng(node, {
        width: node.offsetWidth,
        height: node.offsetHeight,
        canvasWidth: px.w,
        canvasHeight: px.h,
        pixelRatio: 1,
        skipAutoScale: true,
        fontEmbedCSS,
        cacheBust: false,
      });
      images.push({ name: names[i], bytes: setPngDpi(dataUrlToBytes(dataUrl), DPI) });
      options.onProgress?.({ done: i + 1, total: pages.length });
      // keep the UI responsive
      await new Promise((r) => setTimeout(r, 0));
    }
  } finally {
    root.unmount();
    host.remove();
  }
  return images;
}
