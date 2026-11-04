/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream, StandardFonts } from 'pdf-lib';
import { buildPdf, noticeCapacity, noticeLines, wrapText } from './pdf';
import { mmToPt, sheetLayout, type Paper } from './layout';
import { SRD_ATTRIBUTION, sheetCredits } from '../model/legal';
import { solidPng } from './png';

async function contentOf(doc: PDFDocument, pageIndex: number): Promise<string> {
  const page = doc.getPage(pageIndex);
  const contents = page.node.Contents();
  const streams: PDFRawStream[] = [];
  if (contents && 'asArray' in contents) {
    for (const ref of (contents as unknown as { asArray(): unknown[] }).asArray()) streams.push(doc.context.lookup(ref as never) as PDFRawStream);
  } else if (contents) {
    streams.push(contents as unknown as PDFRawStream);
  }
  return streams.map((s) => new TextDecoder('latin1').decode(decodePDFRawStream(s).decode())).join('\n');
}

describe('buildPdf', () => {
  const card = solidPng(8, 11);

  it.each([['a4', 595.28, 841.89], ['letter', 612, 792]] as const)('creates %s pages with 9 cards each', async (paper, w, h) => {
    const bytes = await buildPdf(Array(11).fill(card), { paper, bleed: 0, lang: 'de', title: 'Test' });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(2);
    const size = doc.getPage(0).getSize();
    expect(size.width).toBeCloseTo(w, 1);
    expect(size.height).toBeCloseTo(h, 1);
    expect(doc.getTitle()).toBe('Test');
    const xobjects = (p: number) => doc.getPage(p).node.Resources()?.lookup(PDFName.of('XObject'));
    expect((xobjects(0) as unknown as { keys(): unknown[] }).keys()).toHaveLength(9);
    expect((xobjects(1) as unknown as { keys(): unknown[] }).keys()).toHaveLength(2);
  });

  it('places card images at exact positions (1:1, no scaling by the browser)', async () => {
    const bleed = 3;
    const bytes = await buildPdf([card], { paper: 'a4', bleed, lang: 'en' });
    const doc = await PDFDocument.load(bytes);
    const content = await contentOf(doc, 0);
    const layout = sheetLayout('a4', bleed);
    const slot = layout.slots[0];
    const pageH = mmToPt(297);
    // pdf-lib writes the image transform as translation followed by scale
    const expected = [mmToPt(slot.image.x), pageH - mmToPt(slot.image.y + slot.image.h), mmToPt(slot.image.w), mmToPt(slot.image.h)];
    const cm = content.match(/1 0 0 1 ([\d.-]+) ([\d.-]+) cm\s+1 0 0 1 0 0 cm\s+([\d.-]+) 0 0 ([\d.-]+) 0 0 cm[\s\S]*?\/Image/);
    expect(cm).not.toBeNull();
    cm!.slice(1, 5).map(Number).forEach((v, i) => expect(v).toBeCloseTo(expected[i], 2));
    // clipping rectangle for the bleed
    const re = content.match(/([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) re\s*W\s*n/);
    expect(re).not.toBeNull();
    expect(Number(re![3])).toBeCloseTo(mmToPt(slot.clip.w), 2);
    // 16 cut marks, 0.3 pt wide
    expect(content.match(/ l\s+S/g)).toHaveLength(16);
    expect(content).toContain('0.3 w');
  });

  it('prints the SRD attribution in the deck language on every sheet', async () => {
    const bytes = await buildPdf(Array(10).fill(card), { paper: 'letter', bleed: 3, lang: 'de' });
    const doc = await PDFDocument.load(bytes);
    for (const i of [0, 1]) {
      const content = await contentOf(doc, i);
      const hexTexts = [...content.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)].map((m) => Buffer.from(m[1], 'hex').toString('latin1'));
      const joined = hexTexts.join(' ');
      expect(joined).toContain('Systemreferenzdokument 5.2.1');
      expect(joined).toContain('Creative Commons Namensnennung 4.0');
      expect(joined).toContain('Änderungen: Die SRD-Texte');
      expect(joined).toContain('Symbole von game-icons.net');
    }
  });

  it.each([
    ['a4', 0], ['a4', 3], ['letter', 0], ['letter', 3],
  ] as [Paper, number][])('fits both notices into their boxes (%s, bleed %i mm)', async (paper, bleed) => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const layout = sheetLayout(paper, bleed);
    for (const lang of ['de', 'en'] as const) {
      for (const [box, text] of [[layout.attribution, SRD_ATTRIBUTION[lang]], [layout.credits, sheetCredits(lang)]] as const) {
        expect(noticeLines(text, box, font).length).toBeLessThanOrEqual(noticeCapacity(box));
      }
    }
  });

  it('creates one empty sheet for an empty selection', async () => {
    const doc = await PDFDocument.load(await buildPdf([], { paper: 'a4', bleed: 0, lang: 'en' }));
    expect(doc.getPageCount()).toBe(1);
  });
});

describe('wrapText', () => {
  it('wraps by measured width', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const lines = wrapText('aaa bbb ccc ddd', font, 10, font.widthOfTextAtSize('aaa bbb', 10));
    expect(lines).toEqual(['aaa bbb', 'ccc ddd']);
    expect(wrapText('verylongword', font, 10, 1)).toEqual(['verylongword']);
  });
});
