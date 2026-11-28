// Use the PM's shared language context (CHG-001).
import { useContext } from 'react'
import { LanguageContext } from '../../shared/i18n/languageContext.js'

export function useF2Language() {
  return useContext(LanguageContext)
}
