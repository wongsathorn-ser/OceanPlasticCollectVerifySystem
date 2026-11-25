// SHARED FILE - CHG-001 language context (own file, as in the useContext lecture).
// Use it in a crew-facing page:
//
//   import { useContext } from 'react'
//   import { LanguageContext } from '../../shared/i18n/languageContext.js'
//   const { t } = useContext(LanguageContext)
//   <h1>{t('home.welcome', { name: user.name })}</h1>
//
// Keys and words live in client/translations.json (eng_word / th_word / burmese_word).
import { createContext } from 'react'
import translations from '../../../translations.json'

export const LANGUAGES = [
  // code, column in translations.json, name shown in the switcher (in its own language)
  { code: 'en', column: 'eng_word', name: 'English' },
  { code: 'th', column: 'th_word', name: 'ไทย' },
  { code: 'my', column: 'burmese_word', name: 'မြန်မာ' },
]

// Same key and event as the F2 adapter (f2_record_collection/i18n.js), so both stay in sync.
export const LANGUAGE_STORAGE_KEY = 'ocean-language'
export const LANGUAGE_EVENT = 'ocean-language-change'

/** Translate `key` into `language`; fall back to English, then to the key itself. */
export function translate(language, key, values = {}) {
  const column = LANGUAGES.find((l) => l.code === language)?.column || 'eng_word'
  const entry = translations[key]
  const text = entry?.[column] || entry?.eng_word || key
  return text.replace(/\{(\w+)\}/g, (match, name) => (values[name] ?? match))
}

/** Backend error messages are English; show the translated text when we know the message. */
export function translateServerMessage(language, message) {
  const key = Object.keys(translations).find(
    (k) => k.startsWith('server_error.') && translations[k].eng_word === message,
  )
  return key ? translate(language, key) : message
}

// Default value: English, so pages still work outside the provider (e.g. in tests).
export const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key, values) => translate('en', key, values),
  translateServerMessage: (message) => message,
})
