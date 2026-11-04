// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { readPreference, writePreference } from './preferences';

beforeEach(() => localStorage.clear());

describe('preferences', () => {
  it('writes and reads under the deckwright. prefix', () => {
    writePreference(localStorage, 'paper', 'letter');
    expect(localStorage.getItem('deckwright.paper')).toBe('letter');
    expect(readPreference(localStorage, 'paper')).toBe('letter');
  });

  it('moves a value stored under the old otc. prefix to the new key', () => {
    localStorage.setItem('otc.uiLanguage', 'en');
    expect(readPreference(localStorage, 'uiLanguage')).toBe('en');
    expect(localStorage.getItem('deckwright.uiLanguage')).toBe('en');
    expect(localStorage.getItem('otc.uiLanguage')).toBeNull();
  });

  it('prefers the new key over a leftover old one', () => {
    localStorage.setItem('otc.paper', 'a4');
    localStorage.setItem('deckwright.paper', 'letter');
    expect(readPreference(localStorage, 'paper')).toBe('letter');
  });

  it('returns null when nothing is stored', () => {
    expect(readPreference(localStorage, 'currentDeck')).toBeNull();
  });
});
