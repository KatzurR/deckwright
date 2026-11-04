# Specification: Deckwright

**Status:** v0.5 · 2026-11-04 · MVP (phase 1) implemented, decisions from the implementation in section 11

## 1. Goal

Deckwright is a web app with which players and game masters design and print rules content of fifth edition (2024 rules) – spells, actions, features, items and conditions – as small reference cards in poker card size.

A card contains everything needed at the table to apply the rule without looking it up in the book.

The cards are **general rules references, not tied to a character.** They show the values as they appear in the rules (e.g. "saving throw against your spell save DC", "1d8 Slashing"), not the computed values of a specific character. There is no character profile and there are no character-dependent extra fields.

## 2. Scope

### 2.1 In the first version (MVP)

- Card types: spell, action, feature, item, condition (section 4)
- Bundled SRD 5.2.1 catalog in German and English, searchable, cards added with one click (section 6)
- Manual entry of your own cards in a form editor with live preview
- Decks: group, sort and duplicate cards
- Local storage in the browser, export/import as a JSON file
- Export as a print-ready PDF and as PNG
- Interface and cards in German and English

### 2.2 Not in the MVP

- Character profiles and values computed from them (deliberately excluded, see section 1)
- Publication on the internet and PWA (phase 2, see section 3.1)
- User accounts, server, synchronisation between devices
- Import from character managers, virtual tabletops or other tools
- Rules editions other than 5e 2024
- Freely designable card layouts (only predefined layouts per type)
- Card backs
- Monster cards (the data would be in the SRD, later extension)

## 3. Platform and architecture

- Single-page web app, purely client-side
- No backend and no external APIs at runtime; all data (SRD catalog, fonts, icons) is shipped with the app
- Supported browsers: current versions of Chrome, Firefox, Safari, Edge (desktop); tablets should work, smartphones are not a goal of the MVP

### 3.1 Operation: local first, online later

**Phase 1 (MVP): local only.** The app runs on your own computer and is not published.

- Start for development with `npm install` and `npm run dev`, available at `http://localhost:5173`
- Production build can be checked locally with `npm run build` and `npm run preview`
- The server only listens on `localhost`, not on the network
- Requirement: Node.js (current LTS version); for the data pipeline also Poppler (`pdftotext`)
- The README describes the local installation step by step

**Phase 2: online, as soon as phase 1 runs stably.** Publication as a static site (e.g. GitHub Pages), then optionally installable and usable offline as a PWA. The architecture from phase 1 stays unchanged; only deployment and PWA configuration are added. So that this works without restructuring, the following already applies in phase 1:

- The build produces purely static files, no server-side logic
- Relative paths or a configurable base path (for hosting in a sub-directory)

### 3.2 Technology

| Area | Decision | Reason |
|---|---|---|
| Language | TypeScript | Data model and data pipeline benefit from type checking |
| Build | Vite | Standard, fast, static output |
| UI | React | Most widespread, makes outside contributions easier |
| Storage | IndexedDB via Dexie | Sufficient for many decks, simple API |
| Card rendering | HTML/CSS with dimensions in mm | One source for preview, print and export |
| PNG export | Rendering the card DOM elements into an image (e.g. html-to-image) at 300 dpi | No server needed |
| PDF export | pdf-lib, cards as 300 dpi images placed on A4/Letter, cut marks as vectors | Exact dimensions, independent of the browser's print dialog |
| Browser print | Print CSS with `@page` | Alternative with vector text |
| i18n | i18next | Proven, supports plural forms |
| Data pipeline | Node scripts in TypeScript, PDF text via pdftotext (Poppler) | Only runs when generating the catalog, not in the app |
| Tests | Vitest for data model and pipeline, Playwright for export | Pipeline results and print dimensions must be demonstrably correct |

## 4. Card types

All cards have common fields:

| Field | Required | Description |
|---|---|---|
| `id` | yes | Unique ID (UUID) |
| `type` | yes | `spell`, `action`, `feature`, `item`, `condition` |
| `srdKey` | no | Reference to the SRD entry, if taken from the catalog |
| `name` | yes | Title, per language |
| `description` | yes | Rules text per language, Markdown subset (bold, italic, lists) |
| `source` | no | "SRD 5.2.1" or "custom entry" |
| `tags` | no | Free keywords for filtering |

Texts are stored per language (`{ "de": "...", "en": "..." }`). For SRD cards both languages are available; for your own cards one is enough.

### 4.1 Spell (`spell`)

| Field | Example |
|---|---|
| Level | 0 (cantrip) to 9 |
| School | Evocation |
| Casting time | Action, Bonus Action, Reaction (+ trigger), minutes/hours |
| Ritual | yes/no |
| Range | number + unit, or Self/Touch |
| Components | V, S, M (+ material text, cost, consumed) |
| Duration | Instantaneous, 1 minute … |
| Concentration | yes/no |
| Attack / saving throw | spell attack or saving throw with ability (without a number) |
| Damage | dice + damage type |
| Classes | Wizard, Sorcerer |
| At higher levels | text |

