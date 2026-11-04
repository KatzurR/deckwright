import { describe, expect, it } from 'vitest';
import { diceTokens, lengthSimilarity, matchCandidates, tokenSimilarity, type Candidate } from './match';

const c = (id: string, primary: string, tokens: string[] = [], length = 100): Candidate => ({ id, primary, tokens, length });

describe('similarity measures', () => {
  it('compares token multisets', () => {
    expect(tokenSimilarity([], [])).toBe(1);
    expect(tokenSimilarity(['8d6'], ['8d6'])).toBe(1);
    expect(tokenSimilarity(['8d6'], ['1d4'])).toBe(0);
    expect(tokenSimilarity(['8d6', '8d6'], ['8d6'])).toBe(0.5);
  });

  it('expects German texts to be about 1.2× longer', () => {
    expect(lengthSimilarity(100, 120)).toBe(1);
    expect(lengthSimilarity(100, 60)).toBeCloseTo(0.5);
    expect(lengthSimilarity(100, 240)).toBeCloseTo(0.5);
    expect(lengthSimilarity(0, 100)).toBe(0);
  });

  it('extracts dice in both notations', () => {
    expect(diceTokens('8W6 Feuerschaden und 1 W 4')).toEqual(['8d6', '1d4']);
    expect(diceTokens('takes 2d10 damage')).toEqual(['2d10']);
  });
});

describe('matchCandidates', () => {
  it('pairs unique fingerprints directly', () => {
    const r = matchCandidates([c('fireball', '3|evo'), c('shield', '1|abj')], [c('Schild', '1|abj'), c('Feuerball', '3|evo')]);
    expect(Object.fromEntries(r.pairs)).toEqual({ fireball: 'Feuerball', shield: 'Schild' });
    expect(r.ambiguous).toEqual([]);
  });

  it('separates a group by secondary tokens when the margin is clear', () => {
    const r = matchCandidates(
      [c('a', 'g', ['8d6']), c('b', 'g', ['1d10', '1d10'])],
      [c('B', 'g', ['1d10', '1d10']), c('A', 'g', ['8d6'])],
    );
    expect(Object.fromEntries(r.pairs)).toEqual({ a: 'A', b: 'B' });
  });

  it('reports groups it cannot separate as ambiguous', () => {
    const r = matchCandidates([c('a', 'g'), c('b', 'g')], [c('A', 'g'), c('B', 'g')]);
    expect(r.pairs.size).toBe(0);
    expect(r.ambiguous).toEqual([{ primary: 'g', en: ['a', 'b'], de: ['A', 'B'] }]);
  });

  it('reports entries without any partner as unmatched', () => {
    const r = matchCandidates([c('a', 'x'), c('b', 'y')], [c('A', 'x'), c('C', 'z')]);
    expect(Object.fromEntries(r.pairs)).toEqual({ a: 'A' });
    expect(r.unmatchedEn).toEqual(['b']);
    expect(r.unmatchedDe).toEqual(['C']);
  });
});
