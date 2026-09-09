import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fallbackLanguage,
  languageStorageKey,
  LanguageContext,
  type Translate,
} from './LanguageContext'
import {
  formatMessage,
  isLanguage,
  messageCatalog,
  type Language,
} from './messages'

function readStoredLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(languageStorageKey)
    return isLanguage(stored) ? stored : fallbackLanguage
  } catch {
    return fallbackLanguage
  }
}

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode
  initialLanguage?: Language
}) {
  const [language, setLanguage] = useState<Language>(
    initialLanguage ?? readStoredLanguage,
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(languageStorageKey, language)
    } catch {
      /* language preference persistence is best-effort */
    }
  }, [language])

  const t = useCallback<Translate>(
    (key, params) => formatMessage(messageCatalog[language][key], params),
    [language],
  )

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
