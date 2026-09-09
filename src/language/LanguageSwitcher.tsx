import { useLanguage } from './useLanguage'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <select
      className={className ?? 'app-language-switch'}
      aria-label={t('shell.language')}
      value={language}
      onChange={(event) => {
        if (event.target.value === 'en' || event.target.value === 'pcm') {
          setLanguage(event.target.value)
        }
      }}
    >
      <option value="en">{t('common.english')}</option>
      <option value="pcm">{t('common.pidgin')}</option>
    </select>
  )
}
