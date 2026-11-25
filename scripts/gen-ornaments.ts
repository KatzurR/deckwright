/**
 * Generates the flat gold ornaments of the card frame as small SVG files in
 * src/render/ornaments/. Deterministic, so re-running produces identical files.
 * Run: npm run ornaments
 *
 * The gold is fixed (it suits every card colour), so the files work for all decks. Lengths are in
 * millimetres and must match the background sizes in src/render/card.css.
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const GOLD = '#d6aa52';
const DARK = '#3a2410';
const STROKE = `fill='none' stroke='${GOLD}' stroke-linecap='round' stroke-linejoin='round'`;

const CARD = { w: 63, h: 88 };
/** Height of a chain strip. */
const CHAIN_BAND = 3.4;
/** Target distance between two lozenges; the strips spread whole lozenges evenly. */
const CHAIN_PITCH = 2.6;
/** Distance from a chain end to the card corner, keeps the chain clear of the corner plates. */
const CHAIN_CLEAR = 7.1;
/** Width of the level shield and the gap between the shield and the bottom chain. */
const BADGE_W = 6.6;
const BADGE_CLEAR = 1.2;

const dir = new URL('../src/render/ornaments/', import.meta.url);
mkdirSync(dir, { recursive: true });

const f = (n: number) => String(Number(n.toFixed(3)));

function write(name: string, body: string, viewBox: string) {
  writeFileSync(new URL(name, dir), `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'>${body}</svg>\n`);
}

/** Fine lozenge lattice on the frame. */
function lattice() {
  write('lattice.svg',
    `<path d='M6 0L12 6L6 12L0 6Z' fill='none' stroke='${GOLD}' stroke-opacity='0.14' stroke-width='0.6'/>` +
    `<circle cx='6' cy='6' r='0.7' fill='${GOLD}' fill-opacity='0.18'/>`, '0 0 12 12');
}

/** Scroll of the dividers (the lozenge in the middle is drawn in the accent colour by CSS). */
function flourish() {
  write('flourish.svg',
    `<g ${STROKE} stroke-width='1.6'><path d='M22 11c-5-6-12-6-14 0 3 4 8 3 9 0M38 11c5-6 12-6 14 0-3 4-8 3-9 0'/>` +
    `<path d='M2 11h5M53 11h5'/></g>`, '0 0 60 22');
}

/**
 * Horizontal lozenge chain of the given length with a rivet at both ends. The lozenges are spread
 * evenly over the length, so none is cut off.
 */
function chainStrip(length: number): { body: string; count: number } {
  const cap = 1.05;
  const count = Math.round((length - 2 * cap) / CHAIN_PITCH);
  const pitch = (length - 2 * cap) / count;
  const cy = CHAIN_BAND / 2;
  const half = 0.91;
  const ends = [0.34, length - 0.34];
  const lozenges: string[] = [];
  const links: string[] = [];
  const dots: string[] = [];
  let x = ends[0];
  for (let i = 0; i < count; i++) {
    const c = cap + pitch * (i + 0.5);
    links.push(`M${f(x)} ${f(cy)}H${f(c - half)}`);
    lozenges.push(`M${f(c)} ${f(cy - half)}L${f(c + half)} ${f(cy)}L${f(c)} ${f(cy + half)}L${f(c - half)} ${f(cy)}Z`);
    dots.push(`<circle cx='${f(c)}' cy='${f(cy)}' r='0.26' fill='${GOLD}'/>`);
    x = c + half;
  }
  links.push(`M${f(x)} ${f(cy)}H${f(ends[1])}`);
  const rivets = ends.map((e) => `<circle cx='${f(e)}' cy='${f(cy)}' r='0.34' fill='${GOLD}'/>`).join('');
  return {
    body: `<g ${STROKE} stroke-width='0.17'><path d='${lozenges.join('')}'/><path d='${links.join('')}'/></g>${dots.join('')}${rivets}`,
    count,
  };
}

/** The four chain strips of the frame: top/bottom, sides, and the bottom halves beside the shield. */
function chain() {
  const hLen = CARD.w - 2 * CHAIN_CLEAR;
  const vLen = CARD.h - 2 * CHAIN_CLEAR;
  const halfLen = CARD.w / 2 - BADGE_W / 2 - BADGE_CLEAR - CHAIN_CLEAR;
  const h = chainStrip(hLen);
  write('chain-h.svg', h.body, `0 0 ${f(hLen)} ${CHAIN_BAND}`);
  const v = chainStrip(vLen);
  write('chain-v.svg', `<g transform='rotate(90) translate(0 ${-CHAIN_BAND})'>${v.body}</g>`, `0 0 ${CHAIN_BAND} ${f(vLen)}`);
  const half = chainStrip(halfLen);
  write('chain-h-half.svg', half.body, `0 0 ${f(halfLen)} ${CHAIN_BAND}`);
  console.log(`chain strips (mm): ${f(hLen)} × ${CHAIN_BAND} (${h.count}), ${CHAIN_BAND} × ${f(vLen)} (${v.count}), ${f(halfLen)} × ${CHAIN_BAND} (${half.count})`);
}

/** Gold corner plate with a notch, an embossed lozenge and two rivets; four mirrored variants. */
function cornerPlates() {
  const body =
    `<path d='M0 0 H31 L20 11 A5 5 0 0 0 11 20 L0 31 Z' fill='${GOLD}' stroke='${DARK}' stroke-opacity='.35' stroke-width='.6'/>` +
    `<path d='M3.6 3.6 H22.5 L15.5 10.6 A6 6 0 0 0 10.6 15.5 L3.6 22.5 Z' fill='none' stroke='${DARK}' stroke-opacity='.45' stroke-width='.8'/>` +
    `<path d='M8.4 5.4 L11.4 8.4 L8.4 11.4 L5.4 8.4Z' fill='${DARK}' fill-opacity='.42'/>` +
    `<circle cx='26' cy='2.4' r='1.15' fill='${DARK}' fill-opacity='.42'/><circle cx='2.4' cy='26' r='1.15' fill='${DARK}' fill-opacity='.42'/>`;
  const corners = { tl: '', tr: 'translate(40 0) scale(-1 1)', bl: 'translate(0 40) scale(1 -1)', br: 'translate(40 40) scale(-1 -1)' };
  for (const [corner, transform] of Object.entries(corners)) {
    write(`corner-${corner}.svg`, transform ? `<g transform='${transform}'>${body}</g>` : body, '0 0 40 40');
  }
}

lattice();
flourish();
chain();
cornerPlates();
console.log('src/render/ornaments/*.svg written');
