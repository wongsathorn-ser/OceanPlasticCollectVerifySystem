// F1 · Accounts & access - split layout of the public screens (Sign in, Create an
// account, Request sent): dark brand panel on the left, form on the right.
// On phones the brand panel becomes a slim bar on top (NFR-13).
// CHG-001: texts come from client/translations.json; the language switcher sits above the form.
import { useContext } from 'react'
import { LanguageContext } from '../../../shared/i18n/languageContext.js'
import LanguageSwitcher from '../../../shared/i18n/LanguageSwitcher.jsx'
import BrandMark from './BrandMark.jsx'
import { CheckIcon } from './icons.jsx'

const POINTS = ['app.point_1', 'app.point_2', 'app.point_3']

export default function AuthLayout({ children, wide = false }) {
  const { t } = useContext(LanguageContext)
  return (
    <div className="min-h-screen bg-[#edf2f4] md:flex">
      <aside className="bg-[#0e4a56] px-5 py-4 text-white md:flex md:w-5/12 md:flex-col md:justify-between md:p-10 lg:p-12">
        <BrandMark />

        <div className="hidden md:block">
          <p className="max-w-md text-4xl font-bold leading-tight">{t('app.tagline')}</p>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm text-[#dceef1]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#0c6e80]">
                  <CheckIcon className="size-3.5 text-white" />
                </span>
                {t(point)}
              </li>
            ))}
          </ul>
        </div>

        <p className="hidden text-xs text-[#a9d5dd] md:block">{t('app.copyright')}</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-10 md:px-10">
        <div className={`w-full ${wide ? 'max-w-[520px]' : 'max-w-[440px]'}`}>
          <div className="mb-8 flex justify-end">
            <LanguageSwitcher />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
