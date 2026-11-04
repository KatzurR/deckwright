# Kartendesign: Grimoire Codex

Gewählter Stil für alle Kartentypen (Ergänzung zu [SPEC.md](../SPEC.md), Abschnitt 5).

<img src="grimoire-codex.png" width="320" alt="Beispielkarte Feuerball im Stil Grimoire Codex">

Beispiel: Zauber **Feuerball** mit deutschem SRD-5.2.1-Text und dem Beispielprofil „Elara · Magierin 5“ (Zauber-SG 14).

| Datei | Inhalt |
|---|---|
| [grimoire-codex.png](grimoire-codex.png) | Referenzbild, 744 × 1039 px = 63 × 88 mm bei 300 dpi |

Das Flammensymbol ist ein Platzhalter. In der App kommen die Symbole von game-icons.net.

## Aufbau

Von außen nach innen und von oben nach unten:

1. **Ledereinband**: umlaufendes Band, 2,9 mm breit, dunkelbraun mit Lederstruktur. Außen eine feine Goldlinie.
2. **Pergament**: Innenfläche mit leichter Wolkenstruktur und Vignette, darin eine feine braune Rahmenlinie.
3. **Medaillon**: rund, ⌀ 10,5 mm, oben mittig und über den Rand hinausragend. Lederring mit Goldrand, innen Pergament mit Ring in der Akzentfarbe und Typ- bzw. Schulsymbol.
4. **Kopf**: Name zentriert in der Akzentfarbe, darunter der Untertitel kursiv (z. B. „Hervorrufungszauber 3. Grades“).
5. **Trenner**: Linie mit Raute in der Akzentfarbe in der Mitte.
6. **Eigenschaftsblock**: zwei Spalten mit senkrechter Mittellinie, je Feld eine Beschriftung in Versalien (Akzentfarbe) und der Wert darunter, alles zentriert. Bei Zaubern: Zeitaufwand, Reichweite, Komponenten, Wirkungsdauer, Rettungswurf/Angriff, Schaden. Der Materialtext steht als Fußnote (`*`) darunter.
7. **Regeltext**: linksbündig. „Auf höheren Graden.“ fett kursiv als Einleitung des letzten Absatzes.
8. **Fußzeile**: links die Klassen bzw. Herkunft, rechts die Quelle, kursiv. Mittig ragt ein Schild aus dem unteren Lederband mit dem Grad (bei Gegenständen: Seltenheit als Kürzel).

## Farben

| Rolle | Wert |
|---|---|
| Leder | `#4b2a16` |
| Gold (Linien, Schild-Text) | `#c79a3e` |
| Pergament | `#efe1bd`, Medaillon innen `#f7ecd2` |
| Text | `#3b2614` |
| Linien, Fußnote, Fußzeile | `#6b4523` |
| Akzent (Zauber, Hervorrufung) | `#8a2a12` |

Die Akzentfarbe wechselt je Kartentyp bzw. Zauberschule (SPEC Abschnitt 5) und betrifft Name, Beschriftungen, Rauten und den Ring im Medaillon. Leder, Gold und Pergament bleiben für alle Typen gleich.

## Schrift

Serifenschrift aus der Familie Century Schoolbook. Der Entwurf wurde mit **C059** (URW) gezeichnet. Die App verwendet die gleichwertige **TeX Gyre Schola** (GUST Font License, frei auslieferbar; SPEC Abschnitt 11.1). Größen bei 300 dpi:

| Element | Schnitt | Größe |
|---|---|---|
| Name | Bold | 14,4 pt |
| Untertitel | Italic | 6,2 pt |
| Beschriftung Eigenschaften | Bold, Versalien, Sperrung | 3,8 pt |
| Wert Eigenschaften | Roman | 6,5 pt |
| Regeltext | Roman | 6,0 pt (bei langen Texten bis 4,8 pt) |
| Fußnote Material | Italic | 4,8 pt |
| Fußzeile | Italic | 4,6 pt |
| Grad im Schild | Bold | 7,2 pt |

Diese Größen gelten für einen Regeltext, der auf eine Karte passt. Bei längeren Texten greift die Verkleinerung bzw. Folgekarte aus SPEC Abschnitt 5.

## Noch zu prüfen

- **Probedruck:** Die Beschriftung der Eigenschaften (3,8 pt) ist sehr klein. Ein Probedruck soll zeigen, ob sie lesbar bleibt, und die Mindestgröße für den Regeltext bestätigen (vorläufig 4,8 pt, `FONT` in `src/render/paginate.ts`).

## Erledigt

- **Tinte und Schnitt:** Der Ledereinband reicht bis an den Kartenrand. Auf dem PDF-Bogen liegen die Karten ohne Abstand nebeneinander, die Nachbarkarte wirkt als Beschnitt. Außen bekommt das Raster optional 3 mm Beschnittzugabe (SPEC Abschnitte 8 und 11.1).
