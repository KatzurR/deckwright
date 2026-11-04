/**
 * Turns a card into its display model for a given card language: everything the card face
 * shows, already translated and formatted. Pure function, shared by preview, print and export.
 */
import type {
  ActionCard, Card, Damage, FeatureCard, ItemCard, Lang, SpellCard,
} from '../model/schema';
import { formatDice, formatDistance, formatRangePair } from '../model/units';
import { localized } from '../model/deck';
import { terms, type CardTerms } from '../i18n/terms';
import { accentFor, iconFor } from './theme';
import type { IconName } from './icons';

export interface DisplayProperty {
  label: string;
  value: string;
}

export interface CardDisplay {
  title: string;
  subtitle: string;
  accent: string;
  icon: IconName;
  properties: DisplayProperty[];
  /** Footnotes under the property block, e.g. material components ("* …"). */
  footnotes: string[];
  /** Rule text (markdown subset). */
  body: string;
  /** Closing paragraph with a bold italic lead-in, e.g. "Auf höheren Graden." */
  closing?: { label: string; text: string };
  footerLeft: string;
  footerRight: string;
  /** Text of the shield in the bottom leather band (spell level, rarity); omitted when empty. */
  badge?: string;
}

export interface DisplayOptions {
  colorBySchool?: boolean;
}

export function formatDamage(damage: Damage | undefined, lang: Lang, t: CardTerms): string {
  if (!damage) return '';
  const types = damage.types.map((d) => t.damageTypes[d]).join('/');
  return [damage.dice ? formatDice(damage.dice, lang) : '', types].filter(Boolean).join(' ');
}

function castingTime(card: SpellCard, t: CardTerms): string {
  const ct = card.spell.castingTime;
  let text: string;
  if (ct.unit === 'minute') text = t.castingUnits.minute(ct.amount ?? 1);
  else if (ct.unit === 'hour') text = t.castingUnits.hour(ct.amount ?? 1);
  else text = t.castingUnits[ct.unit];
  if (card.spell.ritual) text += ` ${t.orRitual}`;
  return text;
}

export function formatSpellRange(range: SpellCard['spell']['range'], lang: Lang, t: CardTerms): string {
  if (range.kind === 'distance') return formatDistance(range.feet ?? 0, lang);
  return t.ranges[range.kind];
}

export function formatDuration(spell: SpellCard['spell'], t: CardTerms, short = true): string {
  const d = spell.duration;
  const n = d.amount ?? 1;
  let text: string;
  switch (d.kind) {
    case 'round': text = t.durations.round(n); break;
    case 'minute': text = t.durations.minute(n); break;
    case 'hour': text = t.durations.hour(n); break;
    case 'day': text = t.durations.day(n); break;
    default: text = t.durations[d.kind];
  }
  if (!spell.concentration) return text;
  return short ? t.durations.concentrationShort(text) : t.durations.concentration(text);
}

function spellDisplay(card: SpellCard, lang: Lang, t: CardTerms) {
  const s = card.spell;
  const c = s.components;
  const footnotes: string[] = [];
  const letters = [c.verbal && t.componentLetters.verbal, c.somatic && t.componentLetters.somatic, c.material && t.componentLetters.material]
    .filter(Boolean)
    .join(', ');
  const material = localized(c.materialText, lang);
  let components = letters || '—';
  if (c.material && material) {
    components += ' *';
    footnotes.push(`* ${material}`);
  }
  let casting = castingTime(card, t);
  const trigger = localized(s.castingTime.trigger, lang);
  if (s.castingTime.unit === 'reaction' && trigger) {
    casting += ' †';
    footnotes.push(`† ${trigger}`);
  }
  const properties: DisplayProperty[] = [
    { label: t.labels.castingTime, value: casting },
    { label: t.labels.range, value: formatSpellRange(s.range, lang, t) },
    { label: t.labels.components, value: components },
    { label: t.labels.duration, value: formatDuration(s, t) },
  ];
  if (s.save && s.attack) {
    properties.push({ label: t.labels.saveOrAttack, value: `${t.abilityShort[s.save]} / ${t.spellAttack}` });
  } else if (s.save) {
    properties.push({ label: t.labels.save, value: t.abilityShort[s.save] });
  } else if (s.attack) {
    properties.push({ label: t.labels.attack, value: t.spellAttack });
  }
  const damage = formatDamage(s.damage, lang, t);
  if (damage) properties.push({ label: t.labels.damage, value: damage });

  const higher = localized(s.higherLevels, lang);
  return {
    subtitle: t.spellSubtitle(s.school, s.level),
    properties,
    footnotes,
    closing: higher ? { label: s.level === 0 ? t.cantripUpgrade : t.higherLevels, text: higher } : undefined,
    footerLeft: s.classes.map((k) => t.classes[k]).join(', '),
    badge: String(s.level),
  };
}

