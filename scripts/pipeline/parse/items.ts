/**
 * Magic items from "Magic Items A–Z" / "Magische Gegenstände A–Z".
 *
 * Entry layout: Name (h3), italic header line(s) "Category (Detail), Rarity (Requires Attunement …)",
 * then the rules text.
 */
import type { Lang, Rarity } from '../../../src/model/schema';
import { ITEM_CATEGORIES } from '../../../src/model/schema';
import { bodyMarkdown, italicRefs, plainText, section, splitEntries, type Doc } from '../doc';
import { tidy } from '../text';
import { numberWordsToDigits } from '../concepts';

type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const ITEM_SECTION: Record<Lang, string> = { en: 'Magic Items A–Z', de: 'Magische Gegenstände A–Z' };

const CATEGORY_NAMES: Record<Lang, Record<string, ItemCategory>> = {
  en: {
    'wondrous item': 'wondrous-item', armor: 'armor', weapon: 'weapon', potion: 'potion', ring: 'ring',
    rod: 'rod', scroll: 'scroll', staff: 'staff', wand: 'wand',
  },
  de: {
    'wundersamer gegenstand': 'wondrous-item', rüstung: 'armor', waffe: 'weapon', trank: 'potion', ring: 'ring',
    zepter: 'rod', schriftrolle: 'scroll', stab: 'staff', zauberstab: 'wand',
  },
};

const RARITY_NAMES: Record<Lang, [RegExp, Rarity][]> = {
  en: [
    [/^rarity varies/i, 'varies'], [/^very rare/i, 'very-rare'], [/^uncommon/i, 'uncommon'], [/^common/i, 'common'], [/^rare/i, 'rare'],
    [/^legendary/i, 'legendary'], [/^artifact/i, 'artifact'],
  ],
  de: [
    [/^seltenheit variiert/i, 'varies'], [/^sehr selten/i, 'very-rare'], [/^ungewöhnlich/i, 'uncommon'], [/^gewöhnlich/i, 'common'], [/^selten/i, 'rare'],
    [/^legendär/i, 'legendary'], [/^artefakt/i, 'artifact'],
  ],
};

const ATTUNEMENT: Record<Lang, RegExp> = {
  en: /\(Requires Attunement(?:\s+(by .*?))?\)\s*$/i,
  de: /\(erfordert Einstimmung(?:\s+(durch .*?))?\)\s*$/i,
};

export interface ItemHeader {
  category: ItemCategory;
  categoryDetail?: string;
  rarity: Rarity;
  /** All rarities mentioned (graded items list several). */
  rarities: Rarity[];
  /** Rarity text for graded items, e.g. "Uncommon (+1), Rare (+2), or Very Rare (+3)". */
  rarityText?: string;
  attunement: boolean;
  attunementDetail?: string;
}

export function parseItemHeader(text: string, lang: Lang): ItemHeader {
  let t = tidy(text);
  let attunement = false;
  let attunementDetail: string | undefined;
  const am = t.match(ATTUNEMENT[lang]);
  if (am) {
    attunement = true;
    attunementDetail = am[1]?.trim();
    t = t.slice(0, am.index).trim();
  }
  const m = t.match(/^([^,(]+?)\s*(?:\(([^)]*)\))?\s*,\s*(.+)$/);
  if (!m) throw new Error(`Unrecognised item header "${text}"`);
  const category = CATEGORY_NAMES[lang][m[1].trim().toLowerCase()];
  if (!category) throw new Error(`Unknown item category "${m[1]}" in "${text}"`);
  const rarityPart = m[3].trim();
  // Every rarity word in the rarity part (graded items: "Uncommon (+1), Rare (+2), or Very Rare (+3)").
  const rarities: Rarity[] = [];
  const words = rarityPart.split(/,\s*|\s+(?:or|oder)\s+/i).map((w) => w.replace(/^(?:or|oder)\s+/i, '').trim());
  for (const w of words) {
    const r = RARITY_NAMES[lang].find(([re]) => re.test(w));
    if (r && !rarities.includes(r[1])) rarities.push(r[1]);
  }
  if (rarities.length === 0) throw new Error(`No rarity in "${text}"`);
  const graded = rarities.length > 1;
  // Shield: "Armor (Shield)" is its own category in the card model.
  const isShield = category === 'armor' && /^(shield|schild)$/i.test(m[2]?.trim() ?? '');
  return {
    category: isShield ? 'shield' : category,
    categoryDetail: isShield ? undefined : m[2]?.trim(),
    rarity: graded ? 'varies' : rarities[0],
    rarities,
    rarityText: graded ? rarityPart : undefined,
    attunement,
    attunementDetail,
  };
}

export interface ParsedItem {
  lang: Lang;
  name: string;
  page: number;
  header: ItemHeader;
  headerText: string;
  description: string;
  /** Italic references in the text (spell and item names). */
  refs: string[];
  charges?: { count?: number; recharge?: string };
}

const CHARGES: Record<Lang, { count: RegExp; recharge: RegExp; format: (x: string) => string }> = {
  en: {
    count: /\b(?:has|have) (\d+) charges?\b/i,
    recharge: /\bregains? (all|\d+d\d+(?:\s*\+\s*\d+)?|\d+) expended charges? daily at dawn/i,
    format: (x) => `${x === 'all' ? 'all' : x} daily at dawn`,
  },
  de: {
    count: /\b(?:hat|verfügt über|besitzt) (\d+) Ladungen\b/i,
    recharge: /\berhält täglich im Morgengrauen (alle|\d+W\d+(?:\s*\+\s*\d+)?|\d+) verbrauchten? Ladungen? zurück/i,
    format: (x) => `${x === 'alle' ? 'alle' : x} täglich im Morgengrauen`,
  },
};

export function parseCharges(text: string, lang: Lang): ParsedItem['charges'] {
  const plain = numberWordsToDigits(text.replace(/\*\*/g, ''), lang);
  const c = CHARGES[lang];
  const count = plain.match(c.count);
  const recharge = plain.match(c.recharge);
  if (!count && !recharge) return undefined;
  return {
    ...(count ? { count: Number(count[1]) } : {}),
    ...(recharge ? { recharge: c.format(recharge[1].replace(/\s*\+\s*/, ' + ')) } : {}),
  };
}

export function parseItems(doc: Doc): { items: ParsedItem[]; errors: string[] } {
  const lines = section(doc.lines, ITEM_SECTION[doc.lang], 'h1');
  const items: ParsedItem[] = [];
  const errors: string[] = [];
  for (const e of splitEntries(lines.slice(1), 'h3', ['title', 'h1'])) {
    let i = 0;
    while (i < e.lines.length && e.lines[i].role === 'body' && e.lines[i].segments.every((s) => s.italic || !s.text.trim())) i++;
    const headerText = plainText(doc, e.lines.slice(0, i)).replace(/(\p{L})\(/u, '$1 (');
    try {
      const header = parseItemHeader(headerText, doc.lang);
      const description = bodyMarkdown(doc, e.lines.slice(i));
      items.push({
        lang: doc.lang,
        name: e.name,
        page: e.page,
        header,
        headerText,
        description,
        refs: italicRefs(doc, e.lines.slice(i)),
        charges: parseCharges(description, doc.lang),
      });
    } catch (err) {
      errors.push(`${e.name}: ${(err as Error).message}`);
    }
  }
  return { items, errors };
}
