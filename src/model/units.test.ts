import { describe, expect, it } from 'vitest';
import { feetToMetres, formatDice, formatDistance, formatNumber, formatRangePair, metresToFeet, normaliseDice } from './units';

describe('distances (SRD conversion 5 ft = 1.5 m, 1 mile = 1.6 km)', () => {
  it.each([
    [5, '1,5 m'], [10, '3 m'], [15, '4,5 m'], [30, '9 m'], [60, '18 m'], [90, '27 m'],
    [100, '30 m'], [120, '36 m'], [150, '45 m'], [300, '90 m'], [500, '150 m'],
  ])('%i ft → %s', (feet, expected) => {
    expect(formatDistance(feet, 'de')).toBe(expected);
  });

  it('formats miles as kilometres like the German SRD', () => {
    expect(formatDistance(5280, 'de', true)).toBe('1,6 Kilometer');
    expect(formatDistance(500 * 5280, 'de')).toBe('800 km');
    expect(formatDistance(5280, 'en', true)).toBe('1 mile');
    expect(formatDistance(500 * 5280, 'en', true)).toBe('500 miles');
  });

  it('keeps feet for English cards', () => {
    expect(formatDistance(150, 'en')).toBe('150 ft.');
    expect(formatDistance(150, 'en', true)).toBe('150 feet');
    expect(formatDistance(1, 'en', true)).toBe('1 foot');
  });

  it('formats range pairs', () => {
    expect(formatRangePair(80, 320, 'de')).toBe('24/96 m');
    expect(formatRangePair(25, 100, 'de')).toBe('7,5/30 m');
    expect(formatRangePair(80, 320, 'en')).toBe('80/320 ft.');
    expect(formatRangePair(30, undefined, 'de')).toBe('9 m');
  });

  it('round-trips metres and feet', () => {
    for (const ft of [5, 10, 25, 30, 60, 120, 150, 600]) expect(metresToFeet(feetToMetres(ft))).toBe(ft);
  });

  it('uses the decimal comma in German only', () => {
    expect(formatNumber(1.5, 'de')).toBe('1,5');
    expect(formatNumber(1.5, 'en')).toBe('1.5');
  });
});

describe('dice', () => {
  it('localises dice notation', () => {
    expect(formatDice('8d6', 'de')).toBe('8W6');
    expect(formatDice('1d6+4', 'de')).toBe('1W6 + 4');
    expect(formatDice('2W8', 'en')).toBe('2d8');
    expect(formatDice('d20', 'de')).toBe('W20');
  });
  it('normalises user input to English notation', () => {
    expect(normaliseDice(' 1W8 ')).toBe('1d8');
    expect(normaliseDice('2 w 6 + 3')).toBe('2d6 + 3');
  });
});
