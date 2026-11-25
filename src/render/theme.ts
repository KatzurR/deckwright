/** Colours of the "Beschlag" card design (docs/design/README.md). */
import type { Card, CardColor, School } from '../model/schema';
import type { IconName } from './icons';

/** Colours shared by every card colour; keep in sync with the variables in card.css. */
export const PALETTE = {
  gold: '#d6aa52',
  parchment: '#f0e2c0',
  text: '#2b1d12',
  line: '#7a5630',
} as const;

export interface CardColorTheme {
  /** Frame (binding) around the parchment. */
  frame: string;
  /** Darker frame tone: ring around the parchment, medallion background. */
  frameDeep: string;
  /** Title, labels, drop cap, divider lozenges and the picture background. */
  accent: string;
}

/** The selectable card colours (deck option `cardColor`). Accents keep 4.5:1 against the parchment. */
export const CARD_COLOR_THEMES: Record<CardColor, CardColorTheme> = {
  red: { frame: '#4a1715', frameDeep: '#2c0c0b', accent: '#8f2416' },
  blue: { frame: '#16223a', frameDeep: '#0e1729', accent: '#1f4a80' },
  green: { frame: '#163226', frameDeep: '#0c2018', accent: '#2b6142' },
  purple: { frame: '#2e1c47', frameDeep: '#1c1030', accent: '#5d2d85' },
};

/** Accent per school of magic (deck option `colorBySchool`); all keep 4.5:1 against the parchment. */
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

/** Accent that replaces the card colour's accent: the school colour for spells, if enabled. */
export function accentOverride(card: Card, colorBySchool: boolean): string | undefined {
  return card.type === 'spell' && colorBySchool ? SCHOOL_ACCENT[card.spell.school] : undefined;
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
