# Contributing to Deckwright

Thank you for helping! Bug reports, ideas and pull requests are welcome. Please read this page first; it is short, but the content rules in [Rules content and trademarks](#rules-content-and-trademarks) are strict for legal reasons.

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Security problems are reported privately, see [SECURITY.md](SECURITY.md).

## Setup

Requirements: [Node.js](https://nodejs.org/) in the version from [.nvmrc](.nvmrc) (the minimum is in `engines` in [package.json](package.json)) and Git. For the data pipeline you also need Poppler (`pdftohtml`; Debian/Ubuntu: `sudo apt install poppler-utils`, macOS: `brew install poppler`).

```bash
git clone https://github.com/KatzurR/deckwright.git
cd deckwright
npm ci
npm run dev                               # http://localhost:5173
npx playwright install chromium firefox   # once, for the end-to-end tests
```

The SRD catalog is committed (`data/catalog/`), so you only need the pipeline if you change it.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server on http://localhost:5173 (localhost only) |
| `npm run typecheck` | TypeScript check of app, tests and scripts |
| `npm test` | Unit and integration tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) in Chromium and Firefox; one browser: `npm run test:e2e -- --project=chromium` |
| `npm run build` / `npm run preview` | Type check, production build, local preview on http://localhost:4173 |
| `npm run pipeline` / `npm run pipeline:offline` | Rebuild the SRD catalog (online, or from `data/cache/`) |
| `npm run schema` | Regenerate `docs/deck-format.schema.json` after changing the data model |
| `npm run textures` | Regenerate the card textures |

How the code is organised, and how to add an icon, a card field or a card type, is described in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tests

Before you open a pull request, run:

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

CI runs the same steps on every pull request (end-to-end tests in Chromium and Firefox). Notes:

- Add or update tests with your change: unit tests next to the code (`*.test.ts`), end-to-end tests in `e2e/`.
- The pipeline integration test (`scripts/pipeline/pipeline.test.ts`) is skipped unless `data/cache/` exists, i.e. after one run of `npm run pipeline`. Run it locally if you change the pipeline, and commit the regenerated `data/catalog/`, `data/mapping/` and `data/pipeline-report.md`.
- If you change the data model, run `npm run schema` and update [docs/deck-format.md](docs/deck-format.md); a unit test compares the published schema with the code.
- If the test fixtures change, regenerate the e2e fixture with `npx tsx e2e/make-fixture.ts`.

## Commits and pull requests

- One logical change per commit. Subject line in the imperative mood and sentence case, without a type prefix and without a trailing full stop, at most about 72 characters, e.g. `Fix PNG/PDF export in Firefox`. Explain in the body why the change is needed if it is not obvious.
- Work on a branch (e.g. `feat/…`, `fix/…`, `docs/…`) and open a pull request against `main`. Fill in the checklist of the pull request template.
- Keep pull requests focused; unrelated clean-ups go into a separate pull request.

## Documentation and languages

- **All documentation is in English** (README, `docs/`, code comments, commit messages).
- **The app stays bilingual.** Every UI text needs a German and an English version in `src/i18n/ui.ts` (a unit test checks that both have the same keys). Card vocabulary lives in `src/i18n/terms.ts`; German card terms follow the official German SRD 5.2.1.
- Update the [user guide](docs/USER_GUIDE.md) when you change what users see, using the exact English labels from `src/i18n/ui.ts`.

## Rules content and trademarks

Deckwright may only contain rules content from the **System Reference Document 5.2.1** (CC BY 4.0), in its official English and German versions.

- **SRD 5.2.1 content only.** Do not add rules content from any other book or source to the repository – not in the catalog, the tests, the fixtures, the documentation or the screenshots. Users may enter other content in their own decks; it stays in their own files.
- **No trademarks.** Do not use product names, logos or other references to the publisher of the SRD. The only exceptions are the official attribution and the official SRD download URLs. To describe compatibility, use "fifth edition" or "5E compatible".
- **Do not change the attribution.** The texts in `SRD_ATTRIBUTION` (`src/model/legal.ts`) are official wording: never translate, shorten or reword them. The German attribution stays German, also in English documents. Keep the change note (`SRD_CHANGES`), the icon credits, [data/catalog/LICENSE.md](data/catalog/LICENSE.md) and the notices on the exported sheets.
- **Icons** come from [game-icons.net](https://game-icons.net) (CC BY 3.0) and must be credited, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#add-an-icon). Other images, fonts or data need a license that allows redistribution and an entry in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

Code contributions are released under the [MIT License](LICENSE) of this project. Changes to the catalog data in `data/catalog/` are released under CC BY 4.0 like the rest of that data ([data/catalog/LICENSE.md](data/catalog/LICENSE.md)).
