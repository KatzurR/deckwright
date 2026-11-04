/**
 * Magic item cards: one card per entry of the SRD (PDF), texts from both PDFs.
 * Open5e lists ~760 srd-2024 magic items because it expands variants ("Battleaxe (+1)",
 * "Armor of Resistance (Breastplate)"); those are collapsed onto the PDF entry and only used
 * as a cross-check.
 */
import type { ItemCard } from '../../../src/model/schema';
import type { Doc } from '../doc';
import { conceptTokens, emptyDict, type ConceptDict } from '../concepts';
import type { Candidate } from '../match';
import { parseItems, type ParsedItem } from '../parse/items';
import { normaliseName, slugify } from '../text';
import { assignGerman, assignmentReport, byEnglishName, type TypeResult } from './common';

export interface Open5eMagicItem {
  key: string;
  name: string;
  rarity: { key: string } | null;
  requires_attunement: boolean;
}

export function itemKey(enName: string): string {
  return `srd-2024_${slugify(enName.replace(/,\s*\+1, \+2, or \+3$/, ' plus 1 2 3'))}`;
}

export function itemFingerprint(i: ParsedItem): string {
  return [i.header.category, i.header.rarities.join('+'), i.header.attunement ? 'A' : ''].join('|');
}

export function itemCandidate(i: ParsedItem, id: string, dict: ConceptDict): Candidate {
  return {
    id,
    primary: itemFingerprint(i),
    tokens: conceptTokens(i.description, i.lang, dict, i.refs),
    length: i.description.length,
  };
}

/** Base name of an Open5e variant: "Armor of Resistance (Breastplate)" → "armor of resistance". */
function baseName(name: string): string {
  return normaliseName(name.replace(/\s*\([^)]*\)\s*$/, ''));
}

export function buildItems(open5e: Open5eMagicItem[], en: Doc, de: Doc, dict: ConceptDict = emptyDict()): TypeResult {
  const warnings: string[] = [];
  const enParsed = parseItems(en);
  const deParsed = parseItems(de);
  warnings.push(...enParsed.errors.map((e) => `EN PDF: ${e}`), ...deParsed.errors.map((e) => `DE PDF: ${e}`));

  const keyed = enParsed.items.map((i) => ({ key: itemKey(i.name), i }));
  const dupKeys = keyed.filter((k, idx) => keyed.findIndex((x) => x.key === k.key) !== idx);
  for (const d of dupKeys) warnings.push(`duplicate item key ${d.key}`);

  // Cross-check with Open5e (variants collapse onto their base name).
  const open5eBases = new Map<string, Open5eMagicItem[]>();
  for (const o of open5e) {
    const b = baseName(o.name);
    open5eBases.set(b, [...(open5eBases.get(b) ?? []), o]);
  }
  let withOpen5e = 0;
  const usedBases = new Set<string>();
  for (const { i } of keyed) {
    const b = normaliseName(i.name.replace(/,\s*\+1, \+2, or \+3$/, ''));
    if (open5eBases.has(b)) {
      withOpen5e++;
      usedBases.add(b);
    } else warnings.push(`no Open5e entry for PDF item "${i.name}"`);
  }
  const open5eOnly = [...open5eBases.keys()].filter((b) => !usedBases.has(b));

  const assignment = assignGerman(
    'item',
    keyed.map(({ key, i }) => itemCandidate(i, key, dict)),
    deParsed.items.map((i) => itemCandidate(i, i.name, dict)),
  );
  const deByName = new Map(deParsed.items.map((i) => [i.name, i]));

  const entries: ItemCard[] = [];
  for (const { key, i: e } of keyed) {
    const deName = assignment.mapping[key]?.de;
    const d = deName ? deByName.get(deName) : undefined;
    if (!d) continue;
    if (itemFingerprint(e) !== itemFingerprint(d)) {
      warnings.push(`${e.name} ↔ ${d.name}: header differs ("${e.headerText}" / "${d.headerText}")`);
    }
    const h = e.header;
    const loc = (en?: string, deText?: string) => (en || deText ? { en, de: deText } : undefined);
    const charges =
      e.charges || d.charges
        ? {
            ...(e.charges?.count ?? d.charges?.count ? { count: e.charges?.count ?? d.charges?.count } : {}),
            ...(e.charges?.recharge || d.charges?.recharge
              ? { recharge: { en: e.charges?.recharge, de: d.charges?.recharge } }
              : {}),
          }
        : undefined;
    if (e.charges?.count !== d.charges?.count) {
      warnings.push(`${e.name}: charges EN ${e.charges?.count ?? '–'} / DE ${d.charges?.count ?? '–'}`);
    }
    const categoryDetail = loc(h.categoryDetail, d.header.categoryDetail);
    const rarityText = loc(h.rarityText, d.header.rarityText);
    const attunementDetail = loc(h.attunementDetail, d.header.attunementDetail);
    entries.push({
      id: key,
      srdKey: key,
      type: 'item',
      source: 'srd-5.2.1',
      name: { en: e.name, de: d.name },
      description: { en: e.description, de: d.description },
      item: {
        category: h.category,
        ...(categoryDetail ? { categoryDetail } : {}),
        rarity: h.rarity,
        ...(rarityText ? { rarityText } : {}),
        attunement: h.attunement,
        ...(attunementDetail ? { attunementDetail } : {}),
        ...(charges && Object.keys(charges).length ? { charges } : {}),
      },
    });
  }
  entries.sort(byEnglishName);

  return {
    type: 'item',
    entries,
    mapping: assignment.mapping,
    report: {
      type: 'item',
      counts: {
        'Open5e (srd-2024, incl. variants)': open5e.length,
        'Open5e base names': open5eBases.size,
        'EN PDF': enParsed.items.length,
        'DE PDF': deParsed.items.length,
        'PDF entries with Open5e counterpart': withOpen5e,
        'Open5e base names without PDF entry (expanded generic variants)': open5eOnly.length,
        catalog: entries.length,
      },
      ...assignmentReport(assignment),
      warnings: [...warnings, `Open5e base names without own PDF entry: ${open5eOnly.join(', ')}`],
    },
  };
}
