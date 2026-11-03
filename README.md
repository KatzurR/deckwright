# open-tabletop-cards

An open-source tool for turning D&D rules content — spells, actions, class features, abilities, items, and conditions — into small, printable reference cards you can keep at the table.

> **Status:** Early planning. The specification is being written; there is no usable release yet.

## Why

Character sheets get crowded. Flipping through a rulebook mid-combat slows the game down. A stack of small cards — one per spell or ability — keeps the essentials in front of the player: range, duration, components, damage, and a short rules summary.

open-tabletop-cards aims to make those cards quick to create, consistent in layout, and easy to print.

## Planned features

- **Card types** for spells, actions, class features / abilities, items, and conditions, each with a layout suited to its content
- **Structured data input** so cards can be created from a file instead of typed by hand one at a time
- **Card editor** to create and adjust individual cards
- **Export formats**
  - Print-ready PDF sheets (multiple cards per page, with cut marks)
  - Card-sleeve inserts in common card sizes
  - PNG images per card
- **Decks** to group cards per character, class, or encounter

The exact scope, data format, and technology stack will be defined in the specification.

## Content and licensing

The code in this repository is released under the [MIT License](LICENSE).

open-tabletop-cards is compatible with fifth edition (2024 rules). The only rules content included is the System Reference Document 5.2.1, in its official English and German versions (see [srd/](srd/)):

> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Any other content you enter, for example from books you own, stays in your own files and is your responsibility.

## Contributing

The project is at the specification stage. Ideas and feedback are welcome via [GitHub Issues](https://github.com/KatzurR/open-tabletop-cards/issues).

## License

[MIT](LICENSE) © 2026 KatzurR
