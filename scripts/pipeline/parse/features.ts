/**
 * Features: class and subclass features ("Level 2: Action Surge" / "2. Stufe: Tatendrang"),
 * class options (Metamagic, Eldritch Invocations), species traits and feats.
 */
import type { ClassKey, Lang } from '../../../src/model/schema';
import { bodyMarkdown, italicRefs, lineText, plainText, section, type Doc } from '../doc';
import type { Line } from '../pdf/layout';
import { joinBroken, tidy } from '../text';
import { CLASS_NAMES } from './spells';

export type FeatCategory = 'origin' | 'general' | 'fighting-style' | 'epic-boon';

export interface ParsedFeature {
  lang: Lang;
  kind: 'class' | 'subclass' | 'option' | 'species' | 'feat';
  name: string;
  classKey?: ClassKey;
  /** Subclass or species name. */
  group?: string;
  level?: number;
  featCategory?: FeatCategory;
  prerequisite?: string;
  description: string;
  refs: string[];
  page: number;
}

const LEVEL_HEADING: Record<Lang, RegExp> = {
  en: /^Level (\d+): (.+)$/,
  de: /^(\d+)\. Stufe: (.+)$/,
};
const SUBCLASS_PLACEHOLDER: Record<Lang, RegExp> = { en: /Subclass$/, de: /Unterklasse$/ };
const CLASS_FEATURES_H2: Record<Lang, RegExp> = { en: /Class Features$/, de: /^Klassenmerkmale de/ };
const SUBCLASS_H2: Record<Lang, RegExp> = { en: /Subclass:\s*(.+)$/, de: /Unterklasse:\s*(.+)$/ };
const OPTIONS_H2: Record<Lang, RegExp> = { en: /Options$/, de: /Optionen$/ };
const CLASS_CHAPTER_END: Record<Lang, string> = { en: 'Character Origins', de: 'Charakterherkunft' };
const PREREQ: Record<Lang, RegExp> = { en: /^\(?Prerequisite:\s*(.+?)\)?$/, de: /^\(?Voraussetzung:\s*(.+?)\)?$/ };

/** Caption of the class table ("Paladin Features" / "Paladinmerkmale"). */
const CLASS_TABLE_CAPTION: Record<Lang, RegExp> = { en: /^\p{L}+ Features$/u, de: /^\p{L}+merkmale$/u };

/**
 * Remove the class tables. A class table is wider than a column: Poppler splits it into a left
 * half (level, proficiency bonus, features) that follows the caption and a right half (spell
 * slots, resources) that is read with the right column – i.e. inside the first class feature.
 * All sans lines on the caption's page between the caption and the last row are dropped.
 */
const TABLE_ROW_GAP = 60;

export function stripClassTables(lines: Line[], lang: Lang): Line[] {
  const drop = new Set<Line>();
  for (let i = 0; i < lines.length; i++) {
    const caption = lines[i];
    if (caption.role !== 'h4' || !CLASS_TABLE_CAPTION[lang].test(lineText(caption))) continue;
    drop.add(caption);
    // The rows below the caption in its column (or full width), without larger vertical gaps.
    // Geometry instead of reading order: full-width rows split the page into bands, so the
    // right column's text can be read between the caption and the first rows.
    const rows = lines
      .filter((l) => l.page === caption.page && l.role === 'sans' && (l.col === caption.col || l.col === -1) && l.top > caption.top)
      .map((l) => l.top)
      .sort((a, b) => a - b);
    let bottom = caption.top;
    for (const top of rows) {
      if (top - bottom > TABLE_ROW_GAP) break;
      bottom = top;
    }
    for (const l of lines) {
      if (l.page === caption.page && l.role === 'sans' && l.top >= caption.top && l.top <= bottom + 5) drop.add(l);
    }
  }
  return lines.filter((l) => !drop.has(l));
}

/** Join consecutive heading lines of the same role (wrapped headings). */
function headingText(doc: Doc, lines: Line[], i: number): { text: string; next: number } {
  let text = lineText(lines[i]);
  let j = i + 1;
  while (j < lines.length && lines[j].role === lines[i].role) {
    text = tidy(joinBroken(text, lines[j].text, doc));
    j++;
  }
  return { text, next: j };
}

/** Leading italic lines of an entry (feat category, prerequisite). */
function italicLead(lines: Line[]): number {
  let i = 0;
  while (i < lines.length && lines[i].role === 'body' && lines[i].segments.every((s) => s.italic || !s.text.trim())) i++;
  return i;
}

