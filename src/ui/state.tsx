/** Application state: decks with automatic persistence in IndexedDB (SPEC §7). */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Card, Deck, Lang } from '../model/schema';
import { createDeck, duplicateDeck, newId } from '../model/deck';
import { DeckStore } from '../storage/db';
import { readPreference, writePreference } from '../storage/preferences';
import { layoutCards, type LaidOutCard } from '../render/measure';
import type { DisplayOptions } from '../render/format';

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'error';
}

interface AppState {
  decks: Deck[];
  loading: boolean;
  currentId: string | null;
  current: Deck | null;
  select(id: string | null): void;
  create(name: string, lang: Lang): Promise<Deck>;
  update(deck: Deck): void;
  remove(id: string): Promise<void>;
  duplicate(id: string): Promise<Deck | undefined>;
  importDeck(deck: Deck): Promise<Deck>;
  toasts: Toast[];
  notify(text: string, kind?: Toast['kind']): void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children, store: injected }: { children: ReactNode; store?: DeckStore }) {
  const store = useMemo(() => injected ?? new DeckStore(), [injected]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const notify = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 9000 : 4000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await store.migrateLegacy();
      } catch (e) {
        // the old database stays where it is; the app starts with the new one
        console.warn('Could not migrate decks from the old database', e);
      }
      const list = await store.list();
      if (cancelled) return;
      setDecks(list);
      let stored: string | null = null;
      try {
        stored = readPreference(localStorage, 'currentDeck');
      } catch {
        /* ignore */
      }
      setCurrentId(list.find((d) => d.id === stored)?.id ?? list[0]?.id ?? null);
      setLoading(false);
      void DeckStore.requestPersistence();
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  const select = useCallback((id: string | null) => {
    setCurrentId(id);
    try {
      if (id) writePreference(localStorage, 'currentDeck', id);
    } catch {
      /* ignore */
    }
  }, []);

  const upsert = (deck: Deck) => setDecks((list) => [deck, ...list.filter((d) => d.id !== deck.id)]);

  const persist = useCallback(
    (deck: Deck) => {
      store.save(deck).catch((e: Error) => notify(e.message, 'error'));
    },
    [store, notify],
  );

  const value: AppState = {
    decks,
    loading,
    currentId,
    current: decks.find((d) => d.id === currentId) ?? null,
    select,
    async create(name, lang) {
      const deck = await store.save(createDeck(name, lang));
      upsert(deck);
      select(deck.id);
      return deck;
    },
    update(deck) {
      setDecks((list) => list.map((d) => (d.id === deck.id ? deck : d)));
      persist(deck);
    },
    async remove(id) {
      await store.delete(id);
      setDecks((list) => {
        const rest = list.filter((d) => d.id !== id);
        if (currentId === id) select(rest[0]?.id ?? null);
        return rest;
      });
    },
    async duplicate(id) {
      const source = decks.find((d) => d.id === id);
      if (!source) return undefined;
      const copy = await store.save(duplicateDeck(source));
      upsert(copy);
      select(copy.id);
      return copy;
    },
    async importDeck(deck) {
      const saved = await store.import(deck, newId);
      upsert(saved);
      select(saved.id);
      return saved;
    },
    toasts,
    notify,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState outside AppStateProvider');
  return ctx;
}

/** Lay out cards asynchronously (font fitting and continuation cards). */
export function useLaidOutCards(cards: Card[], lang: Lang, options: DisplayOptions, delay = 0): LaidOutCard[] | null {
  const [result, setResult] = useState<LaidOutCard[] | null>(null);
  const key = JSON.stringify([cards, lang, options]);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      layoutCards(cards, lang, options)
        .then((r) => {
          if (!cancelled) setResult(r);
        })
        .catch((e) => console.error(e));
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, delay]);
  return result;
}
