# Spezifikation: open-tabletop-cards

**Status:** v0.5 · 2026-11-04 · MVP (Phase 1) umgesetzt, Entscheidungen aus der Umsetzung in Abschnitt 11

## 1. Ziel

open-tabletop-cards ist eine Web-App, mit der Spieler und Spielleiter Regelinhalte der fünften Edition (Regeln 2024) – Zauber, Aktionen, Fähigkeiten, Gegenstände und Zustände – als kleine Referenzkarten im Pokerkartenformat gestalten und drucken.

Eine Karte enthält alles, was am Tisch nötig ist, um die Regel anzuwenden, ohne ins Buch zu schauen.

Die Karten sind **allgemeine Regelreferenzen, nicht an einen Charakter gebunden.** Sie zeigen die Werte so, wie sie im Regelwerk stehen (z. B. „Rettungswurf gegen deinen Zauber-SG“, „1W8 Hieb“), nicht die ausgerechneten Werte einer bestimmten Figur. Es gibt kein Charakterprofil und keine charakterabhängigen Zusatzfelder.

## 2. Umfang

### 2.1 In der ersten Version (MVP)

- Kartentypen: Zauber, Aktion, Fähigkeit, Gegenstand, Zustand (Abschnitt 4)
- Mitgelieferter SRD-5.2.1-Katalog auf Deutsch und Englisch, durchsuchbar, Karten per Klick übernehmen (Abschnitt 6)
- Manuelle Eingabe eigener Karten in einem Formular-Editor mit Live-Vorschau
- Decks: Karten gruppieren, sortieren, duplizieren
- Speicherung lokal im Browser, Export/Import als JSON-Datei
- Export als druckfertiges PDF und als PNG
- Oberfläche und Karten auf Deutsch und Englisch

### 2.2 Nicht im MVP

- Charakterprofile und daraus berechnete Werte (bewusst ausgeschlossen, siehe Abschnitt 1)
- Veröffentlichung im Internet und PWA (Phase 2, siehe Abschnitt 3.1)
- Benutzerkonten, Server, Synchronisation zwischen Geräten
- Import aus Charakterverwaltungen, virtuellen Spieltischen oder anderen Tools
- Regeleditionen außer 5e 2024
- Frei gestaltbare Kartenlayouts (nur vordefinierte Layouts pro Typ)
- Kartenrückseiten
- Monsterkarten (Daten wären im SRD vorhanden, späterer Ausbau)

## 3. Plattform und Architektur

- Single-Page-Web-App, rein clientseitig
- Kein Backend und zur Laufzeit keine externen APIs; alle Daten (SRD-Katalog, Schriften, Symbole) werden mit der App ausgeliefert
- Unterstützte Browser: aktuelle Versionen von Chrome, Firefox, Safari, Edge (Desktop); Tablet soll funktionieren, Smartphone ist nicht Ziel des MVP

### 3.1 Betrieb: zuerst lokal, später online

**Phase 1 (MVP): nur lokal.** Die App läuft auf dem eigenen Rechner und wird nicht veröffentlicht.

- Start für die Entwicklung mit `npm install` und `npm run dev`, erreichbar unter `http://localhost:5173`
- Produktions-Build lokal prüfbar mit `npm run build` und `npm run preview`
- Der Server lauscht nur auf `localhost`, nicht im Netzwerk
- Voraussetzung: Node.js (aktuelle LTS-Version); für die Datenpipeline zusätzlich Poppler (`pdftotext`)
- Die README beschreibt die lokale Installation Schritt für Schritt

**Phase 2: online, sobald Phase 1 stabil läuft.** Veröffentlichung als statische Seite (z. B. GitHub Pages), danach optional installierbar und offline nutzbar als PWA. Die Architektur aus Phase 1 bleibt unverändert; es kommen nur Deployment und PWA-Konfiguration hinzu. Damit das ohne Umbau geht, gilt schon in Phase 1:

- Build erzeugt rein statische Dateien, keine serverseitige Logik
- Relative Pfade bzw. konfigurierbarer Basis-Pfad (für Hosting in einem Unterverzeichnis)

### 3.2 Technologie

