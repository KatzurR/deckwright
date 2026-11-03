/** Type-specific editor forms with the fields of SPEC §4.1–4.4. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ABILITIES, ACTION_TYPES, ACTIVATIONS, AMMUNITION, CASTING_UNITS, CLASSES, DAMAGE_TYPES, DURATION_KINDS, FEAT_CATEGORIES,
  ITEM_CATEGORIES, MASTERIES, ORIGIN_KINDS, RANGE_KINDS, RARITIES, RECOVERY, SCHOOLS, WEAPON_PROPERTIES,
  type ActionCard, type Card, type FeatureCard, type ItemCard, type Lang, type SpellCard,
} from '../../model/schema';
import { terms } from '../../i18n/terms';
import { loadWeapons } from '../../catalog/catalog';
import { cardName } from '../../model/deck';
import { Check } from '../widgets';
import type { ValidationErrors } from '../../model/templates';
import { DiceInput, DistanceInput, LocalizedInput, MultiCheck, NumberInput, Select } from './inputs';

export interface FormProps<C extends Card> {
  card: C;
  /** Language of the texts being edited (and of the labels' units). */
  lang: Lang;
  /** Language for option labels (UI language). */
  uiLang: Lang;
  errors: ValidationErrors;
  onChange(card: C): void;
}

const opts = <T extends string>(keys: readonly T[], labels: Record<T, string>) => keys.map((k) => ({ value: k, label: labels[k] }));

