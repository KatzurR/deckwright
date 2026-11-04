import { useEffect, useId, useRef, type ReactNode } from 'react';
import { CardFace } from '../render/CardFace';
import type { LaidOutCard } from '../render/measure';

export function Modal({ title, onClose, children, footer, wide }: {
  title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const titleId = useId();
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' modal--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={ref}>
        <header className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="×">×</button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint, error, wide }: {
  label: string; children: ReactNode; hint?: string; error?: string; wide?: boolean;
}) {
  return (
    <label className={`field${wide ? ' field--wide' : ''}${error ? ' field--error' : ''}`}>
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error" role="alert">{error}</span>}
    </label>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/** Card face scaled for lists and previews. */
export function CardPreview({ laid, page = 0, scale = 1 }: { laid: LaidOutCard; page?: number; scale?: number }) {
  const p = laid.pagination.pages[page] ?? laid.pagination.pages[0];
  return (
    <div className="card-preview" style={{ width: `calc(63mm * ${scale})`, height: `calc(88mm * ${scale})` }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        <CardFace display={laid.display} blocks={p.blocks} fontSize={p.fontSize} first={p.first} part={p.part} total={p.total} />
      </div>
    </div>
  );
}

export function CardPlaceholder({ scale = 1 }: { scale?: number }) {
  return <div className="card-preview card-preview--placeholder" style={{ width: `calc(63mm * ${scale})`, height: `calc(88mm * ${scale})` }} />;
}
