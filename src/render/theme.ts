/** Colours of the "Grimoire Codex" design (docs/design/README.md). */
import type { Card, School } from '../model/schema';
import type { IconName } from './icons';

export const PALETTE = {
  leather: '#4b2a16',
  gold: '#c79a3e',
  parchment: '#efe1bd',
  medallion: '#f7ecd2',
  text: '#3b2614',
  line: '#6b4523',
} as const;

/** Accent per card type (SPEC §5). Spells use the evocation red unless coloured by school. */
export const TYPE_ACCENT: Record<Card['type'], string> = {
  spell: '#8a2a12',
  action: '#7a3a10',
  feature: '#2e5a3a',
  item: '#1f4e6e',
  condition: '#5b2d6e',
};

/** Accent per school of magic; all keep a contrast ratio ≥ 4.5 against the parchment. */
export const SCHOOL_ACCENT: Record<School, string> = {
  abjuration: '#24527a',
  conjuration: '#7a4a0c',
  divination: '#1f5f66',
  enchantment: '#8a1f5a',
  evocation: '#8a2a12',
  illusion: '#4f2f86',
  necromancy: '#3a3a2a',
  transmutation: '#3f5f12',
};

export const TYPE_ICON: Record<Card['type'], IconName> = {
  spell: 'spell-book',
  action: 'crossed-swords',
  feature: 'laurel-crown',
  item: 'swap-bag',
  condition: 'broken-heart',
};

export const SCHOOL_ICON: Record<School, IconName> = {
  abjuration: 'magic-shield',
  conjuration: 'magic-portal',
  divination: 'third-eye',
  enchantment: 'charm',
  evocation: 'fireball',
  illusion: 'domino-mask',
  necromancy: 'skull-crossed-bones',
  transmutation: 'cycle',
};

export function accentFor(card: Card, colorBySchool: boolean): string {
  if (card.type === 'spell' && colorBySchool) return SCHOOL_ACCENT[card.spell.school];
  return TYPE_ACCENT[card.type];
}

export function iconFor(card: Card): IconName {
  return card.type === 'spell' ? SCHOOL_ICON[card.spell.school] : TYPE_ICON[card.type];
}

/** WCAG relative luminance contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
