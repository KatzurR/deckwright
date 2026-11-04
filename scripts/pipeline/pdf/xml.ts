/**
 * Parser for the XML output of Poppler's `pdftohtml -xml -i`.
 *
 * We use the XML output instead of plain `pdftotext` because it keeps font, bold/italic
 * and position information. That makes entry headings, run-in headings ("**Alarm.** …")
 * and paragraph starts detectable reliably. The text itself is still Poppler's text
 * extraction in reading order (not layout mode).
 */

export interface FontSpec {
  id: string;
  size: number;
  family: string;
  color: string;
}

export interface Segment {
  text: string;
  bold: boolean;
  italic: boolean;
}

export interface TextElement {
  page: number;
  top: number;
  left: number;
  width: number;
  height: number;
  font: FontSpec;
  segments: Segment[];
}

export interface XmlPage {
  number: number;
  width: number;
  height: number;
  elements: TextElement[];
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return ENTITIES[e] ?? m;
  });
}

/** Split the inner HTML of a <text> element (<b>, <i>, <a>) into styled segments. */
export function parseSegments(inner: string): Segment[] {
  const out: Segment[] = [];
  let bold = 0;
  let italic = 0;
  const re = /<(\/?)([a-z]+)[^>]*>|([^<]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner))) {
    if (m[3] !== undefined) {
      const text = decodeEntities(m[3]);
      const last = out[out.length - 1];
      const b = bold > 0;
      const i = italic > 0;
      if (last && last.bold === b && last.italic === i) last.text += text;
      else out.push({ text, bold: b, italic: i });
      continue;
    }
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (tag === 'b') bold += closing ? -1 : 1;
    else if (tag === 'i') italic += closing ? -1 : 1;
  }
  return out;
}

export function parseXml(xml: string): XmlPage[] {
  const fonts = new Map<string, FontSpec>();
  const pages: XmlPage[] = [];
  let current: XmlPage | undefined;
  const re =
    /<page number="(\d+)"[^>]*height="(\d+)" width="(\d+)">|<fontspec id="(\d+)" size="(-?\d+)" family="([^"]*)" color="([^"]*)"\/>|<text top="(-?\d+)" left="(-?\d+)" width="(\d+)" height="(\d+)" font="(\d+)">([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    if (m[1] !== undefined) {
      current = { number: Number(m[1]), height: Number(m[2]), width: Number(m[3]), elements: [] };
      pages.push(current);
    } else if (m[4] !== undefined) {
      // Strip the subset prefix ("CFGFPT+Cambria" → "Cambria").
      const family = m[6].replace(/^[A-Z]{6}\+/, '');
      fonts.set(m[4], { id: m[4], size: Number(m[5]), family, color: m[7].toLowerCase() });
    } else if (m[8] !== undefined && current) {
      const font = fonts.get(m[12]) ?? { id: m[12], size: 0, family: '', color: '' };
      const segments = parseSegments(m[13]);
      if (segments.length === 0) continue;
      current.elements.push({
        page: current.number,
        top: Number(m[8]),
        left: Number(m[9]),
        width: Number(m[10]),
        height: Number(m[11]),
        font,
        segments,
      });
    }
  }
  return pages;
}
