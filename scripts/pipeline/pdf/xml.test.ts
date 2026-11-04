import { describe, expect, it } from 'vitest';
import { classify, pageLines } from './layout';
import { decodeEntities, parseSegments, parseXml } from './xml';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<pdf2xml producer="poppler" version="24.02.0">
<page number="7" position="absolute" top="0" left="0" height="1188" width="918">
\t<fontspec id="0" size="18" family="ABCDEF+GillSans-SemiBold" color="#822000"/>
\t<fontspec id="1" size="15" family="QWERTY+Cambria" color="#231f20"/>
<text top="100" left="80" width="120" height="20" font="0"><b>Fireball</b></text>
<text top="130" left="80" width="300" height="17" font="1"><i>Level 3 Evocation</i> (Sorcerer, Wizard)</text>
<text top="150" left="80" width="300" height="17" font="1">Deals 8d6 &amp; more &#8212; see &#x2192;</text>
</page>
</pdf2xml>`;

describe('Poppler XML parsing', () => {
  it('decodes named and numeric entities', () => {
    expect(decodeEntities('a &amp; b &lt;c&gt; &#228; &#xFC; &unknown;')).toBe('a & b <c> ä ü &unknown;');
  });

  it('splits inline markup into styled segments', () => {
    expect(parseSegments('<b>Alarm.</b> You <i>see</i> <b><i>both</i></b><a href="x">link</a>')).toEqual([
      { text: 'Alarm.', bold: true, italic: false },
      { text: ' You ', bold: false, italic: false },
      { text: 'see', bold: false, italic: true },
      { text: ' ', bold: false, italic: false },
      { text: 'both', bold: true, italic: true },
      { text: 'link', bold: false, italic: false },
    ]);
  });

  it('reads pages, fonts (without subset prefix) and text elements', () => {
    const [page] = parseXml(XML);
    expect(page).toMatchObject({ number: 7, width: 918, height: 1188 });
    expect(page.elements).toHaveLength(3);
    expect(page.elements[0].font).toEqual({ id: '0', size: 18, family: 'GillSans-SemiBold', color: '#822000' });
    expect(page.elements[2].segments[0].text).toBe('Deals 8d6 & more — see →');
  });

  it('classifies red 18 pt GillSans as entry heading and Cambria as body', () => {
    const [page] = parseXml(XML);
    expect(classify(page.elements[0], page.height)).toBe('h3');
    expect(classify(page.elements[1], page.height)).toBe('body');
    const lines = pageLines(page);
    expect(lines.map((l) => l.role)).toEqual(['h3', 'body', 'body']);
    expect(lines[0].text).toBe('Fireball');
  });
});
