// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { CardFace, bodyLineHeightPx } from './CardFace';
import { displayCard } from './format';
import { cardBlocks } from './measure';
import { blinded, fireball } from '../test/fixtures';

describe('CardFace', () => {
  it('renders title, subtitle, properties, rule text, closing paragraph, footer and badge', () => {
    const display = displayCard(fireball, 'de');
    const { container } = render(<CardFace display={display} blocks={cardBlocks(display)} fontSize={6} />);
    const text = container.textContent ?? '';
    expect(container.querySelector('.otc-card__title')?.textContent).toBe('Feuerball');
    expect(text).toContain('Hervorrufungszauber 3. Grades');
    expect(container.querySelectorAll('.otc-card__prop')).toHaveLength(6);
    expect(text).toContain('* eine Kugel aus Fledermaus-Guano und Schwefel');
    expect(container.querySelector('.otc-card__body strong em, .otc-card__body em')?.textContent).toBe('Auf höheren Graden.');
    expect(container.querySelector('.otc-card__badge')?.textContent).toBe('3');
    expect(container.querySelector('.otc-card')?.getAttribute('style')).toContain('--accent: #8a2a12');
  });

  it('shows "(2/3)" and hides the property block on continuation cards', () => {
    const display = displayCard(fireball, 'de');
    const { container } = render(<CardFace display={display} blocks={[]} fontSize={4.8} first={false} part={2} total={3} />);
    expect(container.querySelector('.otc-card__title')?.textContent).toBe('Feuerball (2/3)');
    expect(container.querySelector('.otc-card__props')).toBeNull();
  });

  it('renders bullet lists for conditions and applies bleed', () => {
    const display = displayCard(blinded, 'en');
    const { container } = render(<CardFace display={display} blocks={cardBlocks(display)} fontSize={6} bleed={3} />);
    expect(container.querySelectorAll('.otc-card__body li')).toHaveLength(2);
    expect(container.querySelector('.otc-card--bleed')).not.toBeNull();
    expect(container.querySelector('.otc-card__badge')).toBeNull();
  });

  it('uses whole-pixel line heights', () => {
    expect(bodyLineHeightPx(6)).toBe(9);
    expect(bodyLineHeightPx(4.8)).toBe(7);
    for (let pt = 4.8; pt <= 6; pt += 0.2) expect(Number.isInteger(bodyLineHeightPx(pt))).toBe(true);
  });
});
