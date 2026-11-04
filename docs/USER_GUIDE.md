# Benutzerhandbuch

open-tabletop-cards erstellt druckbare Regelkarten im Pokerkartenformat (63 × 88 mm) für Zauber, Aktionen, Fähigkeiten, Gegenstände und Zustände der fünften Edition (Regeln 2024). Die App läuft vollständig in deinem Browser auf deinem eigenen Rechner. Es gibt keinen Server, kein Benutzerkonto und keine Verbindung zu externen Diensten.

Inhalt:

1. [Installation](#1-installation)
2. [Überblick](#2-überblick)
3. [Decks](#3-decks)
4. [Karten aus dem SRD-Katalog](#4-karten-aus-dem-srd-katalog)
5. [Eigene Karten und Karten bearbeiten](#5-eigene-karten-und-karten-bearbeiten)
6. [Drucken und Exportieren](#6-drucken-und-exportieren)
7. [Sichern und Weitergeben (JSON)](#7-sichern-und-weitergeben-json)
8. [Sprachen](#8-sprachen)
9. [Tests](#9-tests)
10. [Katalog neu erzeugen (für Entwickler)](#10-katalog-neu-erzeugen-für-entwickler)
11. [Probleme und Lösungen](#11-probleme-und-lösungen)

## 1. Installation

Du brauchst:

- **Node.js** ab Version 18.18 (https://nodejs.org, die LTS-Version genügt). Prüfen mit `node -v`.
- **Git** zum Herunterladen des Projekts (alternativ das ZIP von GitHub).
- Einen aktuellen Browser: Chrome, Edge, Firefox oder Safari.

Schritt für Schritt in einem Terminal (Windows: „Eingabeaufforderung“ oder „PowerShell“):

```bash
git clone https://github.com/KatzurR/open-tabletop-cards.git
cd open-tabletop-cards
npm install
npm run dev
```

`npm install` lädt einmalig die benötigten Bibliotheken herunter (einige Minuten). `npm run dev` startet die App. Öffne dann im Browser **http://localhost:5173**. Die App ist nur auf deinem Rechner erreichbar, nicht im Netzwerk.

Beenden: im Terminal `Strg + C`. Beim nächsten Mal genügt `npm run dev` im Projektordner.

Optional, als fertiger Build: `npm run build` und danach `npm run preview` (http://localhost:4173).

## 2. Überblick

Oben findest du drei Bereiche:

- **Decks** – deine Kartenstapel, die Karten darin und alle Funktionen zum Drucken und Exportieren
- **SRD-Katalog** – alle mitgelieferten Regeleinträge aus dem SRD 5.2.1, auf Deutsch und Englisch
- **Über** – Lizenzen und die vorgeschriebene Namensnennung

Rechts oben stellst du die **Sprache der Oberfläche** ein (Deutsch oder Englisch). Beim ersten Start richtet sie sich nach der Sprache deines Browsers.

Der gelbe Hinweis erinnert daran, dass deine Decks nur im Browser gespeichert sind (siehe [Abschnitt 7](#7-sichern-und-weitergeben-json)). Mit **Verstanden** blendest du ihn aus.

## 3. Decks

Ein Deck ist eine benannte, geordnete Liste von Karten, z. B. „Magierzauber Grad 1–3“ oder „Kämpfer Stufe 5“.

- **Neues Deck** legt ein leeres Deck an. Den Namen änderst du direkt im Namensfeld.
- **Kartensprache**: Deutsch oder Englisch. Sie bestimmt Texte und Beschriftungen der Karten, unabhängig von der Sprache der Oberfläche.
- **Zauber nach Schule einfärben**: Zauberkarten bekommen die Akzentfarbe ihrer Schule statt der einheitlichen Zauberfarbe.
- **Sortieren**: nach Name, nach Typ oder nach Typ und Grad.
- **Deck duplizieren** und **Deck löschen** (mit Rückfrage).

Mit den Karten eines Decks:

- **Kartenbild anklicken** öffnet den Editor ([Abschnitt 5](#5-eigene-karten-und-karten-bearbeiten)).
- Das **Kästchen** unter der Karte wählt sie aus. Mit **Alle auswählen** und **Auswahl aufheben** steuerst du die Auswahl.
- Für die Auswahl gibt es **Duplizieren**, **Löschen** und **In Deck kopieren …** (in ein anderes Deck).
- **Reihenfolge**: Karte mit der Maus an die neue Stelle ziehen, oder mit den Pfeilen **‹** (nach vorne) und **›** (nach hinten) verschieben.
- Eine Markierung wie **+2** heißt: Der Text ist zu lang für eine Karte, beim Drucken entstehen zwei Folgekarten „Name (2/3)“ und „Name (3/3)“.

Alle Änderungen werden sofort automatisch gespeichert.

## 4. Karten aus dem SRD-Katalog

Der Katalog enthält 978 Einträge aus dem System Reference Document 5.2.1, jeweils auf Deutsch und Englisch:

| Typ | Anzahl | Inhalt |
|---|---|---|
| Zauber | 339 | alle Zauber |
| Aktion | 50 | 12 Aktionen aus dem Regelglossar (Angreifen, Ausweichen …) und 38 Waffenangriffe |
| Fähigkeit | 316 | Klassen- und Unterklassenmerkmale, Klassenoptionen (z. B. Metamagie), Merkmale der Spezies, Talente |
| Gegenstand | 258 | magische Gegenstände |
| Zustand | 15 | alle Zustände |

Hintergründe und gewöhnliche Ausrüstung sind nicht enthalten.

So übernimmst du Karten:

1. **SRD-Katalog** öffnen, oder im Deck auf **Aus dem Katalog** klicken.
2. **Suchen**: Das Suchfeld findet deutsche und englische Namen („Feuerball“ und „Fireball“ liefern denselben Zauber). Groß- und Kleinschreibung und Umlaute spielen keine Rolle.
3. **Filtern** nach Typ, Grad, Schule und Klasse. **Filter zurücksetzen** hebt alle Filter auf.
4. **Auswählen**: Einträge anklicken. Mit der Maus über einem Eintrag siehst du rechts die fertige Karte in der Kartensprache des Zieldecks. **Alle Treffer auswählen** wählt alles, was die aktuelle Suche findet. Die Auswahl bleibt erhalten, wenn du weitersuchst.
5. Unter **Übernehmen in** das Zieldeck wählen (oder **+ neues Deck**) und auf **N Karten übernehmen** klicken.

Übernommene Karten behalten ihren Verweis auf den SRD-Eintrag (sichtbar im Editor als „SRD-Verweis“) und lassen sich danach wie eigene Karten bearbeiten.

## 5. Eigene Karten und Karten bearbeiten

Im Deck wählst du unter **Neue Karte** den Kartentyp. Der Editor zeigt links das Formular und rechts die **Vorschau in Originalgröße**. Sie entspricht exakt dem Druck.

- **Texte bearbeiten auf**: Jede Karte kann Texte in beiden Sprachen haben. Hier wählst du, welche Sprache du gerade bearbeitest. Fehlt der Text in der Kartensprache des Decks, zeigt die Karte die andere Sprache, und das Deck weist darauf hin.
- **Pflichtfelder**: Name und Regeltext müssen in mindestens einer Sprache ausgefüllt sein. Fehlerhafte Felder werden beim Speichern markiert.
- **Regeltext**: Absätze durch eine Leerzeile trennen. `**fett**`, `*kursiv*`, Listen mit `- ` am Zeilenanfang. Eine fette Einleitung wie `**Auf höheren Graden.** …` wird als Zwischenüberschrift gesetzt.
- **Felder je Typ**: bei Zaubern z. B. Grad, Schule, Zeitaufwand, Reichweite, Komponenten, Wirkungsdauer, Schaden. Bei Aktionen kannst du unter **Waffe (Werte übernehmen)** eine SRD-Waffe wählen, dann werden Schaden, Eigenschaften und Meisterschaft eingetragen.
- **Entfernungen** gibst du in der Einheit der Kartensprache ein: in Metern bei deutschen, in Fuß bei englischen Karten. Gespeichert wird in Fuß; die andere Sprache rechnet nach dem deutschen SRD um (1,5 m je 5 Fuß, 1,6 km je Meile).
- **Textlänge**: Unter der Vorschau steht, ob der Text passt. Ist er zu lang, wird die Schrift von 6,0 pt bis auf 4,8 pt verkleinert. Reicht das nicht, entstehen automatisch Folgekarten.

**Speichern** übernimmt die Änderungen, **Abbrechen** verwirft sie (mit Rückfrage).

## 6. Drucken und Exportieren

Im Deck öffnet **Drucken & Export …** den Exportdialog.

**Umfang**: das ganze Deck oder nur die ausgewählten Karten. Folgekarten werden automatisch mitgedruckt.

**Formate**:

| Format | Ergebnis |
|---|---|
| **PDF-Bogen** | PDF mit 3 × 3 Karten je Seite, Schnittmarken und am Rand der SRD-Namensnennung, dem Änderungshinweis und der Namensnennung der Symbole. Papier A4 oder US Letter. |
| **PNG-Bilder (ZIP)** | eine PNG-Datei je Karte, 744 × 1039 px (300 dpi), gepackt als ZIP zusammen mit einer Textdatei mit der Namensnennung (`NAMENSNENNUNG.txt` bzw. `ATTRIBUTION.txt`), z. B. für Druckdienste oder digitale Spieltische. Wenn du die Bilder weitergibst, gib die Namensnennung mit. |
| **Direkt drucken (Browser)** | öffnet den Druckdialog des Browsers mit derselben Anordnung wie im PDF |

**3 mm Beschnittzugabe** (nur PDF): Der Ledereinband der Karten reicht 3 mm über die Schnittkante hinaus. Das ist für Druckereien und randlosen Druck gedacht, damit beim Schneiden kein weißer Rand bleibt. Für den Heimdrucker ist es nicht nötig.

### Richtig drucken: 100 %

Damit die Karten genau 63 × 88 mm groß werden und in Standard-Kartenhüllen passen:

1. Im Druckdialog **„Tatsächliche Größe“**, **„100 %“** bzw. **„Keine Skalierung“** wählen, **nicht „An Seite anpassen“**.
2. Papierformat im Drucker passend zum PDF einstellen (A4 oder Letter).
3. Beim Browser-Druck die Kopf- und Fußzeilen des Browsers abschalten und die Ränder auf „Keine“ oder „Standard“ lassen. Die App gibt die Seitengröße selbst vor.
4. Nach dem ersten Druck nachmessen: Eine Karte muss 63 mm breit und 88 mm hoch sein.

Zum Schneiden: an den Schnittmarken entlang mit Lineal und Cutter oder einer Schneidemaschine. Die Karten liegen ohne Abstand nebeneinander, ein Schnitt trennt also zwei Karten.

## 7. Sichern und Weitergeben (JSON)

Deine Decks liegen in der Datenbank deines Browsers (IndexedDB). Sie bleiben beim Schließen erhalten, gehen aber verloren, wenn du die Browserdaten löschst, in einem anderen Browser oder auf einem anderen Rechner arbeitest oder einen privaten Modus benutzt.

- **Als JSON exportieren** speichert das aktuelle Deck als Datei (z. B. `magierzauber-grad-1-3.otc.json`). Exportiere deine Decks regelmäßig.
- **Deck importieren …** lädt eine solche Datei. Das Deck wird vollständig wiederhergestellt, inklusive aller Karten, beider Sprachen und Einstellungen. Gibt es schon ein Deck mit derselben Kennung, wird das importierte als neues Deck angelegt.

Das Dateiformat ist versioniert und beschrieben in [deck-format.md](deck-format.md), damit auch andere Programme Decks erzeugen können.

## 8. Sprachen

- **Oberfläche** und **Karten** haben getrennte Spracheinstellungen. So kannst du z. B. mit deutscher Oberfläche englische Karten drucken.
- Deutsche Karten verwenden die Begriffe des offiziellen deutschen SRD 5.2.1 („Zeitaufwand“, „Wirkungsdauer“, „Bonusaktion“ …), Würfel als „W“ (2W6) und Entfernungen in Metern.
- Englische Karten verwenden Fuß und Meilen.

## 9. Tests

Für Entwickler und zur Kontrolle nach Änderungen:

```bash
npm test                          # Unit- und Integrationstests (Vitest)
npx playwright install chromium firefox   # einmalig: Testbrowser installieren
npm run test:e2e                          # Ende-zu-Ende-Tests in Chromium und Firefox (Playwright)
npm run test:e2e -- --project=chromium    # nur in einem Browser
```

- `npm test` prüft Datenmodell, Einheiten, Kartenrendering, Textumbruch, PDF- und PNG-Erzeugung, Speicherung und die Datenpipeline. Dazu gehört, dass die Gesamtzahlen je Kartentyp in beiden PDFs übereinstimmen und alle Katalogkarten in beiden Sprachen vorliegen. Der Pipeline-Test läuft nur, wenn `data/cache/` vorhanden ist (nach einem Lauf von `npm run pipeline`), sonst wird er übersprungen.
- `npm run test:e2e` startet die App und prüft im Browser den Katalog (Suchen, Filtern, Übernehmen), den Editor, das Umsortieren per Drag & Drop, die exakten Maße von PDF, PNG und Browser-Druck sowie den JSON-Export und -Import.

## 10. Katalog neu erzeugen (für Entwickler)

Der Katalog liegt fertig im Repository (`data/catalog/`). Neu erzeugen musst du ihn nur, wenn du die Pipeline änderst.

Zusätzlich nötig: **Poppler** (`pdftohtml`). Debian/Ubuntu: `sudo apt install poppler-utils`, macOS: `brew install poppler`.

```bash
npm run pipeline          # lädt Open5e-Daten, liest beide SRD-PDFs, schreibt data/catalog
npm run pipeline:offline  # dasselbe aus dem Zwischenspeicher data/cache
```

Ergebnis:

- `data/catalog/<typ>.json` – die Karten
- `data/mapping/<typ>.json` – Zuordnung englischer Schlüssel → deutscher Eintrag. Einträge mit `"manual": true` sind von Hand gesetzt und bleiben bei jedem Lauf erhalten.
- `data/pipeline-report.md` – Bericht mit Zahlen, Zuordnungen und Warnungen

Die Pipeline bricht ab, wenn ein Eintrag keine deutsche Zuordnung hat oder ein deutscher Eintrag doppelt vergeben ist. Dann im Bericht nachsehen und in der Mapping-Datei einen Handeintrag ergänzen.

## 11. Probleme und Lösungen

| Problem | Lösung |
|---|---|
| `npm run dev` meldet „Port 5173 is already in use“ | Die App läuft schon in einem anderen Terminal; dort beenden oder einfach den offenen Browser-Tab nutzen. |
| Gedruckte Karten sind zu klein oder zu groß | Im Druckdialog 100 % / „Tatsächliche Größe“ wählen (siehe [Abschnitt 6](#richtig-drucken-100-)). |
| Decks sind verschwunden | Browserdaten wurden gelöscht, oder du nutzt einen anderen Browser oder ein anderes Profil. Letzten JSON-Export importieren. |
| Der Katalog zeigt „noch nicht erzeugt“ | `data/catalog/` fehlt (z. B. unvollständige Kopie). Repository neu klonen oder `npm run pipeline` ausführen. |
| Eine Karte zeigt englischen Text in einem deutschen Deck | Die Karte hat keinen deutschen Text. Im Editor unter „Texte bearbeiten auf: Deutsch“ ergänzen. |