### 4.2 Action (`action`)

Actions without reference to a character: weapon attacks with a specific weapon and general actions (e.g. Dodge, Dash, Grapple, Help).

| Field | Example |
|---|---|
| Action type | Action, Bonus Action, Reaction |
| Weapon | optional; values come from the weapon data |
| Damage | weapon dice + damage type (e.g. 1d8 Slashing; versatile 1d10) |
| Range | 5 ft.; 80/320 ft. |
| Properties | Finesse, Light, Versatile … |
| Mastery | e.g. Topple, with rules text |
| Trigger | only for reactions |

### 4.3 Feature (`feature`)

Class, subclass, species, background and feat features.

| Field | Example |
|---|---|
| Origin | class (Fighter, from level 2), species, feat … |
| Action type | Action, Bonus Action, Reaction, passive |
| Uses | as in the rules text, e.g. "number = Proficiency Bonus" |
| Recovery | Short Rest, Long Rest, none |

### 4.4 Item (`item`)

| Field | Example |
|---|---|
| Category | Weapon, Armor, Wondrous Item … |
| Rarity | Common to Artifact |
| Attunement | yes/no, with condition if any |
| Charges | number + recharge |

### 4.5 Condition (`condition`)

Name and rules text, as a list of the effects. No further fields.

## 5. Card format and layout

- Format: 63 × 88 mm (poker card), fits standard card sleeves
- Each card type has a fixed layout: header (name, type icon), property block, rules text, footer (source, level/rarity)
- Each type has its own accent colour; spell cards optionally coloured by school
- Icons: game-icons.net (CC BY 3.0, credited in the app, on every sheet and in the PNG export)
- **Text overflow:** if the rules text does not fit, the font is reduced down to a minimum size. If that is not enough, a continuation card is created automatically ("Name (2/2)"). The editor shows a warning.
- The preview in the editor matches the printed result exactly
- Design: style "Grimoire Codex", see [design/README.md](design/README.md)

## 6. Data sources

### 6.1 Bundled SRD catalog

The app contains a ready-made data set of all relevant SRD 5.2.1 entries in German and English. It is produced by a data pipeline, versioned in the repository and shipped as static JSON files, not loaded at runtime.

**Sources:**

1. **Structure and English texts from the Open5e API** (`document__key=srd-2024`). Checked on 2026-11-03:

   | Endpoint | Entries | Remark |
   |---|---|---|
   | `spells` | 339 | structured fields (level, school, range, components, damage, saving throw …) |
   | `weapons` | 75 | incl. masteries (2024) |
   | `armor` | 13 | |
   | `magicitems` | 760 | incl. spelled-out variants ("Battleaxe (+1)" …); the pipeline merges them into the 258 entries of the PDFs |
   | `classes` | 24 | 12 classes + 12 subclasses, with features |
   | `species`, `feats`, `backgrounds` | 9 / 17 / 4 | |
   | `conditions` | **0** | missing for 2024 |

2. **German texts from the official German SRD 5.2.1** (PDF, downloaded by the pipeline, see [srd/README.md](../srd/README.md)): name, description, "At higher levels", material text.
3. **Conditions** in both languages directly from the SRD PDFs, because Open5e does not provide them.

Structured fields (school, action type, damage type …) are stored as keys and translated when rendering; only the free texts are translated or matched.

### 6.2 Matching English ↔ German

The German and English entries have no common ID, and both PDFs are sorted alphabetically by the respective name. Matching is therefore done in three steps:

1. **Split the entries from the German PDF.** The entries have a fixed structure. For spells: name, header line "‹Schule›zauber N. Grades (Klassen)", then the fields "Zeitaufwand:", "Reichweite:", "Komponenten:", "Wirkungsdauer:", then the rules text. A sample found 347 blocks with "Zeitaufwand:" in the German and 343 with "Casting Time:" in the English SRD. PDF text extraction is done in reading order (not in layout mode), because the two-column layout would otherwise mix lines.
2. **Automatic matching via a fingerprint of values** that agree in both languages: type, level, school, class list, casting time, range (feet → metres), components, duration, concentration, ritual, dice in the text. Analogously for other types (e.g. items: category, rarity, attunement).
3. **Mapping file as the authoritative source.** The result is written to `data/mapping/*.json` (`srdKey` → German name). Unique matches are entered automatically; ambiguous or missing ones are listed in the pipeline report and added by hand. Manual entries are kept on every new run.

The pipeline fails if an SRD entry has no German assignment or a German entry is assigned twice. A test checks the totals per type against both PDFs.

### 6.3 Catalog in the app

- Search by name (in both languages), filter by type, spell level, school, class
- Multiple selection, adding to a deck
- Added cards keep the `srdKey` and are normally editable afterwards

### 6.4 Manual entry

- Form per card type with the fields from section 4
- Live preview next to the form
- Required fields are validated

## 7. Decks and storage