export function parseClassFeatures(doc: Doc): ParsedFeature[] {
  const lang = doc.lang;
  const start = doc.lines.findIndex((l) => l.role === 'h1' && CLASS_NAMES[lang][lineText(l).toLowerCase()]);
  const end = doc.lines.findIndex((l, i) => i > start && (l.role === 'title' || l.role === 'h1') && lineText(l).startsWith(CLASS_CHAPTER_END[lang]));
  const lines = stripClassTables(doc.lines.slice(start, end), lang);
  const out: ParsedFeature[] = [];
  let classKey: ClassKey | undefined;
  let context: 'features' | 'subclass' | 'options' | 'other' = 'other';
  let subclass: string | undefined;
  let cur: { f: Omit<ParsedFeature, 'description' | 'refs'>; lines: Line[] } | undefined;
  const flush = () => {
    if (cur) {
      let body = cur.lines;
      let prerequisite: string | undefined;
      if (cur.f.kind === 'option') {
        const n = italicLead(body);
        const lead = plainText(doc, body.slice(0, n));
        const m = lead.match(PREREQ[lang]);
        if (m) prerequisite = tidy(m[1]);
        body = body.slice(n);
      }
      out.push({
        ...cur.f,
        ...(prerequisite ? { prerequisite } : {}),
        description: bodyMarkdown(doc, body),
        refs: italicRefs(doc, body),
      });
    }
    cur = undefined;
  };
  for (let i = 0; i < lines.length; ) {
    const l = lines[i];
    if (l.role === 'h1' || l.role === 'title') {
      flush();
      const key = CLASS_NAMES[lang][lineText(l).toLowerCase()];
      if (key) classKey = key;
      context = 'other';
      i++;
      continue;
    }
    if (l.role === 'h2') {
      flush();
      const { text, next } = headingText(doc, lines, i);
      i = next;
      const sm = text.match(SUBCLASS_H2[lang]);
      if (sm) {
        context = 'subclass';
        subclass = tidy(sm[1]);
      } else if (CLASS_FEATURES_H2[lang].test(text)) context = 'features';
      else if (OPTIONS_H2[lang].test(text)) context = 'options';
      else context = 'other';
      continue;
    }
    if (l.role === 'h3') {
      flush();
      const { text, next } = headingText(doc, lines, i);
      i = next;
      if (!classKey) continue;
      if (context === 'features' || context === 'subclass') {
        const m = text.match(LEVEL_HEADING[lang]);
        if (!m || SUBCLASS_PLACEHOLDER[lang].test(m[2])) continue;
        cur = {
          f: {
            lang,
            kind: context === 'subclass' ? 'subclass' : 'class',
            name: tidy(m[2]),
            classKey,
            ...(context === 'subclass' ? { group: subclass } : {}),
            level: Number(m[1]),
            page: l.page,
          },
          lines: [],
        };
      } else if (context === 'options') {
        cur = { f: { lang, kind: 'option', name: text, classKey, page: l.page }, lines: [] };
      }
      continue;
    }
    cur?.lines.push(l);
    i++;
  }
  flush();
  return out;
}

const SPECIES_SECTION: Record<Lang, string> = { en: 'Species Descriptions', de: 'Beschreibungen der Spezies' };

/** Species traits: run-in paragraphs after the intro sentence of each species. */
export function parseSpeciesTraits(doc: Doc): ParsedFeature[] {
  const lines = section(doc.lines, SPECIES_SECTION[doc.lang], 'h2');
  const out: ParsedFeature[] = [];
  let species: string | undefined;
  let entry: Line[] = [];
  let page = 0;
  const flush = () => {
    if (!species) return;
    const body = entry.filter((l, idx) => !(l.role === 'sans' && idx < 4 && /:/.test(l.text))); // creature type, size, speed
    const md = bodyMarkdown(doc, body);
    const paragraphs = md.split('\n\n');
    let current: { name: string; paras: string[] } | undefined;
    const traits: { name: string; paras: string[] }[] = [];
    for (const p of paragraphs) {
      const m = p.match(/^\*\*(.+?)[.:]\*\*\s*(.*)$/s);
      if (m) {
        current = { name: tidy(m[1]), paras: [m[2]] };
        traits.push(current);
      } else if (current) current.paras.push(p);
    }
    for (const t of traits) {
      out.push({
        lang: doc.lang,
        kind: 'species',
        name: t.name,
        group: species,
        description: t.paras.filter(Boolean).join('\n\n'),
        refs: [],
        page,
      });
    }
  };
  for (const l of lines.slice(1)) {
    if (l.role === 'h3') {
      flush();
      species = lineText(l);
      entry = [];
      page = l.page;
      continue;
    }
    if (l.role === 'h4') continue;
    entry.push(l);
  }
  flush();
  return out;
}

const FEAT_SECTIONS: Record<Lang, [RegExp, FeatCategory][]> = {
  en: [[/^Origin Feats/, 'origin'], [/^General Feats/, 'general'], [/^Fighting Style Feats/, 'fighting-style'], [/^Epic Boon Feats/, 'epic-boon']],
  de: [[/^Herkunftstalente/, 'origin'], [/^Allgemeine Talente/, 'general'], [/^Kampfstil-Talente/, 'fighting-style'], [/^Epische-Gabe-Talente/, 'epic-boon']],
};
const FEAT_CHAPTER: Record<Lang, string> = { en: 'Feat Descriptions', de: 'Beschreibungen der Talente' };
const FEAT_PREREQ: Record<Lang, RegExp> = { en: /\(Prerequisite:\s*(.+)\)\s*$/, de: /\(Voraussetzung:\s*(.+)\)\s*$/ };

export function parseFeats(doc: Doc): ParsedFeature[] {
  const lines = section(doc.lines, FEAT_CHAPTER[doc.lang], 'h1');
  const out: ParsedFeature[] = [];
  let category: FeatCategory | undefined;
  let cur: { name: string; page: number; lines: Line[] } | undefined;
  const flush = () => {
    if (cur && category) {
      const n = italicLead(cur.lines);
      const lead = plainText(doc, cur.lines.slice(0, n));
      const pm = lead.match(FEAT_PREREQ[doc.lang]);
      const body = cur.lines.slice(n);
      out.push({
        lang: doc.lang,
        kind: 'feat',
        name: cur.name,
        featCategory: category,
        ...(pm ? { prerequisite: tidy(pm[1]) } : {}),
        description: bodyMarkdown(doc, body),
        refs: italicRefs(doc, body),
        page: cur.page,
      });
    }
    cur = undefined;
  };
  for (const l of lines.slice(1)) {
    if (l.role === 'h2') {
      flush();
      const c = FEAT_SECTIONS[doc.lang].find(([re]) => re.test(lineText(l)));
      category = c?.[1];
      continue;
    }
    if (l.role === 'h3') {
      flush();
      cur = { name: lineText(l), page: l.page, lines: [] };
      continue;
    }
    cur?.lines.push(l);
  }
  flush();
  return out;
}