export function SpellForm({ card, lang, uiLang, errors, onChange }: FormProps<SpellCard>) {
  const { t } = useTranslation();
  const term = terms(uiLang);
  const s = card.spell;
  const set = (patch: Partial<SpellCard['spell']>) => onChange({ ...card, spell: { ...s, ...patch } });
  const needsAmount = s.castingTime.unit === 'minute' || s.castingTime.unit === 'hour';
  const durationNeedsAmount = ['round', 'minute', 'hour', 'day'].includes(s.duration.kind);
  return (
    <div className="form-grid">
      <Select label={t('editor.spell.level')} value={String(s.level)} options={[...Array(10).keys()].map((l) => ({ value: String(l), label: l === 0 ? t('catalog.cantrip') : String(l) }))} onChange={(v) => set({ level: Number(v ?? 0) })} />
      <Select label={t('editor.spell.school')} value={s.school} options={opts(SCHOOLS, term.schools)} onChange={(v) => v && set({ school: v })} />
      <Select label={t('editor.spell.castingTime')} value={s.castingTime.unit} options={opts(CASTING_UNITS, t('editor.spell.units', { returnObjects: true }) as Record<string, string>)} onChange={(v) => v && set({ castingTime: { ...s.castingTime, unit: v, amount: v === 'minute' || v === 'hour' ? s.castingTime.amount ?? 1 : undefined } })} />
      {needsAmount && <NumberInput label={t('editor.spell.amount')} min={1} value={s.castingTime.amount} onChange={(v) => set({ castingTime: { ...s.castingTime, amount: v } })} />}
      <Check label={t('editor.spell.ritual')} checked={s.ritual} onChange={(v) => set({ ritual: v })} />
      {s.castingTime.unit === 'reaction' && (
        <LocalizedInput label={t('editor.spell.trigger')} lang={lang} value={s.castingTime.trigger} onChange={(v) => set({ castingTime: { ...s.castingTime, trigger: v } })} />
      )}
      <Select label={t('editor.spell.range')} value={s.range.kind} options={opts(RANGE_KINDS, t('editor.spell.rangeKinds', { returnObjects: true }) as Record<string, string>)} onChange={(v) => v && set({ range: { kind: v, feet: v === 'distance' ? s.range.feet ?? 30 : undefined } })} />
      {s.range.kind === 'distance' && <DistanceInput label={t('editor.spell.distance')} feet={s.range.feet} lang={lang} onChange={(feet) => set({ range: { kind: 'distance', feet } })} error={errors['spell.range']} />}
      <fieldset className="multi-check">
        <legend>{t('editor.spell.components')}</legend>
        <Check label={t('editor.spell.verbal')} checked={s.components.verbal} onChange={(v) => set({ components: { ...s.components, verbal: v } })} />
        <Check label={t('editor.spell.somatic')} checked={s.components.somatic} onChange={(v) => set({ components: { ...s.components, somatic: v } })} />
        <Check label={t('editor.spell.material')} checked={s.components.material} onChange={(v) => set({ components: { ...s.components, material: v } })} />
      </fieldset>
      {s.components.material && (
        <>
          <LocalizedInput label={t('editor.spell.materialText')} lang={lang} value={s.components.materialText} onChange={(v) => set({ components: { ...s.components, materialText: v } })} />
          <NumberInput label={t('editor.spell.materialCost')} min={0} value={s.components.materialCost} onChange={(v) => set({ components: { ...s.components, materialCost: v } })} />
          <Check label={t('editor.spell.materialConsumed')} checked={s.components.materialConsumed ?? false} onChange={(v) => set({ components: { ...s.components, materialConsumed: v || undefined } })} />
        </>
      )}
      <Select label={t('editor.spell.duration')} value={s.duration.kind} options={opts(DURATION_KINDS, t('editor.spell.durationKinds', { returnObjects: true }) as Record<string, string>)} onChange={(v) => v && set({ duration: { kind: v, amount: ['round', 'minute', 'hour', 'day'].includes(v) ? s.duration.amount ?? 1 : undefined } })} />
      {durationNeedsAmount && <NumberInput label={t('editor.spell.amount')} min={1} value={s.duration.amount} onChange={(v) => set({ duration: { ...s.duration, amount: v } })} />}
      <Check label={t('editor.spell.concentration')} checked={s.concentration} onChange={(v) => set({ concentration: v })} />
      <Check label={t('editor.spell.attack')} checked={s.attack} onChange={(v) => set({ attack: v })} />
      <Select label={t('editor.spell.save')} value={s.save} allowEmpty options={opts(ABILITIES, term.abilities)} onChange={(v) => set({ save: v })} />
      <DiceInput label={t('editor.spell.damage')} lang={lang} value={s.damage?.dice} onChange={(dice) => set({ damage: { types: s.damage?.types ?? [], dice } })} error={errors['spell.damage.dice']} />
      <MultiCheck label={t('editor.spell.damageTypes')} values={s.damage?.types ?? []} options={opts(DAMAGE_TYPES, term.damageTypes)} onChange={(types) => set({ damage: { ...s.damage, types } })} />
      <MultiCheck label={t('editor.spell.classes')} values={s.classes} options={opts(CLASSES, term.classes)} onChange={(classes) => set({ classes })} />
      <LocalizedInput label={t('editor.spell.higherLevels')} lang={lang} multiline rows={3} value={s.higherLevels} onChange={(v) => set({ higherLevels: v })} />
    </div>
  );
}

