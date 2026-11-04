/**
 * UI translations (SPEC §9). The UI language is independent of the card language of a deck.
 * Default: browser language; the choice is remembered per browser.
 */
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '../model/schema';

const de = {
  app: { title: 'open-tabletop-cards', tagline: 'Regelkarten für die fünfte Edition', compat: 'kompatibel mit der fünften Edition' },
  nav: { decks: 'Decks', catalog: 'SRD-Katalog', about: 'Über', uiLanguage: 'Sprache der Oberfläche' },
  common: {
    cancel: 'Abbrechen', save: 'Speichern', delete: 'Löschen', close: 'Schließen', add: 'Hinzufügen', yes: 'Ja', no: 'Nein',
    none: '—', loading: 'Wird geladen …', create: 'Anlegen', apply: 'Übernehmen', edit: 'Bearbeiten', name: 'Name',
    german: 'Deutsch', english: 'Englisch', selected_one: '{{count}} ausgewählt', selected_other: '{{count}} ausgewählt',
    cards_one: '{{count}} Karte', cards_other: '{{count}} Karten',
  },
  notice: {
    storage: 'Deine Decks werden nur in diesem Browser gespeichert. Browserdaten können verloren gehen (z. B. beim Löschen des Verlaufs) – exportiere deine Decks regelmäßig als JSON-Datei.',
    dismiss: 'Verstanden',
  },
  decks: {
    title: 'Decks', new: 'Neues Deck', newName: 'Neues Deck', import: 'Deck importieren …', empty: 'Noch keine Decks. Lege ein neues Deck an oder importiere eine JSON-Datei.',
    namePlaceholder: 'Name des Decks', cardLanguage: 'Kartensprache', colorBySchool: 'Zauber nach Schule einfärben',
    addCard: 'Neue Karte', fromCatalog: 'Aus dem Katalog', exportJson: 'Als JSON exportieren', export: 'Drucken & Export …',
    duplicate: 'Deck duplizieren', deleteDeck: 'Deck löschen', confirmDelete: 'Deck „{{name}}“ mit {{count}} Karten wirklich löschen?',
    sort: 'Sortieren', sortName: 'nach Name', sortType: 'nach Typ', sortLevel: 'nach Typ und Grad',
    emptyDeck: 'Dieses Deck ist leer. Füge Karten aus dem Katalog hinzu oder lege eine eigene Karte an.',
    selectAll: 'Alle auswählen', selectNone: 'Auswahl aufheben', copyTo: 'In Deck kopieren …', copyTarget: 'Zieldeck',
    duplicateCards: 'Duplizieren', deleteCards: 'Löschen', confirmDeleteCards_one: 'Eine Karte löschen?', confirmDeleteCards_other: '{{count}} Karten löschen?',
    moveLeft: 'Nach vorne', moveRight: 'Nach hinten', continuation_one: '+{{count}} Folgekarte', continuation_other: '+{{count}} Folgekarten',
    missingLanguage_one: '{{count}} Karte hat keinen Text in der Kartensprache und zeigt die andere Sprache.',
    missingLanguage_other: '{{count}} Karten haben keinen Text in der Kartensprache und zeigen die andere Sprache.',
    imported: 'Deck „{{name}}“ importiert.', importFailed: 'Import fehlgeschlagen: {{message}}', copied_one: 'Karte nach „{{deck}}“ kopiert.', copied_other: '{{count}} Karten nach „{{deck}}“ kopiert.',
    cardCount_one: '{{count}} Karte', cardCount_other: '{{count}} Karten',
  },
  types: { spell: 'Zauber', action: 'Aktion', feature: 'Fähigkeit', item: 'Gegenstand', condition: 'Zustand' },
  catalog: {
    title: 'SRD-5.2.1-Katalog', search: 'Suche nach Name (Deutsch oder Englisch)', type: 'Typ', level: 'Grad', school: 'Schule', class: 'Klasse',
    all: 'alle', cantrip: 'Zaubertrick', reset: 'Filter zurücksetzen', results_one: '{{count}} Eintrag', results_other: '{{count}} Einträge',
    target: 'Übernehmen in', newDeck: '+ neues Deck', addSelected_one: '{{count}} Karte übernehmen', addSelected_other: '{{count}} Karten übernehmen',
    added_one: 'Eine Karte zu „{{deck}}“ hinzugefügt.', added_other: '{{count}} Karten zu „{{deck}}“ hinzugefügt.', empty: 'Keine Treffer.',
    unavailable: 'Der Katalog ist noch nicht erzeugt. Führe „npm run pipeline“ aus (siehe Benutzerhandbuch).',
    preview: 'Vorschau', selectVisible: 'Alle Treffer auswählen', clearSelection: 'Auswahl aufheben', more: 'Weitere {{count}} anzeigen',
  },
  editor: {
    newTitle: 'Neue Karte: {{type}}', editTitle: 'Karte bearbeiten', textLanguage: 'Texte bearbeiten auf', preview: 'Vorschau (Originalgröße)',
    name: 'Name', description: 'Regeltext', descriptionHint: 'Absätze durch Leerzeile trennen. **fett**, *kursiv*, Listen mit „- “ am Zeilenanfang.',
    source: 'Quelle', tags: 'Schlagwörter', tagsHint: 'durch Komma getrennt', srdKey: 'SRD-Verweis',
    fitNone: 'Der Text passt auf die Karte.', fitShrunk: 'Der Text wurde auf {{size}} pt verkleinert, damit er auf die Karte passt.',
    fitSplit: 'Der Text ist zu lang für eine Karte: Es entstehen automatisch {{count}} Karten („{{name}} (1/{{count}})“ …).',
    invalid: 'Bitte die markierten Felder prüfen.', required: 'Pflichtfeld', requiredLang: 'Pflichtfeld (in mindestens einer Sprache)',
    otherLanguage: 'Andere Sprache: {{text}}', discard: 'Änderungen verwerfen?',
    spell: {
      level: 'Grad', school: 'Schule', castingTime: 'Zeitaufwand', amount: 'Anzahl', trigger: 'Auslöser (bei Reaktion)', ritual: 'Ritual',
      range: 'Reichweite', distance: 'Entfernung', components: 'Komponenten', verbal: 'Verbal (V)', somatic: 'Gestik (G)', material: 'Material (M)',
      materialText: 'Material', materialCost: 'Kosten (GM)', materialConsumed: 'wird verbraucht', duration: 'Wirkungsdauer', concentration: 'Konzentration',
      attack: 'Zauberangriff', save: 'Rettungswurf', damage: 'Schaden (Würfel)', damageTypes: 'Schadensarten', classes: 'Klassen', higherLevels: 'Auf höheren Graden / Verbesserung des Zaubertricks',
      units: { action: 'Aktion', bonus: 'Bonusaktion', reaction: 'Reaktion', minute: 'Minuten', hour: 'Stunden' },
      rangeKinds: { self: 'Selbst', touch: 'Berührung', distance: 'Entfernung', sight: 'Sicht', unlimited: 'Unbegrenzt', special: 'Besonders' },
      durationKinds: { instantaneous: 'Unmittelbar', round: 'Runden', minute: 'Minuten', hour: 'Stunden', day: 'Tage', 'until-dispelled': 'Bis gebannt', 'until-dispelled-or-triggered': 'Bis gebannt oder ausgelöst', special: 'Besonders' },
    },
    action: {
      actionType: 'Aktionsart', weapon: 'Waffe (Werte übernehmen)', noWeapon: 'keine Waffe', weaponCategory: 'Waffenkategorie', simple: 'Einfach', martial: 'Kriegswaffe',
      kind: 'Art', melee: 'Nahkampf', ranged: 'Fernkampf', damage: 'Schaden (Würfel)', damageType: 'Schadensart', versatile: 'Vielseitig (Würfel)',
      rangeNormal: 'Grundreichweite', rangeLong: 'Maximalreichweite', reach: 'Reichweite (Nahkampf)', properties: 'Eigenschaften', ammunition: 'Geschoss',
      mastery: 'Meisterschaft', masteryText: 'Regeltext der Meisterschaft', trigger: 'Auslöser (bei Reaktion)',
    },
    feature: {
      originKind: 'Herkunft', classKey: 'Klasse', originName: 'Name (Unterklasse, Spezies …)', level: 'ab Stufe', featCategory: 'Talentkategorie',
      activation: 'Aktionsart', uses: 'Nutzungen', recovery: 'Erholung', prerequisite: 'Voraussetzung',
    },
    item: {
      category: 'Kategorie', categoryDetail: 'Zusatz (z. B. „beliebiges Schwert“)', rarity: 'Seltenheit', rarityText: 'Seltenheit als Text (optional)',
      attunement: 'Erfordert Einstimmung', attunementDetail: 'Bedingung der Einstimmung', charges: 'Ladungen', recharge: 'Wiederaufladung',
    },
  },
  export: {
    title: 'Drucken & Export', format: 'Format', pdf: 'PDF-Bogen', png: 'PNG-Bilder (ZIP)', print: 'Direkt drucken (Browser)',
    paper: 'Papierformat', a4: 'A4', letter: 'US Letter', bleed: '3 mm Beschnittzugabe', bleedHint: 'Für Druckereien oder randlosen Druck: Der Ledereinband reicht 3 mm über die Schnittkante.',
    scope: 'Umfang', wholeDeck: 'Ganzes Deck ({{count}})', selection: 'Auswahl ({{count}})', start: 'Exportieren', printStart: 'Druckdialog öffnen',
    progress: 'Karte {{done}} von {{total}} wird gerendert …', layout: 'Karten werden gesetzt …', done: 'Fertig.', failed: 'Export fehlgeschlagen: {{message}}',
    hint100: 'Beim Drucken unbedingt „Tatsächliche Größe“ bzw. 100 % wählen, nicht „An Seite anpassen“.',
    pngInfo: 'Eine PNG-Datei pro Karte, 300 dpi (744 × 1039 px), dazu eine Textdatei mit der Namensnennung.', sheets_one: '{{count}} Bogen', sheets_other: '{{count}} Bögen',
  },
  about: {
    title: 'Über open-tabletop-cards',
    intro: 'open-tabletop-cards erstellt kleine, druckbare Regelkarten (63 × 88 mm) für Zauber, Aktionen, Fähigkeiten, Gegenstände und Zustände. Alles läuft lokal in deinem Browser – es gibt keinen Server und keine Konten.',
    srd: 'Regelinhalte', icons: 'Symbole', fonts: 'Schrift', code: 'Programmcode',
    iconsText: 'Die Kartensymbole stammen von game-icons.net und stehen unter der Lizenz Creative Commons Namensnennung 3.0:',
    fontsText: 'Die Kartenschrift ist TeX Gyre Schola (GUST e-foundry), lizenziert unter der GUST Font License.',
    codeText: 'Der Programmcode steht unter der MIT-Lizenz.',
    license: 'Lizenztext',
  },
};

