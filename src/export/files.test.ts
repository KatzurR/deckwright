import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { zipFiles } from './files';
import { imageNames, slugify } from './render';
import type { LaidOutCard } from '../render/measure';

describe('zipFiles', () => {
  it('stores files and de-duplicates names', () => {
    const zip = zipFiles([
      { name: 'a.png', bytes: new Uint8Array([1]) },
      { name: 'a.png', bytes: new Uint8Array([2]) },
      { name: 'b.png', bytes: new Uint8Array([3]) },
    ]);
    const files = unzipSync(zip);
    expect(Object.keys(files).sort()).toEqual(['a-2.png', 'a.png', 'b.png']);
    expect([...files['a-2.png']]).toEqual([2]);
  });
});

describe('image names', () => {
  it('slugifies German titles', () => {
    expect(slugify('Melfs Säurepfeil')).toBe('melfs-saurepfeil');
    expect(slugify('Größe & Stärke!')).toBe('grosse-starke');
    expect(slugify('???')).toBe('card');
  });

  it('numbers cards in deck order and suffixes continuation cards', () => {
    const laid = (title: string, pages: number) => ({
      display: { title },
      pagination: { pages: Array.from({ length: pages }, (_, i) => ({ part: i + 1, total: pages })) },
    }) as unknown as LaidOutCard;
    expect(imageNames([laid('Feuerball', 1), laid('Wunsch', 2)])).toEqual(['01-feuerball', '02-wunsch-1', '02-wunsch-2']);
  });
});
