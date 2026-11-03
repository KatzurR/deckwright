/**
 * Browser side of the overflow handling: renders cards off-screen and checks whether the rule
 * text fits (see paginate.ts for the algorithm).
 */
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import type { Card, Lang } from '../model/schema';
import { parseMarkdown, type Block } from '../model/markdown';
import { CardFace } from './CardFace';
import { displayCard, type CardDisplay, type DisplayOptions } from './format';
import { closingBlock, paginate, type FitsFn, type Pagination } from './paginate';

export function cardBlocks(display: CardDisplay): Block[] {
  const blocks = parseMarkdown(display.body);
  if (display.closing) blocks.push(closingBlock(display.closing.label, display.closing.text));
  return blocks;
}

const FONT_FACES = ['400 normal', '700 normal', '400 italic', '700 italic'];

/** Resolves when the card fonts are loaded (measuring before would give wrong results). */
export async function cardFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all(
    FONT_FACES.map((f) => {
      const [weight, style] = f.split(' ');
      return document.fonts.load(`${style} ${weight} 6pt "TeX Gyre Schola"`).catch(() => []);
    }),
  );
  await document.fonts.ready;
}

export interface LaidOutCard {
  card: Card;
  display: CardDisplay;
  pagination: Pagination;
}

class Measurer {
  private host: HTMLDivElement | null = null;
  private root: Root | null = null;
  private cache = new Map<string, Pagination>();

  private ensure(): { host: HTMLDivElement; root: Root } {
    if (!this.host || !this.root) {
      this.host = document.createElement('div');
      this.host.setAttribute('aria-hidden', 'true');
      this.host.style.cssText = 'position:fixed;left:-20000px;top:0;visibility:hidden;pointer-events:none;';
      document.body.appendChild(this.host);
      this.root = createRoot(this.host);
    }
    return { host: this.host, root: this.root };
  }

  fitsFor(display: CardDisplay): FitsFn {
    return ({ first, blocks, fontSize }) => {
      const { host, root } = this.ensure();
      flushSync(() => {
        root.render(<CardFace display={display} blocks={blocks} fontSize={fontSize} first={first} part={1} total={first ? 1 : 2} />);
      });
      const body = host.querySelector<HTMLElement>('[data-card-body]');
      if (!body) return true;
      return body.scrollHeight <= body.clientHeight + 0.5;
    };
  }

  layout(card: Card, lang: Lang, options: DisplayOptions): LaidOutCard {
    const display = displayCard(card, lang, options);
    const key = JSON.stringify([display, lang]);
    let pagination = this.cache.get(key);
    if (!pagination) {
      pagination = paginate(cardBlocks(display), this.fitsFor(display));
      if (this.cache.size > 2000) this.cache.clear();
      this.cache.set(key, pagination);
    }
    return { card, display, pagination };
  }
}

let shared: Measurer | null = null;

/** Lay out cards (font size and continuation cards). Must not be called during a React render. */
export async function layoutCards(cards: Card[], lang: Lang, options: DisplayOptions = {}): Promise<LaidOutCard[]> {
  await cardFontsReady();
  // Leave the current React lifecycle before flushSync-based measuring.
  await new Promise((r) => setTimeout(r, 0));
  shared ??= new Measurer();
  return cards.map((card) => shared!.layout(card, lang, options));
}
