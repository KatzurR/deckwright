import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Deck } from '../model/schema';
import { deckFileName } from '../model/deckFile';
import { NOTICE_FILE_NAME, noticeText } from '../model/legal';
import type { LaidOutCard } from '../render/measure';
import { BLEED_MM, toSheets, type Paper } from '../export/layout';
import { buildPdf } from '../export/pdf';
import { renderCardImages, type Progress } from '../export/render';
import { downloadBlob, zipFiles } from '../export/files';
import { printSheets } from '../export/PrintSheets';
import { readPreference, writePreference } from '../storage/preferences';
import { Check, Field, Modal } from './widgets';

type Format = 'pdf' | 'png' | 'print';

function defaultPaper(): Paper {
  try {
    const stored = readPreference(localStorage, 'paper');
    if (stored === 'a4' || stored === 'letter') return stored;
  } catch {
    /* ignore */
  }
  return typeof navigator !== 'undefined' && /^en-(US|CA)/.test(navigator.language) ? 'letter' : 'a4';
}

export function ExportDialog({ deck, laid, selectedIds, onClose }: {
  deck: Deck; laid: LaidOutCard[]; selectedIds: Set<string>; onClose(): void;
}) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<Format>('pdf');
  const [paper, setPaper] = useState<Paper>(defaultPaper);
  const [bleed, setBleed] = useState(false);
  const [onlySelection, setOnlySelection] = useState(selectedIds.size > 0);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const cards = onlySelection ? laid.filter((l) => selectedIds.has(l.card.id)) : laid;
  const pageCount = cards.reduce((n, c) => n + c.pagination.pages.length, 0);
  const bleedMm = bleed && format !== 'png' ? BLEED_MM : 0;

  const choosePaper = (p: Paper) => {
    setPaper(p);
    try {
      writePreference(localStorage, 'paper', p);
    } catch {
      /* ignore */
    }
  };

  const run = async () => {
    setBusy(true);
    setStatus('');
    try {
      if (format === 'print') {
        printSheets({ cards, paper, bleed: bleedMm, lang: deck.lang });
        onClose();
        return;
      }
      const images = await renderCardImages(cards, { bleed: bleedMm, onProgress: setProgress });
      if (format === 'png') {
        const zip = zipFiles([
          ...images.map((i) => ({ name: `${i.name}.png`, bytes: i.bytes })),
          { name: NOTICE_FILE_NAME[deck.lang], bytes: new TextEncoder().encode(noticeText(deck.lang)) },
        ]);
        downloadBlob(zip, deckFileName(deck, 'png.zip'), 'application/zip');
      } else {
        const pdf = await buildPdf(images.map((i) => i.bytes), { paper, bleed: bleedMm, lang: deck.lang, title: deck.name });
        downloadBlob(pdf, deckFileName(deck, 'pdf'), 'application/pdf');
      }
      setStatus(t('export.done'));
    } catch (e) {
      console.error(e);
      setStatus(t('export.failed', { message: (e as Error).message }));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <Modal
      title={t('export.title')}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose}>{t('common.close')}</button>
          <button type="button" className="primary" disabled={busy || cards.length === 0} onClick={() => void run()} data-testid="export-start">
            {format === 'print' ? t('export.printStart') : t('export.start')}
          </button>
        </>
      }
    >
      <fieldset className="radio-group">
        <legend>{t('export.format')}</legend>
        {(['pdf', 'png', 'print'] as Format[]).map((f) => (
          <label key={f}>
            <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} /> {t(`export.${f}`)}
          </label>
        ))}
      </fieldset>
      {format !== 'png' ? (
        <>
          <Field label={t('export.paper')}>
            <select value={paper} onChange={(e) => choosePaper(e.target.value as Paper)}>
              <option value="a4">{t('export.a4')}</option>
              <option value="letter">{t('export.letter')}</option>
            </select>
          </Field>
          <Check label={t('export.bleed')} checked={bleed} onChange={setBleed} />
          <p className="hint">{t('export.bleedHint')}</p>
          <p className="hint">
            {t('common.cards', { count: pageCount })} · {t('export.sheets', { count: Math.max(1, toSheets(Array(pageCount)).length) })}
          </p>
          <p className="hint hint--strong">{t('export.hint100')}</p>
        </>
      ) : (
        <p className="hint">{t('export.pngInfo')}</p>
      )}
      {selectedIds.size > 0 && (
        <fieldset className="radio-group">
          <legend>{t('export.scope')}</legend>
          <label><input type="radio" name="scope" checked={!onlySelection} onChange={() => setOnlySelection(false)} /> {t('export.wholeDeck', { count: laid.length })}</label>
          <label><input type="radio" name="scope" checked={onlySelection} onChange={() => setOnlySelection(true)} /> {t('export.selection', { count: selectedIds.size })}</label>
        </fieldset>
      )}
      {progress && (
        <div className="progress">
          <progress value={progress.done} max={progress.total} />
          <span>{t('export.progress', { done: progress.done, total: progress.total })}</span>
        </div>
      )}
      {status && <p className="hint" role="status">{status}</p>}
    </Modal>
  );
}