| Bereich | Entscheidung | Begründung |
|---|---|---|
| Sprache | TypeScript | Datenmodell und Datenpipeline profitieren von Typprüfung |
| Build | Vite | Standard, schnell, statischer Output |
| UI | React | Größte Verbreitung, erleichtert Beiträge von außen |
| Speicherung | IndexedDB über Dexie | Ausreichend für viele Decks, einfache API |
| Kartenrendering | HTML/CSS mit Maßen in mm | Eine Quelle für Vorschau, Druck und Export |
| PNG-Export | Rendern der Karten-DOM-Elemente in ein Bild (z. B. html-to-image) mit 300 dpi | Kein Server nötig |
| PDF-Export | pdf-lib, Karten als 300-dpi-Bilder auf A4/Letter platziert, Schnittmarken als Vektor | Exakte Maße, unabhängig vom Druckdialog des Browsers |
| Browser-Druck | Druck-CSS mit `@page` | Alternative mit Vektortext |
| i18n | i18next | Bewährt, unterstützt Pluralformen |
| Datenpipeline | Node-Skripte in TypeScript, PDF-Text über pdftotext (Poppler) | Läuft nur beim Erzeugen des Katalogs, nicht in der App |
| Tests | Vitest für Datenmodell und Pipeline, Playwright für Export | Pipeline-Ergebnisse und Druckmaße müssen nachweisbar stimmen |

## 4. Kartentypen

Alle Karten haben gemeinsame Felder:

| Feld | Pflicht | Beschreibung |
|---|---|---|
| `id` | ja | Eindeutige ID (UUID) |
| `type` | ja | `spell`, `action`, `feature`, `item`, `condition` |
| `srdKey` | nein | Verweis auf den SRD-Eintrag, falls aus dem Katalog übernommen |
| `name` | ja | Titel, je Sprache |
| `description` | ja | Regeltext je Sprache, Markdown-Untermenge (fett, kursiv, Listen) |
| `source` | nein | „SRD 5.2.1“ oder „Eigene Eingabe“ |
| `tags` | nein | Freie Schlagwörter zum Filtern |

Texte werden pro Sprache gespeichert (`{ "de": "...", "en": "..." }`). Für SRD-Karten liegen beide Sprachen vor; bei eigenen Karten reicht eine.

### 4.1 Zauber (`spell`)

| Feld | Beispiel |
|---|---|
| Grad | 0 (Zaubertrick) bis 9 |
| Schule | Hervorrufung |
| Zeitaufwand | Aktion, Bonusaktion, Reaktion (+ Auslöser), Minuten/Stunden |
| Ritual | ja/nein |
| Reichweite | Zahl + Einheit, oder Selbst/Berührung |
| Komponenten | V, G, M (+ Materialtext, Kosten, verbraucht) |
| Wirkungsdauer | Sofort, 1 Minute … |
| Konzentration | ja/nein |
| Angriff / Rettungswurf | Zauberangriff oder Rettungswurf mit Attribut (ohne Zahlenwert) |
| Schaden | Würfel + Schadensart |
| Klassen | Magier, Zauberer |
| Auf höheren Graden | Text |

### 4.2 Aktion (`action`)

Aktionen ohne Charakterbezug: Waffenangriffe mit einer bestimmten Waffe sowie allgemeine Aktionen (z. B. Ausweichen, Spurt, Ringen, Helfen).

| Feld | Beispiel |
|---|---|
| Aktionsart | Aktion, Bonusaktion, Reaktion |
| Waffe | optional; Werte kommen aus den Waffendaten |
| Schaden | Waffenwürfel + Schadensart (z. B. 1W8 Hieb; vielseitig 1W10) |
| Reichweite | 1,5 m; 24/96 m |
| Eigenschaften | Finesse, Leicht, Vielseitig … |
| Meisterschaft | z. B. Umstoßen, mit Regeltext |
| Auslöser | nur bei Reaktionen |

### 4.3 Fähigkeit (`feature`)

Klassen-, Unterklassen-, Spezies-, Hintergrund- und Talentmerkmale.

| Feld | Beispiel |
|---|---|
| Herkunft | Klasse (Kämpfer, ab Stufe 2), Spezies, Talent … |
| Aktionsart | Aktion, Bonusaktion, Reaktion, passiv |
| Nutzungen | wie im Regeltext, z. B. „Anzahl = Übungsbonus“ |
| Erholung | kurze Rast, lange Rast, keine |

### 4.4 Gegenstand (`item`)

| Feld | Beispiel |
|---|---|
| Kategorie | Waffe, Rüstung, Wundersamer Gegenstand … |
| Seltenheit | Gewöhnlich bis Artefakt |
| Einstimmung | ja/nein, ggf. Bedingung |
| Ladungen | Anzahl + Wiederaufladung |

