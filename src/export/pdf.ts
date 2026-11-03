/**
 * PDF sheets with pdf-lib (SPEC §8): cards as 300 dpi images placed at exact millimetre
 * positions, cut marks as vector lines, SRD attribution on every sheet.
 */
import {
  PDFDocument, StandardFonts, clip, degrees, endPath, popGraphicsState, pushGraphicsState, rectangle, rgb,
  type PDFFont,
} from 'pdf-lib';
import type { Lang } from '../model/schema';
import { SRD_ATTRIBUTION } from '../model/legal';
import { mmToPt, sheetLayout, toSheets, type Paper } from './layout';

export interface PdfOptions {
  paper: Paper;
  bleed: number;
  lang: Lang;
  title?: string;
}

export const CUT_MARK_WIDTH_PT = 0.3;
export const ATTRIBUTION_FONT_PT = 4.2;

/** Greedy word wrap with real font metrics. */
export function wrapText(text: string, font: Pick<PDFFont, 'widthOfTextAtSize'>, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Build the PDF. `images` are PNG files of the card faces including bleed, in deck order
 * (continuation cards included), each rendered at 300 dpi.
 */
export async function buildPdf(images: Uint8Array[], options: PdfOptions): Promise<Uint8Array> {
  const layout = sheetLayout(options.paper, options.bleed);
  const doc = await PDFDocument.create();
  doc.setTitle(options.title ?? 'open-tabletop-cards');
  doc.setCreator('open-tabletop-cards');
  doc.setProducer('open-tabletop-cards (pdf-lib)');
  doc.setLanguage(options.lang === 'de' ? 'de-DE' : 'en-US');
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const pageW = mmToPt(layout.page.w);
  const pageH = mmToPt(layout.page.h);
  // PDF origin is bottom left, layout origin is top left.
  const flipY = (yMm: number, hMm: number) => pageH - mmToPt(yMm + hMm);

  const a = layout.attribution;
  const attribution = SRD_ATTRIBUTION[options.lang];
  const textLength = mmToPt(a.rotation === 0 ? a.w : a.h);
  const attrLines = wrapText(attribution, font, ATTRIBUTION_FONT_PT, textLength);
  const lineGap = ATTRIBUTION_FONT_PT * 1.25;

  const sheets = toSheets(images);
  if (sheets.length === 0) sheets.push([]);
  for (const sheet of sheets) {
    const page = doc.addPage([pageW, pageH]);
    for (let i = 0; i < sheet.length; i++) {
      const slot = layout.slots[i];
      const image = await doc.embedPng(sheet[i]);
      page.pushOperators(
        pushGraphicsState(),
        rectangle(mmToPt(slot.clip.x), flipY(slot.clip.y, slot.clip.h), mmToPt(slot.clip.w), mmToPt(slot.clip.h)),
        clip(),
        endPath(),
      );
      page.drawImage(image, {
        x: mmToPt(slot.image.x),
        y: flipY(slot.image.y, slot.image.h),
        width: mmToPt(slot.image.w),
        height: mmToPt(slot.image.h),
      });
      page.pushOperators(popGraphicsState());
    }
    for (const m of layout.cutMarks) {
      page.drawLine({
        start: { x: mmToPt(m.x1), y: pageH - mmToPt(m.y1) },
        end: { x: mmToPt(m.x2), y: pageH - mmToPt(m.y2) },
        thickness: CUT_MARK_WIDTH_PT,
        color: rgb(0, 0, 0),
      });
    }
    attrLines.forEach((line, i) => {
      const width = font.widthOfTextAtSize(line, ATTRIBUTION_FONT_PT);
      if (a.rotation === 0) {
        // Centred below the grid, first line closest to the cards.
        page.drawText(line, {
          x: mmToPt(a.x) + (textLength - width) / 2,
          y: pageH - mmToPt(a.y) - ATTRIBUTION_FONT_PT - i * lineGap,
          size: ATTRIBUTION_FONT_PT, font, color: rgb(0.25, 0.25, 0.25),
        });
      } else {
        // Rotated 90° (reads bottom to top), first line closest to the cards.
        page.drawText(line, {
          x: mmToPt(a.x + a.w) - ATTRIBUTION_FONT_PT * 0.25 - i * lineGap,
          y: pageH - mmToPt(a.y + a.h) + (textLength - width) / 2,
          size: ATTRIBUTION_FONT_PT, font, color: rgb(0.25, 0.25, 0.25),
          rotate: degrees(90),
        });
      }
    });
  }
  return doc.save();
}
