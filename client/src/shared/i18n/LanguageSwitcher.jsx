// SHARED FILE - CHG-001 language switcher for the crew-facing screens.
// `tone="dark"` for the dark side navigation, default for light pages.
import { useContext } from 'react'
import { LANGUAGES, LanguageContext } from './languageContext.js'

export default function LanguageSwitcher({ tone = 'light', className = '' }) {
  const { language, setLanguage, t } = useContext(LanguageContext)
  const dark = tone === 'dark'
  return (
    <div role="group" aria-label={t('language.label')} className={`inline-flex rounded-lg p-1 ${dark ? 'bg-[#0e4a56]' : 'bg-white shadow-sm ring-1 ring-[#c8d4d9]'} ${className}`}>
      {LANGUAGES.map((l) => {
        const active = l.code === language
        return (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            aria-pressed={active}
            onClick={() => setLanguage(l.code)}
            className={`min-h-9 rounded-md px-3 text-sm font-semibold transition ${
              active
                ? 'bg-[#0c6e80] text-white'
                : dark
                  ? 'text-[#a9d5dd] hover:text-white'
                  : 'text-[#46616b] hover:text-[#0c1d23]'
            }`}
          >
            {l.name}
          </button>
        )
      })}
    </div>
  )
}