function actionDisplay(card: ActionCard, lang: Lang, t: CardTerms) {
  const a = card.action;
  const properties: DisplayProperty[] = [{ label: t.labels.actionType, value: t.actionTypes[a.actionType] }];
  const footnotes: string[] = [];
  let damage = formatDamage(a.damage, lang, t);
  if (a.weapon?.versatileDice) damage += ` (${t.versatile} ${formatDice(a.weapon.versatileDice, lang)})`;
  if (damage) properties.push({ label: t.labels.damage, value: damage });
  if (a.range) properties.push({ label: t.labels.range, value: formatRangePair(a.range.normal, a.range.long, lang) });
  else if (a.reach) properties.push({ label: t.labels.reach, value: formatDistance(a.reach, lang) });
  if (a.weapon?.properties.length) {
    const props = a.weapon.properties.map((p) => {
      const name = t.weaponProperties[p];
      return p === 'ammunition' && a.weapon?.ammunition ? `${name} (${t.ammunition[a.weapon.ammunition]})` : name;
    });
    properties.push({ label: t.labels.properties, value: props.join(', ') });
  }
  if (a.mastery) properties.push({ label: t.labels.mastery, value: t.masteries[a.mastery] });
  const trigger = localized(a.trigger, lang);
  if (trigger) footnotes.push(`${t.labels.trigger}: ${trigger}`);
  const mastery = localized(a.masteryText, lang);
  return {
    subtitle: a.weapon ? t.weaponCategory(a.weapon.category, a.weapon.kind) : t.actionTypes[a.actionType],
    properties,
    footnotes,
    closing: a.mastery && mastery ? { label: `${t.masteries[a.mastery]}.`, text: mastery } : undefined,
    footerLeft: a.weapon ? t.weaponCategory(a.weapon.category, a.weapon.kind) : t.action,
    badge: undefined,
  };
}

export function formatOrigin(card: FeatureCard, lang: Lang, t: CardTerms): string {
  const o = card.feature.origin;
  const name = localized(o.name, lang);
  const cls = o.classKey ? t.classes[o.classKey] : '';
  let base: string;
  switch (o.kind) {
    case 'class': base = cls || name; break;
    case 'subclass': base = name && cls ? `${name} (${cls})` : name || cls; break;
    case 'feat': base = o.featCategory ? t.featCategories[o.featCategory] : name || t.originKinds.feat; break;
    default: base = name || t.originKinds[o.kind];
  }
  return o.level ? `${base}, ${t.levelFrom(o.level)}` : base;
}

function featureDisplay(card: FeatureCard, lang: Lang, t: CardTerms) {
  const f = card.feature;
  const origin = formatOrigin(card, lang, t);
  const properties: DisplayProperty[] = [
    { label: t.labels.origin, value: origin },
    { label: t.labels.activation, value: t.activations[f.activation] },
  ];
  const uses = localized(f.uses, lang);
  if (uses) properties.push({ label: t.labels.uses, value: uses });
  if (f.recovery) properties.push({ label: t.labels.recovery, value: t.recovery[f.recovery] });
  const prerequisite = localized(f.prerequisite, lang);
  if (prerequisite) properties.push({ label: t.labels.prerequisite, value: prerequisite });
  const o = f.origin;
  const subtitle = o.kind === 'feat' && o.featCategory
    ? t.featCategories[o.featCategory]
    : [t.originKinds[o.kind], localized(o.name, lang) || (o.classKey ? t.classes[o.classKey] : '')].filter(Boolean).join(': ');
  return {
    subtitle,
    properties,
    footnotes: [] as string[],
    closing: undefined,
    footerLeft: origin,
    badge: o.level ? String(o.level) : undefined,
  };
}

function itemDisplay(card: ItemCard, lang: Lang, t: CardTerms) {
  const it = card.item;
  const detail = localized(it.categoryDetail, lang);
  const category = detail ? `${t.itemCategories[it.category]} (${detail})` : t.itemCategories[it.category];
  const rarity = localized(it.rarityText, lang) || t.rarities[it.rarity];
  const properties: DisplayProperty[] = [
    { label: t.labels.category, value: category },
    { label: t.labels.rarity, value: rarity },
  ];
  const attunementDetail = localized(it.attunementDetail, lang);
  properties.push({
    label: t.labels.attunement,
    value: it.attunement ? (attunementDetail || t.yes) : t.no,
  });
  if (it.charges) {
    const recharge = localized(it.charges.recharge, lang);
    const value = [it.charges.count !== undefined ? String(it.charges.count) : '', recharge].filter(Boolean).join(' · ');
    if (value) properties.push({ label: t.labels.charges, value });
  }
  const subtitleRarity = (localized(it.rarityText, lang) || t.rarities[it.rarity]).toLocaleLowerCase(lang);
  let subtitle = `${category}, ${subtitleRarity}`;
  if (it.attunement) subtitle += ` (${t.requiresAttunement})`;
  return {
    subtitle,
    properties,
    footnotes: [] as string[],
    closing: undefined,
    footerLeft: t.itemCategories[it.category],
    badge: t.rarityShort[it.rarity],
  };
}

export function displayCard(card: Card, lang: Lang, options: DisplayOptions = {}): CardDisplay {
  const t = terms(lang);
  const common = {
    title: localized(card.name, lang),
    accent: accentFor(card, options.colorBySchool ?? false),
    icon: iconFor(card),
    body: localized(card.description, lang),
    footerRight: t.sources[card.source ?? 'custom'],
  };
  switch (card.type) {
    case 'spell': return { ...common, ...spellDisplay(card, lang, t) };
    case 'action': return { ...common, ...actionDisplay(card, lang, t) };
    case 'feature': return { ...common, ...featureDisplay(card, lang, t) };
    case 'item': return { ...common, ...itemDisplay(card, lang, t) };
    case 'condition':
      return { ...common, subtitle: t.condition, properties: [], footnotes: [], footerLeft: t.condition };
  }
}
