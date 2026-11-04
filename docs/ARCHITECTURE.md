# Architecture

Technical documentation for developers. What the app does and why is described in the product specification [SPEC.md](SPEC.md); this document describes how the code does it. File references are relative to the repository root.

Contents:

1. [Overview and data flow](#1-overview-and-data-flow)
2. [Technology](#2-technology)
3. [Module map](#3-module-map)
4. [Data model](#4-data-model)
5. [Rendering](#5-rendering)
6. [Export](#6-export)
7. [Storage](#7-storage)
8. [Internationalisation](#8-internationalisation)
9. [Data pipeline](#9-data-pipeline)
10. [Testing](#10-testing)
11. [How-tos](#11-how-tos)
12. [Legal notices in the code](#12-legal-notices-in-the-code)
13. [Technical decisions](#13-technical-decisions)

## 1. Overview and data flow

Deckwright is a static single-page app (React + Vite + TypeScript). There is no backend: the SRD catalog, fonts, icons and textures are bundled with the app, and decks are stored in the browser. A separate Node data pipeline, which is not part of the app bundle, generates the catalog once and commits it to the repository.

```
 build time (npm run pipeline)                    runtime (browser)
 ─────────────────────────────                    ────────────────────────────────────────────────────────
 Open5e API ─┐                                    data/catalog/*.json ──► src/catalog (load, search)
 SRD PDF EN ─┼─► scripts/pipeline ─► data/catalog        │
 SRD PDF DE ─┘          │            data/mapping        ▼ adopt (new ids, srdKey kept)
                        └──────────► pipeline-report     Deck (src/model) ◄──► IndexedDB (src/storage)
                                                         │                ◄──► deck file .deckwright.json
                                                         ▼ displayCard(card, deck language)
                                                  CardDisplay (src/render/format.ts)
                                                         ▼ paginate + measure (font size, continuation cards)
                                                  LaidOutCard[] (src/render/measure.tsx)
                                                         ▼ <CardFace> (HTML/CSS in mm)
                                       ┌─────────────────┼──────────────────────┐
                                       ▼                 ▼                      ▼
                                 preview (UI)    html-to-image @ 300 dpi    PrintSheets + @page
                                                   ├─► PNG + ZIP            (browser print)
                                                   └─► pdf-lib sheets (PDF)
```

1. **Catalog → deck.** `loadCatalog()` lazily imports the generated JSON files and validates them. Selected entries are copied into a deck by `adoptCatalogCards()`: each card gets a new `id` and keeps its `srdKey`.
2. **Deck → card model.** A deck is an ordered list of language-neutral cards (`src/model/schema.ts`). Every change goes through pure functions in `src/model/deck.ts` and is saved automatically by `DeckStore`.
3. **Card model → display model.** `displayCard()` (`src/render/format.ts`) turns a card into everything the card face shows in the deck's card language: title, subtitle, accent colour, icon, property block, footnotes, rules text, closing paragraph, footer and badge.
4. **Display model → pages.** `layoutCards()` (`src/render/measure.tsx`) finds the largest rules-text size that fits and, if necessary, splits the text over continuation cards.
5. **Pages → output.** The same `CardFace` component renders the preview, the 300 dpi images for PNG/PDF and the browser print sheets, so all outputs match.

## 2. Technology

| Area | Decision | Reason |
|---|---|---|
| Language | TypeScript | Data model and data pipeline benefit from type checking |
| Build | Vite | Standard, fast, static output |
| UI | React | Most widespread, makes outside contributions easier |
| Data model | zod | One schema for types, editor validation and deck file import |
| Storage | IndexedDB via Dexie | Sufficient for many decks, simple API |
| Card rendering | HTML/CSS with dimensions in mm | One source for preview, print and export |
| PNG export | html-to-image, card DOM rendered at 300 dpi | No server needed |
| PDF export | pdf-lib, cards as 300 dpi images placed on A4/Letter, cut marks as vectors | Exact dimensions, independent of the browser's print dialog |
| Browser print | Print CSS with `@page` | Alternative with vector text |
| ZIP | fflate | Small, no recompression of PNG data |
| i18n | i18next / react-i18next for the UI, own term tables for the cards | Proven, supports plural forms |
| Data pipeline | Node scripts in TypeScript (tsx), PDF text via Poppler `pdftohtml -xml` | Only runs when generating the catalog, not in the app |
| Tests | Vitest (unit, integration, pipeline), Playwright (end-to-end in Chromium and Firefox) | Pipeline results and print dimensions must be demonstrably correct |

Exact versions are pinned in [package.json](../package.json). The dev server and the preview server only listen on `localhost` with fixed ports 5173 and 4173 (`vite.config.ts`). `base` is relative (`./`) so that the static build also works from a sub-directory; it can be overridden with the environment variable `DECKWRIGHT_BASE`.

## 3. Module map

| Module | Responsibility | Key files |
|---|---|---|
| `src/model` | Card and deck model, pure deck operations, units, Markdown subset, deck file format, legal texts | `schema.ts` (zod schemas), `deck.ts` (immutable deck operations), `templates.ts` (blank cards, validation), `units.ts` (feet/metres, dice), `markdown.ts`, `deckFile.ts`, `legal.ts` |
| `src/render` | Card face, display model, text fitting and continuation cards, design tokens | `format.ts` (`displayCard`), `CardFace.tsx`, `card.css`, `paginate.ts` (algorithm), `measure.tsx` (browser measurement), `theme.ts` (colours, icon per type/school), `icons.ts` (game-icons.net paths), `fonts/`, `textures/` |
| `src/export` | PDF, PNG/ZIP and browser print, sheet geometry | `layout.ts` (sheet geometry in mm), `render.tsx` (300 dpi rasterising), `pdf.ts`, `png.ts` (pHYs, encoder), `PrintSheets.tsx` + `print.css`, `fonts.ts` (embedded font CSS), `files.ts` (ZIP, downloads) |
| `src/catalog` | Loading and searching the bundled catalog | `catalog.ts` (`loadCatalog`, `loadWeapons`), `search.ts` (normalisation, filters) |
| `src/storage` | IndexedDB persistence and small browser preferences | `db.ts` (`CardsDatabase`, `DeckStore`), `preferences.ts` |
| `src/ui` | React user interface | `App.tsx` (views, import, storage notice), `state.tsx` (app state, `useLaidOutCards`), `DeckView.tsx`, `CatalogView.tsx`, `ExportDialog.tsx`, `AboutView.tsx`, `editor/` (`Editor.tsx`, `forms.tsx` per card type, `inputs.tsx`), `widgets.tsx` |
| `src/i18n` | UI translations and card vocabulary | `ui.ts` (i18next resources, language detection), `terms.ts` (card terms per card language) |
| `scripts/pipeline` | Builds `data/catalog`, `data/mapping` and `data/pipeline-report.md` from Open5e and both SRD PDFs | `run.ts`, `sources.ts`, `pdf/` (XML parsing, line layout), `doc.ts`, `text.ts`, `parse/` (per entry kind), `build/` (per card type), `match.ts`, `concepts.ts`, `mapping.ts`, `report.ts`, `expected.ts` |
| `scripts` | Other generators | `gen-schema.ts` (`npm run schema`), `gen-textures.ts` (`npm run textures`) |
| `e2e` | Playwright tests and their fixture | `*.spec.ts`, `make-fixture.ts`, `fixtures/sample-deck.deckwright.json` |

`src/model` has no dependency on React or the browser (except `crypto.randomUUID`, with a fallback), so the pipeline reuses it (schemas, units).

## 4. Data model

The zod schemas in [src/model/schema.ts](../src/model/schema.ts) are the single source of truth: TypeScript types are inferred from them (`z.infer`), the editor validates with them (`validateCard` in `templates.ts`), deck files and stored decks are checked against them, and the pipeline validates every generated card with them.

- **Card types:** `spell`, `action`, `feature`, `item`, `condition` (`CARD_TYPES`). `cardSchema` is a discriminated union on `type`; each type except `condition` has exactly one object with its type-specific fields (`spell`, `action`, `feature`, `item`). The fields are described in [SPEC §4](SPEC.md#4-card-types).
- **Common fields:** `id`, `srdKey` (catalog reference), `name` and `description` (both required in at least one language, `requiredTextSchema`), `source` (`srd-5.2.1` or `custom`), `tags`.
- **Keys, not texts:** structured values (school, damage type, class, ability, mastery …) are stored as language-neutral keys and translated when rendering. Only free text is stored per language as `{ de?, en? }` (`localizedTextSchema`). `localized()` in `deck.ts` falls back to the other language when the deck language is missing.
- **Units:** distances are stored in feet. `src/model/units.ts` converts them for German cards with the factors of the German SRD (5 ft = 1.5 m, `METRES_PER_FOOT = 0.3`; 1 mile = 1.6 km) and formats numbers with the decimal separator of the language. Dice are stored in English notation (`8d6`) and shown as `8W6` on German cards (`formatDice`). The editor converts entered metres back to feet (`metresToFeet`).
- **Decks:** `deckSchema` – `id`, `name`, `lang` (card language), `options.colorBySchool`, `cards`, `createdAt`, `updatedAt`. Deck operations in `deck.ts` are pure and return new objects (`addCard`, `moveCard`, `sortCards`, `duplicateCards`, `copyCardsToDeck`, `setDeckLanguage` …).
- **Catalog files:** `catalogFileSchema` (`formatVersion` 1, `type`, `source: 'srd-5.2.1'`, `entries`); every entry has `id === srdKey`.
- **Deck files:** `deckFileSchema` in [src/model/deckFile.ts](../src/model/deckFile.ts) wraps a deck with `formatVersion` (currently 1), `generator` and `exportedAt`. `parseDeckFile()` rejects newer versions and reports validation problems with paths (`deck.cards.0.spell.level`). The JSON Schema [docs/deck-format.schema.json](deck-format.schema.json) is generated from the zod schema with `npm run schema`. The format is documented in [deck-format.md](deck-format.md).
- **Markdown subset:** `src/model/markdown.ts` parses rules texts into blocks (`p`, `ul`) of inline runs (bold, italic). Other Markdown stays literal text.

## 5. Rendering

### Card face

`CardFace` ([src/render/CardFace.tsx](../src/render/CardFace.tsx)) renders one physical card from a `CardDisplay`, the blocks for this page, the rules-text font size and an optional bleed. It is pure presentation; which text goes on which page is decided before. All dimensions in [src/render/card.css](../src/render/card.css) are in `mm` and `pt`: the card is `63mm × 88mm` plus `2 × --bleed`, the leather band is 2.9 mm. The layers are leather, trim with parchment, medallion with icon, content (header, divider, property block, footnotes, body, footer) and the badge in the bottom band. Colours and the icon per type or school of magic come from `theme.ts`; the design is described in [design/README.md](design/README.md).

- **Fonts:** TeX Gyre Schola (four OpenType files in `src/render/fonts/`), declared with `@font-face` in `card.css`. `cardFontsReady()` waits for all four faces before measuring.
- **Textures:** leather and parchment are small tileable PNGs in `src/render/textures/`, generated deterministically by `scripts/gen-textures.ts` (`npm run textures`), see [§13](#13-technical-decisions).
- **Icons:** SVG path data from game-icons.net in `src/render/icons.ts` (`viewBox 0 0 512 512`, foreground path only), each with `slug` and `author`.
- **Title:** a `useLayoutEffect` shrinks long titles from 14.4 pt in steps of 0.4 pt down to 8 pt and only wraps below that (`TITLE_MAX_PT`, `TITLE_MIN_PT`).
- **Line height:** the rules-text line height is rounded to whole CSS pixels (`bodyLineHeightPx`, leading 1.15).

### Text fitting and continuation cards

The algorithm in [src/render/paginate.ts](../src/render/paginate.ts) is pure; whether a page fits is decided by an injected `fits` function.

1. Try the font sizes from `FONT.max` (6.0 pt) down to `FONT.min` (4.8 pt) in steps of `FONT.step` (0.2 pt) with all blocks on the first card. The first size that fits wins (`overflow: 'none'` or `'shrunk'`).
2. Otherwise split at the minimum size (`overflow: 'split'`): fill each page with as many whole blocks as fit (binary search), then as many words of the next block as fit; the rest goes to the next page. Continuation pages repeat the header but have no property block and no footnotes, so they hold more text. A list item split across cards continues without a bullet (`continued`). A hard cap of 50 pages protects against a `fits` function that never accepts anything.
3. The card title gets the suffix "(part/total)".

The browser side in [src/render/measure.tsx](../src/render/measure.tsx) renders each candidate page off-screen with `flushSync` into a hidden React root and compares `scrollHeight` and `clientHeight` of the body (`[data-card-body]`). Results are cached per display model and language. In the UI, `useLaidOutCards()` (`src/ui/state.tsx`) runs the layout asynchronously, outside the React render; the editor debounces it by 120 ms. The closing paragraph (e.g. "Using a Higher-Level Spell Slot.") is appended as a block with a bold italic lead-in (`closingBlock`).

## 6. Export

All outputs use the laid-out pages from §5 and the sheet geometry from [src/export/layout.ts](../src/export/layout.ts).

### Sheet layout

`sheetLayout(paper, bleed)` returns, in millimetres with the origin at the top left:

- the page (A4 210 × 297 mm, US Letter 215.9 × 279.4 mm) and the centred 3 × 3 grid of 63 × 88 mm cards without gaps;
- per slot the trim box, the image box (card plus bleed on all sides) and a clip box that keeps bleed only on the outside of the grid, so bleed never covers a neighbouring card;
- cut marks outside the bleed area (1 mm offset, up to 3 mm long, shortened if the margin is smaller);
- two notice boxes outside the cut marks and inside a 3 mm printer margin: if the vertical margin is at least as large as the horizontal one (A4), the SRD attribution goes below the grid and the credits above it; otherwise (US Letter) the attribution goes to the left and the credits to the right, rotated by 90°.

`cardPixels()` gives the image size at 300 dpi (744 × 1039 px without bleed). `toSheets()` splits the pages into groups of nine.

### PNG (html-to-image)

`renderCardImages()` ([src/export/render.tsx](../src/export/render.tsx)) renders each page with `CardFace` into an off-screen root and rasterises it with `toPng()` at the exact pixel size. html-to-image draws the node inside an SVG `foreignObject`, which cannot load external fonts, so the card font is passed as `fontEmbedCSS` with the font files inlined as data URLs (`cardFontEmbedCSS()` in `src/export/fonts.ts`). `setPngDpi()` (`src/export/png.ts`) writes a `pHYs` chunk so that the PNGs carry 300 dpi. File names are numbered in deck order (`01-feuerball.png`, continuation cards `-2`, `-3`). For the PNG export, `ExportDialog` zips the images together with `NAMENSNENNUNG.txt` / `ATTRIBUTION.txt` (`noticeText()`) using fflate without recompression (`zipFiles`).

### PDF (pdf-lib)

`buildPdf()` ([src/export/pdf.ts](../src/export/pdf.ts)) creates one page per sheet with the page size in points, embeds each 300 dpi PNG at its image box, clipped to its clip box, draws the cut marks as 0.3 pt vector lines and writes both notices in Helvetica 4.2 pt, wrapped with real font metrics (`wrapText`). The PDF origin is at the bottom left, so y coordinates are flipped. Title, creator ("Deckwright") and language are set in the metadata.

### Browser print

`printSheets()` ([src/export/PrintSheets.tsx](../src/export/PrintSheets.tsx)) renders the same sheets as absolutely positioned HTML in mm (`PrintSheets`) into a separate root, adds an `@page { size: A4|letter portrait; margin: 0 }` rule and a body class that hides everything else in print media (`print.css`), waits for the fonts, calls `window.print()` and cleans up on `afterprint`. Text stays vector text.

### Notice boxes

Every PDF page and every print sheet carries `SRD_ATTRIBUTION[lang]` in one notice box and `sheetCredits(lang)` (change note plus icon credits) in the opposite one, in the card language of the deck. See [§12](#12-legal-notices-in-the-code).

## 7. Storage

[src/storage/db.ts](../src/storage/db.ts) defines the Dexie database `deckwright` with two tables: `decks` (`&id, name, updatedAt`) and `meta` (`&key`). A deck is stored as one document including its cards.

- `DeckStore.save()` validates with `deckSchema` before writing, so broken data never reaches the database; `list()` returns decks newest first and skips invalid records instead of failing.
- `import()` keeps the id of an imported deck unless it already exists, in which case the deck gets a new id.
- `requestPersistence()` asks the browser not to evict the data (`navigator.storage.persist()`, best effort).
- `migrateLegacy()` copies decks once from the database used before the rename (`open-tabletop-cards`). It runs at start-up (`AppStateProvider`), skips invalid records and existing ids, records a marker in `meta` so that it never runs twice, and leaves the old database untouched.

Small preferences live in `localStorage` (UI language, current deck, paper size) and `sessionStorage` (dismissed storage notice) under the prefix `deckwright.` ([src/storage/preferences.ts](../src/storage/preferences.ts)); values under the old prefix `otc.` are moved on first read. The app state (`src/ui/state.tsx`) keeps the decks in React state and saves every change immediately.

## 8. Internationalisation

There are two independent language settings with two separate mechanisms:

- **Interface language** – [src/i18n/ui.ts](../src/i18n/ui.ts) contains the i18next resources `de` and `en` (the type of `en` is derived from `de`, so both must have the same keys; a unit test also checks keys and empty strings). The default comes from the browser languages; the choice is stored as the preference `uiLanguage`.
- **Card language** – [src/i18n/terms.ts](../src/i18n/terms.ts) contains the card vocabulary per language (`CardTerms`: labels, schools, classes, damage types, subtitles, durations, units …). `displayCard()` uses `terms(deck.lang)`, independent of the interface language. German terms follow the official German SRD 5.2.1; a test covers every key of the data model in both languages.

## 9. Data pipeline

`npm run pipeline` ([scripts/pipeline/run.ts](../scripts/pipeline/run.ts)) builds the catalog; `npm run pipeline:offline` does the same from `data/cache/` only. It needs Node and Poppler (`pdftohtml`); the app itself never runs it.

### Sources

[scripts/pipeline/sources.ts](../scripts/pipeline/sources.ts):

- **Open5e API v2** (`https://api.open5e.com/v2`, `document__key=srd-2024`): endpoints `spells`, `weapons`, `magicitems`, `classes`, `species`, `feats`, fetched page by page, filtered again client-side to `srd-2024` and cached in `data/cache/open5e/`. Open5e provides structure and keys (structured spell fields, weapon data with masteries, variant lists of magic items, class data used as a cross-check). It has no conditions for 2024. Counts checked on 2026-11-03:

  | Endpoint | Entries | Remark |
  |---|---|---|
  | `spells` | 339 | structured fields (level, school, range, components, damage, saving throw …) |
  | `weapons` | 75 | incl. masteries (2024) |
  | `armor` | 13 | |
  | `magicitems` | 760 | incl. spelled-out variants ("Battleaxe (+1)" …); the pipeline merges them into the 258 entries of the PDFs |
  | `classes` | 24 | 12 classes + 12 subclasses, with features |
  | `species`, `feats`, `backgrounds` | 9 / 17 / 4 | |
  | `conditions` | **0** | missing for 2024 |

- **SRD 5.2.1 PDFs** (English and German): `ensureSrdPdf()` downloads them from the official URLs in `SRD_SOURCES` into `srd/` (gitignored) and verifies the SHA-256 checksum (`verifySha256`); a changed file stops the pipeline with a message. The check is skipped if the extracted text is already cached. See [srd/README.md](../srd/README.md).
- **Text extraction:** `loadPdfXml()` runs `pdftohtml -xml -i -q -stdout -enc UTF-8` and caches the result as `data/cache/srd-<lang>.xml`.

The German texts (name, description, "At higher levels", material text) and all conditions come from the PDFs. Structured fields are stored as keys; only the free texts are taken from the PDFs per language.

### PDF parsing

1. `pdf/xml.ts` parses the Poppler XML into pages, font specs and text elements with bold/italic segments.
2. `pdf/layout.ts` (`documentLines`) puts the elements into lines in reading order of the two-column layout and classifies each line by typographic role (`title`, `h1`–`h4`, `statname`, `body`, `sans`, `stat`, `footer`).
3. `doc.ts` (`makeDoc`) removes sidebars (boxed GillSans text), slices sections and splits entries; `text.ts` joins broken lines and hyphenation and converts lines into the card Markdown subset (paragraphs, bold run-in headings, lists).
4. `parse/*.ts` read the entries of each kind in both languages: spells (name, subtitle line "Level 3 Evocation (Sorcerer, Wizard)" / "Hervorrufungszauber 3. Grades (Magier, Zauberer)", then "Casting Time:/Zeitaufwand:", "Range:/Reichweite:", "Components:/Komponenten:", "Duration:/Wirkungsdauer:", then the rules text; a sample before the implementation found 347 blocks with "Zeitaufwand:" in the German and 343 with "Casting Time:" in the English SRD), Rules Glossary entries (conditions and actions), weapons and mastery properties, magic items, features (class and subclass features, class options, species traits, feats).
5. `build/*.ts` combine Open5e data and both PDFs into cards per type: `spells.ts`, `conditions.ts`, `actions.ts` (12 glossary actions + one attack card per weapon), `items.ts` (Open5e variants collapsed onto the PDF entry), `features.ts`. Some fields are derived from the English rules text (`inferUsage` in `build/features.ts`).

### English ↔ German matching

The PDFs have no common IDs and are sorted by the name in their own language, so entries cannot be paired by position ([scripts/pipeline/match.ts](../scripts/pipeline/match.ts)):

1. Every entry gets a **primary fingerprint** of values that agree in both languages – for spells: type, level, school, class list, casting time, range (feet → metres), components, duration, concentration, ritual; analogously for other types (e.g. items: category, rarity, attunement). Entries whose fingerprint is unique on both sides are paired directly.
2. Inside a group with several candidates, pairs are scored by **secondary tokens** (dice in the text, relative text length; German texts are about 1.2 × longer) and accepted only with a clear margin.
3. For free-text types (magic items, features), [concepts.ts](../scripts/pipeline/concepts.ts) adds language-independent "concept tokens": referenced spells (via the spell mapping that is built first), conditions, damage types, abilities, dice, bonuses, DCs, charges and durations. Spells and conditions are therefore built first and serve as anchors.
4. Everything else is reported as ambiguous or unmatched.

### Manual mappings

[scripts/pipeline/mapping.ts](../scripts/pipeline/mapping.ts) writes the binding result to `data/mapping/<type>.json` (`srdKey` → `{ "de": German name }`). Entries with `"manual": true` (optionally with a `note`) are set by hand, kept on every run and take precedence; automatic pairs that would reuse a German name taken by a manual entry are dropped. German feature names repeat across classes, so their German identifiers are qualified ("Kämpfer: Zusätzlicher Angriff"). `checkMapping()` reports missing keys, German names assigned twice and German names that do not exist in the PDF.

### Result and report

The pipeline validates every card with `cardSchema` and `cardIssues()` (both languages present, `id === srdKey`, `source: 'srd-5.2.1'`). It writes `data/catalog/<type>.json` only for types without problems, always writes the mapping files and [data/pipeline-report.md](../data/pipeline-report.md) (counts per source, automatic and manual matches, ambiguous groups, missing entries, duplicates, warnings), and exits with code 1 if an entry has no German assignment, a German entry is assigned twice, or a card is invalid. Then check the report and add a manual entry to the mapping file. `scripts/pipeline/expected.ts` holds the expected totals per type (339 spells, 15 conditions, 50 actions, 258 magic items, 316 features).

## 10. Testing

| Command | What runs |
|---|---|
| `npm run typecheck` | `tsc -b` for app, tests and scripts |
| `npm test` | Vitest: all `src/**/*.test.{ts,tsx}` and `scripts/**/*.test.ts` |
| `npm run test:e2e` | Playwright: `e2e/*.spec.ts` in Chromium and Firefox |

**Vitest** (configured in `vite.config.ts`, default environment `node`; files that need a DOM declare `// @vitest-environment jsdom`):

- unit tests next to the code: data model, units, Markdown, deck operations, deck file round trip and published JSON Schema, legal notices, card terms and UI keys, display model, pagination, card face, sheet layout, PDF (page size, image positions, notices), PNG metadata, ZIP, search;
- storage tests with `fake-indexeddb` (including the migration from the old database);
- pipeline unit tests on small inputs (text cleanup, layout cleanup, parsers, matching, mapping, sources);
- `scripts/pipeline/catalog.test.ts` checks the committed catalog: schema-valid, bilingual, consistent with the mapping files, expected totals;
- `scripts/pipeline/pipeline.test.ts` builds every type from the cached sources and checks the totals per type against both PDFs. It is **skipped** (`describe.skipIf`) unless `data/cache/open5e/` exists and either the extracted PDF text (`data/cache/srd-*.xml`) or the PDFs plus Poppler are available, i.e. after one run of `npm run pipeline`.

Test fixtures (SRD 5.2.1 texts) are in `src/test/fixtures.ts`.

**Playwright** ([playwright.config.ts](../playwright.config.ts)) starts `npm run dev` (or reuses a running server), uses the locale `de-DE`, runs one worker and covers the projects `chromium` and `firefox`. Tests: catalog (search in both languages, filters, adding to decks), editor (live preview, validation, continuation cards), deck (drag & drop and arrow reordering, migration from the old database), export (PNG size and dpi, PDF page sizes and slots for A4 and Letter with bleed, print dimensions, notices, JSON export/import round trip). The import fixture `e2e/fixtures/sample-deck.deckwright.json` is generated from the unit test fixtures with `npx tsx e2e/make-fixture.ts`. Install the browsers once with `npx playwright install chromium firefox`; one browser only: `npm run test:e2e -- --project=chromium`.

## 11. How-tos

### Add an icon

1. Take the icon from https://github.com/game-icons/icons (CC BY 3.0) and add an entry to `ICONS` in `src/render/icons.ts` with `slug`, `author` and the foreground `path` (viewBox 0 0 512 512). `IconName` is derived from the keys.
2. Use it in `TYPE_ICON` or `SCHOOL_ICON` in `src/render/theme.ts`.
3. The About page lists every icon in `ICONS` with author and link automatically. If the author is new, add the name to `ICON_ATTRIBUTION` in `src/model/legal.ts` (both languages; `legal.test.ts` fails otherwise) and to [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

### Add a card field

1. Add the field to the type's data schema in `src/model/schema.ts`. Make it optional (or give it a `.default()`) so that existing deck files stay valid; otherwise increase `DECK_FORMAT_VERSION` and handle older files.
2. If needed, give it a default in `blankCard()` (`src/model/templates.ts`).
3. Show it on the card: label in `CardTerms.labels` and values in `src/i18n/terms.ts` (both languages), formatting in the type's display function in `src/render/format.ts`.
4. Edit it: input in the type's form in `src/ui/editor/forms.tsx`, label in `src/i18n/ui.ts` (`de` and `en`).
5. Fill it from the SRD, if applicable: the type's builder in `scripts/pipeline/build/`, then `npm run pipeline` (the committed catalog must stay schema-valid).
6. Run `npm run schema` (the unit test compares `docs/deck-format.schema.json` with the zod schema), update [deck-format.md](deck-format.md) and the fixtures/tests, and regenerate the e2e fixture if its content changes.

### Add a card type

1. `src/model/schema.ts`: add the key to `CARD_TYPES`, a data schema, a card schema and add it to the `cardSchema` union.
2. Fill every `Record<CardType, …>` that the type checker reports: `TYPE_ACCENT` and `TYPE_ICON` in `theme.ts`, `EXPECTED_COUNTS` in `scripts/pipeline/expected.ts`, `PDF_COUNT_KEYS` in `pipeline.test.ts`, and the `switch` statements in `displayCard()` (`format.ts`) and `blankCard()` (`templates.ts`).
3. Card terms and the UI name (`types.<type>` in `ui.ts`), an editor form in `forms.tsx` and its use in `Editor.tsx`.
4. For SRD content: a parser in `scripts/pipeline/parse/`, a builder in `scripts/pipeline/build/`, an entry in the `builders` list in `run.ts`, then run the pipeline. `loadCatalog()` picks up `data/catalog/<type>.json` automatically.
5. Update SPEC §4, [deck-format.md](deck-format.md) and the JSON Schema (`npm run schema`).

### Update the SRD version

1. In `scripts/pipeline/sources.ts`, update `SRD_SOURCES` (official URLs and SHA-256 of the new PDFs), the file names in `SRD_PDF` and, if Open5e publishes a new document, `OPEN5E_DOCUMENT`.
2. Delete `data/cache/` and the old PDFs in `srd/`, run `npm run pipeline` and work through `data/pipeline-report.md`: parsers for changed layouts, manual entries in `data/mapping/*.json`, `EXPECTED_COUNTS`.
3. Replace the attribution in `src/model/legal.ts` with the **official wording** of the new version in both languages (never translate or reword it), and check `SRD_CHANGES`.
4. The version also appears in the source key `srd-5.2.1` (`SOURCES` and `catalogFileSchema` in `schema.ts`, the builders, `cardIssues()` in `run.ts`), the labels in `terms.ts`, `ui.ts` and `Editor.tsx`, and the tests. Changing the key `srd-5.2.1` affects stored decks and deck files, so it needs a migration or a new `formatVersion`.
5. Update the documentation: README, [srd/README.md](../srd/README.md), [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md), [data/catalog/LICENSE.md](../data/catalog/LICENSE.md), SPEC.

## 12. Legal notices in the code

The rules content is licensed under CC BY 4.0, the icons under CC BY 3.0 and the font under the GUST Font License. CC BY requires an attribution wherever the material is shared, and CC BY 4.0 §3(a)(1)(B) also requires a notice that the material was modified. Because cards leave the app as PDF, PNG and print, the notices travel with every output, not only with the app. According to the SRD license notice, no other references to the publisher may appear; the app only says "kompatibel mit der fünften Edition" / "5E compatible".

All texts are in [src/model/legal.ts](../src/model/legal.ts):

| Constant | Content | Used in |
|---|---|---|
| `SRD_ATTRIBUTION` | Official attribution of the SRD 5.2.1, English and German. Official wording – never translate, shorten or reword it. | About page (both languages), every PDF page and print sheet (deck language), notice file of the PNG ZIP |
| `SRD_CHANGES` | Modification notice (CC BY 4.0 §3(a)(1)(B)) | About page, `sheetCredits()`, notice file |
| `ICON_ATTRIBUTION` | Icon credits (game-icons.net, Lorc, Delapouite, CC BY 3.0) | `sheetCredits()`, notice file |
| `sheetCredits()` | `SRD_CHANGES` + `ICON_ATTRIBUTION`, second notice box on every sheet | `pdf.ts`, `PrintSheets.tsx` |
| `COMPATIBILITY` | "kompatibel mit der fünften Edition" / "5E compatible" | About page |
| `NOTICE_FILE_NAME`, `noticeText()` | `NAMENSNENNUNG.txt` / `ATTRIBUTION.txt` with all three notices | PNG ZIP (`ExportDialog.tsx`) |

The About page (`src/ui/AboutView.tsx`) also lists every icon with its author and link, the font license and the code license; the license texts are served from `public/licenses/`. Tests: `legal.test.ts` (every icon author is credited, sheet credits, notice file), `pdf.test.ts` (attribution and credits in the deck language on every sheet), `e2e/export.spec.ts` (notice file in the ZIP, notices on the print sheets).

In the repository: [README.md](../README.md) and [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) (overview of all licenses), [data/catalog/LICENSE.md](../data/catalog/LICENSE.md) (the catalog data is CC BY 4.0, not MIT, with both attributions and the list of changes), [srd/README.md](../srd/README.md) (sources and both attributions) and the header of `src/render/icons.ts`.

## 13. Technical decisions

Decisions from the implementation (formerly SPEC §11.1); the product-level decisions stay in [SPEC §11.1](SPEC.md#111-decided).

- **Textures** (leather, parchment) are generated PNG files (`npm run textures`), because SVG `feTurbulence` renders black in the 300 dpi export (html-to-image renders through an SVG `foreignObject`).
- **Line height** in whole CSS pixels, otherwise the line spacing becomes uneven in the export.
- **Units:** the German SRD uses 5 feet = 1.5 m and 1 mile = 1.6 km. Values are stored in feet; the German card converts when rendering.
- **Text extraction:** Poppler `pdftohtml -xml` instead of `pdftotext`, because the XML output keeps the font, bold/italic and position. This makes headings, bold lead-ins and tables reliably detectable. Class tables and sidebars ("Breaking Your Oath") are removed, because they do not belong to a single feature. The text is extracted in reading order (not layout mode), because the two-column layout would otherwise mix lines.
- **Card images in Firefox:** the app creates the embedded card font for the 300 dpi export itself (`src/export/fonts.ts`), because html-to-image cannot read the font family in Firefox. Firefox breaks lines in the image export slightly differently than in the view; so that paragraphs do not overlap, the text blocks grow with their content in the export (`EXPORT_CSS` in `src/export/render.tsx`).