export function ActionForm({ card, lang, uiLang, errors, onChange }: FormProps<ActionCard>) {
  const { t } = useTranslation();
  const term = terms(uiLang);
  const a = card.action;
  const [weapons, setWeapons] = useState<ActionCard[]>([]);
  useEffect(() => {
    loadWeapons().then((w) => setWeapons(w.filter((c): c is ActionCard => c.type === 'action'))).catch(() => setWeapons([]));
  }, []);
  const set = (patch: Partial<ActionCard['action']>) => onChange({ ...card, action: { ...a, ...patch } });
  const setWeapon = (patch: Partial<NonNullable<ActionCard['action']['weapon']>>) =>
    set({ weapon: { category: 'simple', kind: 'melee', properties: [], ...a.weapon, ...patch } });

  const takeWeapon = (key: string | undefined) => {
    const w = weapons.find((x) => x.id === key);
    if (!w) {
      set({ weapon: undefined });
      return;
    }
    onChange({
      ...card,
      name: card.name.de || card.name.en ? card.name : { ...w.name },
      description: card.description.de || card.description.en ? card.description : { ...w.description },
      action: { ...structuredClone(w.action), actionType: a.actionType, trigger: a.trigger },
    });
  };

  return (
    <div className="form-grid">
      <Select label={t('editor.action.actionType')} value={a.actionType} options={opts(ACTION_TYPES, term.actionTypes)} onChange={(v) => v && set({ actionType: v })} />
      <Select
        label={t('editor.action.weapon')}
        value={weapons.find((w) => w.action.weapon?.key && w.action.weapon.key === a.weapon?.key)?.id}
        allowEmpty
        options={weapons.map((w) => ({ value: w.id, label: cardName(w, uiLang) }))}
        onChange={takeWeapon}
      />
      {a.actionType === 'reaction' && <LocalizedInput label={t('editor.action.trigger')} lang={lang} value={a.trigger} onChange={(v) => set({ trigger: v })} />}
      <DiceInput label={t('editor.action.damage')} lang={lang} value={a.damage?.dice} onChange={(dice) => set({ damage: { types: a.damage?.types ?? [], dice } })} error={errors['action.damage.dice']} />
      <Select label={t('editor.action.damageType')} value={a.damage?.types[0]} allowEmpty options={opts(DAMAGE_TYPES, term.damageTypes)} onChange={(v) => set({ damage: { ...a.damage, types: v ? [v] : [] } })} />
      <Select label={t('editor.action.weaponCategory')} value={a.weapon?.category} allowEmpty options={[{ value: 'simple', label: t('editor.action.simple') }, { value: 'martial', label: t('editor.action.martial') }]} onChange={(v) => (v ? setWeapon({ category: v }) : set({ weapon: undefined }))} />
      {a.weapon && (
        <>
          <Select label={t('editor.action.kind')} value={a.weapon.kind} options={[{ value: 'melee', label: t('editor.action.melee') }, { value: 'ranged', label: t('editor.action.ranged') }]} onChange={(v) => v && setWeapon({ kind: v })} />
          <DiceInput label={t('editor.action.versatile')} lang={lang} value={a.weapon.versatileDice} onChange={(versatileDice) => setWeapon({ versatileDice })} />
          <MultiCheck label={t('editor.action.properties')} values={a.weapon.properties} options={opts(WEAPON_PROPERTIES, term.weaponProperties)} onChange={(properties) => setWeapon({ properties })} />
          {a.weapon.properties.includes('ammunition') && (
            <Select label={t('editor.action.ammunition')} value={a.weapon.ammunition} allowEmpty options={opts(AMMUNITION, term.ammunition)} onChange={(ammunition) => setWeapon({ ammunition })} />
          )}
        </>
      )}
      <DistanceInput label={t('editor.action.reach')} feet={a.reach} lang={lang} onChange={(reach) => set({ reach })} />
      <DistanceInput label={t('editor.action.rangeNormal')} feet={a.range?.normal} lang={lang} onChange={(normal) => set({ range: normal ? { normal, long: a.range?.long } : undefined })} />
      {a.range && <DistanceInput label={t('editor.action.rangeLong')} feet={a.range.long} lang={lang} onChange={(long) => set({ range: { normal: a.range!.normal, long } })} />}
      <Select label={t('editor.action.mastery')} value={a.mastery} allowEmpty options={opts(MASTERIES, term.masteries)} onChange={(mastery) => set({ mastery })} />
      {a.mastery && <LocalizedInput label={t('editor.action.masteryText')} lang={lang} multiline rows={3} value={a.masteryText} onChange={(v) => set({ masteryText: v })} />}
    </div>
  );
}

