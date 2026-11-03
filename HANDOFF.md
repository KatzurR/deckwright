# Handoff – Umsetzung open-tabletop-cards (Stand 2026-11-03)

Branch: `feat/app-mvp`. Umsetzung der Spezifikation [docs/SPEC.md](docs/SPEC.md) (MVP, Phase 1 lokal).
Die Arbeit wurde mitten im Abschluss unterbrochen – unten steht, was fertig ist und was fehlt.

## Schnellstart

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # 127 Unit-Tests (Vitest), alle grün
npx playwright install chromium && npm run test:e2e   # 6 E2E-Tests (Export/Druck/Editor), alle grün
npm run pipeline       # SRD-Katalog neu erzeugen (braucht Poppler + Netz; --offline nutzt data/cache)
```

Voraussetzung: Node.js ≥ 18.18 (getestet mit 18.19). Deshalb Vite 6 / Vitest 3 (Vitest 4 braucht Node 20;
`npm audit` meldet Advisories nur für diese Dev-Abhängigkeiten).

## Fertig (getestet)

| Bereich | Dateien |
|---|---|
| Datenmodell (zod, Typen, Validierung, Defaults) | `src/model/schema.ts`, `templates.ts` |
| Einheiten ft→m (×0,3), Meile→1,6 km (laut DE-SRD!), Würfel d→W | `src/model/units.ts` |
| Deck-Operationen (anlegen, sortieren, duplizieren, kopieren, verschieben) | `src/model/deck.ts` |
| Deck-JSON mit `formatVersion` + JSON Schema + Doku | `src/model/deckFile.ts`, `docs/deck-format.md`, `docs/deck-format.schema.json` (`npm run schema`) |
| Kartenvokabular DE/EN nach offizieller DE-SRD-Terminologie | `src/i18n/terms.ts` |
| UI-Übersetzungen (i18next, Standard = Browsersprache) | `src/i18n/ui.ts` |
| Kartenrendering „Grimoire Codex“ in mm/pt | `src/render/CardFace.tsx`, `card.css`, `format.ts`, `theme.ts`, `icons.ts` |
| Textüberlauf: Schrift 6,0→4,8 pt, dann Folgekarten „(2/3)“ | `src/render/paginate.ts` (rein, getestet), `measure.tsx` (DOM-Messung) |
| PDF (pdf-lib, A4/Letter, 3×3, Schnittmarken, 3 mm Beschnitt, SRD-Hinweis je Bogen) | `src/export/layout.ts`, `pdf.ts` |
| PNG 744×1039 px, 300 dpi (pHYs), ZIP | `src/export/render.tsx`, `png.ts`, `files.ts` |
| Browser-Druck mit `@page`, gleiche Anordnung | `src/export/PrintSheets.tsx`, `print.css` |
| IndexedDB (Dexie), Autospeichern, Hinweis auf Datenverlust | `src/storage/db.ts`, `src/ui/state.tsx` |
| UI: Decks, Katalog (Suche/Filter/Mehrfachauswahl), Editor mit Live-Vorschau, Export-Dialog, Über-Seite | `src/ui/**` |
| SRD-Katalog: 339 Zauber, 15 Zustände, 50 Aktionen (12 Glossar + 38 Waffen), 258 mag. Gegenstände, 316 Fähigkeiten – alle DE↔EN zugeordnet | `data/catalog/*.json`, `data/mapping/*.json`, `data/pipeline-report.md` |
| Datenpipeline (Open5e + pdftohtml/pdftotext, Fingerabdruck-Abgleich, Handzuordnungen bleiben erhalten) | `scripts/pipeline/**` |

## Getroffene Entscheidungen (noch in SPEC.md nachtragen)

1. **Schrift:** TeX Gyre Schola (GUST Font License) statt C059 – löst SPEC §11 Frage 1. Lizenz: `public/licenses/GUST-FONT-LICENSE.txt`.
2. **Beschnitt:** Karten liegen ohne Abstand nebeneinander (gleiches Leder an allen Kanten wirkt als Beschnitt); nur das 3×3-Raster bekommt außen 3 mm. So passt Beschnitt auch auf US Letter.
3. **SRD-Namensnennung auf dem Bogen:** im größeren Rand außerhalb der Schnittmarken (A4 unten, Letter links gedreht).
4. **Texturen** als erzeugte PNGs (`npm run textures`), weil SVG-`feTurbulence` im 300-dpi-Export (html-to-image/foreignObject) schwarz rendert.
5. **Zeilenhöhe** in ganzen CSS-Pixeln (`bodyLineHeightPx`), sonst ungleichmäßige Zeilenabstände im Export.
6. **Magische Gegenstände:** Open5e-Varianten („Battleaxe (+1)“ …) werden zu einem Eintrag pro PDF-Eintrag zusammengefasst.
7. **Hintergründe** (4) und gewöhnliche Ausrüstung sind nicht im Katalog.

## Offen / nächste Schritte

1. **Pipeline-Tests fehlen** (`scripts/**/*.test.ts`): Unit-Tests für Textbereinigung, Parser, Abgleich, Mapping-Merge sowie der Integrationstest „Gesamtzahlen je Typ gegen beide PDFs“ (SPEC §6.2) und „Katalogdateien sind schema-gültig, beide Sprachen vorhanden“. Die Pipeline wurde während einer letzten Korrektur („key-split fallback for fixed-width rows“) gestoppt → `npm run pipeline:offline` erneut laufen lassen und Stichproben im Katalog prüfen.
2. **E2E-Test für den Katalog** (Suchen → Auswählen → ins Deck übernehmen) ergänzen; Katalog-UI mit echten Daten im Browser durchklicken (bisher nur mit Fixture-Deck getestet).
3. **Dokumentation:** `README.md` (Status, Installation Schritt für Schritt), `docs/SPEC.md` (Status v0.5, Entscheidungen oben in §11), `docs/design/README.md` (Schrift), **Benutzerhandbuch `docs/USER_GUIDE.md`** (Installation, Bedienung, Druck mit 100 %, Export/Import, Tests).
4. **Probedruck** (docs/design/README.md „Noch zu prüfen“): Lesbarkeit 3,8 pt / Mindestgröße 4,8 pt bestätigen (`FONT` in `src/render/paginate.ts`).
5. Heuristisch abgeleitete Felder prüfen: `feature.activation`/`recovery` werden aus dem Regeltext erraten.
6. Ungetestete Bereiche: Safari/Firefox (nur Chromium geprüft), Drag & Drop in der Deck-Ansicht.

## Hilfsdateien

- `e2e/make-fixture.ts` erzeugt `e2e/fixtures/sample-deck.otc.json` aus `src/test/fixtures.ts`.
- `data/cache/` (gitignored) enthält Open5e-Downloads und PDF-Extrakte; wird von `npm run pipeline` neu angelegt.
