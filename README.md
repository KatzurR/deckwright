# open-tabletop-cards

An open-source tool for turning D&D rules content — spells, actions, class features, abilities, items, and conditions — into small, printable reference cards you can keep at the table.

> **Status:** MVP (phase 1, local use). The web app runs on your own computer; it is not published online yet. See the [user guide](docs/USER_GUIDE.md) (German) and the [specification](docs/SPEC.md).

## Why

Character sheets get crowded. Flipping through a rulebook mid-combat slows the game down. A stack of small cards — one per spell or ability — keeps the essentials in front of the player: range, duration, components, damage, and a short rules summary.

open-tabletop-cards makes those cards quick to create, consistent in layout, and easy to print.

## Features

- **Five card types** – spell, action, feature, item, condition – in poker size (63 × 88 mm), card design "Grimoire Codex" ([docs/design](docs/design/README.md))
- **Bundled SRD 5.2.1 catalog in German and English**: 339 spells, 15 conditions, 50 actions (incl. 38 weapons), 258 magic items, 316 class features, species traits and feats – searchable, filterable, added to a deck with one click
- **Card editor** with a live preview that matches the print exactly; long texts shrink to a minimum size and then continue on follow-up cards ("Name (2/3)")
- **Decks**: sort, duplicate, copy cards between decks, reorder by drag & drop; stored automatically in the browser (IndexedDB)
- **Export**: PDF sheets (A4 or US Letter, 3 × 3 cards, cut marks, optional 3 mm bleed), PNG per card (300 dpi, ZIP), direct browser print
- **Deck files**: JSON export/import with a versioned, documented format ([docs/deck-format.md](docs/deck-format.md))
- **Two languages**: user interface and cards in German or English, independently of each other; German cards follow the terminology of the official German SRD and use metres

Everything runs in the browser. There is no server, no account and no external service at runtime.

## Installation

Requirements: [Node.js](https://nodejs.org/) 18.18 or newer (tested with 18.19) and Git.

```bash
git clone https://github.com/KatzurR/open-tabletop-cards.git
cd open-tabletop-cards
npm install
npm run dev
```

Open http://localhost:5173 in Chrome, Firefox, Edge or Safari. The server only listens on `localhost`.

A production build is created with `npm run build` and can be checked with `npm run preview` (http://localhost:4173). The `dist/` folder contains only static files.

The SRD catalog is part of the repository (`data/catalog/`), so you do not need to run the data pipeline to use the app. The [user guide](docs/USER_GUIDE.md) explains every step in detail, including printing at 100 % scale.

## Development

| Command | Purpose |
|---|---|
| `npm run dev` | Development server on http://localhost:5173 |
| `npm run build` / `npm run preview` | Type check, production build, local preview |
| `npm test` | Unit and integration tests (Vitest): data model, rendering, export, data pipeline |
| `npm run test:e2e` | End-to-end tests (Playwright) in Chromium and Firefox: catalog, editor, drag & drop, PDF/PNG/print dimensions, JSON round trip. Once: `npx playwright install chromium firefox` |
| `npm run pipeline` | Rebuild the SRD catalog from Open5e and both SRD PDFs (needs Poppler and network) |
| `npm run pipeline:offline` | Same, from the cached sources in `data/cache/` |
| `npm run schema` | Regenerate the JSON schema of the deck format |
| `npm run textures` | Regenerate the card textures (PNG) |

The data pipeline ([scripts/pipeline](scripts/pipeline)) takes structure and keys from the Open5e API and the rules texts from the English and German SRD 5.2.1 PDFs (Poppler `pdftohtml -xml`). English and German entries are paired by a fingerprint of language-independent values; manual assignments in `data/mapping/*.json` are kept on every run. The pipeline fails if an entry has no German counterpart or a German entry is assigned twice; the result is summarised in [data/pipeline-report.md](data/pipeline-report.md).

Project layout:

```
src/model     card and deck model (zod), units, deck operations, deck file format
src/render    card rendering (mm/pt), text fitting and follow-up cards
src/export    PDF, PNG, browser print
src/catalog   catalog loading and search
src/storage   IndexedDB
src/ui        React user interface
src/i18n      card vocabulary DE/EN, UI translations
scripts       data pipeline, schema and texture generators
data          generated catalog, mapping files, pipeline report
e2e           Playwright tests
```

## Content and licensing

The code in this repository is released under the [MIT License](LICENSE).

open-tabletop-cards is compatible with fifth edition (2024 rules). The only rules content included is the System Reference Document 5.2.1, in its official English and German versions (see [srd/](srd/)):

> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Card icons are from [game-icons.net](https://game-icons.net) (CC BY 3.0, [license](public/licenses/CC-BY-3.0.txt)). The card font is TeX Gyre Schola (GUST Font License, [license](public/licenses/GUST-FONT-LICENSE.txt)).

Any other content you enter, for example from books you own, stays in your own files and is your responsibility.

## Contributing

Ideas, bug reports and feedback are welcome via [GitHub Issues](https://github.com/KatzurR/open-tabletop-cards/issues).

## License

[MIT](LICENSE) © 2026 KatzurR