type Resources = typeof de;

const en: Resources = {
  app: { title: 'open-tabletop-cards', tagline: 'Rules reference cards for fifth edition', compat: '5E compatible' },
  nav: { decks: 'Decks', catalog: 'SRD catalog', about: 'About', uiLanguage: 'Interface language' },
  common: {
    cancel: 'Cancel', save: 'Save', delete: 'Delete', close: 'Close', add: 'Add', yes: 'Yes', no: 'No',
    none: '—', loading: 'Loading …', create: 'Create', apply: 'Apply', edit: 'Edit', name: 'Name',
    german: 'German', english: 'English', selected_one: '{{count}} selected', selected_other: '{{count}} selected',
    cards_one: '{{count}} card', cards_other: '{{count}} cards',
  },
  notice: {
    storage: 'Your decks are stored in this browser only. Browser data can be lost (e.g. when clearing your history) – export your decks as JSON files regularly.',
    dismiss: 'Got it',
  },
  decks: {
    title: 'Decks', new: 'New deck', newName: 'New deck', import: 'Import deck …', empty: 'No decks yet. Create a new deck or import a JSON file.',
    namePlaceholder: 'Deck name', cardLanguage: 'Card language', colorBySchool: 'Colour spells by school',
    addCard: 'New card', fromCatalog: 'From the catalog', exportJson: 'Export as JSON', export: 'Print & export …',
    duplicate: 'Duplicate deck', deleteDeck: 'Delete deck', confirmDelete: 'Really delete deck "{{name}}" with {{count}} cards?',
    sort: 'Sort', sortName: 'by name', sortType: 'by type', sortLevel: 'by type and level',
    emptyDeck: 'This deck is empty. Add cards from the catalog or create your own card.',
    selectAll: 'Select all', selectNone: 'Clear selection', copyTo: 'Copy to deck …', copyTarget: 'Target deck',
    duplicateCards: 'Duplicate', deleteCards: 'Delete', confirmDeleteCards_one: 'Delete one card?', confirmDeleteCards_other: 'Delete {{count}} cards?',
    moveLeft: 'Move forward', moveRight: 'Move back', continuation_one: '+{{count}} continuation card', continuation_other: '+{{count}} continuation cards',
    missingLanguage_one: '{{count}} card has no text in the card language and shows the other language.',
    missingLanguage_other: '{{count}} cards have no text in the card language and show the other language.',
    imported: 'Deck "{{name}}" imported.', importFailed: 'Import failed: {{message}}', copied_one: 'Card copied to "{{deck}}".', copied_other: '{{count}} cards copied to "{{deck}}".',
    cardCount_one: '{{count}} card', cardCount_other: '{{count}} cards',
  },
  types: { spell: 'Spell', action: 'Action', feature: 'Feature', item: 'Item', condition: 'Condition' },
  catalog: {
    title: 'SRD 5.2.1 catalog', search: 'Search by name (English or German)', type: 'Type', level: 'Level', school: 'School', class: 'Class',
    all: 'all', cantrip: 'Cantrip', reset: 'Reset filters', results_one: '{{count}} entry', results_other: '{{count}} entries',
    target: 'Add to', newDeck: '+ new deck', addSelected_one: 'Add {{count}} card', addSelected_other: 'Add {{count}} cards',
    added_one: 'Added one card to "{{deck}}".', added_other: 'Added {{count}} cards to "{{deck}}".', empty: 'No matches.',
    unavailable: 'The catalog has not been generated yet. Run "npm run pipeline" (see the user guide).',
    preview: 'Preview', selectVisible: 'Select all matches', clearSelection: 'Clear selection', more: 'Show {{count}} more',
  },
  editor: {
    newTitle: 'New card: {{type}}', editTitle: 'Edit card', textLanguage: 'Edit texts in', preview: 'Preview (actual size)',
    name: 'Name', description: 'Rules text', descriptionHint: 'Separate paragraphs with a blank line. **bold**, *italic*, lists with "- " at the start of a line.',
    source: 'Source', tags: 'Tags', tagsHint: 'comma separated', srdKey: 'SRD reference',
    fitNone: 'The text fits on the card.', fitShrunk: 'The text was reduced to {{size}} pt to fit on the card.',
    fitSplit: 'The text is too long for one card: {{count}} cards are created automatically ("{{name}} (1/{{count}})" …).',
    invalid: 'Please check the highlighted fields.', required: 'Required', requiredLang: 'Required (in at least one language)',
    otherLanguage: 'Other language: {{text}}', discard: 'Discard changes?',
    spell: {
      level: 'Level', school: 'School', castingTime: 'Casting time', amount: 'Amount', trigger: 'Trigger (reaction)', ritual: 'Ritual',
      range: 'Range', distance: 'Distance', components: 'Components', verbal: 'Verbal (V)', somatic: 'Somatic (S)', material: 'Material (M)',
      materialText: 'Material', materialCost: 'Cost (GP)', materialConsumed: 'consumed', duration: 'Duration', concentration: 'Concentration',
      attack: 'Spell attack', save: 'Saving throw', damage: 'Damage (dice)', damageTypes: 'Damage types', classes: 'Classes', higherLevels: 'Using a higher-level spell slot / cantrip upgrade',
      units: { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction', minute: 'Minutes', hour: 'Hours' },
      rangeKinds: { self: 'Self', touch: 'Touch', distance: 'Distance', sight: 'Sight', unlimited: 'Unlimited', special: 'Special' },
      durationKinds: { instantaneous: 'Instantaneous', round: 'Rounds', minute: 'Minutes', hour: 'Hours', day: 'Days', 'until-dispelled': 'Until dispelled', 'until-dispelled-or-triggered': 'Until dispelled or triggered', special: 'Special' },
    },
    action: {
      actionType: 'Action type', weapon: 'Weapon (take values)', noWeapon: 'no weapon', weaponCategory: 'Weapon category', simple: 'Simple', martial: 'Martial',
      kind: 'Kind', melee: 'Melee', ranged: 'Ranged', damage: 'Damage (dice)', damageType: 'Damage type', versatile: 'Versatile (dice)',
      rangeNormal: 'Normal range', rangeLong: 'Long range', reach: 'Reach (melee)', properties: 'Properties', ammunition: 'Ammunition',
      mastery: 'Mastery', masteryText: 'Mastery rules text', trigger: 'Trigger (reaction)',
    },
    feature: {
      originKind: 'Origin', classKey: 'Class', originName: 'Name (subclass, species …)', level: 'from level', featCategory: 'Feat category',
      activation: 'Activation', uses: 'Uses', recovery: 'Recovery', prerequisite: 'Prerequisite',
    },
    item: {
      category: 'Category', categoryDetail: 'Qualifier (e.g. "any Sword")', rarity: 'Rarity', rarityText: 'Rarity as text (optional)',
      attunement: 'Requires attunement', attunementDetail: 'Attunement condition', charges: 'Charges', recharge: 'Recharge',
    },
  },
  export: {
    title: 'Print & export', format: 'Format', pdf: 'PDF sheets', png: 'PNG images (ZIP)', print: 'Print directly (browser)',
    paper: 'Paper size', a4: 'A4', letter: 'US Letter', bleed: '3 mm bleed', bleedHint: 'For print shops or borderless printing: the leather border extends 3 mm beyond the cut line.',
    scope: 'Scope', wholeDeck: 'Whole deck ({{count}})', selection: 'Selection ({{count}})', start: 'Export', printStart: 'Open print dialog',
    progress: 'Rendering card {{done}} of {{total}} …', layout: 'Laying out cards …', done: 'Done.', failed: 'Export failed: {{message}}',
    hint100: 'When printing, choose "Actual size" / 100 %, not "Fit to page".',
    pngInfo: 'One PNG file per card, 300 dpi (744 × 1039 px), plus a text file with the attribution.', sheets_one: '{{count}} sheet', sheets_other: '{{count}} sheets',
  },
  about: {
    title: 'About open-tabletop-cards',
    intro: 'open-tabletop-cards creates small printable rules reference cards (63 × 88 mm) for spells, actions, features, items and conditions. Everything runs locally in your browser – there is no server and there are no accounts.',
    srd: 'Rules content', icons: 'Icons', fonts: 'Typeface', code: 'Source code',
    iconsText: 'The card icons are from game-icons.net, licensed under Creative Commons Attribution 3.0:',
    fontsText: 'The card typeface is TeX Gyre Schola (GUST e-foundry), licensed under the GUST Font License.',
    codeText: 'The source code is released under the MIT License.',
    license: 'License text',
  },
};

export const UI_RESOURCES = { de, en };

const STORAGE_KEY = 'otc.uiLanguage';

export function detectUiLanguage(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'de' || stored === 'en') return stored;
  } catch {
    /* storage unavailable */
  }
  const languages = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
  return languages.some((l) => l?.toLowerCase().startsWith('de')) ? 'de' : 'en';
}

export function setUiLanguage(lang: Lang): void {
  void i18next.changeLanguage(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang;
}

export function initI18n(lang: Lang = detectUiLanguage()) {
  void i18next.use(initReactI18next).init({
    resources: { de: { translation: de }, en: { translation: en } },
    lng: lang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  return i18next;
}
