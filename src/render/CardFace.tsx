import { forwardRef, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { Block, Inline } from '../model/markdown';
import type { CardDisplay } from './format';
import { ICONS } from './icons';
import { CARD_COLOR_THEMES } from './theme';
import './card.css';

export interface CardFaceProps {
  display: CardDisplay;
  blocks: Block[];
  /** Rule text size in pt. */
  fontSize: number;
  /** First card of a (possibly split) card: shows the property block. */
  first?: boolean;
  part?: number;
  total?: number;
  /** Bleed in mm (3 mm for print with bleed). */
  bleed?: number;
  className?: string;
}

export const TITLE_MAX_PT = 14.4;
export const TITLE_MIN_PT = 8;
/** Leading of the rule text relative to the font size. */
export const BODY_LEADING = 1.15;

/**
 * Line height in whole CSS pixels. Browsers snap text baselines to whole CSS pixels, so a
 * fractional line height (6 pt × 1.17 = 9.36 px) gives visibly uneven line spacing at 300 dpi.
 */
export function bodyLineHeightPx(fontSizePt: number): number {
  return Math.max(1, Math.round(((fontSizePt * 96) / 72) * BODY_LEADING));
}

/** A letter or digit at the start of the text, after optional opening punctuation. */
const INITIAL = /^([\p{Ps}\p{Pi}"'„‚]*[\p{L}\p{N}])(.*)$/su;
/**
 * Shortest first paragraph (in characters) that gets a drop cap: the cap spans about three
 * lines, so a paragraph of one line would leave it hanging.
 */
export const INITIAL_MIN_CHARS = 110;

function renderInlines(inlines: Inline[], initial = false): ReactNode[] {
  return inlines.map((run, i) => {
    const match = initial && i === 0 ? INITIAL.exec(run.text) : null;
    let node: ReactNode = match ? <><span className="otc-card__initial">{match[1]}</span>{match[2]}</> : run.text;
    if (run.italic) node = <em>{node}</em>;
    if (run.bold) node = <strong>{node}</strong>;
    return <span key={i}>{node}</span>;
  });
}

/**
 * Rule text blocks. With `initial`, the first letter of a leading paragraph becomes a drop cap.
 * It is a real element rather than `::first-letter`, because html-to-image does not copy
 * `::first-letter` styles into the 300 dpi export.
 */
export function renderBlocks(blocks: Block[], { initial = false }: { initial?: boolean } = {}): ReactNode[] {
  const first = blocks[0];
  const withInitial = initial && first?.kind === 'p'
    && first.inlines.reduce((n, run) => n + run.text.length, 0) >= INITIAL_MIN_CHARS;
  return blocks.map((block, i) =>
    block.kind === 'p' ? (
      <p key={i}>{renderInlines(block.inlines, withInitial && i === 0)}</p>
    ) : (
      <ul key={i} className={block.continued ? 'otc-card__continued' : undefined}>
        {block.items.map((item, j) => (
          <li key={j}>{renderInlines(item)}</li>
        ))}
      </ul>
    ),
  );
}

/**
 * One physical card (63 × 88 mm, optionally with bleed). Pure presentation: the caller decides
 * which blocks go on this card and at which font size (see paginate.ts). Colour and picture
 * layout come from the display model (deck options); card.css draws the three layouts from
 * the same markup.
 */
export const CardFace = forwardRef<HTMLDivElement, CardFaceProps>(function CardFace(
  { display, blocks, fontSize, first = true, part = 1, total = 1, bleed = 0, className },
  ref,
) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const title = total > 1 ? `${display.title} (${part}/${total})` : display.title;

  // Long names: shrink the title until it fits on one line; wrap only below the minimum size.
  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.classList.remove('otc-card__title--wrap');
    let size = TITLE_MAX_PT;
    el.style.fontSize = `${size}pt`;
    while (el.scrollWidth > el.clientWidth + 0.5 && size > TITLE_MIN_PT) {
      size = Math.max(TITLE_MIN_PT, size - 0.4);
      el.style.fontSize = `${size}pt`;
    }
    if (el.scrollWidth > el.clientWidth + 0.5) el.classList.add('otc-card__title--wrap');
  }, [title]);

  const theme = CARD_COLOR_THEMES[display.color];
  const style = {
    '--frame': theme.frame,
    '--frame-deep': theme.frameDeep,
    '--accent': display.accent ?? theme.accent,
    '--bleed': `${bleed}mm`,
    '--body-size': `${fontSize}pt`,
    '--body-line': `${bodyLineHeightPx(fontSize)}px`,
  } as CSSProperties;
  const icon = ICONS[display.icon];
  const showProps = first && display.properties.length > 0;
  const showFootnotes = first && display.footnotes.length > 0;
  // The picture sits in the property block, so it only appears on the first card. In the window
  // layout it moves above the title and leaves no block of its own behind.
  const showSummaryBlock = showProps || showFootnotes || (first && display.layout !== 'window');
  const badgeClass = [
    'otc-card__badge-inner',
    (display.badge?.length ?? 0) > 1 ? 'otc-card__badge-inner--small' : '',
    /\D/.test(display.badge ?? '') ? 'otc-card__badge-inner--letters' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={['otc-card', bleed > 0 ? 'otc-card--bleed' : '', display.badge ? 'otc-card--badge' : '', className]
        .filter(Boolean).join(' ')}
      style={style}
      data-color={display.color}
      data-layout={display.layout}
      data-card-part={part}
    >
      <div className="otc-card__leather" />
      <div className="otc-card__trim">
        <div className="otc-card__parchment" />
        <div className="otc-card__content">
          <header className="otc-card__header">
            <h2 className="otc-card__title" ref={titleRef}>{title}</h2>
            {display.subtitle && <p className="otc-card__subtitle">{display.subtitle}</p>}
          </header>
          <div className="otc-card__divider"><span className="otc-card__diamond" /></div>
          {first && (
            <div className={`otc-card__summary${showProps ? '' : ' otc-card__summary--bare'}`}>
              <div className="otc-card__medallion">
                <div className="otc-card__medallion-inner">
                  <svg className="otc-card__icon" viewBox="0 0 512 512" aria-hidden="true">
                    <path d={icon.path} />
                  </svg>
                </div>
              </div>
              {showProps && (
                <div className="otc-card__props">
                  {display.properties.map((p, i) => (
                    <div className="otc-card__prop" key={i}>
                      <span className="otc-card__prop-label">{p.label}</span>
                      <span className="otc-card__prop-value">{p.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {showFootnotes && (
            <div className="otc-card__footnotes">
              {display.footnotes.map((f, i) => <p key={i}>{f}</p>)}
            </div>
          )}
          {showSummaryBlock && <div className="otc-card__divider"><span className="otc-card__diamond" /></div>}
          <div className="otc-card__body" data-card-body="">
            {renderBlocks(blocks, { initial: first })}
          </div>
          <footer className="otc-card__footer">
            <span>{display.footerLeft}</span>
            <span>{display.footerRight}</span>
          </footer>
        </div>
        <div className="otc-card__corners" />
        {display.badge && (
          <div className="otc-card__badge">
            <div className={badgeClass}>{display.badge}</div>
          </div>
        )}
      </div>
    </div>
  );
});
