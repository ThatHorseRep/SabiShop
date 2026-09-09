import { createContext } from 'react'
import {
  formatMessage,
  messageCatalog,
  type Language,
  type MessageKey,
  type TranslationParams,
} from './messages'

export type Translate = (key: MessageKey, params?: TranslationParams) => string

export type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: Translate
}

export const languageStorageKey = 'sabi-shop:language'
export const fallbackLanguage: Language = 'en'

const fallbackTranslate: Translate = (key, params) =>
  formatMessage(messageCatalog.en[key], params)

export const fallbackContextValue: LanguageContextValue = {
  language: fallbackLanguage,
  setLanguage: () => undefined,
  t: fallbackTranslate,
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)
