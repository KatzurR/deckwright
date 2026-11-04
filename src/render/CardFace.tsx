import { forwardRef, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { Block, Inline } from '../model/markdown';
import type { CardDisplay } from './format';
import { ICONS } from './icons';
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

function renderInlines(inlines: Inline[]): ReactNode[] {
  return inlines.map((run, i) => {
    let node: ReactNode = run.text;
    if (run.italic) node = <em>{node}</em>;
    if (run.bold) node = <strong>{node}</strong>;
    return <span key={i}>{node}</span>;
  });
}

export function renderBlocks(blocks: Block[]): ReactNode[] {
  return blocks.map((block, i) =>
    block.kind === 'p' ? (
      <p key={i}>{renderInlines(block.inlines)}</p>
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
 * which blocks go on this card and at which font size (see paginate.ts).
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

  const style = {
    '--accent': display.accent,
    '--bleed': `${bleed}mm`,
    '--body-size': `${fontSize}pt`,
    '--body-line': `${bodyLineHeightPx(fontSize)}px`,
  } as CSSProperties;
  const icon = ICONS[display.icon];
  const showProps = first && display.properties.length > 0;
  const showFootnotes = first && display.footnotes.length > 0;
  const badgeSmall = (display.badge?.length ?? 0) > 1;

  return (
    <div
      ref={ref}
      className={['otc-card', bleed > 0 ? 'otc-card--bleed' : '', className].filter(Boolean).join(' ')}
      style={style}
      data-card-part={part}
    >
      <div className="otc-card__leather" />
      <div className="otc-card__trim">
        <div className="otc-card__parchment" />
        <div className="otc-card__medallion">
          <div className="otc-card__medallion-inner">
            <svg className="otc-card__icon" viewBox="0 0 512 512" aria-hidden="true">
              <path d={icon.path} />
            </svg>
          </div>
        </div>
        <div className="otc-card__content">
          <header className="otc-card__header">
            <h2 className="otc-card__title" ref={titleRef}>{title}</h2>
            {display.subtitle && <p className="otc-card__subtitle">{display.subtitle}</p>}
          </header>
          <div className="otc-card__divider"><span className="otc-card__diamond" /></div>
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
          {showFootnotes && (
            <div className="otc-card__footnotes">
              {display.footnotes.map((f, i) => <p key={i}>{f}</p>)}
            </div>
          )}
          {(showProps || showFootnotes) && <div className="otc-card__divider"><span className="otc-card__diamond" /></div>}
          <div className="otc-card__body" data-card-body="">
            {renderBlocks(blocks)}
          </div>
          <footer className="otc-card__footer">
            <span>{display.footerLeft}</span>
            <span>{display.footerRight}</span>
          </footer>
        </div>
        {display.badge && (
          <div className="otc-card__badge">
            <div className={`otc-card__badge-inner${badgeSmall ? ' otc-card__badge-inner--small' : ''}`}>{display.badge}</div>
          </div>
        )}
      </div>
    </div>
  );
});
