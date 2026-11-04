/**
 * Sheet geometry for PDF and browser print (SPEC §8): A4 or US Letter, 3 × 3 cards,
 * cut marks, optional 3 mm bleed. All values in millimetres, origin top left.
 *
 * Bleed strategy: every card has the same leather border at its edge, so neighbouring cards
 * touch without a gap – a slightly off cut between two cards only shows more of the identical
 * leather. Bleed is therefore only added around the outside of the 3 × 3 grid. Each card is
 * rendered with bleed on all sides and clipped to its cell, so the bleed never covers a neighbour.
 */

export const CARD_MM = { w: 63, h: 88 } as const;
export const BLEED_MM = 3;
export const DPI = 300;
export const MM_PER_INCH = 25.4;
export const PT_PER_MM = 72 / MM_PER_INCH;

export const PAPERS = {
  a4: { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
} as const;
export type Paper = keyof typeof PAPERS;

export const COLS = 3;
export const ROWS = 3;
export const CARDS_PER_SHEET = COLS * ROWS;

/** Distance between the bleed edge and the start of a cut mark. */
export const MARK_OFFSET_MM = 1;
export const MARK_LENGTH_MM = 3;
/** Typical non-printable border of office printers; text stays inside it. */
export const PRINTER_MARGIN_MM = 3;

export interface Rect { x: number; y: number; w: number; h: number }
export interface Line { x1: number; y1: number; x2: number; y2: number }

export interface SheetSlot {
  index: number;
  col: number;
  row: number;
  /** Final card after cutting (63 × 88 mm). */
  trim: Rect;
  /** Rendered card image including bleed on all sides. */
  image: Rect;
  /** Visible part of the image: bleed only on the outer sides of the grid. */
  clip: Rect;
}

export interface SheetLayout {
  paper: Paper;
  page: { w: number; h: number };
  bleed: number;
  /** Trim box of the whole grid. */
  grid: Rect;
  slots: SheetSlot[];
  cutMarks: Line[];
  /**
   * Box for the SRD attribution, outside the cut marks in the larger margin:
   * below the grid (rotation 0, A4) or left of it, reading bottom to top (rotation 90, Letter).
   * For rotation 90 the text runs along `h`.
   */
  attribution: NoticeBox;
  /** Box for the change note and icon credits, mirrored: above the grid (A4) or right of it (Letter). */
  credits: NoticeBox;
}

/** `side` is the side of the grid the box lies on; text lines start next to the cards. */
export type NoticeBox = Rect & { rotation: 0 | 90; side: 'top' | 'bottom' | 'left' | 'right' };

const round = (v: number) => Math.round(v * 1000) / 1000;

export function sheetLayout(paper: Paper, bleed = 0): SheetLayout {
  const page = PAPERS[paper];
  const gridW = COLS * CARD_MM.w;
  const gridH = ROWS * CARD_MM.h;
  const grid: Rect = { x: round((page.w - gridW) / 2), y: round((page.h - gridH) / 2), w: gridW, h: gridH };
  if (grid.x < bleed || grid.y < bleed) throw new Error(`Paper ${paper} is too small for the card grid`);

  const slots: SheetSlot[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const trim: Rect = { x: round(grid.x + col * CARD_MM.w), y: round(grid.y + row * CARD_MM.h), w: CARD_MM.w, h: CARD_MM.h };
      const image: Rect = { x: round(trim.x - bleed), y: round(trim.y - bleed), w: CARD_MM.w + 2 * bleed, h: CARD_MM.h + 2 * bleed };
      const left = col === 0 ? bleed : 0;
      const right = col === COLS - 1 ? bleed : 0;
      const top = row === 0 ? bleed : 0;
      const bottom = row === ROWS - 1 ? bleed : 0;
      const clip: Rect = { x: round(trim.x - left), y: round(trim.y - top), w: round(CARD_MM.w + left + right), h: round(CARD_MM.h + top + bottom) };
      slots.push({ index: row * COLS + col, col, row, trim, image, clip });
    }
  }

  // Cut marks outside the bleed area, one per trim line on both sides.
  const cutMarks: Line[] = [];
  const outer = { left: grid.x - bleed, right: grid.x + gridW + bleed, top: grid.y - bleed, bottom: grid.y + gridH + bleed };
  const markLen = (space: number) => Math.max(0, Math.min(MARK_LENGTH_MM, space - MARK_OFFSET_MM - 0.3));
  const vLen = markLen(outer.top);
  const hLen = markLen(outer.left);
  for (let c = 0; c <= COLS; c++) {
    const x = round(grid.x + c * CARD_MM.w);
    if (vLen > 0) {
      cutMarks.push({ x1: x, y1: round(outer.top - MARK_OFFSET_MM - vLen), x2: x, y2: round(outer.top - MARK_OFFSET_MM) });
      cutMarks.push({ x1: x, y1: round(outer.bottom + MARK_OFFSET_MM), x2: x, y2: round(outer.bottom + MARK_OFFSET_MM + vLen) });
    }
  }
  for (let r = 0; r <= ROWS; r++) {
    const y = round(grid.y + r * CARD_MM.h);
    if (hLen > 0) {
      cutMarks.push({ x1: round(outer.left - MARK_OFFSET_MM - hLen), y1: y, x2: round(outer.left - MARK_OFFSET_MM), y2: y });
      cutMarks.push({ x1: round(outer.right + MARK_OFFSET_MM), y1: y, x2: round(outer.right + MARK_OFFSET_MM + hLen), y2: y });
    }
  }

  // Notices outside the cut marks, in the larger of the vertical and horizontal margins:
  // SRD attribution below / left of the grid, credits in the mirrored margin above / right.
  const gap = 0.8;
  const vertical = page.h - outer.bottom >= outer.left;
  let attribution: NoticeBox;
  let credits: NoticeBox;
  if (vertical) {
    const thickness = round(Math.max(0, page.h - PRINTER_MARGIN_MM - (outer.bottom + MARK_OFFSET_MM + vLen + gap)));
    attribution = { x: grid.x, y: round(outer.bottom + MARK_OFFSET_MM + vLen + gap), w: gridW, h: thickness, rotation: 0, side: 'bottom' };
    credits = {
      x: grid.x, y: PRINTER_MARGIN_MM, w: gridW,
      h: round(Math.max(0, outer.top - MARK_OFFSET_MM - vLen - gap - PRINTER_MARGIN_MM)),
      rotation: 0, side: 'top',
    };
  } else {
    attribution = {
      x: PRINTER_MARGIN_MM, y: grid.y,
      w: round(Math.max(0, outer.left - MARK_OFFSET_MM - hLen - gap - PRINTER_MARGIN_MM)), h: gridH,
      rotation: 90, side: 'left',
    };
    const x = round(outer.right + MARK_OFFSET_MM + hLen + gap);
    credits = { x, y: grid.y, w: round(Math.max(0, page.w - PRINTER_MARGIN_MM - x)), h: gridH, rotation: 90, side: 'right' };
  }

  return { paper, page: { ...page }, bleed, grid, slots, cutMarks, attribution, credits };
}

/** Pixel size of a card image at 300 dpi, e.g. 744 × 1039 px for 63 × 88 mm (SPEC §8). */
export function cardPixels(bleed = 0, dpi = DPI): { w: number; h: number } {
  return {
    w: Math.round(((CARD_MM.w + 2 * bleed) / MM_PER_INCH) * dpi),
    h: Math.round(((CARD_MM.h + 2 * bleed) / MM_PER_INCH) * dpi),
  };
}

/** Split items into sheets of nine. */
export function toSheets<T>(items: T[], perSheet = CARDS_PER_SHEET): T[][] {
  const sheets: T[][] = [];
  for (let i = 0; i < items.length; i += perSheet) sheets.push(items.slice(i, i + perSheet));
  return sheets;
}

export const mmToPt = (mm: number) => mm * PT_PER_MM;