### 4.5 Zustand (`condition`)

Name und Regeltext, als Aufzählung der Effekte. Keine weiteren Felder.

## 5. Kartenformat und Layout

- Format: 63 × 88 mm (Pokerkarte), passt in Standard-Kartenhüllen
- Jeder Kartentyp hat ein festes Layout: Kopfzeile (Name, Typ-Symbol), Eigenschaftsblock, Regeltext, Fußzeile (Quelle, Grad/Seltenheit)
- Jeder Typ hat eine eigene Akzentfarbe; Zauberkarten optional nach Schule eingefärbt
- Symbole: game-icons.net (CC BY 3.0, Namensnennung in der App, auf jedem Bogen und im PNG-Export)
- **Textüberlauf:** Passt der Regeltext nicht, wird die Schrift bis zu einer Mindestgröße verkleinert. Reicht das nicht, entsteht automatisch eine Folgekarte („Name (2/2)“). Der Editor zeigt eine Warnung.
- Vorschau im Editor entspricht exakt dem Druckergebnis
- Gestaltung: Stil „Grimoire Codex“, siehe [design/README.md](design/README.md)

## 6. Datenquellen

### 6.1 Mitgelieferter SRD-Katalog

Die App enthält einen fertigen Datensatz aller relevanten SRD-5.2.1-Einträge in Deutsch und Englisch. Er wird von einer Datenpipeline erzeugt, im Repository versioniert und als statische JSON-Dateien ausgeliefert, nicht zur Laufzeit geladen.

**Quellen:**

1. **Struktur und englische Texte aus der Open5e-API** (`document__key=srd-2024`). Geprüft am 2026-11-03:

   | Endpunkt | Einträge | Bemerkung |
   |---|---|---|
   | `spells` | 339 | strukturierte Felder (Grad, Schule, Reichweite, Komponenten, Schaden, Rettungswurf …) |
   | `weapons` | 75 | inkl. Meisterschaften (2024) |
   | `armor` | 13 | |
   | `magicitems` | 760 | inkl. ausgeschriebener Varianten („Battleaxe (+1)“ …); die Pipeline fasst sie zu den 258 Einträgen der PDFs zusammen |
   | `classes` | 24 | 12 Klassen + 12 Unterklassen, mit Merkmalen |
   | `species`, `feats`, `backgrounds` | 9 / 17 / 4 | |
   | `conditions` | **0** | fehlen für 2024 |

2. **Deutsche Texte aus dem offiziellen deutschen SRD 5.2.1** ([srd/SRD_CC_v5.2.1_DE.pdf](../srd/SRD_CC_v5.2.1_DE.pdf)): Name, Beschreibung, „Auf höheren Graden“, Materialtext.
3. **Zustände** in beiden Sprachen direkt aus den SRD-PDFs, da Open5e sie nicht liefert.

Strukturierte Felder (Schule, Aktionsart, Schadensart …) werden als Schlüssel gespeichert und beim Rendern übersetzt; übersetzt bzw. zugeordnet werden nur die Freitexte.

### 6.2 Zuordnung Englisch ↔ Deutsch

Die deutschen und englischen Einträge haben keine gemeinsame ID, und beide PDFs sind nach dem jeweiligen Namen alphabetisch sortiert. Die Zuordnung erfolgt deshalb in drei Schritten:

1. **Einträge aus dem deutschen PDF zerlegen.** Die Einträge haben einen festen Aufbau. Bei Zaubern: Name, Kopfzeile „‹Schule›zauber N. Grades (Klassen)“, dann die Felder „Zeitaufwand:“, „Reichweite:“, „Komponenten:“, „Wirkungsdauer:“, danach der Regeltext. Eine Stichprobe ergab 347 Blöcke mit „Zeitaufwand:“ im deutschen und 343 mit „Casting Time:“ im englischen SRD. Die PDF-Textextraktion erfolgt im Lesefluss (nicht im Layoutmodus), weil das zweispaltige Layout sonst Zeilen vermischt.
2. **Automatischer Abgleich über einen Fingerabdruck aus Werten,** die in beiden Sprachen übereinstimmen: Typ, Grad, Schule, Klassenliste, Zeitaufwand, Reichweite (Fuß → Meter), Komponenten, Wirkungsdauer, Konzentration, Ritual, Würfelangaben im Text. Für andere Typen analog (z. B. Gegenstände: Kategorie, Seltenheit, Einstimmung).
3. **Zuordnungsdatei als verbindliche Quelle.** Das Ergebnis wird in `data/mapping/*.json` geschrieben (`srdKey` → deutscher Name). Eindeutige Treffer werden automatisch eingetragen; mehrdeutige oder fehlende werden im Pipeline-Bericht aufgelistet und von Hand ergänzt. Handeinträge bleiben bei erneutem Lauf erhalten.

