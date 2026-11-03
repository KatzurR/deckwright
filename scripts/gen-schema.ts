// Regenerates docs/deck-format.schema.json from the zod schema (npm run schema).
import { writeFileSync } from 'node:fs';
import { deckFileJsonSchema } from '../src/model/deckFile';

writeFileSync(new URL('../docs/deck-format.schema.json', import.meta.url), `${JSON.stringify(deckFileJsonSchema(), null, 2)}\n`);
console.log('docs/deck-format.schema.json written');
