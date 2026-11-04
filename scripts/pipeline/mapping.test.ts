import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { assignGerman } from './build/common';
import { checkMapping, manualEntries, mergeMapping, readMapping, writeMapping, type Mapping } from './mapping';

describe('mergeMapping', () => {
  const existing: Mapping = {
    'srd-2024_b': { de: 'Handgesetzt', manual: true, note: 'set by hand' },
    'srd-2024_old': { de: 'Alt' },
  };

  it('keeps manual entries, replaces automatic ones and sorts the keys', () => {
    const auto = new Map([
      ['srd-2024_c', 'Zeh'],
      ['srd-2024_a', 'Ah'],
      ['srd-2024_b', 'Automatisch'],
    ]);
    const { mapping, dropped } = mergeMapping(auto, existing);
    expect(mapping).toEqual({
      'srd-2024_a': { de: 'Ah' },
      'srd-2024_b': { de: 'Handgesetzt', manual: true, note: 'set by hand' },
      'srd-2024_c': { de: 'Zeh' },
    });
    expect(Object.keys(mapping)).toEqual(['srd-2024_a', 'srd-2024_b', 'srd-2024_c']);
    expect(dropped).toEqual([]);
  });

  it('drops automatic pairs that reuse a German name taken by a manual entry', () => {
    const { mapping, dropped } = mergeMapping(new Map([['srd-2024_x', 'Handgesetzt']]), existing);
    expect(mapping['srd-2024_x']).toBeUndefined();
    expect(dropped).toEqual(['srd-2024_x']);
  });

  it('filters manual entries', () => {
    expect(Object.keys(manualEntries(existing))).toEqual(['srd-2024_b']);
  });
});

describe('checkMapping', () => {
  it('finds missing keys, duplicate and unknown German names', () => {
    const p = checkMapping(
      { a: { de: 'Eins' }, b: { de: 'Eins' }, c: { de: 'Gibt es nicht' }, stale: { de: 'Egal' } },
      ['a', 'b', 'c', 'd'],
      ['Eins', 'Zwei'],
    );
    expect(p.missing).toEqual(['d']);
    expect(p.duplicates).toEqual([{ de: 'Eins', keys: ['a', 'b'] }]);
    expect(p.unknownDe).toEqual([{ key: 'c', de: 'Gibt es nicht' }]);
  });
});

describe('assignGerman (automatic + manual assignment)', () => {
  const cand = (id: string, primary: string) => ({ id, primary, tokens: [], length: 100 });

  it('lets a manual entry resolve an ambiguous group', () => {
    const en = [cand('a', 'g'), cand('b', 'g'), cand('c', 'x')];
    const de = [cand('A', 'g'), cand('B', 'g'), cand('C', 'x')];
    const without = assignGerman('test', en, de, {});
    expect(without.problems.missing).toEqual(['a', 'b']);
    const withManual = assignGerman('test', en, de, { a: { de: 'A', manual: true } });
    expect(withManual.mapping).toEqual({ a: { de: 'A', manual: true }, b: { de: 'B' }, c: { de: 'C' } });
    expect(withManual.manualMatches).toBe(1);
    expect(withManual.autoMatches).toBe(2);
    expect(withManual.problems).toEqual({ missing: [], duplicates: [], unknownDe: [] });
  });

  it('removes automatic entries for keys that no longer exist', () => {
    const r = assignGerman('test', [cand('a', 'x')], [cand('A', 'x')], { gone: { de: 'Weg' } });
    expect(r.mapping).toEqual({ a: { de: 'A' } });
  });
});

describe('mapping files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'otc-mapping-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('round-trips sorted JSON and reads a missing file as empty', () => {
    const file = join(dir, 'sub', 'spell.json');
    expect(readMapping(file)).toEqual({});
    writeMapping(file, { z: { de: 'Z' }, a: { de: 'A', manual: true } });
    expect(readFileSync(file, 'utf8').endsWith('}\n')).toBe(true);
    expect(Object.keys(readMapping(file))).toEqual(['a', 'z']);
  });
});
