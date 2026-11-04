# Deck file format (`formatVersion` 1)

Decks are exported and imported as JSON files (SPEC §7). The format is versioned and
documented, so that other tools can create or read decks.

- File extension: `.deckwright.json`; before the rename `.otc.json` (any `.json` file is accepted on import)
- Character encoding: UTF-8
- Machine-readable schema: [deck-format.schema.json](deck-format.schema.json) (JSON Schema 2020-12, generated from the code with `npm run schema`)
- Reference implementation: [src/model/schema.ts](../src/model/schema.ts) and [src/model/deckFile.ts](../src/model/deckFile.ts)

## Structure

```json
{
  "formatVersion": 1,
  "generator": "deckwright",
  "exportedAt": "2026-11-03T12:00:00.000Z",
  "deck": {
    "id": "6f1c…",
    "name": "Wizard spells levels 1–3",
    "lang": "de",
    "options": { "colorBySchool": true },
    "createdAt": "2026-11-03T10:00:00.000Z",
    "updatedAt": "2026-11-03T12:00:00.000Z",
    "cards": [ … ]
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `formatVersion` | yes | Always `1`. Newer versions are rejected with an error message. |
| `generator`, `exportedAt` | no | Informative. The app writes `deckwright`; older files with `open-tabletop-cards` are imported the same way. |
| `deck.id` | yes | Any unique string. If a deck with this ID already exists on import, the imported deck gets a new one. |
| `deck.name` | yes | Name of the deck. |
| `deck.lang` | yes | Card language `de` or `en`. The labels and texts of the cards follow it. |
| `deck.options.colorBySchool` | no | Colour spell cards in the colour of their school. |
| `deck.cards` | yes | Ordered list of cards (order = print order). |

## Cards

Fields common to all cards:

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique ID (UUID recommended). |
| `type` | yes | `spell`, `action`, `feature`, `item` or `condition` |
| `srdKey` | no | Reference to the SRD catalog entry, e.g. `srd-2024_fireball` |
| `name` | yes | Text per language, at least one language not empty: `{ "de": "Feuerball", "en": "Fireball" }` |
| `description` | yes | Rules text per language (Markdown subset, see below) |
| `source` | no | `srd-5.2.1` or `custom` |
| `tags` | no | List of free keywords |

Depending on `type`, exactly one object with the type-specific fields is added: `spell`, `action`,
`feature` or `item` (conditions have none).

### Conventions

- **Structured values are keys**, not texts: `"school": "evocation"`, `"save": "dex"`,
  `"types": ["fire"]`. The app translates them into the card language when displaying them.
- **Distances in feet** (`feet`, `reach`, `range.normal`/`range.long`). German cards show
  them in metres, converted as in the German SRD: 5 feet = 1.5 m, 1 mile (5280 feet) = 1.6 km.
- **Dice in English notation**: `"8d6"`, `"1d6 + 4"`. German cards show `8W6`.
- **Free texts per language** (`{ "de": …, "en": … }`), e.g. material component, trigger, "At higher levels".

### Markdown subset in the rules text

- Separate paragraphs with a blank line
- `**bold**`, `*italic*` (also `_italic_`), `***bold italic***`
- Lists: lines that start with `- `, `* ` or `• `

Other Markdown elements (headings, tables, links) are output as plain text.

### Spell (`spell`)

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

| Field | Values |
|---|---|
| `level` | 0 (cantrip) to 9 |
| `school` | `abjuration`, `conjuration`, `divination`, `enchantment`, `evocation`, `illusion`, `necromancy`, `transmutation` |
| `castingTime.unit` | `action`, `bonus`, `reaction`, `minute`, `hour`; `amount` for minutes/hours; `trigger` (text) for reactions |
| `range.kind` | `self`, `touch`, `distance` (with `feet`), `sight`, `unlimited`, `special` |
| `components` | `verbal`, `somatic`, `material` (bool); optional `materialText`, `materialCost` (GP), `materialConsumed` |
| `duration.kind` | `instantaneous`, `round`, `minute`, `hour`, `day` (with `amount`), `until-dispelled`, `until-dispelled-or-triggered`, `special` |
| `save` | `str`, `dex`, `con`, `int`, `wis`, `cha` (without a number) |
| `damage.types` | `acid`, `bludgeoning`, `cold`, `fire`, `force`, `lightning`, `necrotic`, `piercing`, `poison`, `psychic`, `radiant`, `slashing`, `thunder` |
| `classes` | `barbarian`, `bard`, `cleric`, `druid`, `fighter`, `monk`, `paladin`, `ranger`, `rogue`, `sorcerer`, `warlock`, `wizard` |

### Action (`action`)

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
`kind` `melee`/`ranged`, `properties` from `ammunition`, `finesse`, `heavy`, `light`, `loading`,
`reach`, `thrown`, `two-handed`, `versatile`; `ammunition` `arrow`, `bolt`, `firearm-bullet`,
`sling-bullet`, `needle`), `damage`, `range` (`normal`, `long` in feet), `reach` (feet),
`mastery` (`cleave`, `graze`, `nick`, `push`, `sap`, `slow`, `topple`, `vex`), `masteryText`, `trigger`.

### Feature (`feature`)

```json
{
  "origin": { "kind": "class", "classKey": "fighter", "level": 2 },
  "activation": "passive",
  "uses": { "de": "…", "en": "…" },
  "recovery": "short-rest",
  "prerequisite": { "en": "Level 4+" }
}
```

`origin.kind`: `class`, `subclass`, `species`, `feat`, `background`, `other`; plus optionally
`classKey`, `name` (text, e.g. subclass or species), `level` (1–20), `featCategory`
(`origin`, `general`, `fighting-style`, `epic-boon`). `activation`: `action`, `bonus`,
`reaction`, `passive`. `recovery`: `short-rest`, `long-rest`, `none`.

### Item (`item`)

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
`scroll`, `staff`, `wand`, `adventuring-gear`, `other`; optional `categoryDetail` (text).
`rarity`: `common`, `uncommon`, `rare`, `very-rare`, `legendary`, `artifact`, `varies`;
optional `rarityText` for tiered rarities.

### Condition (`condition`)

Only the common fields. The effects are listed in the rules text.

## Minimal example

```json
{
  "formatVersion": 1,
  "deck": {
    "id": "my-deck",
    "name": "Conditions",
    "lang": "en",
    "createdAt": "2026-11-03T00:00:00Z",
    "updatedAt": "2026-11-03T00:00:00Z",
    "cards": [
      { "id": "c1", "type": "condition", "name": { "en": "Dazed" }, "description": { "en": "- **Slowed.** Your Speed is halved." } }
    ]
  }
}
```

Missing optional fields are filled in with default values on import (e.g. `ritual: false`).
Invalid files are rejected completely; the error message names the affected fields
(e.g. `deck.cards.0.spell.level`).