export function FeatureForm({ card, lang, uiLang, onChange }: FormProps<FeatureCard>) {
  const { t } = useTranslation();
  const term = terms(uiLang);
  const f = card.feature;
  const set = (patch: Partial<FeatureCard['feature']>) => onChange({ ...card, feature: { ...f, ...patch } });
  const setOrigin = (patch: Partial<FeatureCard['feature']['origin']>) => set({ origin: { ...f.origin, ...patch } });
  const o = f.origin;
  return (
    <div className="form-grid">
      <Select label={t('editor.feature.originKind')} value={o.kind} options={opts(ORIGIN_KINDS, term.originKinds)} onChange={(kind) => kind && setOrigin({ kind })} />
      {(o.kind === 'class' || o.kind === 'subclass') && (
        <Select label={t('editor.feature.classKey')} value={o.classKey} allowEmpty options={opts(CLASSES, term.classes)} onChange={(classKey) => setOrigin({ classKey })} />
      )}
      {o.kind === 'feat' && (
        <Select label={t('editor.feature.featCategory')} value={o.featCategory} allowEmpty options={opts(FEAT_CATEGORIES, term.featCategories)} onChange={(featCategory) => setOrigin({ featCategory })} />
      )}
      {o.kind !== 'class' && <LocalizedInput label={t('editor.feature.originName')} lang={lang} value={o.name} onChange={(name) => setOrigin({ name })} />}
      <NumberInput label={t('editor.feature.level')} min={1} max={20} value={o.level} onChange={(level) => setOrigin({ level })} />
      <Select label={t('editor.feature.activation')} value={f.activation} options={opts(ACTIVATIONS, term.activations)} onChange={(activation) => activation && set({ activation })} />
      <LocalizedInput label={t('editor.feature.uses')} lang={lang} value={f.uses} onChange={(uses) => set({ uses })} />
      <Select label={t('editor.feature.recovery')} value={f.recovery} allowEmpty options={opts(RECOVERY, term.recovery)} onChange={(recovery) => set({ recovery })} />
      <LocalizedInput label={t('editor.feature.prerequisite')} lang={lang} value={f.prerequisite} onChange={(prerequisite) => set({ prerequisite })} />
    </div>
  );
}

export function ItemForm({ card, lang, uiLang, onChange }: FormProps<ItemCard>) {
  const { t } = useTranslation();
  const term = terms(uiLang);
  const it = card.item;
  const set = (patch: Partial<ItemCard['item']>) => onChange({ ...card, item: { ...it, ...patch } });
  return (
    <div className="form-grid">
      <Select label={t('editor.item.category')} value={it.category} options={opts(ITEM_CATEGORIES, term.itemCategories)} onChange={(category) => category && set({ category })} />
      <LocalizedInput label={t('editor.item.categoryDetail')} lang={lang} value={it.categoryDetail} onChange={(categoryDetail) => set({ categoryDetail })} />
      <Select label={t('editor.item.rarity')} value={it.rarity} options={opts(RARITIES, term.rarities)} onChange={(rarity) => rarity && set({ rarity })} />
      <LocalizedInput label={t('editor.item.rarityText')} lang={lang} value={it.rarityText} onChange={(rarityText) => set({ rarityText })} />
      <Check label={t('editor.item.attunement')} checked={it.attunement} onChange={(attunement) => set({ attunement })} />
      {it.attunement && <LocalizedInput label={t('editor.item.attunementDetail')} lang={lang} value={it.attunementDetail} onChange={(attunementDetail) => set({ attunementDetail })} />}
      <NumberInput label={t('editor.item.charges')} min={1} value={it.charges?.count} onChange={(count) => set({ charges: count || it.charges?.recharge ? { ...it.charges, count } : undefined })} />
      <LocalizedInput label={t('editor.item.recharge')} lang={lang} value={it.charges?.recharge} onChange={(recharge) => set({ charges: { ...it.charges, recharge } })} />
    </div>
  );
}
