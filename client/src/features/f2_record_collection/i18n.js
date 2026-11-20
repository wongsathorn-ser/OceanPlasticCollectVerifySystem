// F2 adapter for the PM's translation file. Replace with the shared context
// when CHG-001's LanguageContext is merged; translation keys stay the same.
import { useCallback, useEffect, useState } from 'react'
import translations from '../../../translations.json'
const KEY = 'ocean-language'
const columns = { en: 'eng_word', th: 'th_word', my: 'burmese_word' }
function readLanguage() {
  try { const value = localStorage.getItem(KEY); return columns[value] ? value : 'en' } catch { return 'en' }
}
export function useF2Language() {
  const [language, updateLanguage] = useState(readLanguage)
  useEffect(() => {
    const update = () => updateLanguage(readLanguage())
    window.addEventListener('ocean-language-change', update)
    window.addEventListener('storage', update)
    return () => { window.removeEventListener('ocean-language-change', update); window.removeEventListener('storage', update) }
  }, [])
  const t = useCallback((key, values = {}) => {
    const entry = translations[key]
    const text = entry?.[columns[language]] || entry?.eng_word || key
    return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match)
  }, [language])
  function setLanguage(value) {
    updateLanguage(value)
    try { localStorage.setItem(KEY, value) } catch { /* Language choice can still work for this visit. */ }
    window.dispatchEvent(new Event('ocean-language-change'))
  }
  return { language, setLanguage, t }
}
