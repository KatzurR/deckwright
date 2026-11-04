import { describe, expect, it } from 'vitest';
import { crc32, dataUrlToBytes, isPng, pngDpi, pngSize, readChunks, setPngDpi, solidPng } from './png';

describe('PNG helpers', () => {
  it('computes the standard CRC-32', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('encodes a valid PNG and reads its size', () => {
    const png = solidPng(744, 1039);
    expect(isPng(png)).toBe(true);
    expect(pngSize(png)).toEqual({ w: 744, h: 1039 });
    expect(readChunks(png).map((c) => c.type)).toEqual(['IHDR', 'IDAT', 'IEND']);
    expect(pngDpi(png)).toBeUndefined();
  });

  it('sets the resolution to 300 dpi right after IHDR and replaces existing pHYs', () => {
    const png = setPngDpi(solidPng(4, 4), 300);
    expect(readChunks(png).map((c) => c.type)).toEqual(['IHDR', 'pHYs', 'IDAT', 'IEND']);
    expect(pngDpi(png)).toBe(300);
    const again = setPngDpi(png, 150);
    expect(readChunks(again).filter((c) => c.type === 'pHYs')).toHaveLength(1);
    expect(pngDpi(again)).toBe(150);
  });

  it('rejects non-PNG data', () => {
    expect(() => readChunks(new Uint8Array([1, 2, 3]))).toThrow();
  });

  it('decodes data URLs', () => {
    expect([...dataUrlToBytes('data:text/plain;base64,QUJD')]).toEqual([65, 66, 67]);
  });
});
