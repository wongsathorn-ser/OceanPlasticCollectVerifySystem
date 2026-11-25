// F1 · Accounts & access - logo + product name (Figma: top-left of the sign-in screens).
import { useContext } from 'react'
import { LanguageContext } from '../../../shared/i18n/languageContext.js'
import { BoatIcon } from './icons.jsx'

export default function BrandMark() {
  const { t } = useContext(LanguageContext)
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0c6e80] text-white">
        <BoatIcon className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-white">{t('app.name')}</span>
        <span className="block text-xs text-[#a9d5dd]">{t('app.organisation')}</span>
      </span>
    </div>
  )
}
