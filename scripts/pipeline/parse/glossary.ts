/**
 * Rules Glossary entries ("Rules Definitions" / "Regeldefinitionen").
 * Tagged entries: EN "Blinded [Condition]", "Dash [Action]"; DE "Blind (Zustand)", "Spurt (Aktion)".
 */
import type { Lang } from '../../../src/model/schema';
import { bodyMarkdown, section, splitEntries, type Doc } from '../doc';

export type GlossaryTag = 'condition' | 'action';

const TAGS: Record<Lang, Record<string, GlossaryTag>> = {
  en: { Condition: 'condition', Action: 'action' },
  de: { Zustand: 'condition', Aktion: 'action' },
};

export const GLOSSARY_SECTION: Record<Lang, string> = { en: 'Rules Definitions', de: 'Regeldefinitionen' };

export interface GlossaryEntry {
  lang: Lang;
  name: string;
  tag: GlossaryTag;
  page: number;
  /** Markdown with paragraphs and bold run-in headings. */
  markdown: string;
  /** Number of paragraphs starting with a run-in heading. */
  runIns: number;
}

export function parseTaggedName(heading: string, lang: Lang): { name: string; tag: GlossaryTag } | undefined {
  const m = lang === 'en' ? heading.match(/^(.*?)\s*\[(\w+)\]$/) : heading.match(/^(.*?)\s*\((\w+)\)$/);
  if (!m) return undefined;
  const tag = TAGS[lang][m[2]];
  return tag ? { name: m[1].trim(), tag } : undefined;
}

export function parseGlossary(doc: Doc): GlossaryEntry[] {
  const lines = section(doc.lines, GLOSSARY_SECTION[doc.lang], 'h1');
  const out: GlossaryEntry[] = [];
  for (const e of splitEntries(lines.slice(1), 'h3', ['title', 'h1'])) {
    const tagged = parseTaggedName(e.name, doc.lang);
    if (!tagged) continue;
    const markdown = bodyMarkdown(doc, e.lines);
    const runIns = markdown.split('\n\n').filter((p) => p.startsWith('**')).length;
    out.push({ lang: doc.lang, ...tagged, page: e.page, markdown, runIns });
  }
  return out;
}

/**
 * Condition text as intro paragraph(s) followed by a bullet list of the effects
 * ("- **Can't See.** …").
 */
export function effectsAsList(markdown: string): string {
  const paragraphs = markdown.split('\n\n');
  const intro: string[] = [];
  const effects: string[] = [];
  for (const p of paragraphs) {
    if (p.startsWith('**')) effects.push(`- ${p.replace(/\n/g, ' ')}`);
    else if (effects.length === 0) intro.push(p);
    else effects[effects.length - 1] += ` ${p}`;
  }
  return [...intro, effects.join('\n')].filter(Boolean).join('\n\n');
}
