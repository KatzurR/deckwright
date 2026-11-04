// Writes e2e/fixtures/sample-deck.otc.json from the unit test fixtures (npx tsx e2e/make-fixture.ts).
import { writeFileSync } from 'node:fs';
import { ALL_FIXTURES } from '../src/test/fixtures';
import { serializeDeck } from '../src/model/deckFile';
import { cardSchema } from '../src/model/schema';

const deck = {
  id: 'e2e-sample-deck',
  name: 'Beispieldeck',
  lang: 'de' as const,
  cards: ALL_FIXTURES.map((c) => cardSchema.parse(c)),
  createdAt: '2026-11-03T00:00:00.000Z',
  updatedAt: '2026-11-03T00:00:00.000Z',
};
writeFileSync(new URL('./fixtures/sample-deck.otc.json', import.meta.url), serializeDeck(deck, new Date('2026-11-03T00:00:00Z')));
console.log('e2e/fixtures/sample-deck.otc.json written');
