// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { BlankCardPreview } from './widgets';

describe('BlankCardPreview', () => {
  it('renders an empty card face in the deck colour and layout', () => {
    const { container } = render(<BlankCardPreview options={{ colorBySchool: false, cardColor: 'blue', cardLayout: 'window' }} />);
    const card = container.querySelector('.otc-card')!;
    expect(card.getAttribute('data-color')).toBe('blue');
    expect(card.getAttribute('data-layout')).toBe('window');
    // frame and parchment only: no text, no picture, no properties, no level shield
    expect(card.textContent).toBe('');
    expect(container.querySelector('.otc-card__medallion')).toBeNull();
    expect(container.querySelector('.otc-card__props')).toBeNull();
    expect(container.querySelector('.otc-card__badge')).toBeNull();
    expect(container.querySelector('.otc-card__leather')).not.toBeNull();
    expect(container.querySelector('.otc-card__corners')).not.toBeNull();
  });
});