- A deck is a named, ordered list of cards (e.g. "Wizard spells levels 1–3")
- Cards can be copied between decks
- Stored automatically in IndexedDB
- Export of a deck as a JSON file; importing the same file restores the deck completely
- The JSON format is versioned (`formatVersion`) and documented, so that other tools can produce it
- Notice in the app that browser data can be lost and that regular export is recommended

## 8. Export and print

| Format | Description |
|---|---|
| PDF sheet | A4 or US Letter, 3 × 3 cards per page, cut marks, optional 3 mm bleed |
| PNG | One file per card, 300 dpi (744 × 1039 px), as a ZIP for a whole deck |
| Browser print | Direct printing with print CSS, same arrangement as the PDF |

- A whole deck or a selection is exported
- Print dimensions must be exact at 100 % scaling

## 9. Language

- Interface fully in German and English, switchable, default by browser language
- Each deck has a card language; labels (e.g. "Reichweite" / "Range") and texts follow it, independently of the interface language
- Terms on German cards follow the terminology of the official German SRD 5.2.1
- Lengths: German in metres, English in feet, according to the respective SRD version

## 10. Legal

- Code: MIT License
- Rules content exclusively from the SRD 5.2.1 (CC BY 4.0), official German and English version, see [srd/README.md](../srd/README.md)
- The required attribution statement appears in the app (About page) and on every PDF and print sheet, in the language of the deck
- CC BY 4.0 requires a notice of changes: "Changes: the SRD texts were split into individual entries …" (`SRD_CHANGES` in `src/model/legal.ts`). It appears together with the icon credits in the opposite margin of every sheet, on the About page and in the README
- The PNG export (ZIP) contains a text file with the attribution, the change note and the icon credits (`NAMENSNENNUNG.txt` / `ATTRIBUTION.txt`)
- The catalog data is licensed under CC BY 4.0, not MIT ([data/catalog/LICENSE.md](../data/catalog/LICENSE.md)); overview of all third-party licenses in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)
- According to the license notice, no further references to the publisher may appear; "kompatibel mit der fünften Edition" / "5E compatible" is allowed
- No content from other books in the repository

## 11. Open questions

### 11.1 Decided

1. **Typeface:** TeX Gyre Schola (GUST Font License) instead of C059. It belongs to the same family (Century Schoolbook) and may be shipped with the app without restriction. License: `public/licenses/GUST-FONT-LICENSE.txt`.
2. **Bleed:** the cards lie on the sheet next to each other without gaps. Because the leather border is the same on all edges, the neighbouring card acts as bleed. Only the 3 × 3 grid gets 3 mm bleed on the outside. This way the bleed also fits on US Letter.
3. **SRD attribution on the sheet:** in the larger margin outside the cut marks (A4 bottom, US Letter left, rotated). The change note and the icon credits are mirrored in the opposite margin (A4 top, US Letter right), because on US Letter with bleed there is only room for one line.
4. **Textures** (leather, parchment) as generated PNG files (`npm run textures`), because SVG `feTurbulence` renders black in the 300 dpi export.
5. **Line height** in whole CSS pixels, otherwise the line spacing becomes uneven in the export.
6. **Magic items:** Open5e variants ("Battleaxe (+1)", "Battleaxe (+2)" …) are merged into one entry per PDF entry ("Weapon, +1, +2, or +3").
7. **Not in the catalog:** the 4 backgrounds and mundane equipment (no card types of their own in the MVP).
8. **Units:** the German SRD uses 5 feet = 1.5 m and 1 mile = 1.6 km. Values are stored in feet; the German card converts when rendering.
9. **Text extraction:** Poppler `pdftohtml -xml` instead of `pdftotext`, because the XML output keeps the font, bold/italic and position. This makes headings, bold lead-ins and tables reliably detectable. Class tables and sidebars ("Breaking Your Oath") are removed, because they do not belong to a single feature.
10. **Card images in Firefox:** the app creates the embedded card font for the 300 dpi export itself (`src/export/fonts.ts`), because html-to-image cannot read the font family in Firefox. Firefox breaks lines in the image export slightly differently than in the view; so that paragraphs do not overlap, the text blocks grow with their content in the export.
11. **Text overflow:** rules text 6.0 pt, reduced in steps of 0.2 pt down to 4.8 pt, then continuation cards. The minimum size is provisional, see 11.2.

### 11.2 Open

1. **Test print:** confirm the legibility of the labels (3.8 pt) and of the minimum size of the rules text (4.8 pt) on a real print (`FONT` in `src/render/paginate.ts`).
2. **Fields derived from the text:** action type, recovery and uses of features are inferred from the English rules text (`inferUsage` in `scripts/pipeline/build/features.ts`). Samples are correct; a complete review is missing.
3. **Tables with unusual typesetting:** in a few entries the key of a table row stands vertically centred next to multi-line text (Prismatic Wall), or words are swapped in the PDF extraction (Amulet of the Planes). The text is complete, but the structure is untidy. Solution: manual correction in the editor or special handling in the pipeline.
4. **Browsers:** Chromium and Firefox are tested automatically (all end-to-end tests). Safari (WebKit) and Edge still have to be checked by hand, especially browser print.

New questions from the implementation are collected here.
