// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { CardFace, bodyLineHeightPx } from './CardFace';
import { displayCard } from './format';
import { cardBlocks } from './measure';
import { actionSurge, blinded, fireball } from '../test/fixtures';

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
    const card = container.querySelector('.otc-card')!;
    expect(card.getAttribute('data-color')).toBe('red');
    expect(card.getAttribute('data-layout')).toBe('medallion');
    expect(card.getAttribute('style')).toContain('--accent: #8f2416');
    expect(card.classList.contains('otc-card--badge')).toBe(true);
    // the picture sits next to the properties, the rules text starts with a drop cap
    expect(container.querySelector('.otc-card__summary .otc-card__medallion')).not.toBeNull();
    expect(container.querySelector('.otc-card__summary--bare')).toBeNull();
    expect(container.querySelector('.otc-card__body p:first-child .otc-card__initial')?.textContent).toBe('D');
    expect(container.querySelector('.otc-card__body p:first-child')?.textContent).toMatch(/^Du /);
  });

  it('applies the deck colour and layout, and a school accent over the colour', () => {
    const display = displayCard(fireball, 'de', { cardColor: 'blue', cardLayout: 'window', colorBySchool: true });
    const { container } = render(<CardFace display={display} blocks={cardBlocks(display)} fontSize={6} />);
    const card = container.querySelector('.otc-card')!;
    expect(card.getAttribute('data-color')).toBe('blue');
    expect(card.getAttribute('data-layout')).toBe('window');
    expect(card.getAttribute('style')).toContain('--frame: #16223a');
    expect(card.getAttribute('style')).toContain('--accent: #8a2a12');
  });

  it('shows "(2/3)" and hides the property block on continuation cards', () => {
    const display = displayCard(fireball, 'de');
    const { container } = render(<CardFace display={display} blocks={[]} fontSize={4.8} first={false} part={2} total={3} />);
    expect(container.querySelector('.otc-card__title')?.textContent).toBe('Feuerball (2/3)');
    expect(container.querySelector('.otc-card__props')).toBeNull();
    expect(container.querySelector('.otc-card__medallion')).toBeNull();
  });

  it('shows the picture alone on cards without properties and starts later pages without a drop cap', () => {
    const display = displayCard(blinded, 'de');
    const { container } = render(<CardFace display={display} blocks={cardBlocks(display)} fontSize={6} />);
    expect(container.querySelector('.otc-card__summary--bare .otc-card__medallion')).not.toBeNull();
    // a one-line rules text gets no drop cap
    const short = displayCard(actionSurge, 'en');
    expect(render(<CardFace display={short} blocks={cardBlocks(short)} fontSize={6} />).container.querySelector('.otc-card__initial')).toBeNull();
    const next = render(<CardFace display={displayCard(fireball, 'de')} blocks={cardBlocks(displayCard(fireball, 'de'))} fontSize={6} first={false} part={2} total={2} />);
    expect(next.container.querySelector('.otc-card__initial')).toBeNull();
  });

  it('renders bullet lists for conditions and applies bleed', () => {
    const display = displayCard(blinded, 'en');
    const { container } = render(<CardFace display={display} blocks={cardBlocks(display)} fontSize={6} bleed={3} />);
    expect(container.querySelectorAll('.otc-card__body li')).toHaveLength(2);
    expect(container.querySelector('.otc-card--bleed')).not.toBeNull();
    expect(container.querySelector('.otc-card__badge')).toBeNull();
    expect(container.querySelector('.otc-card--badge')).toBeNull();
  });

  it('uses whole-pixel line heights', () => {
    expect(bodyLineHeightPx(6)).toBe(9);
    expect(bodyLineHeightPx(4.8)).toBe(7);
    for (let pt = 4.8; pt <= 6; pt += 0.2) expect(Number.isInteger(bodyLineHeightPx(pt))).toBe(true);
  });
});
