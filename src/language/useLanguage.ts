import { useContext } from 'react'
import { fallbackContextValue, LanguageContext } from './LanguageContext'

export function useLanguage() {
  return useContext(LanguageContext) ?? fallbackContextValue
}
