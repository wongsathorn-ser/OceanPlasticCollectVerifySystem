// SHARED FILE - CHG-001: keeps the chosen language for the whole app
// (Context + Reducer pattern from the State Management lecture).
// The choice is saved on the phone (localStorage) so it stays after a reload.
import { useCallback, useEffect, useReducer } from 'react'
import {
  LANGUAGE_EVENT,
  LANGUAGE_STORAGE_KEY,
  LANGUAGES,
  LanguageContext,
  translate,
  translateServerMessage,
} from './languageContext.js'

function readSavedLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return LANGUAGES.some((l) => l.code === saved) ? saved : 'en'
  } catch {
    return 'en' // storage blocked (private mode): English for this visit
  }
}

function languageReducer(state, action) {
  switch (action.type) {
    case 'changed':
      return LANGUAGES.some((l) => l.code === action.language) ? { language: action.language } : state
    default:
      throw new Error(`Unknown action: ${action.type}`)
  }
}

export default function LanguageProvider({ children }) {
  const [state, dispatch] = useReducer(languageReducer, null, () => ({ language: readSavedLanguage() }))

  // Another tab or the F2 adapter changed the language -> follow it.
  useEffect(() => {
    const follow = () => dispatch({ type: 'changed', language: readSavedLanguage() })
    window.addEventListener(LANGUAGE_EVENT, follow)
    window.addEventListener('storage', follow)
    return () => {
      window.removeEventListener(LANGUAGE_EVENT, follow)
      window.removeEventListener('storage', follow)
    }
  }, [])

  // Tell the browser which language the page is in (screen readers, fonts).
  useEffect(() => {
    document.documentElement.lang = state.language
  }, [state.language])

  const setLanguage = useCallback((language) => {
    dispatch({ type: 'changed', language })
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      /* the choice still works until the page is closed */
    }
    window.dispatchEvent(new Event(LANGUAGE_EVENT))
  }, [])

  const t = useCallback((key, values) => translate(state.language, key, values), [state.language])
  const serverMessage = useCallback((message) => translateServerMessage(state.language, message), [state.language])

  return (
    <LanguageContext value={{ language: state.language, setLanguage, t, translateServerMessage: serverMessage }}>
      {children}
    </LanguageContext>
  )
}
