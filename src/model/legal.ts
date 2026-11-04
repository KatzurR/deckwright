/**
 * Legal notices (SPEC §10). The SRD attribution is mandatory in the app (About page) and on
 * every PDF sheet, in the language of the deck. No other references to the publisher.
 *
 * CC BY 4.0 (§3(a)(1)(B)) also requires stating that the material was modified, and the icons
 * (CC BY 3.0) need a credit wherever cards are shared – so exported sheets and the PNG ZIP carry
 * `SRD_CHANGES` and `ICON_ATTRIBUTION` as well.
 */
import type { Lang } from './schema';

export const SRD_ATTRIBUTION: Record<Lang, string> = {
  de: 'Dieses Werk enthält Material aus dem Systemreferenzdokument 5.2.1 („SRD 5.2.1“) von Wizards of the Coast LLC, verfügbar unter https://www.dndbeyond.com/srd. Das SRD 5.2.1 ist lizenziert gemäß Creative Commons Namensnennung 4.0 International Public License (verfügbar unter https://creativecommons.org/licenses/by/4.0/legalcode.de).',
  en: 'This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.',
};

/** Modification notice required by CC BY 4.0 §3(a)(1)(B). */
export const SRD_CHANGES: Record<Lang, string> = {
  de: 'Änderungen: Die SRD-Texte wurden in einzelne Einträge aufgeteilt und für Karten neu formatiert, Tabellen und Infokästen wurden entfernt; Karten können zusätzlich bearbeitet worden sein.',
  en: 'Changes: the SRD texts were split into individual entries and reformatted for cards, tables and sidebars were removed; cards may have been edited further.',
};

export const COMPATIBILITY: Record<Lang, string> = {
  de: 'kompatibel mit der fünften Edition',
  en: '5E compatible',
};

export const ICON_ATTRIBUTION: Record<Lang, string> = {
  de: 'Symbole von game-icons.net (Lorc, Delapouite), lizenziert unter CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/).',
  en: 'Icons from game-icons.net (Lorc, Delapouite), licensed under CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/).',
};

/** Second notice on every sheet, in the margin opposite the SRD attribution. */
export function sheetCredits(lang: Lang): string {
  return `${SRD_CHANGES[lang]} ${ICON_ATTRIBUTION[lang]}`;
}

export const NOTICE_FILE_NAME: Record<Lang, string> = {
  de: 'NAMENSNENNUNG.txt',
  en: 'ATTRIBUTION.txt',
};

/** Plain-text notice that accompanies exported card images (PNG ZIP). */
export function noticeText(lang: Lang): string {
  return [
    'open-tabletop-cards',
    '',
    SRD_ATTRIBUTION[lang],
    '',
    SRD_CHANGES[lang],
    '',
    ICON_ATTRIBUTION[lang],
    '',
  ].join('\n');
}
