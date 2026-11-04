/**
 * English ↔ German assignment (SPEC §6.2).
 *
 * Both PDFs are sorted alphabetically by the name in their language, so entries cannot be
 * paired by position. Instead every entry gets a fingerprint built from values that agree
 * in both languages (level, school, classes, ranges converted ft → m, dice …).
 *
 * 1. Entries whose primary fingerprint is unique on both sides are paired directly.
 * 2. Inside a group with several candidates, pairs are scored by secondary features
 *    (dice in the text, relative text length) and accepted only with a clear margin.
 * 3. Everything else is reported as ambiguous/unmatched and must be resolved by a manual
 *    entry in data/mapping/<type>.json.
 */

export interface Candidate {
  /** English: srdKey; German: German name. */
  id: string;
  /** Values that must be identical in both languages. */
  primary: string;
  /** Secondary tokens (e.g. dice) compared as multisets. */
  tokens: string[];
  /** Length of the rules text (German texts are ~1.2× longer than English ones). */
  length: number;
}

export interface MatchResult {
  pairs: Map<string, string>; // en id → de id
  ambiguous: { primary: string; en: string[]; de: string[] }[];
  unmatchedEn: string[];
  unmatchedDe: string[];
}

/** Multiset Jaccard similarity of token lists (1 = identical, 0 = disjoint, 1 when both empty). */
export function tokenSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const count = (xs: string[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());
  const ca = count(a);
  const cb = count(b);
  let inter = 0;
  let union = 0;
  for (const k of new Set([...ca.keys(), ...cb.keys()])) {
    inter += Math.min(ca.get(k) ?? 0, cb.get(k) ?? 0);
    union += Math.max(ca.get(k) ?? 0, cb.get(k) ?? 0);
  }
  return union === 0 ? 1 : inter / union;
}

/** German text is longer; compare the length ratio against the expected factor. */
export function lengthSimilarity(en: number, de: number, factor = 1.2): number {
  if (en === 0 || de === 0) return 0;
  const r = de / (en * factor);
  return r > 1 ? 1 / r : r;
}

export function pairScore(en: Candidate, de: Candidate): number {
  return 2 * tokenSimilarity(en.tokens, de.tokens) + lengthSimilarity(en.length, de.length);
}

export function matchCandidates(en: Candidate[], de: Candidate[], minMargin = 0.25): MatchResult {
  const pairs = new Map<string, string>();
  const ambiguous: MatchResult['ambiguous'] = [];
  const groups = new Map<string, { en: Candidate[]; de: Candidate[] }>();
  for (const c of en) {
    if (!groups.has(c.primary)) groups.set(c.primary, { en: [], de: [] });
    groups.get(c.primary)!.en.push(c);
  }
  for (const c of de) {
    if (!groups.has(c.primary)) groups.set(c.primary, { en: [], de: [] });
    groups.get(c.primary)!.de.push(c);
  }
  const unmatchedEn: string[] = [];
  const unmatchedDe: string[] = [];
  for (const [primary, g] of groups) {
    if (g.en.length === 1 && g.de.length === 1) {
      pairs.set(g.en[0].id, g.de[0].id);
      continue;
    }
    // Greedy assignment by score with a margin against the runner-up.
    const freeEn = new Set(g.en);
    const freeDe = new Set(g.de);
    let progress = true;
    while (progress && freeEn.size && freeDe.size) {
      progress = false;
      for (const e of [...freeEn]) {
        if (freeDe.size === 0) break;
        const scored = [...freeDe].map((d) => ({ d, s: pairScore(e, d) })).sort((a, b) => b.s - a.s);
        const best = scored[0];
        const second = scored[1]?.s ?? -Infinity;
        // The chosen German entry must also prefer this English one.
        const rivals = [...freeEn].filter((x) => x !== e).map((x) => pairScore(x, best.d));
        const rival = Math.max(-Infinity, ...rivals);
        if (best.s - second >= minMargin && best.s - rival >= minMargin) {
          pairs.set(e.id, best.d.id);
          freeEn.delete(e);
          freeDe.delete(best.d);
          progress = true;
        }
      }
      // A single pair left over is unambiguous.
      if (freeEn.size === 1 && freeDe.size === 1) {
        const [e] = freeEn;
        const [d] = freeDe;
        pairs.set(e.id, d.id);
        freeEn.clear();
        freeDe.clear();
      }
    }
    if (freeEn.size && freeDe.size) {
      ambiguous.push({ primary, en: [...freeEn].map((c) => c.id), de: [...freeDe].map((c) => c.id) });
    } else {
      unmatchedEn.push(...[...freeEn].map((c) => c.id));
      unmatchedDe.push(...[...freeDe].map((c) => c.id));
    }
  }
  return { pairs, ambiguous, unmatchedEn, unmatchedDe };
}

/** Dice expressions in a text, normalised to English notation ("8W6" → "8d6"). */
export function diceTokens(text: string): string[] {
  return [...text.matchAll(/(\d+)\s*[dDwW]\s*(\d+)/g)].map((m) => `${m[1]}d${m[2]}`);
}
