# Deck-Dateiformat (`formatVersion` 1)

Decks werden als JSON-Datei exportiert und importiert (SPEC §7). Das Format ist versioniert und
dokumentiert, damit andere Werkzeuge Decks erzeugen oder lesen können.

- Dateiendung: `.deckwright.json`; vor der Umbenennung `.otc.json` (jede `.json`-Datei wird beim Import akzeptiert)
- Zeichensatz: UTF-8
- Maschinenlesbares Schema: [deck-format.schema.json](deck-format.schema.json) (JSON Schema 2020-12, erzeugt aus dem Code mit `npm run schema`)
- Referenzimplementierung: [src/model/schema.ts](../src/model/schema.ts) und [src/model/deckFile.ts](../src/model/deckFile.ts)

## Aufbau

```json
{
  "formatVersion": 1,
  "generator": "deckwright",
  "exportedAt": "2026-11-03T12:00:00.000Z",
  "deck": {
    "id": "6f1c…",
    "name": "Magierzauber Grad 1–3",
    "lang": "de",
    "options": { "colorBySchool": true },
    "createdAt": "2026-11-03T10:00:00.000Z",
    "updatedAt": "2026-11-03T12:00:00.000Z",
    "cards": [ … ]
  }
}
```

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `formatVersion` | ja | Immer `1`. Neuere Versionen werden mit einer Fehlermeldung abgelehnt. |
| `generator`, `exportedAt` | nein | Informativ. Die App schreibt `deckwright`; ältere Dateien mit `open-tabletop-cards` werden genauso importiert. |
| `deck.id` | ja | Beliebige eindeutige Zeichenkette. Existiert beim Import schon ein Deck mit dieser ID, bekommt das importierte Deck eine neue. |
| `deck.name` | ja | Name des Decks. |
| `deck.lang` | ja | Kartensprache `de` oder `en`. Beschriftungen und Texte der Karten folgen ihr. |
| `deck.options.colorBySchool` | nein | Zauberkarten in der Farbe ihrer Schule einfärben. |
| `deck.cards` | ja | Geordnete Liste der Karten (Reihenfolge = Druckreihenfolge). |

## Karten

Gemeinsame Felder aller Karten:

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `id` | ja | Eindeutige ID (UUID empfohlen). |
| `type` | ja | `spell`, `action`, `feature`, `item` oder `condition` |
| `srdKey` | nein | Verweis auf den SRD-Katalogeintrag, z. B. `srd-2024_fireball` |
| `name` | ja | Text je Sprache, mindestens eine Sprache nicht leer: `{ "de": "Feuerball", "en": "Fireball" }` |
| `description` | ja | Regeltext je Sprache (Markdown-Untermenge, siehe unten) |
| `source` | nein | `srd-5.2.1` oder `custom` |
| `tags` | nein | Liste freier Schlagwörter |

Je nach `type` kommt genau ein Objekt mit den typspezifischen Feldern hinzu: `spell`, `action`,
`feature` oder `item` (Zustände haben keins).

### Konventionen

- **Strukturierte Werte sind Schlüssel**, keine Texte: `"school": "evocation"`, `"save": "dex"`,
  `"types": ["fire"]`. Die App übersetzt sie beim Darstellen in die Kartensprache.
- **Entfernungen in Fuß** (`feet`, `reach`, `range.normal`/`range.long`). Deutsche Karten zeigen
  sie in Metern nach der Umrechnung des deutschen SRD: 5 Fuß = 1,5 m, 1 Meile (5280 Fuß) = 1,6 km.
- **Würfel in englischer Notation**: `"8d6"`, `"1d6 + 4"`. Deutsche Karten zeigen `8W6`.
- **Freitexte je Sprache** (`{ "de": …, "en": … }`), z. B. Materialkomponente, Auslöser, „Auf höheren Graden“.

### Markdown-Untermenge im Regeltext

- Absätze durch eine Leerzeile trennen
- `**fett**`, `*kursiv*` (auch `_kursiv_`), `***fett kursiv***`
- Aufzählungen: Zeilen, die mit `- `, `* ` oder `• ` beginnen

Andere Markdown-Elemente (Überschriften, Tabellen, Links) werden als normaler Text ausgegeben.

### Zauber (`spell`)

```json
{
  "level": 3,
  "school": "evocation",
  "castingTime": { "unit": "action" },
  "ritual": false,
  "range": { "kind": "distance", "feet": 150 },
  "components": {
    "verbal": true, "somatic": true, "material": true,
    "materialText": { "de": "eine Kugel aus Fledermaus-Guano und Schwefel", "en": "a ball of bat guano and sulfur" }
  },
  "duration": { "kind": "instantaneous" },
  "concentration": false,
  "attack": false,
  "save": "dex",
  "damage": { "dice": "8d6", "types": ["fire"] },
  "classes": ["sorcerer", "wizard"],
  "higherLevels": { "de": "Für jeden Zauberplatzgrad über dem 3. …", "en": "The damage increases by 1d6 …" }
}
```

