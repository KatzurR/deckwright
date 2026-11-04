import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CARD_TYPES, CLASSES, SCHOOLS, type Card, type CardType, type ClassKey, type Lang, type School } from '../model/schema';
import { adoptCatalogCards, cardName } from '../model/deck';
import { terms } from '../i18n/terms';
import { loadCatalog, type Catalog } from '../catalog/catalog';
import { EMPTY_FILTER, searchCatalog, type CatalogFilter } from '../catalog/search';
import { useAppState, useLaidOutCards } from './state';
import { CardPlaceholder, CardPreview } from './widgets';

const PAGE = 200;

export function CatalogView({ uiLang, onDone }: { uiLang: Lang; onDone(): void }) {
  const { t } = useTranslation();
  const app = useAppState();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CatalogFilter>(EMPTY_FILTER);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<Card | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [targetId, setTargetId] = useState<string>(app.currentId ?? '');

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((e: Error) => setError(e.message));
  }, []);

  const target = app.decks.find((d) => d.id === targetId) ?? null;
  const cardLang: Lang = target?.lang ?? uiLang;
  const results = useMemo(() => (catalog ? searchCatalog(catalog.entries, filter, uiLang) : []), [catalog, filter, uiLang]);
  const visible = results.slice(0, limit);
  const term = terms(uiLang);

  const set = <K extends keyof CatalogFilter>(key: K, value: CatalogFilter[K]) => {
    setFilter((f) => ({ ...f, [key]: value }));
    setLimit(PAGE);
  };
  const single = <T extends string | number>(value: string, parse: (v: string) => T): T[] => (value === '' ? [] : [parse(value)]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const adopt = async () => {
    if (!catalog) return;
    const entries = catalog.entries.filter((c) => selected.has(c.id));
    let deck = target;
    if (!deck) deck = await app.create(t('decks.newName'), uiLang);
    app.update(adoptCatalogCards(deck, entries));
    app.select(deck.id);
    app.notify(t('catalog.added', { count: entries.length, deck: deck.name }));
    setSelected(new Set());
    onDone();
  };

  if (error) return <p className="empty">{error}</p>;
  if (!catalog) return <p className="empty">{t('common.loading')}</p>;
  if (catalog.entries.length === 0) return <p className="empty">{t('catalog.unavailable')}</p>;

  return (
    <section className="catalog">
      <div className="catalog__filters">
        <input
          type="search"
          className="catalog__search"
          placeholder={t('catalog.search')}
          aria-label={t('catalog.search')}
          value={filter.query}
          onChange={(e) => set('query', e.target.value)}
          autoFocus
        />
        <label className="inline-field">
          {t('catalog.type')}
          <select value={filter.types[0] ?? ''} onChange={(e) => set('types', single(e.target.value, (v) => v as CardType))}>
            <option value="">{t('catalog.all')}</option>
            {CARD_TYPES.map((type) => <option key={type} value={type}>{t(`types.${type}`)} ({catalog.byType[type].length})</option>)}
          </select>
        </label>
        <label className="inline-field">
          {t('catalog.level')}
          <select value={filter.levels[0] ?? ''} onChange={(e) => set('levels', single(e.target.value, Number))}>
            <option value="">{t('catalog.all')}</option>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => <option key={l} value={l}>{l === 0 ? t('catalog.cantrip') : l}</option>)}
          </select>
        </label>
        <label className="inline-field">
          {t('catalog.school')}
          <select value={filter.schools[0] ?? ''} onChange={(e) => set('schools', single(e.target.value, (v) => v as School))}>
            <option value="">{t('catalog.all')}</option>
            {SCHOOLS.map((s) => <option key={s} value={s}>{term.schools[s]}</option>)}
          </select>
        </label>
        <label className="inline-field">
          {t('catalog.class')}
          <select value={filter.classes[0] ?? ''} onChange={(e) => set('classes', single(e.target.value, (v) => v as ClassKey))}>
            <option value="">{t('catalog.all')}</option>
            {CLASSES.map((c) => <option key={c} value={c}>{term.classes[c]}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => setFilter(EMPTY_FILTER)}>{t('catalog.reset')}</button>
      </div>

      <div className="catalog__actions">
        <span className="muted">{t('catalog.results', { count: results.length })}</span>
        <button type="button" onClick={() => setSelected(new Set([...selected, ...results.map((c) => c.id)]))}>{t('catalog.selectVisible')}</button>
        {selected.size > 0 && <button type="button" onClick={() => setSelected(new Set())}>{t('catalog.clearSelection')}</button>}
        <span className="toolbar__spacer" />
        <label className="inline-field">
          {t('catalog.target')}
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)} data-testid="catalog-target">
            {app.decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            <option value="">{t('catalog.newDeck')}</option>
          </select>
        </label>
        <button type="button" className="primary" disabled={!selected.size} onClick={() => void adopt()} data-testid="catalog-add">
          {t('catalog.addSelected', { count: selected.size })}
        </button>
      </div>

      <div className="catalog__body">
        <ul className="catalog__list" role="listbox" aria-multiselectable="true">
          {visible.map((card) => (
            <li
              key={card.id}
              role="option"
              aria-selected={selected.has(card.id)}
              className={`catalog__row${focus?.id === card.id ? ' catalog__row--focus' : ''}`}
              onMouseEnter={() => setFocus(card)}
              onClick={() => {
                setFocus(card);
                toggle(card.id);
              }}
            >
              <input type="checkbox" tabIndex={-1} readOnly checked={selected.has(card.id)} aria-hidden="true" />
              <span className="catalog__name">
                {cardName(card, uiLang)}
                <small>{cardName(card, uiLang === 'de' ? 'en' : 'de')}</small>
              </span>
              <span className="catalog__meta">{describe(card, uiLang, t)}</span>
            </li>
          ))}
          {results.length > limit && (
            <li className="catalog__more">
              <button type="button" onClick={() => setLimit(limit + PAGE)}>{t('catalog.more', { count: Math.min(PAGE, results.length - limit) })}</button>
            </li>
          )}
          {results.length === 0 && <li className="empty">{t('catalog.empty')}</li>}
        </ul>
        <aside className="catalog__preview" aria-label={t('catalog.preview')}>
          {focus ? <FocusPreview card={focus} lang={cardLang} colorBySchool={target?.options?.colorBySchool ?? false} /> : <CardPlaceholder />}
        </aside>
      </div>
    </section>
  );
}

function FocusPreview({ card, lang, colorBySchool }: { card: Card; lang: Lang; colorBySchool: boolean }) {
  const cards = useMemo(() => [card], [card]);
  const options = useMemo(() => ({ colorBySchool }), [colorBySchool]);
  const laid = useLaidOutCards(cards, lang, options, 60);
  return laid?.[0]?.card.id === card.id ? <CardPreview laid={laid[0]} /> : <CardPlaceholder />;
}

function describe(card: Card, lang: Lang, t: (k: string) => string): string {
  const term = terms(lang);
  switch (card.type) {
    case 'spell': return `${term.spellSubtitle(card.spell.school, card.spell.level)}`;
    case 'item': return `${t('types.item')} · ${term.rarities[card.item.rarity]}`;
    case 'feature': {
      const o = card.feature.origin;
      const who = o.classKey ? term.classes[o.classKey] : (o.name?.[lang] ?? o.name?.en ?? '');
      return [t('types.feature'), who, o.level ? term.levelFrom(o.level) : ''].filter(Boolean).join(' · ');
    }
    case 'action': return card.action.weapon ? term.weaponCategory(card.action.weapon.category, card.action.weapon.kind) : t('types.action');
    default: return t(`types.${card.type}`);
  }
}
