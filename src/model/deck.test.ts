import { describe, expect, it } from 'vitest';
import {
  adoptCatalogCards, addCard, cardsMissingLanguage, cloneCard, copyCardsToDeck, createDeck, duplicateCards,
  duplicateDeck, localized, moveCard, newId, removeCards, renameDeck, setDeckLanguage, sortCards, updateCard,
} from './deck';
import { actionSurge, blinded, fireball, longsword, bagOfHolding } from '../test/fixtures';
import type { Card } from './schema';

const names = (cards: Card[]) => cards.map((c) => c.name.en);

describe('deck operations', () => {
  it('creates decks with ids and timestamps', () => {
    const deck = createDeck('  Magierzauber Grad 1–3 ', 'de');
    expect(deck.name).toBe('Magierzauber Grad 1–3');
    expect(deck.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(deck.cards).toEqual([]);
    expect(newId()).not.toBe(newId());
  });

  it('adopts catalog cards with new ids but keeps the srdKey', () => {
    const deck = adoptCatalogCards(createDeck('d', 'de'), [fireball]);
    expect(deck.cards).toHaveLength(1);
    expect(deck.cards[0].id).not.toBe(fireball.id);
    expect(deck.cards[0].srdKey).toBe('srd-2024_fireball');
    expect(deck.cards[0].name).toEqual(fireball.name);
  });

  it('clones deeply', () => {
    const copy = cloneCard(fireball);
    expect(copy).not.toBe(fireball);
    if (copy.type !== 'spell') throw new Error();
    copy.spell.classes.push('bard');
    expect(fireball.type === 'spell' && fireball.spell.classes).toEqual(['sorcerer', 'wizard']);
  });

  it('adds, updates and removes cards', () => {
    let deck = createDeck('d', 'en');
    deck = addCard(deck, fireball);
    deck = addCard(deck, blinded, 0);
    expect(names(deck.cards)).toEqual(['Blinded', 'Fireball']);
    deck = updateCard(deck, { ...blinded, name: { en: 'Blind!' } });
    expect(names(deck.cards)).toEqual(['Blind!', 'Fireball']);
    expect(() => updateCard(deck, longsword)).toThrow();
    deck = removeCards(deck, [fireball.id]);
    expect(names(deck.cards)).toEqual(['Blind!']);
  });

  it('duplicates cards right after the original', () => {
    let deck = createDeck('d', 'en');
    deck = { ...deck, cards: [fireball, blinded] };
    deck = duplicateCards(deck, [fireball.id]);
    expect(names(deck.cards)).toEqual(['Fireball', 'Fireball', 'Blinded']);
    expect(deck.cards[1].id).not.toBe(fireball.id);
  });

  it('moves cards', () => {
    const deck = { ...createDeck('d', 'en'), cards: [fireball, blinded, longsword] };
    expect(names(moveCard(deck, 0, 2).cards)).toEqual(['Blinded', 'Longsword', 'Fireball']);
    expect(names(moveCard(deck, 2, 0).cards)).toEqual(['Longsword', 'Fireball', 'Blinded']);
    expect(moveCard(deck, 1, 1)).toBe(deck);
    expect(moveCard(deck, 9, 0)).toBe(deck);
  });

  it('sorts by name in the deck language, by type and by level', () => {
    const deck = { ...createDeck('d', 'de'), cards: [longsword, fireball, blinded, bagOfHolding, actionSurge] };
    expect(sortCards(deck, 'name').cards.map((c) => c.name.de)).toEqual(['Blind', 'Feuerball', 'Langschwert', 'Nimmervoller Beutel', 'Tatendrang']);
    expect(sortCards(deck, 'type').cards.map((c) => c.type)).toEqual(['spell', 'action', 'feature', 'item', 'condition']);
    const cantrip = { ...fireball, id: 'c', name: { de: 'Zaubertrick', en: 'Cantrip' }, spell: { ...(fireball.type === 'spell' ? fireball.spell : ({} as never)), level: 0 } } as Card;
    expect(sortCards({ ...deck, cards: [fireball, cantrip] }, 'level').cards.map((c) => c.id)).toEqual(['c', fireball.id]);
  });

  it('copies cards between decks with new ids', () => {
    const a = { ...createDeck('a', 'de'), cards: [fireball, blinded] };
    const b = copyCardsToDeck(a, createDeck('b', 'de'), [blinded.id]);
    expect(names(b.cards)).toEqual(['Blinded']);
    expect(b.cards[0].id).not.toBe(blinded.id);
  });

  it('duplicates, renames and switches the language of decks', () => {
    const deck = { ...createDeck('Zauber', 'de'), options: { colorBySchool: true }, cards: [fireball] };
    const copy = duplicateDeck(deck);
    expect(copy.id).not.toBe(deck.id);
    expect(copy.name).toBe('Zauber (Kopie)');
    expect(copy.options).toEqual({ colorBySchool: true });
    expect(copy.cards[0].id).not.toBe(fireball.id);
    expect(renameDeck(deck, '  ').name).toBe('Zauber');
    expect(renameDeck(deck, 'Neu').name).toBe('Neu');
    expect(setDeckLanguage(deck, 'en').lang).toBe('en');
  });

  it('finds cards without text in the deck language', () => {
    const deck = { ...createDeck('d', 'de'), cards: [fireball, actionSurge] };
    expect(cardsMissingLanguage(deck).map((c) => c.id)).toEqual([actionSurge.id]);
  });

  it('falls back to the other language', () => {
    expect(localized({ en: 'x' }, 'de')).toBe('x');
    expect(localized({ de: ' ', en: 'y' }, 'de')).toBe('y');
    expect(localized(undefined, 'de')).toBe('');
  });
});
