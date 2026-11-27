# Free card colour, derived accent and deck format version 2

The card colour of a deck changes from four named presets (`red`, `blue`, `green`, `purple`) to any hex colour. The user picks only the frame colour. The darker frame tone and the accent colour are computed from it, and the accent is darkened, keeping its hue, until it reaches 4.5:1 contrast against the parchment. We raise the deck file's `formatVersion` to 2 because v1 apps would otherwise reject the new hex values with an unclear validation error instead of the intended "newer version" message.

## Consequences

- The hand-tuned preset tones are gone on purpose. Old colour names are translated to their former frame hex once, when a deck is loaded from storage or imported from a v1 file, and are then treated like any other colour. Old decks may therefore look slightly different, which we accepted. Do not reintroduce the old tones as special cases.
- Without this translation on load, stored decks that still say `red` would fail schema validation and silently disappear from the deck list.
