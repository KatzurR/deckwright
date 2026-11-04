# User guide

Deckwright creates printable rules cards in poker size (63 × 88 mm) for spells, actions, features, items and conditions of fifth edition (2024 rules). The app runs entirely in your browser on your own computer. There is no server, no user account and no connection to external services.

This guide uses the labels of the English interface. The interface can also be switched to German (see [section 2](#2-overview)).

Contents:

1. [Installation](#1-installation)
2. [Overview](#2-overview)
3. [Decks](#3-decks)
4. [Cards from the SRD catalog](#4-cards-from-the-srd-catalog)
5. [Your own cards and editing cards](#5-your-own-cards-and-editing-cards)
6. [Printing and exporting](#6-printing-and-exporting)
7. [Backing up and sharing (JSON)](#7-backing-up-and-sharing-json)
8. [Languages](#8-languages)
9. [Tests](#9-tests)
10. [Regenerating the catalog (for developers)](#10-regenerating-the-catalog-for-developers)
11. [Problems and solutions](#11-problems-and-solutions)

## 1. Installation

You need:

- **Node.js** version 18.18 or newer (https://nodejs.org, the LTS version is fine). Check with `node -v`.
- **Git** to download the project (alternatively the ZIP from GitHub).
- A current browser: Chrome, Edge, Firefox or Safari.

Step by step in a terminal (Windows: "Command Prompt" or "PowerShell"):

```bash
git clone https://github.com/KatzurR/deckwright.git
cd deckwright
npm install
npm run dev
```

`npm install` downloads the required libraries once (a few minutes). `npm run dev` starts the app. Then open **http://localhost:5173** in your browser. The app can only be reached from your own computer, not from the network.

To stop it: press `Ctrl + C` in the terminal. Next time, `npm run dev` in the project folder is enough.

Optionally, as a finished build: `npm run build` followed by `npm run preview` (http://localhost:4173).

## 2. Overview

At the top you find three areas:

- **Decks** – your card stacks, the cards in them and all functions for printing and exporting
- **SRD catalog** – all bundled rules entries from the SRD 5.2.1, in German and English
- **About** – licenses and the required attribution

At the top right you set the **Interface language** (English or German). On the first start it follows the language of your browser.

The yellow notice reminds you that your decks are only stored in the browser (see [section 7](#7-backing-up-and-sharing-json)). **Got it** hides it.

## 3. Decks

A deck is a named, ordered list of cards, for example "Wizard spells levels 1–3" or "Fighter level 5".

- **New deck** creates an empty deck. You change its name directly in the name field.
- **Card language**: German or English. It determines the texts and labels of the cards, independently of the interface language.
- **Colour spells by school**: spell cards get the accent colour of their school instead of the common spell colour.
- **Sort**: by name, by type, or by type and level.
- **Duplicate deck** and **Delete deck** (with confirmation).

With the cards of a deck:

- **Clicking the card image** opens the editor ([section 5](#5-your-own-cards-and-editing-cards)).
- The **checkbox** below the card selects it. **Select all** and **Clear selection** control the selection.
- For the selection there are **Duplicate**, **Delete** and **Copy to deck …** (into another deck).
- **Order**: drag a card with the mouse to its new position, or move it with the arrows **‹** (**Move forward**) and **›** (**Move back**).
- A marker such as **+2** means: the text is too long for one card, and printing creates two continuation cards "Name (2/3)" and "Name (3/3)".

All changes are saved automatically right away.

## 4. Cards from the SRD catalog

The catalog contains 978 entries from the System Reference Document 5.2.1, each in German and English:

| Type | Count | Content |
|---|---|---|
| Spell | 339 | all spells |
| Action | 50 | 12 actions from the rules glossary (Attack, Dodge …) and 38 weapon attacks |
| Feature | 316 | class and subclass features, class options (e.g. Metamagic), species traits, feats |
| Item | 258 | magic items |
| Condition | 15 | all conditions |

Backgrounds and mundane equipment are not included.

How to add cards:

1. Open the **SRD catalog**, or click **From the catalog** in the deck.
2. **Search**: the search field finds German and English names ("Feuerball" and "Fireball" return the same spell). Upper and lower case and umlauts do not matter.
3. **Filter** by type, level, school and class. **Reset filters** clears all filters.
4. **Select**: click entries. When you hover over an entry with the mouse, the finished card appears on the right in the card language of the target deck. **Select all matches** selects everything the current search finds. The selection is kept when you search again.
5. Under **Add to**, choose the target deck (or **+ new deck**) and click **Add N cards**.

Added cards keep their reference to the SRD entry (shown in the editor as "SRD reference") and can be edited afterwards like your own cards.

## 5. Your own cards and editing cards

In the deck, choose the card type under **New card**. The editor shows the form on the left and the **Preview (actual size)** on the right. It matches the print exactly.

- **Edit texts in**: every card can have texts in both languages. Here you choose which language you are editing. If the text is missing in the card language of the deck, the card shows the other language, and the deck points this out.
- **Required fields**: name and rules text must be filled in in at least one language. Invalid fields are highlighted when you save.
- **Rules text**: separate paragraphs with a blank line. `**bold**`, `*italic*`, lists with `- ` at the start of a line. A bold lead-in such as `**Using a Higher-Level Spell Slot.** …` is set as a subheading.
- **Fields per type**: for spells, for example, level, school, casting time, range, components, duration, damage. For actions, you can choose an SRD weapon under **Weapon (take values)**; damage, properties and mastery are then filled in.
- **Distances** are entered in the unit of the card language: in metres for German cards, in feet for English cards. They are stored in feet; the other language is converted as in the German SRD (1.5 m per 5 feet, 1.6 km per mile).
- **Text length**: below the preview you see whether the text fits. If it is too long, the font is reduced from 6.0 pt down to 4.8 pt. If that is not enough, continuation cards are created automatically.

**Save** applies the changes, **Cancel** discards them (with confirmation).

## 6. Printing and exporting

In the deck, **Print & export …** opens the export dialog.

**Scope**: the whole deck or only the selected cards. Continuation cards are printed automatically.

**Formats**:

| Format | Result |
|---|---|
| **PDF sheets** | PDF with 3 × 3 cards per page, cut marks and, in the margin, the SRD attribution, the change note and the icon credits. Paper A4 or US Letter. |
| **PNG images (ZIP)** | one PNG file per card, 744 × 1039 px (300 dpi), packed as a ZIP together with a text file containing the attribution (`NAMENSNENNUNG.txt` or `ATTRIBUTION.txt`), for example for print services or virtual tabletops. If you pass the images on, include the attribution. |
| **Print directly (browser)** | opens the browser's print dialog with the same arrangement as the PDF |

**3 mm bleed** (PDF only): the leather border of the cards extends 3 mm beyond the cut line. This is meant for print shops and borderless printing, so that no white edge remains after cutting. A home printer does not need it.

### Printing correctly: 100 %

So that the cards are exactly 63 × 88 mm and fit into standard card sleeves:

1. In the print dialog, choose **"Actual size"**, **"100 %"** or **"No scaling"**, **not "Fit to page"**.
2. Set the paper size in the printer to match the PDF (A4 or Letter).
3. For browser printing, turn off the browser's headers and footers and leave the margins at "None" or "Default". The app sets the page size itself.
4. Measure after the first print: a card must be 63 mm wide and 88 mm high.

Cutting: along the cut marks with a ruler and a craft knife, or with a paper cutter. The cards lie next to each other without gaps, so one cut separates two cards.

## 7. Backing up and sharing (JSON)

Your decks are stored in your browser's database (IndexedDB). They are kept when you close the browser, but they are lost if you clear the browser data, work in a different browser or on a different computer, or use a private window.

- **Export as JSON** saves the current deck as a file (for example `wizard-spells-levels-1-3.deckwright.json`). Export your decks regularly.
- **Import deck …** loads such a file. The deck is restored completely, including all cards, both languages and settings. If a deck with the same ID already exists, the imported one is created as a new deck.

The file format is versioned and described in [deck-format.md](deck-format.md), so that other programs can create decks too.

## 8. Languages

- The **interface** and the **cards** have separate language settings. For example, you can print English cards with a German interface.
- German cards use the terms of the official German SRD 5.2.1 ("Zeitaufwand", "Wirkungsdauer", "Bonusaktion" …), dice as "W" (2W6) and distances in metres.
- English cards use feet and miles.

## 9. Tests

For developers and as a check after changes:

```bash
npm test                          # unit and integration tests (Vitest)
npx playwright install chromium firefox   # once: install the test browsers
npm run test:e2e                          # end-to-end tests in Chromium and Firefox (Playwright)
npm run test:e2e -- --project=chromium    # in one browser only
```

- `npm test` checks the data model, units, card rendering, line breaking, PDF and PNG generation, storage and the data pipeline. This includes that the totals per card type match in both PDFs and that all catalog cards exist in both languages. The pipeline test only runs if `data/cache/` exists (after a run of `npm run pipeline`); otherwise it is skipped.
- `npm run test:e2e` starts the app and checks in the browser the catalog (search, filter, add), the editor, reordering by drag & drop, the exact dimensions of PDF, PNG and browser print, and the JSON export and import.

## 10. Regenerating the catalog (for developers)

The catalog is part of the repository (`data/catalog/`). You only need to regenerate it if you change the pipeline.

You also need **Poppler** (`pdftohtml`). Debian/Ubuntu: `sudo apt install poppler-utils`, macOS: `brew install poppler`.

```bash
npm run pipeline          # downloads Open5e data and (on the first run) both SRD PDFs into srd/, writes data/catalog
npm run pipeline:offline  # the same from the cache in data/cache
```

Result:

- `data/catalog/<type>.json` – the cards
- `data/mapping/<type>.json` – assignment of English keys → German entry. Entries with `"manual": true` were set by hand and are kept on every run.
- `data/pipeline-report.md` – report with counts, assignments and warnings

The pipeline stops if an entry has no German assignment or a German entry is assigned twice. In that case, check the report and add a manual entry to the mapping file.

## 11. Problems and solutions

| Problem | Solution |
|---|---|
| `npm run dev` reports "Port 5173 is already in use" | The app is already running in another terminal; stop it there or simply use the open browser tab. |
| Printed cards are too small or too large | Choose 100 % / "Actual size" in the print dialog (see [section 6](#printing-correctly-100-)). |
| Decks have disappeared | The browser data was cleared, or you are using a different browser or profile. Import your last JSON export. |
| The catalog shows "has not been generated yet" | `data/catalog/` is missing (for example an incomplete copy). Clone the repository again or run `npm run pipeline`. |
| A card shows English text in a German deck | The card has no German text. Add it in the editor under "Edit texts in: German". |
