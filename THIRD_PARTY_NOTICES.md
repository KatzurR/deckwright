# Third-party notices

The source code of Deckwright is released under the [MIT License](LICENSE). The repository and the app also contain the following material, which keeps its own license.

## System Reference Document 5.2.1

- Files: [data/catalog/](data/catalog/) (derived data, see [data/catalog/LICENSE.md](data/catalog/LICENSE.md)) and the example cards [docs/design/beschlag.png](docs/design/beschlag.png) and [docs/design/beschlag-layouts.png](docs/design/beschlag-layouts.png). The official PDFs are not part of the repository; the data pipeline downloads them into `srd/`, see [srd/README.md](srd/README.md)
- License: Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/legalcode

> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Changes: the SRD texts were split into individual entries and reformatted for cards, tables and sidebars were removed.

Deckwright is an independent project. It is compatible with fifth edition and is not affiliated with or endorsed by the publisher of the SRD.

## Icons from game-icons.net

- Files: path data in [src/render/icons.ts](src/render/icons.ts), from https://github.com/game-icons/icons (only the foreground path is kept); the example cards in [docs/design/](docs/design/) show "fireball" by Lorc
- Authors: Lorc and Delapouite, https://game-icons.net; the About page of the app lists every icon with its author and a link to its page
- License: Creative Commons Attribution 3.0 Unported, [public/licenses/CC-BY-3.0.txt](public/licenses/CC-BY-3.0.txt)

## Alegreya

- Files: `alegreya-latin-*.woff2` in [src/render/fonts/](src/render/fonts/) (Latin subset in WOFF2 format, from the npm package `@fontsource/alegreya` 5.3.0)
- Copyright 2011 The Alegreya Project Authors (https://github.com/huertatipografica/Alegreya)
- License: SIL Open Font License 1.1, [public/licenses/OFL-alegreya.txt](public/licenses/OFL-alegreya.txt)

## Grenze Gotisch

- Files: `grenze-gotisch-latin-700-normal.woff2` in [src/render/fonts/](src/render/fonts/) (Latin subset in WOFF2 format, from the npm package `@fontsource/grenze-gotisch` 5.3.0)
- Copyright 2020 The Grenze Gotisch Project Authors (https://github.com/Omnibus-Type/Grenze-Gotisch)
- License: SIL Open Font License 1.1, [public/licenses/OFL-grenze-gotisch.txt](public/licenses/OFL-grenze-gotisch.txt)

## npm dependencies

The app bundles React, React DOM, i18next, react-i18next, zod, Dexie, pdf-lib, fflate and html-to-image together with their dependencies. All of them are released under permissive licenses (MIT, Apache-2.0, ISC, 0BSD, Zlib); their license texts are in the respective packages under `node_modules/` after `npm install`.
