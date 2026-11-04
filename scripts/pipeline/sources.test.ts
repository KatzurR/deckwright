import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SRD_SOURCES, verifySha256 } from './sources';

describe('SRD PDF sources', () => {
  it('points to the official SRD 5.2.1 PDFs with SHA-256 checksums', () => {
    for (const lang of ['de', 'en'] as const) {
      expect(SRD_SOURCES[lang].url).toMatch(/^https:\/\/media\.dndbeyond\.com\/.*SRD_CC_v5\.2\.1\.pdf$/);
      expect(SRD_SOURCES[lang].sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('accepts matching data and rejects changed data', () => {
    const data = new TextEncoder().encode('srd');
    const hash = createHash('sha256').update(data).digest('hex');
    expect(() => verifySha256(data, hash, 'test')).not.toThrow();
    expect(() => verifySha256(new TextEncoder().encode('SRD'), hash, 'test')).toThrow(/does not match/);
  });
});
