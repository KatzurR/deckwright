import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cardsMissingLanguage, copyCardsToDeck, duplicateCards, moveCard, removeCards, renameDeck, setDeckLanguage, sortCards,
  type SortKey,
} from '../model/deck';
import { CARD_TYPES, type Card, type CardType, type Deck } from '../model/schema';
import { deckFileName, serializeDeck } from '../model/deckFile';
import { downloadBlob } from '../export/files';
import { useAppState, useLaidOutCards } from './state';
import { CardPlaceholder, CardPreview, Check, Modal, Field } from './widgets';
import { ExportDialog } from './ExportDialog';

export interface DeckViewProps {
  deck: Deck;
  onEdit(card: Card): void;
  onNew(type: CardType): void;
  onOpenCatalog(): void;
}

const THUMB_SCALE = 0.72;

export function DeckView({ deck, onEdit, onNew, onOpenCatalog }: DeckViewProps) {
  const { t } = useTranslation();
  const app = useAppState();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const options = useMemo(() => ({ colorBySchool: deck.options?.colorBySchool ?? false }), [deck.options?.colorBySchool]);
  const laid = useLaidOutCards(deck.cards, deck.lang, options);
  const laidById = useMemo(() => new Map((laid ?? []).map((l) => [l.card.id, l])), [laid]);
  const missing = cardsMissingLanguage(deck).length;
  const selectedCards = deck.cards.filter((c) => selected.has(c.id));
  const update = (next: Deck) => app.update(next);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const deleteSelected = () => {
    if (!window.confirm(t('decks.confirmDeleteCards', { count: selected.size }))) return;
    update(removeCards(deck, selected));
    setSelected(new Set());
  };

  const deleteDeck = async () => {
    if (!window.confirm(t('decks.confirmDelete', { name: deck.name, count: deck.cards.length }))) return;
    await app.remove(deck.id);
  };

  const exportJson = () => downloadBlob(serializeDeck(deck), deckFileName(deck), 'application/json');

  return (
    <section className="deck-view" aria-label={deck.name}>
      <div className="deck-head">
        <input
          className="deck-head__name"
          aria-label={t('decks.namePlaceholder')}
          placeholder={t('decks.namePlaceholder')}
          defaultValue={deck.name}
          key={deck.id}
          onBlur={(e) => e.target.value.trim() !== deck.name && update(renameDeck(deck, e.target.value))}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        <span className="muted">{t('decks.cardCount', { count: deck.cards.length })}</span>
        <div className="deck-head__options">
          <label className="inline-field">
            {t('decks.cardLanguage')}
            <select value={deck.lang} onChange={(e) => update(setDeckLanguage(deck, e.target.value as Deck['lang']))}>
              <option value="de">{t('common.german')}</option>
              <option value="en">{t('common.english')}</option>
            </select>
          </label>
          <Check
            label={t('decks.colorBySchool')}
            checked={options.colorBySchool}
            onChange={(v) => update({ ...deck, options: { ...deck.options, colorBySchool: v }, updatedAt: new Date().toISOString() })}
          />
          <label className="inline-field">
            {t('decks.sort')}
            <select value="" onChange={(e) => e.target.value && update(sortCards(deck, e.target.value as SortKey))}>
              <option value="">…</option>
              <option value="name">{t('decks.sortName')}</option>
              <option value="type">{t('decks.sortType')}</option>
              <option value="level">{t('decks.sortLevel')}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="toolbar">
        <button type="button" className="primary" onClick={onOpenCatalog}>{t('decks.fromCatalog')}</button>
        <label className="inline-field">
          <select aria-label={t('decks.addCard')} value="" onChange={(e) => e.target.value && onNew(e.target.value as CardType)}>
            <option value="">{t('decks.addCard')} …</option>
            {CARD_TYPES.map((type) => <option key={type} value={type}>{t(`types.${type}`)}</option>)}
          </select>
        </label>
        <span className="toolbar__spacer" />
        <button type="button" onClick={() => setExporting(true)} disabled={!deck.cards.length}>{t('decks.export')}</button>
        <button type="button" onClick={exportJson}>{t('decks.exportJson')}</button>
        <button type="button" onClick={() => void app.duplicate(deck.id)}>{t('decks.duplicate')}</button>
        <button type="button" className="danger" onClick={() => void deleteDeck()}>{t('decks.deleteDeck')}</button>
      </div>

      {missing > 0 && <p className="hint">{t('decks.missingLanguage', { count: missing })}</p>}

      {deck.cards.length > 0 && (
        <div className="toolbar toolbar--selection">
          <button type="button" onClick={() => setSelected(new Set(selected.size === deck.cards.length ? [] : deck.cards.map((c) => c.id)))}>
            {selected.size === deck.cards.length ? t('decks.selectNone') : t('decks.selectAll')}
          </button>
          {selected.size > 0 && (
            <>
              <span className="muted">{t('common.selected', { count: selected.size })}</span>
              <button type="button" onClick={() => setCopying(true)}>{t('decks.copyTo')}</button>
              <button type="button" onClick={() => update(duplicateCards(deck, selected))}>{t('decks.duplicateCards')}</button>
              <button type="button" className="danger" onClick={deleteSelected}>{t('decks.deleteCards')}</button>
            </>
          )}
        </div>
      )}

      {deck.cards.length === 0 ? (
        <p className="empty">{t('decks.emptyDeck')}</p>
      ) : (
        <ol className="card-grid">
          {deck.cards.map((card, index) => {
            const laidCard = laidById.get(card.id);
            const extra = laidCard ? laidCard.pagination.pages.length - 1 : 0;
            return (
              <li
                key={card.id}
                className={`card-tile${selected.has(card.id) ? ' card-tile--selected' : ''}${dragIndex === index ? ' card-tile--dragging' : ''}`}
                draggable
                onDragStart={(e) => {
                  setDragIndex(index);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) update(moveCard(deck, dragIndex, index));
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
              >
                <button type="button" className="card-tile__face" onClick={() => onEdit(card)} title={t('common.edit')}>
                  {laidCard ? <CardPreview laid={laidCard} scale={THUMB_SCALE} /> : <CardPlaceholder scale={THUMB_SCALE} />}
                </button>
                <div className="card-tile__bar">
                  <input type="checkbox" aria-label={card.name[deck.lang] ?? card.name.en ?? ''} checked={selected.has(card.id)} onChange={() => toggle(card.id)} />
                  <span className="card-tile__type">{t(`types.${card.type}`)}</span>
                  {extra > 0 && <span className="badge" title={t('decks.continuation', { count: extra })}>+{extra}</span>}
                  <span className="toolbar__spacer" />
                  <button type="button" className="icon-button" disabled={index === 0} onClick={() => update(moveCard(deck, index, index - 1))} aria-label={t('decks.moveLeft')}>‹</button>
                  <button type="button" className="icon-button" disabled={index === deck.cards.length - 1} onClick={() => update(moveCard(deck, index, index + 1))} aria-label={t('decks.moveRight')}>›</button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {exporting && laid && (
        <ExportDialog deck={deck} laid={laid} selectedIds={selected} onClose={() => setExporting(false)} />
      )}
      {copying && (
        <CopyDialog
          deck={deck}
          onClose={() => setCopying(false)}
          onCopy={(target) => {
            app.update(copyCardsToDeck(deck, target, selected));
            app.notify(t('decks.copied', { count: selectedCards.length, deck: target.name }));
            setCopying(false);
          }}
        />
      )}
    </section>
  );
}

function CopyDialog({ deck, onClose, onCopy }: { deck: Deck; onClose(): void; onCopy(target: Deck): void }) {
  const { t } = useTranslation();
  const { decks } = useAppState();
  const others = decks.filter((d) => d.id !== deck.id);
  const [targetId, setTargetId] = useState(others[0]?.id ?? '');
  const target = others.find((d) => d.id === targetId);
  return (
    <Modal
      title={t('decks.copyTo')}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="primary" disabled={!target} onClick={() => target && onCopy(target)}>{t('common.apply')}</button>
        </>
      }
    >
      <Field label={t('decks.copyTarget')}>
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          {others.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Field>
      {!others.length && <p className="hint">{t('decks.empty')}</p>}
    </Modal>
  );
}