| Feld | Werte |
|---|---|
| `level` | 0 (Zaubertrick) bis 9 |
| `school` | `abjuration`, `conjuration`, `divination`, `enchantment`, `evocation`, `illusion`, `necromancy`, `transmutation` |
| `castingTime.unit` | `action`, `bonus`, `reaction`, `minute`, `hour`; `amount` für Minuten/Stunden; `trigger` (Text) bei Reaktionen |
| `range.kind` | `self`, `touch`, `distance` (mit `feet`), `sight`, `unlimited`, `special` |
| `components` | `verbal`, `somatic`, `material` (bool); optional `materialText`, `materialCost` (GM), `materialConsumed` |
| `duration.kind` | `instantaneous`, `round`, `minute`, `hour`, `day` (mit `amount`), `until-dispelled`, `until-dispelled-or-triggered`, `special` |
| `save` | `str`, `dex`, `con`, `int`, `wis`, `cha` (ohne Zahlenwert) |
| `damage.types` | `acid`, `bludgeoning`, `cold`, `fire`, `force`, `lightning`, `necrotic`, `piercing`, `poison`, `psychic`, `radiant`, `slashing`, `thunder` |
| `classes` | `barbarian`, `bard`, `cleric`, `druid`, `fighter`, `monk`, `paladin`, `ranger`, `rogue`, `sorcerer`, `warlock`, `wizard` |

### Aktion (`action`)

```json
{
  "actionType": "action",
  "weapon": { "key": "srd-2024_longsword", "category": "martial", "kind": "melee", "versatileDice": "1d10", "properties": ["versatile"] },
  "damage": { "dice": "1d8", "types": ["slashing"] },
  "reach": 5,
  "mastery": "sap",
  "masteryText": { "de": "…", "en": "…" }
}
```

`actionType`: `action`, `bonus`, `reaction`. Optional: `weapon` (`category` `simple`/`martial`,
`kind` `melee`/`ranged`, `properties` aus `ammunition`, `finesse`, `heavy`, `light`, `loading`,
`reach`, `thrown`, `two-handed`, `versatile`; `ammunition` `arrow`, `bolt`, `firearm-bullet`,
`sling-bullet`, `needle`), `damage`, `range` (`normal`, `long` in Fuß), `reach` (Fuß),
`mastery` (`cleave`, `graze`, `nick`, `push`, `sap`, `slow`, `topple`, `vex`), `masteryText`, `trigger`.

### Fähigkeit (`feature`)

```json
{
  "origin": { "kind": "class", "classKey": "fighter", "level": 2 },
  "activation": "passive",
  "uses": { "de": "…", "en": "…" },
  "recovery": "short-rest",
  "prerequisite": { "en": "Level 4+" }
}
```

`origin.kind`: `class`, `subclass`, `species`, `feat`, `background`, `other`; dazu optional
`classKey`, `name` (Text, z. B. Unterklasse oder Spezies), `level` (1–20), `featCategory`
(`origin`, `general`, `fighting-style`, `epic-boon`). `activation`: `action`, `bonus`,
`reaction`, `passive`. `recovery`: `short-rest`, `long-rest`, `none`.

### Gegenstand (`item`)

```json
{
  "category": "wand",
  "rarity": "uncommon",
  "attunement": true,
  "attunementDetail": { "de": "durch einen Zauberwirker", "en": "by a Spellcaster" },
  "charges": { "count": 7, "recharge": { "de": "1W6 + 1 bei Tagesanbruch", "en": "1d6 + 1 at dawn" } }
}
```

`category`: `weapon`, `armor`, `shield`, `ammunition`, `wondrous-item`, `potion`, `ring`, `rod`,
`scroll`, `staff`, `wand`, `adventuring-gear`, `other`; optional `categoryDetail` (Text).
`rarity`: `common`, `uncommon`, `rare`, `very-rare`, `legendary`, `artifact`, `varies`;
optional `rarityText` für gestaffelte Seltenheiten.

### Zustand (`condition`)

Nur die gemeinsamen Felder. Die Effekte stehen als Aufzählung im Regeltext.

## Minimalbeispiel

```json
{
  "formatVersion": 1,
  "deck": {
    "id": "mein-deck",
    "name": "Zustände",
    "lang": "en",
    "createdAt": "2026-11-03T00:00:00Z",
    "updatedAt": "2026-11-03T00:00:00Z",
    "cards": [
      { "id": "c1", "type": "condition", "name": { "en": "Dazed" }, "description": { "en": "- **Slowed.** Your Speed is halved." } }
    ]
  }
}
```

Fehlende optionale Felder werden beim Import mit Standardwerten ergänzt (z. B. `ritual: false`).
Ungültige Dateien werden vollständig abgelehnt; die Fehlermeldung nennt die betroffenen Felder
(z. B. `deck.cards.0.spell.level`).
