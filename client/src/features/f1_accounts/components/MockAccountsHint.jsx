// F1 · Accounts & access - hint on the sign-in page (api.js SHOW_DEMO_ACCOUNTS).
// Lists the demo users the backend seeds into the database on its first start
// (server/.../f1_accounts/seed.py). Turn it off before a real launch.
import { useContext } from 'react'
import { LanguageContext } from '../../../shared/i18n/languageContext.js'

const DEMO_ACCOUNTS = [
  ['mreyes', 'Crew member'],
  ['smendes', 'Sponsor / Management'],
  ['admin', 'Administrator'],
  ['tiversen', 'Suspended crew member'],
]

export default function MockAccountsHint() {
  const { t } = useContext(LanguageContext)
  return (
    <details className="mt-6 rounded-xl border border-dashed border-[#c8d4d9] bg-white/60 px-4 py-3 text-xs text-[#46616b]">
      <summary className="cursor-pointer font-semibold">{t('signin.demo_title')}</summary>
      <p className="mt-2">
        {t('signin.demo_password')} <code className="font-semibold">password123</code>. Accounts are
        stored in the database, so changes stay after a restart.
      </p>
      <ul className="mt-2 space-y-1">
        {DEMO_ACCOUNTS.map(([username, role]) => (
          <li key={username}>
            <code className="font-semibold">{username}</code> - {role}
          </li>
        ))}
      </ul>
    </details>
  )
}
