/**
 * Browser print (SPEC §8): same arrangement as the PDF, but with vector text.
 * Rendered into a separate root that is only visible in print media.
 */
import type { CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import type { Lang } from '../model/schema';
import { SRD_ATTRIBUTION, sheetCredits } from '../model/legal';
import { CardFace } from '../render/CardFace';
import type { LaidOutCard } from '../render/measure';
import { sheetLayout, toSheets, type NoticeBox, type Paper } from './layout';
import './print.css';

export interface PrintSheetsProps {
  cards: LaidOutCard[];
  paper: Paper;
  bleed: number;
  lang: Lang;
}

const mm = (v: number) => `${v}mm`;

/** Position a notice box; the text sits on the side next to the cards. */
function noticeStyle(a: NoticeBox): CSSProperties {
  // Rotated boxes: a box of size h × w is rotated around its top-left corner so it reads bottom
  // to top; its local bottom then faces right and its local top faces left.
  const towardCards = a.side === 'bottom' || a.side === 'right' ? 'flex-start' : 'flex-end';
  return a.rotation === 0
    ? {
        left: mm(a.x), top: mm(a.y), width: mm(a.w), height: mm(a.h), textAlign: 'center',
        display: 'flex', alignItems: towardCards, justifyContent: 'center',
      }
    : {
        left: mm(a.x), top: mm(a.y + a.h), width: mm(a.h), height: mm(a.w),
        transform: 'rotate(-90deg)', transformOrigin: '0 0', textAlign: 'center',
        display: 'flex', alignItems: towardCards, justifyContent: 'center',
      };
}

export function PrintSheets({ cards, paper, bleed, lang }: PrintSheetsProps) {
  const layout = sheetLayout(paper, bleed);
  const pages = cards.flatMap((c) => c.pagination.pages.map((page) => ({ card: c, page })));
  const sheets = toSheets(pages);
  const attributionStyle = noticeStyle(layout.attribution);
  const creditsStyle = noticeStyle(layout.credits);

  return (
    <div className="otc-print" data-paper={paper}>
      {sheets.map((sheet, s) => (
        <section className="otc-print__sheet" key={s} style={{ width: mm(layout.page.w), height: mm(layout.page.h) }}>
          {sheet.map(({ card, page }, i) => {
            const slot = layout.slots[i];
            return (
              <div
                key={i}
                className="otc-print__cell"
                style={{ left: mm(slot.clip.x), top: mm(slot.clip.y), width: mm(slot.clip.w), height: mm(slot.clip.h) }}
              >
                <div style={{ position: 'absolute', left: mm(slot.image.x - slot.clip.x), top: mm(slot.image.y - slot.clip.y) }}>
                  <CardFace
                    display={card.display}
                    blocks={page.blocks}
                    fontSize={page.fontSize}
                    first={page.first}
                    part={page.part}
                    total={page.total}
                    bleed={bleed}
                  />
                </div>
              </div>
            );
          })}
          {layout.cutMarks.map((m, i) => (
            <span
              key={`m${i}`}
              className="otc-print__mark"
              style={m.x1 === m.x2
                ? { left: `calc(${mm(m.x1)} - 0.05mm)`, top: mm(Math.min(m.y1, m.y2)), width: '0.1mm', height: mm(Math.abs(m.y2 - m.y1)) }
                : { top: `calc(${mm(m.y1)} - 0.05mm)`, left: mm(Math.min(m.x1, m.x2)), height: '0.1mm', width: mm(Math.abs(m.x2 - m.x1)) }}
            />
          ))}
          <div className="otc-print__attribution" style={attributionStyle}>
            <span>{SRD_ATTRIBUTION[lang]}</span>
          </div>
          <div className="otc-print__credits" style={creditsStyle}>
            <span>{sheetCredits(lang)}</span>
          </div>
        </section>
      ))}
    </div>
  );
}

/** Render the sheets, open the print dialog and clean up afterwards. */
export function printSheets(props: PrintSheetsProps): void {
  const host = document.createElement('div');
  host.className = 'otc-print-root';
  document.body.appendChild(host);
  const pageStyle = document.createElement('style');
  pageStyle.textContent = `@page { size: ${props.paper === 'a4' ? 'A4' : 'letter'} portrait; margin: 0; }`;
  document.head.appendChild(pageStyle);
  document.body.classList.add('otc-printing');
  const root = createRoot(host);
  flushSync(() => root.render(<PrintSheets {...props} />));

  const cleanup = () => {
    window.removeEventListener('afterprint', cleanup);
    document.body.classList.remove('otc-printing');
    root.unmount();
    host.remove();
    pageStyle.remove();
  };
  window.addEventListener('afterprint', cleanup);
  // Wait for fonts and layout before the dialog opens.
  void document.fonts.ready.then(() => requestAnimationFrame(() => window.print()));
}
