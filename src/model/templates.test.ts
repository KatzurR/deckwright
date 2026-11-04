import { describe, expect, it } from 'vitest';
import { blankCard, pruneEmpty, validateCard } from './templates';
import { CARD_TYPES, cardSchema } from './schema';
import { fireball } from '../test/fixtures';

describe('blank cards', () => {
  it.each(CARD_TYPES)('%s template is valid once name and text are filled in', (type) => {
    const card = { ...blankCard(type), name: { de: 'Test' }, description: { de: 'Text' } };
    expect(cardSchema.safeParse(card).success).toBe(true);
    expect(card.source).toBe('custom');
  });
});

describe('validateCard', () => {
  it('requires a name and a rules text in at least one language', () => {
    const { card, errors } = validateCard(blankCard('condition'));
    expect(card).toBeUndefined();
    expect(Object.keys(errors).sort()).toEqual(['description', 'name']);
  });

  it('reports nested field paths', () => {
    if (fireball.type !== 'spell') throw new Error();
    const { errors } = validateCard({ ...fireball, spell: { ...fireball.spell, range: { kind: 'distance' } } });
    expect(errors['spell.range']).toBeDefined();
  });

  it('drops empty optional texts before validating', () => {
    if (fireball.type !== 'spell') throw new Error();
    const { card } = validateCard({ ...fireball, tags: [], spell: { ...fireball.spell, higherLevels: { de: '  ' } } });
    expect(card?.type === 'spell' && card.spell.higherLevels).toBeUndefined();
  });
});

describe('pruneEmpty', () => {
  it('removes empty strings, empty objects and NaN but keeps name/description', () => {
    expect(pruneEmpty({ a: '', b: ' x ', c: {}, d: { e: '' }, n: NaN, name: {}, description: {}, list: [1] }))
      .toEqual({ b: ' x ', name: {}, description: {}, list: [1] });
  });
});
