/**
 * Units and number formatting shared by the app and the data pipeline.
 *
 * The German SRD 5.2.1 converts 5 feet to 1.5 metres (factor 0.3) and 1 mile to 1.6 km
 * (e.g. range "1 mile" → "1,6 Kilometer", "500 miles" → "800 km").
 * English cards use feet and miles, German cards metres and kilometres (SPEC §9).
 */
import type { Lang } from './schema';

export const FEET_PER_MILE = 5280;
export const METRES_PER_FOOT = 0.3;
export const KM_PER_MILE = 1.6;

/** Format a number with the decimal separator of the language (1,5 vs 1.5). */
export function formatNumber(value: number, lang: Lang): string {
  const rounded = Math.round(value * 100) / 100;
  const text = String(rounded);
  return lang === 'de' ? text.replace('.', ',') : text;
}

/** Feet → metres as used by the German SRD (5 ft = 1.5 m). */
export function feetToMetres(feet: number): number {
  return Math.round(feet * METRES_PER_FOOT * 100) / 100;
}

/** Metres → feet (inverse of {@link feetToMetres}), rounded to whole feet. */
export function metresToFeet(metres: number): number {
  return Math.round(metres / METRES_PER_FOOT);
}

/**
 * Format a distance stored in feet for the given card language.
 * `long` selects the long form ("150 feet" / "45 Meter") instead of the short one ("150 ft." / "45 m").
 */
export function formatDistance(feet: number, lang: Lang, long = false): string {
  if (feet >= FEET_PER_MILE && feet % FEET_PER_MILE === 0) {
    const miles = feet / FEET_PER_MILE;
    if (lang === 'de') return `${formatNumber(miles * KM_PER_MILE, lang)} ${long ? 'Kilometer' : 'km'}`;
    return `${miles} ${long ? (miles === 1 ? 'mile' : 'miles') : 'mi.'}`;
  }
  if (lang === 'de') return `${formatNumber(feetToMetres(feet), lang)} ${long ? 'Meter' : 'm'}`;
  return `${feet} ${long ? (feet === 1 ? 'foot' : 'feet') : 'ft.'}`;
}

/** Normal/long range pair, e.g. "80/320 ft." or "24/96 m". */
export function formatRangePair(normal: number, long: number | undefined, lang: Lang): string {
  if (long === undefined) return formatDistance(normal, lang);
  if (lang === 'de') {
    return `${formatNumber(feetToMetres(normal), lang)}/${formatNumber(feetToMetres(long), lang)} m`;
  }
  return `${normal}/${long} ft.`;
}

/** Localise a dice expression: "8d6" → "8W6" in German. */
export function formatDice(dice: string, lang: Lang): string {
  const normalised = dice.trim().replace(/\s*([+-])\s*/g, ' $1 ');
  return lang === 'de' ? normalised.replace(/(\d*)d(\d+)/gi, '$1W$2') : normalised.replace(/(\d*)[dw](\d+)/gi, '$1d$2');
}

/** Parse a dice expression in either notation ("1W8", "1d8") into English notation. */
export function normaliseDice(input: string): string {
  return input.trim().replace(/(\d*)\s*[dDwW]\s*(\d+)/g, '$1d$2').replace(/\s+/g, ' ');
}
