# Third-party notices

The source code of open-tabletop-cards is released under the [MIT License](LICENSE). The repository and the app also contain the following material, which keeps its own license.

## System Reference Document 5.2.1

- Files: [data/catalog/](data/catalog/) (derived data, see [data/catalog/LICENSE.md](data/catalog/LICENSE.md)). The official PDFs are not part of the repository; the data pipeline downloads them into `srd/`, see [srd/README.md](srd/README.md)
- License: Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/legalcode

> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Changes: the SRD texts were split into individual entries and reformatted for cards, tables and sidebars were removed.

open-tabletop-cards is an independent project. It is compatible with fifth edition and is not affiliated with or endorsed by the publisher of the SRD.

## Icons from game-icons.net

- Files: path data in [src/render/icons.ts](src/render/icons.ts), from https://github.com/game-icons/icons (only the foreground path is kept)
- Authors: Lorc and Delapouite, https://game-icons.net; the About page of the app lists every icon with its author and a link to its page
- License: Creative Commons Attribution 3.0 Unported, [public/licenses/CC-BY-3.0.txt](public/licenses/CC-BY-3.0.txt)

## TeX Gyre Schola

- Files: [src/render/fonts/](src/render/fonts/) (unmodified OpenType files)
- Copyright 2006, 2009 B. Jackowski and J. M. Nowacki (GUST e-foundry, on behalf of TeX users groups)
- License: GUST Font License, [public/licenses/GUST-FONT-LICENSE.txt](public/licenses/GUST-FONT-LICENSE.txt) (LaTeX Project Public License 1.3c or later)

## npm dependencies

The app bundles React, React DOM, i18next, react-i18next, zod, Dexie, pdf-lib, fflate and html-to-image together with their dependencies. All of them are released under permissive licenses (MIT, Apache-2.0, ISC, 0BSD, Zlib); their license texts are in the respective packages under `node_modules/` after `npm install`.
