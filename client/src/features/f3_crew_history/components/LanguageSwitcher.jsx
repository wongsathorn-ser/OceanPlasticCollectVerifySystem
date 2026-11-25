// F3 · Crew home & history - Language switcher matching F2Page (CHG-001)
import { useF3Language } from '../i18n.js'

export default function LanguageSwitcher() {
  const { language, setLanguage, t, isCrewView } = useF3Language()

  if (!isCrewView) return null

  return (
    <label className="inline-flex items-center text-xs text-slate-600">
      <span>{t('language.label')}</span>
      <select
        aria-label={t('language.label')}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="ml-2 min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900"
      >
        <option value="en">English</option>
        <option value="th">ไทย</option>
        <option value="my">မြန်မာ</option>
      </select>
    </label>
  )
}
