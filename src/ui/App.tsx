import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Card, CardType, Lang } from '../model/schema';
import { addCard, updateCard } from '../model/deck';
import { blankCard } from '../model/templates';
import { parseDeckFile, DeckFileError } from '../model/deckFile';
import { readFileAsText } from '../export/files';
import { setUiLanguage } from '../i18n/ui';
import { useAppState } from './state';
import { DeckView } from './DeckView';
import { CatalogView } from './CatalogView';
import { AboutView } from './AboutView';
import { Editor } from './editor/Editor';

type View = 'decks' | 'catalog' | 'about';

function viewFromHash(): View {
  const h = typeof location !== 'undefined' ? location.hash.replace('#/', '') : '';
  return h === 'catalog' || h === 'about' ? h : 'decks';
}

const NOTICE_KEY = 'otc.noticeDismissed';

export function App() {
  const { t, i18n } = useTranslation();
  const app = useAppState();
  const uiLang = (i18n.language?.startsWith('de') ? 'de' : 'en') as Lang;
  const [view, setView] = useState<View>(viewFromHash);
  const [editing, setEditing] = useState<{ card: Card; isNew: boolean } | null>(null);
  const [noticeHidden, setNoticeHidden] = useState(() => {
    try {
      return sessionStorage.getItem(NOTICE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (v: View) => {
    location.hash = `#/${v}`;
    setView(v);
  };

  const deck = app.current;

  const importFile = async (file: File) => {
    try {
      const imported = await app.importDeck(parseDeckFile(await readFileAsText(file)));
      app.notify(t('decks.imported', { name: imported.name }));
      go('decks');
    } catch (e) {
      const details = e instanceof DeckFileError && e.issues.length ? ` (${e.issues.slice(0, 3).join('; ')})` : '';
      app.notify(t('decks.importFailed', { message: (e as Error).message + details }), 'error');
    }
  };

  const saveCard = (card: Card) => {
    if (!deck || !editing) return;
    app.update(editing.isNew ? addCard(deck, card) : updateCard(deck, card));
    setEditing(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <img src="./favicon.svg" alt="" width="22" height="30" />
          <div>
            <strong>{t('app.title')}</strong>
            <span className="muted">{t('app.tagline')}</span>
          </div>
        </div>
        <nav className="app-nav" aria-label="main">
          {(['decks', 'catalog', 'about'] as View[]).map((v) => (
            <button type="button" key={v} className={view === v ? 'tab tab--active' : 'tab'} aria-current={view === v ? 'page' : undefined} onClick={() => go(v)}>
              {t(`nav.${v}`)}
            </button>
          ))}
        </nav>
        <label className="inline-field">
          <span className="sr-only">{t('nav.uiLanguage')}</span>
          <select value={uiLang} onChange={(e) => setUiLanguage(e.target.value as Lang)} aria-label={t('nav.uiLanguage')}>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </label>
      </header>

      {!noticeHidden && (
        <div className="notice" role="note">
          <span>{t('notice.storage')}</span>
          <button
            type="button"
            onClick={() => {
              setNoticeHidden(true);
              try {
                sessionStorage.setItem(NOTICE_KEY, '1');
              } catch {
                /* ignore */
              }
            }}
          >
            {t('notice.dismiss')}
          </button>
        </div>
      )}

      <main className={`app-main app-main--${view}`}>
        {view === 'decks' && (
          <>
            <aside className="sidebar">
              <h2>{t('decks.title')}</h2>
              <ul className="deck-list">
                {app.decks.map((d) => (
                  <li key={d.id}>
                    <button type="button" className={d.id === app.currentId ? 'deck-link deck-link--active' : 'deck-link'} onClick={() => app.select(d.id)}>
                      <span>{d.name}</span>
                      <small>{d.lang.toUpperCase()} · {t('common.cards', { count: d.cards.length })}</small>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="primary" onClick={() => void app.create(t('decks.newName'), uiLang)}>{t('decks.new')}</button>
              <button type="button" onClick={() => fileInput.current?.click()}>{t('decks.import')}</button>
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                hidden
                data-testid="import-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void importFile(file);
                }}
              />
            </aside>
            <div className="content">
              {app.loading ? (
                <p className="empty">{t('common.loading')}</p>
              ) : deck ? (
                <DeckView
                  deck={deck}
                  onEdit={(card) => setEditing({ card, isNew: false })}
                  onNew={(type: CardType) => setEditing({ card: blankCard(type), isNew: true })}
                  onOpenCatalog={() => go('catalog')}
                />
              ) : (
                <p className="empty">{t('decks.empty')}</p>
              )}
            </div>
          </>
        )}
        {view === 'catalog' && <CatalogView uiLang={uiLang} onDone={() => go('decks')} />}
        {view === 'about' && <AboutView uiLang={uiLang} />}
      </main>

      {editing && deck && (
        <Editor deck={deck} card={editing.card} isNew={editing.isNew} uiLang={uiLang} onSave={saveCard} onClose={() => setEditing(null)} />
      )}

      <div className="toasts" aria-live="polite">
        {app.toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>{toast.text}</div>
        ))}
      </div>
    </div>
  );
}
