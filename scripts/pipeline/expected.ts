import type { CardType } from '../../src/model/schema';

/** Entries per type in SRD 5.2.1 (identical in the English and German PDF). */
export const EXPECTED_COUNTS: Record<CardType, number> = {
  spell: 339,
  condition: 15,
  action: 50, // 12 glossary actions + 38 weapons
  item: 258,
  feature: 316, // 162 class features + 58 subclass features + 38 class options + 41 species traits + 17 feats
};
