# SRD 5.2.1 – Quelldokumente

Die Datenpipeline liest das System Reference Document 5.2.1 (Regeln 5e 2024) in den offiziellen Fassungen. Die PDFs liegen **nicht im Repository**: `npm run pipeline` lädt sie beim ersten Lauf von den offiziellen Adressen in diesen Ordner (von Git ignoriert) und prüft die SHA-256-Prüfsumme (`SRD_SOURCES` in [scripts/pipeline/sources.ts](../scripts/pipeline/sources.ts)). Ändert der Herausgeber eine Datei, bricht die Pipeline mit einem Hinweis ab.

| Datei | Sprache | Seiten | Quelle | SHA-256 |
|---|---|---|---|---|
| `SRD_CC_v5.2.1_DE.pdf` | Deutsch | 412 | https://media.dndbeyond.com/compendium-images/srd/5.2/DE_SRD_CC_v5.2.1.pdf | `f06989dc…bc5e3d87` |
| `SRD_CC_v5.2.1_EN.pdf` | Englisch | 364 | https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf | `8974902d…bbe8a65b` |

Stand 2026-11-03. Übersicht aller Fassungen: https://www.dndbeyond.com/srd

Die Dateien werden unverändert verwendet. Sie dienen als Quelle, um strukturierte Kartendaten (Zauber, Zustände, Fähigkeiten …) zu extrahieren, insbesondere die deutschen Texte, die über die Open5e-API nicht verfügbar sind.

## Lizenz und Namensnennung

Beide Dokumente stehen unter CC BY 4.0. Jedes Werk, das Inhalte daraus verwendet, muss die folgende Erklärung enthalten. Andere Verweise auf den Herausgeber sind laut Lizenzhinweis nicht erlaubt.

**Deutsch:**

> Dieses Werk enthält Material aus dem Systemreferenzdokument 5.2.1 („SRD 5.2.1“) von Wizards of the Coast LLC, verfügbar unter https://www.dndbeyond.com/srd. Das SRD 5.2.1 ist lizenziert gemäß Creative Commons Namensnennung 4.0 International Public License (verfügbar unter https://creativecommons.org/licenses/by/4.0/legalcode.de).

**English:**

> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.
