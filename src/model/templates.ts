/** Blank cards for the editor and validation helpers (SPEC §6.4). */
import { cardSchema, type Card, type CardType } from './schema';
import { newId } from './deck';

export function blankCard(type: CardType): Card {
  const base = { id: newId(), name: {}, description: {}, source: 'custom' as const };
  switch (type) {
    case 'spell':
      return {
        ...base, type,
        spell: {
          level: 1, school: 'evocation', castingTime: { unit: 'action' }, ritual: false, range: { kind: 'distance', feet: 60 },
          components: { verbal: true, somatic: true, material: false }, duration: { kind: 'instantaneous' },
          concentration: false, attack: false, classes: [],
        },
      };
    case 'action':
      return { ...base, type, action: { actionType: 'action' } };
    case 'feature':
      return { ...base, type, feature: { origin: { kind: 'class' }, activation: 'passive' } };
    case 'item':
      return { ...base, type, item: { category: 'wondrous-item', rarity: 'uncommon', attunement: false } };
    case 'condition':
      return { ...base, type };
  }
}

/** Drop empty strings and empty localized texts so optional fields stay absent. */
export function pruneEmpty<T>(value: T): T {
  if (Array.isArray(value)) return value.map(pruneEmpty) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const pruned = pruneEmpty(v);
      if (pruned === undefined || pruned === '') continue;
      if (pruned && typeof pruned === 'object' && !Array.isArray(pruned) && Object.keys(pruned).length === 0 && k !== 'name' && k !== 'description') continue;
      out[k] = pruned;
    }
    return out as T;
  }
  if (typeof value === 'string') return (value.trim() === '' ? '' : value) as T;
  if (typeof value === 'number' && Number.isNaN(value)) return undefined as T;
  return value;
}

export type ValidationErrors = Record<string, string>;

/** Validate a draft; returns the cleaned card or errors keyed by field path ("name", "spell.range"). */
export function validateCard(draft: Card): { card?: Card; errors: ValidationErrors } {
  const result = cardSchema.safeParse(pruneEmpty(draft));
  if (result.success) return { card: result.data, errors: {} };
  const errors: ValidationErrors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.filter((p) => typeof p === 'string').join('.') || '(card)';
    errors[path] ??= issue.message;
  }
  return { errors };
}