Die Pipeline schlägt fehl, wenn ein SRD-Eintrag keine deutsche Zuordnung hat oder ein deutscher Eintrag doppelt zugeordnet ist. Ein Test prüft die Gesamtzahlen je Typ gegen beide PDFs.

### 6.3 Katalog in der App

- Suche nach Name (in beiden Sprachen), Filter nach Typ, Zaubergrad, Schule, Klasse
- Mehrfachauswahl, Übernahme in ein Deck
- Übernommene Karten behalten den `srdKey` und sind danach normal editierbar

### 6.4 Manuelle Eingabe

- Formular pro Kartentyp mit den Feldern aus Abschnitt 4
- Live-Vorschau neben dem Formular
- Pflichtfelder werden validiert

## 7. Decks und Speicherung

- Ein Deck ist eine benannte, geordnete Liste von Karten (z. B. „Magierzauber Grad 1–3“)
- Karten können zwischen Decks kopiert werden
- Speicherung automatisch in IndexedDB
- Export eines Decks als JSON-Datei; Import derselben Datei stellt das Deck vollständig wieder her
- Das JSON-Format ist versioniert (`formatVersion`) und dokumentiert, damit andere Tools es erzeugen können
- Hinweis in der App, dass Browserdaten verloren gehen können und regelmäßiger Export empfohlen wird

## 8. Export und Druck

| Format | Beschreibung |
|---|---|
| PDF-Bogen | A4 oder US Letter, 3 × 3 Karten pro Seite, Schnittmarken, optional 3 mm Beschnittzugabe |
| PNG | Eine Datei pro Karte, 300 dpi (744 × 1039 px), als ZIP für ein ganzes Deck |
| Browser-Druck | Direkter Druck mit Druck-CSS, gleiche Anordnung wie PDF |

- Exportiert wird ein ganzes Deck oder eine Auswahl
- Druckmaße müssen bei 100 % Skalierung exakt stimmen

## 9. Sprache

- Oberfläche vollständig auf Deutsch und Englisch, umschaltbar, Standard nach Browsersprache
- Jedes Deck hat eine Kartensprache; Beschriftungen (z. B. „Reichweite“ / „Range“) und Texte folgen ihr, unabhängig von der Oberflächensprache
- Begriffe in deutschen Karten folgen der Terminologie des offiziellen deutschen SRD 5.2.1
- Längenangaben: Deutsch in Metern, Englisch in Fuß, entsprechend der jeweiligen SRD-Fassung

## 10. Rechtliches

- Code: MIT-Lizenz
- Regelinhalte ausschließlich aus dem SRD 5.2.1 (CC BY 4.0), offizielle deutsche und englische Fassung, siehe [srd/README.md](../srd/README.md)
- Die vorgeschriebene Namensnennungserklärung erscheint in der App (Über-Seite) und auf jedem PDF- und Druckbogen, in der Sprache des Decks
- CC BY 4.0 verlangt einen Hinweis auf Änderungen: „Änderungen: Die SRD-Texte wurden in einzelne Einträge aufgeteilt …“ (`SRD_CHANGES` in `src/model/legal.ts`). Er steht zusammen mit der Namensnennung der Symbole im gegenüberliegenden Rand jedes Bogens, auf der Über-Seite und in der README
- Der PNG-Export (ZIP) enthält eine Textdatei mit Namensnennung, Änderungshinweis und Symbol-Namensnennung (`NAMENSNENNUNG.txt` / `ATTRIBUTION.txt`)
- Die Katalogdaten stehen unter CC BY 4.0, nicht unter MIT ([data/catalog/LICENSE.md](../data/catalog/LICENSE.md)); Übersicht aller Fremdlizenzen in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)
- Laut Lizenzhinweis dürfen keine weiteren Verweise auf den Herausgeber erscheinen; erlaubt ist „kompatibel mit der fünften Edition“ / „5E compatible“
- Keine Inhalte aus anderen Büchern im Repository

