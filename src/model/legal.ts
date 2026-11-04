/**
 * Legal notices (SPEC §10). The SRD attribution is mandatory in the app (About page) and on
 * every PDF sheet, in the language of the deck. No other references to the publisher.
 */
import type { Lang } from './schema';

export const SRD_ATTRIBUTION: Record<Lang, string> = {
  de: 'Dieses Werk enthält Material aus dem Systemreferenzdokument 5.2.1 („SRD 5.2.1“) von Wizards of the Coast LLC, verfügbar unter https://www.dndbeyond.com/srd. Das SRD 5.2.1 ist lizenziert gemäß Creative Commons Namensnennung 4.0 International Public License (verfügbar unter https://creativecommons.org/licenses/by/4.0/legalcode.de).',
  en: 'This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.',
};

export const COMPATIBILITY: Record<Lang, string> = {
  de: 'kompatibel mit der fünften Edition',
  en: '5E compatible',
};

export const ICON_ATTRIBUTION: Record<Lang, string> = {
  de: 'Symbole von game-icons.net (Lorc, Delapouite), lizenziert unter CC BY 3.0.',
  en: 'Icons from game-icons.net (Lorc, Delapouite), licensed under CC BY 3.0.',
};
