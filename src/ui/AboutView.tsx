import { useTranslation } from 'react-i18next';
import type { Lang } from '../model/schema';
import { COMPATIBILITY, SRD_ATTRIBUTION, SRD_CHANGES } from '../model/legal';
import { ICONS } from '../render/icons';

export function AboutView({ uiLang }: { uiLang: Lang }) {
  const { t } = useTranslation();
  const icons = Object.values(ICONS);
  return (
    <article className="about">
      <h1>{t('about.title')}</h1>
      <p>{t('about.intro')}</p>
      <p><em>{COMPATIBILITY[uiLang]}</em></p>

      <h2>{t('about.srd')}</h2>
      <blockquote lang="de">{SRD_ATTRIBUTION.de}</blockquote>
      <blockquote lang="en">{SRD_ATTRIBUTION.en}</blockquote>
      <p>{SRD_CHANGES[uiLang]}</p>

      <h2>{t('about.icons')}</h2>
      <p>{t('about.iconsText')}</p>
      <ul className="about__icons">
        {icons.map((icon) => (
          <li key={icon.slug}>
            <svg viewBox="0 0 512 512" width="20" height="20" aria-hidden="true"><path d={icon.path} /></svg>
            <span>
              „{icon.slug}“ – {icon.author}, <a href={`https://game-icons.net/1x1/${icon.author.toLowerCase()}/${icon.slug}.html`} target="_blank" rel="noreferrer">game-icons.net</a>
            </span>
          </li>
        ))}
      </ul>
      <p><a href="./licenses/CC-BY-3.0.txt" target="_blank" rel="noreferrer">CC BY 3.0 – {t('about.license')}</a></p>

      <h2>{t('about.fonts')}</h2>
      <p>{t('about.fontsText')} <a href="./licenses/GUST-FONT-LICENSE.txt" target="_blank" rel="noreferrer">{t('about.license')}</a></p>

      <h2>{t('about.code')}</h2>
      <p>{t('about.codeText')} <a href="https://github.com/KatzurR/open-tabletop-cards" target="_blank" rel="noreferrer">github.com/KatzurR/open-tabletop-cards</a></p>
    </article>
  );
}