## 11. Offene Fragen

### 11.1 Entschieden

1. **Schrift:** TeX Gyre Schola (GUST Font License) statt C059. Sie gehört zur selben Familie (Century Schoolbook) und darf ohne Einschränkung mit der App ausgeliefert werden. Lizenz: `public/licenses/GUST-FONT-LICENSE.txt`.
2. **Beschnitt:** Die Karten liegen auf dem Bogen ohne Abstand nebeneinander. Da der Ledereinband an allen Kanten gleich ist, wirkt die Nachbarkarte als Beschnitt. Nur das 3 × 3-Raster bekommt außen 3 mm Beschnittzugabe. So passt der Beschnitt auch auf US Letter.
3. **SRD-Namensnennung auf dem Bogen:** im größeren Rand außerhalb der Schnittmarken (A4 unten, US Letter links, gedreht). Änderungshinweis und Symbol-Namensnennung stehen gespiegelt im gegenüberliegenden Rand (A4 oben, US Letter rechts), weil bei US Letter mit Beschnitt nur eine Zeile Platz hat.
4. **Texturen** (Leder, Pergament) als erzeugte PNG-Dateien (`npm run textures`), weil SVG-`feTurbulence` im 300-dpi-Export schwarz gerendert wird.
5. **Zeilenhöhe** in ganzen CSS-Pixeln, sonst werden die Zeilenabstände im Export ungleichmäßig.
6. **Magische Gegenstände:** Open5e-Varianten („Battleaxe (+1)“, „Battleaxe (+2)“ …) werden zu einem Eintrag je PDF-Eintrag zusammengefasst („Waffe +1, +2 oder +3“).
7. **Nicht im Katalog:** die 4 Hintergründe und gewöhnliche Ausrüstung (keine eigenen Kartentypen im MVP).
8. **Einheiten:** Das deutsche SRD rechnet 5 Fuß = 1,5 m und 1 Meile = 1,6 km. Gespeichert wird in Fuß, die deutsche Karte rechnet beim Rendern um.
9. **Textextraktion:** Poppler `pdftohtml -xml` statt `pdftotext`, weil die XML-Ausgabe Schriftart, Fett/Kursiv und Position behält. Damit lassen sich Überschriften, fette Einleitungen und Tabellen zuverlässig erkennen. Klassentabellen und Infokästen („Einen Schwur brechen“) werden entfernt, weil sie nicht zu einem einzelnen Merkmal gehören.
10. **Kartenbilder in Firefox:** Die eingebettete Kartenschrift für den 300-dpi-Export erzeugt die App selbst (`src/export/fonts.ts`), weil html-to-image die Schriftfamilie in Firefox nicht lesen kann. Firefox bricht Zeilen im Bildexport minimal anders um als in der Ansicht; damit sich Absätze dabei nicht überlappen, wachsen die Textblöcke im Export mit ihrem Inhalt.
11. **Textüberlauf:** Regeltext 6,0 pt, Verkleinerung in Schritten von 0,2 pt bis 4,8 pt, danach Folgekarten. Die Mindestgröße ist vorläufig, siehe 11.2.

### 11.2 Offen

1. **Probedruck:** Lesbarkeit der Beschriftungen (3,8 pt) und der Mindestgröße des Regeltexts (4,8 pt) an einem echten Druck bestätigen (`FONT` in `src/render/paginate.ts`).
2. **Aus dem Text abgeleitete Felder:** Aktionsart, Erholung und Nutzungen von Fähigkeiten werden aus dem englischen Regeltext erschlossen (`inferUsage` in `scripts/pipeline/build/features.ts`). Stichproben sind korrekt, eine vollständige Durchsicht fehlt.
3. **Tabellen mit ungewöhnlichem Satz:** Bei wenigen Einträgen steht der Schlüssel einer Tabellenzeile senkrecht mittig neben mehrzeiligem Text (Regenbogenwand) oder Wörter sind in der PDF-Extraktion vertauscht (Amulett der Ebenen). Der Text ist vollständig, die Gliederung aber unsauber. Lösung: Handkorrektur im Editor oder eine Sonderbehandlung in der Pipeline.
4. **Browser:** Automatisch getestet werden Chromium und Firefox (alle Ende-zu-Ende-Tests). Safari (WebKit) und Edge sind noch von Hand zu prüfen, vor allem der Browser-Druck.

Neue Fragen aus der Umsetzung werden hier gesammelt.
