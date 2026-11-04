/**
 * PDF sheets with pdf-lib (SPEC §8): cards as 300 dpi images placed at exact millimetre
 * positions, cut marks as vector lines, SRD attribution and credits on every sheet.
 */
import {
  PDFDocument, StandardFonts, clip, degrees, endPath, popGraphicsState, pushGraphicsState, rectangle, rgb,
  type PDFFont, type PDFPage,
} from 'pdf-lib';
import type { Lang } from '../model/schema';
import { SRD_ATTRIBUTION, sheetCredits } from '../model/legal';
import { mmToPt, sheetLayout, toSheets, type NoticeBox, type Paper } from './layout';

export interface PdfOptions {
  paper: Paper;
  bleed: number;
  lang: Lang;
  title?: string;
}

export const CUT_MARK_WIDTH_PT = 0.3;
export const ATTRIBUTION_FONT_PT = 4.2;
const NOTICE_LINE_GAP_PT = ATTRIBUTION_FONT_PT * 1.25;

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
  doc.setTitle(options.title ?? 'Deckwright');
  doc.setCreator('Deckwright');
  doc.setProducer('Deckwright (pdf-lib)');
  doc.setLanguage(options.lang === 'de' ? 'de-DE' : 'en-US');
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const pageW = mmToPt(layout.page.w);
  const pageH = mmToPt(layout.page.h);
  // PDF origin is bottom left, layout origin is top left.
  const flipY = (yMm: number, hMm: number) => pageH - mmToPt(yMm + hMm);

  const notices: [NoticeBox, string][] = [
    [layout.attribution, SRD_ATTRIBUTION[options.lang]],
    [layout.credits, sheetCredits(options.lang)],
  ];

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
    for (const [box, text] of notices) drawNotice(page, text, box, font, pageH);
  }
  return doc.save();
}

/** Lines of a notice wrapped to the length of its box. */
export function noticeLines(text: string, box: NoticeBox, font: Pick<PDFFont, 'widthOfTextAtSize'>): string[] {
  return wrapText(text, font, ATTRIBUTION_FONT_PT, mmToPt(box.rotation === 0 ? box.w : box.h));
}

/** Number of notice lines that fit across the thickness of a box. */
export function noticeCapacity(box: NoticeBox): number {
  const thickness = mmToPt(box.rotation === 0 ? box.h : box.w);
  return Math.max(0, Math.floor((thickness - ATTRIBUTION_FONT_PT * 1.25) / NOTICE_LINE_GAP_PT + 1e-9) + 1);
}

/** Draw a centred notice; the line next to the cards comes first in reading order where possible. */
function drawNotice(page: PDFPage, text: string, box: NoticeBox, font: PDFFont, pageH: number) {
  const size = ATTRIBUTION_FONT_PT;
  const color = rgb(0.25, 0.25, 0.25);
  const length = mmToPt(box.rotation === 0 ? box.w : box.h);
  const lines = noticeLines(text, box, font);
  lines.forEach((line, i) => {
    const offset = (length - font.widthOfTextAtSize(line, size)) / 2;
    switch (box.side) {
      case 'bottom': // below the grid, first line on top
        page.drawText(line, { x: mmToPt(box.x) + offset, y: pageH - mmToPt(box.y) - size - i * NOTICE_LINE_GAP_PT, size, font, color });
        break;
      case 'top': // above the grid, block aligned to the bottom of the box
        page.drawText(line, {
          x: mmToPt(box.x) + offset,
          y: pageH - mmToPt(box.y + box.h) + size * 0.25 + (lines.length - 1 - i) * NOTICE_LINE_GAP_PT,
          size, font, color,
        });
        break;
      case 'left': // rotated 90° (reads bottom to top), first line next to the cards
        page.drawText(line, {
          x: mmToPt(box.x + box.w) - size * 0.25 - i * NOTICE_LINE_GAP_PT,
          y: pageH - mmToPt(box.y + box.h) + offset,
          size, font, color, rotate: degrees(90),
        });
        break;
      case 'right': // rotated 90°, first line next to the cards
        page.drawText(line, {
          x: mmToPt(box.x) + size + i * NOTICE_LINE_GAP_PT,
          y: pageH - mmToPt(box.y + box.h) + offset,
          size, font, color, rotate: degrees(90),
        });
        break;
    }
  });
}
