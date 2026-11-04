/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DeckFileError, deckFileJsonSchema, deckFileName, parseDeckFile, serializeDeck } from './deckFile';
import { createDeck } from './deck';
import { ALL_FIXTURES } from '../test/fixtures';
import { cardSchema } from './schema';

describe('deck file format', () => {
  const deck = { ...createDeck('Magierzauber Grad 1–3', 'de'), options: { colorBySchool: true }, cards: ALL_FIXTURES.map((c) => cardSchema.parse(c)) };

  it('round-trips a deck completely', () => {
    const text = serializeDeck(deck, new Date('2026-11-03T12:00:00Z'));
    const json = JSON.parse(text);
    expect(json.formatVersion).toBe(1);
    expect(json.generator).toBe('deckwright');
    expect(json.exportedAt).toBe('2026-11-03T12:00:00.000Z');
    expect(parseDeckFile(text)).toEqual(deck);
  });

  it('rejects invalid JSON, missing and future versions', () => {
    expect(() => parseDeckFile('{oops')).toThrow(DeckFileError);
    expect(() => parseDeckFile('{}')).toThrowError(/formatVersion/);
    try {
      parseDeckFile(JSON.stringify({ formatVersion: 99, deck }));
    } catch (e) {
      expect((e as DeckFileError).code).toBe('version');
    }
  });

  it('reports validation problems with paths', () => {
    const bad = JSON.parse(serializeDeck(deck));
    bad.deck.cards[0].spell.level = 12;
    bad.deck.cards[1].type = 'monster';
    try {
      parseDeckFile(JSON.stringify(bad));
      expect.unreachable();
    } catch (e) {
      const err = e as DeckFileError;
      expect(err.code).toBe('invalid');
      expect(err.issues.some((i) => i.startsWith('deck.cards.0.spell.level'))).toBe(true);
      expect(err.issues.some((i) => i.startsWith('deck.cards.1'))).toBe(true);
    }
  });

  it('accepts minimal files from other tools and applies defaults', () => {
    const minimal = {
      formatVersion: 1,
      deck: {
        id: 'x', name: 'Minimal', lang: 'en', createdAt: '2026-01-01', updatedAt: '2026-01-01',
        cards: [{ id: 'c1', type: 'condition', name: { en: 'Prone' }, description: { en: 'You are prone.' } }],
      },
    };
    const parsed = parseDeckFile(JSON.stringify(minimal));
    expect(parsed.cards[0].name.en).toBe('Prone');
  });

  it('still imports files written before the rename (generator "open-tabletop-cards")', () => {
    const old = JSON.parse(serializeDeck(deck));
    old.generator = 'open-tabletop-cards';
    expect(parseDeckFile(JSON.stringify(old))).toEqual(deck);
  });

  it('builds file names from the deck name', () => {
    expect(deckFileName(deck)).toBe('magierzauber-grad-1-3.deckwright.json');
    expect(deckFileName({ ...deck, name: 'Größe & Stärke' }, 'pdf')).toBe('grosse-starke.pdf');
    expect(deckFileName({ ...deck, name: '!!!' })).toBe('deck.deckwright.json');
  });

  it('matches the published JSON Schema in docs/', () => {
    const published = JSON.parse(readFileSync(new URL('../../docs/deck-format.schema.json', import.meta.url), 'utf8'));
    expect(published).toEqual(deckFileJsonSchema());
  });
});
