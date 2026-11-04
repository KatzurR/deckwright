/**
 * Small per-browser preferences in localStorage/sessionStorage (UI language, current deck,
 * paper size, dismissed notice). Keys are prefixed with `deckwright.`; values stored under the
 * pre-rename prefix `otc.` are moved to the new key the first time they are read.
 */
export const PREFERENCE_PREFIX = 'deckwright.';
export const LEGACY_PREFERENCE_PREFIX = 'otc.';

export type PreferenceName = 'uiLanguage' | 'currentDeck' | 'paper' | 'noticeDismissed';

/** Read a preference. Storage errors (e.g. storage disabled) are left to the caller. */
export function readPreference(storage: Storage, name: PreferenceName): string | null {
  const value = storage.getItem(PREFERENCE_PREFIX + name);
  if (value !== null) return value;
  const legacy = storage.getItem(LEGACY_PREFERENCE_PREFIX + name);
  if (legacy !== null) {
    storage.setItem(PREFERENCE_PREFIX + name, legacy);
    storage.removeItem(LEGACY_PREFERENCE_PREFIX + name);
  }
  return legacy;
}

export function writePreference(storage: Storage, name: PreferenceName, value: string): void {
  storage.setItem(PREFERENCE_PREFIX + name, value);
}
