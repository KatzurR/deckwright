# SRD 5.2.1 – source documents

The data pipeline reads the System Reference Document 5.2.1 (5e 2024 rules) in its official versions. The PDFs are **not in the repository**: on the first run, `npm run pipeline` downloads them from the official addresses into this folder (ignored by Git) and checks the SHA-256 checksum (`SRD_SOURCES` in [scripts/pipeline/sources.ts](../scripts/pipeline/sources.ts)). If the publisher changes a file, the pipeline stops with a notice.

| File | Language | Pages | Source | SHA-256 |
|---|---|---|---|---|
| `SRD_CC_v5.2.1_DE.pdf` | German | 412 | https://media.dndbeyond.com/compendium-images/srd/5.2/DE_SRD_CC_v5.2.1.pdf | `f06989dc…bc5e3d87` |
| `SRD_CC_v5.2.1_EN.pdf` | English | 364 | https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf | `8974902d…bbe8a65b` |

As of 2026-11-03. Overview of all versions: https://www.dndbeyond.com/srd

The files are used unchanged. They serve as the source for extracting structured card data (spells, conditions, features …), in particular the German texts, which are not available through the Open5e API.

## License and attribution

Both documents are licensed under CC BY 4.0. Every work that uses content from them must include the following statement. According to the license notice, other references to the publisher are not allowed.

**German** (official German attribution, quoted unchanged):

> Dieses Werk enthält Material aus dem Systemreferenzdokument 5.2.1 („SRD 5.2.1“) von Wizards of the Coast LLC, verfügbar unter https://www.dndbeyond.com/srd. Das SRD 5.2.1 ist lizenziert gemäß Creative Commons Namensnennung 4.0 International Public License (verfügbar unter https://creativecommons.org/licenses/by/4.0/legalcode.de).

**English:**

> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.
