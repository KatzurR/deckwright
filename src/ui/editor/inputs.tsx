/** Inputs for localized texts, distances and dice used by the card editor. */
import { useTranslation } from 'react-i18next';
import type { Lang, LocalizedText } from '../../model/schema';
import { feetToMetres, formatNumber, metresToFeet, normaliseDice } from '../../model/units';
import { Field } from '../widgets';

export function LocalizedInput({ label, value, lang, onChange, multiline, rows, hint, error }: {
  label: string; value: LocalizedText | undefined; lang: Lang; onChange(v: LocalizedText): void;
  multiline?: boolean; rows?: number; hint?: string; error?: string;
}) {
  const { t } = useTranslation();
  const other: Lang = lang === 'de' ? 'en' : 'de';
  const otherText = value?.[other];
  const set = (text: string) => onChange({ ...value, [lang]: text });
  return (
    <Field label={`${label} (${lang.toUpperCase()})`} hint={hint} error={error} wide={multiline}>
      {multiline ? (
        <textarea rows={rows ?? 8} value={value?.[lang] ?? ''} onChange={(e) => set(e.target.value)} lang={lang} spellCheck />
      ) : (
        <input type="text" value={value?.[lang] ?? ''} onChange={(e) => set(e.target.value)} lang={lang} />
      )}
      {otherText && !value?.[lang] && (
        <span className="field__hint">{t('editor.otherLanguage', { text: otherText.length > 120 ? `${otherText.slice(0, 120)} …` : otherText })}</span>
      )}
    </Field>
  );
}

/** Distance stored in feet, entered in metres (German cards) or feet (English cards). */
export function DistanceInput({ label, feet, lang, onChange, error }: {
  label: string; feet: number | undefined; lang: Lang; onChange(feet: number | undefined): void; error?: string;
}) {
  const unit = lang === 'de' ? 'm' : 'ft.';
  const shown = feet === undefined ? '' : lang === 'de' ? formatNumber(feetToMetres(feet), 'en') : String(feet);
  return (
    <Field label={`${label} (${unit})`} error={error}>
      <input
        type="number"
        min={0}
        step={lang === 'de' ? 1.5 : 5}
        value={shown}
        onChange={(e) => {
          const v = e.target.value === '' ? undefined : Number(e.target.value);
          onChange(v === undefined || Number.isNaN(v) || v <= 0 ? undefined : lang === 'de' ? metresToFeet(v) : v);
        }}
      />
    </Field>
  );
}

/** Dice input; accepts German (1W8) and English (1d8) notation. */
export function DiceInput({ label, value, lang, onChange, error }: {
  label: string; value: string | undefined; lang: Lang; onChange(v: string | undefined): void; error?: string;
}) {
  const shown = value ? (lang === 'de' ? value.replace(/(\d*)d(\d+)/gi, '$1W$2') : value) : '';
  return (
    <Field label={label} error={error}>
      <input
        type="text"
        value={shown}
        placeholder={lang === 'de' ? '1W8' : '1d8'}
        onChange={(e) => onChange(e.target.value.trim() ? normaliseDice(e.target.value) : undefined)}
      />
    </Field>
  );
}

export function NumberInput({ label, value, onChange, min, max, error }: {
  label: string; value: number | undefined; onChange(v: number | undefined): void; min?: number; max?: number; error?: string;
}) {
  return (
    <Field label={label} error={error}>
      <input
        type="number"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    </Field>
  );
}

export function Select<T extends string>({ label, value, options, onChange, allowEmpty, error }: {
  label: string; value: T | undefined; options: { value: T; label: string }[]; onChange(v: T | undefined): void;
  allowEmpty?: boolean; error?: string;
}) {
  return (
    <Field label={label} error={error}>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : (e.target.value as T))}>
        {allowEmpty && <option value="">—</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function MultiCheck<T extends string>({ label, values, options, onChange }: {
  label: string; values: T[]; options: { value: T; label: string }[]; onChange(v: T[]): void;
}) {
  return (
    <fieldset className="multi-check">
      <legend>{label}</legend>
      {options.map((o) => (
        <label key={o.value} className="check">
          <input
            type="checkbox"
            checked={values.includes(o.value)}
            onChange={(e) => onChange(e.target.checked ? [...values, o.value] : values.filter((v) => v !== o.value))}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
