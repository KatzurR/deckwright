/** Card editor with live preview (SPEC §6.4): form per card type, validation, overflow warning. */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SOURCES, type Card, type Deck, type Lang } from '../../model/schema';
import { validateCard, type ValidationErrors } from '../../model/templates';
import { formatNumber } from '../../model/units';
import { localized } from '../../model/deck';
import { useLaidOutCards } from '../state';
import { CardPlaceholder, CardPreview, Field, Modal } from '../widgets';
import { LocalizedInput } from './inputs';
import { ActionForm, FeatureForm, ItemForm, SpellForm } from './forms';

export interface EditorProps {
  deck: Deck;
  card: Card;
  isNew: boolean;
  uiLang: Lang;
  onSave(card: Card): void;
  onClose(): void;
}

export function Editor({ deck, card, isNew, uiLang, onSave, onClose }: EditorProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Card>(card);
  const [textLang, setTextLang] = useState<Lang>(deck.lang);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [dirty, setDirty] = useState(false);

  const change = (next: Card) => {
    setDraft(next);
    setDirty(true);
    if (Object.keys(errors).length) setErrors(validateCard(next).errors);
  };

  const previewCards = useMemo(() => {
    const { card: valid } = validateCard(draft);
    return valid ? [valid] : [];
  }, [draft]);
  const options = useMemo(() => ({ colorBySchool: deck.options?.colorBySchool ?? false }), [deck.options?.colorBySchool]);
  const laid = useLaidOutCards(previewCards, deck.lang, options, 120);
  const current = laid?.[0];

  const save = () => {
    const result = validateCard(draft);
    setErrors(result.errors);
    if (result.card) onSave(result.card);
  };

  const close = () => {
    if (!dirty || window.confirm(t('editor.discard'))) onClose();
  };

  const formProps = { lang: textLang, uiLang, errors };
  const overflow = current?.pagination.overflow;
  const pages = current?.pagination.pages ?? [];

  return (
    <Modal
      wide
      title={isNew ? t('editor.newTitle', { type: t(`types.${card.type}`) }) : t('editor.editTitle')}
      onClose={close}
      footer={
        <>
          {Object.keys(errors).length > 0 && <span className="field__error">{t('editor.invalid')}</span>}
          <button type="button" onClick={close}>{t('common.cancel')}</button>
          <button type="button" className="primary" onClick={save} data-testid="editor-save">{t('common.save')}</button>
        </>
      }
    >
      <div className="editor">
        <form className="editor__form" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <div className="editor__lang">
            <span>{t('editor.textLanguage')}</span>
            {(['de', 'en'] as Lang[]).map((l) => (
              <button type="button" key={l} className={textLang === l ? 'pill pill--active' : 'pill'} onClick={() => setTextLang(l)} aria-pressed={textLang === l}>
                {l === 'de' ? t('common.german') : t('common.english')}
              </button>
            ))}
          </div>
          <div className="form-grid">
            <LocalizedInput label={t('editor.name')} lang={textLang} value={draft.name} onChange={(name) => change({ ...draft, name })} error={errors.name && t('editor.requiredLang')} />
            <Field label={t('editor.source')}>
              <select value={draft.source ?? 'custom'} onChange={(e) => change({ ...draft, source: e.target.value as Card['source'] })}>
                {SOURCES.map((s) => <option key={s} value={s}>{s === 'custom' ? (uiLang === 'de' ? 'Eigene Eingabe' : 'Custom') : 'SRD 5.2.1'}</option>)}
              </select>
            </Field>
          </div>
          {draft.type === 'spell' && <SpellForm card={draft} onChange={change} {...formProps} />}
          {draft.type === 'action' && <ActionForm card={draft} onChange={change} {...formProps} />}
          {draft.type === 'feature' && <FeatureForm card={draft} onChange={change} {...formProps} />}
          {draft.type === 'item' && <ItemForm card={draft} onChange={change} {...formProps} />}
          <LocalizedInput
            label={t('editor.description')}
            lang={textLang}
            multiline
            rows={10}
            hint={t('editor.descriptionHint')}
            value={draft.description}
            onChange={(description) => change({ ...draft, description })}
            error={errors.description && t('editor.requiredLang')}
          />
          <Field label={t('editor.tags')} hint={t('editor.tagsHint')}>
            <input
              type="text"
              defaultValue={(draft.tags ?? []).join(', ')}
              onChange={(e) => change({ ...draft, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
          </Field>
          {draft.srdKey && <p className="hint">{t('editor.srdKey')}: <code>{draft.srdKey}</code></p>}
          {errors['(card)'] && <p className="field__error">{errors['(card)']}</p>}
        </form>
        <aside className="editor__preview" aria-live="polite">
          <h3>{t('editor.preview')}</h3>
          {overflow && (
            <p className={`fit fit--${overflow}`} data-testid="fit-status">
              {overflow === 'none' && t('editor.fitNone')}
              {overflow === 'shrunk' && t('editor.fitShrunk', { size: formatNumber(pages[0].fontSize, uiLang) })}
              {overflow === 'split' && t('editor.fitSplit', { count: pages.length, name: localized(draft.name, deck.lang) })}
            </p>
          )}
          <div className="editor__pages">
            {current ? pages.map((_, i) => <CardPreview key={i} laid={current} page={i} />) : <CardPlaceholder />}
          </div>
        </aside>
      </div>
    </Modal>
  );
}
