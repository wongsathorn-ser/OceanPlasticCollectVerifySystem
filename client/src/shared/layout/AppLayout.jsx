// SHARED FILE - signed-in layout: side navigation + page content (<Outlet />).
// Shows only the signed-in user's menu (NAV_BY_ROLE[user.role]), their name and
// role, and a log-out button. Crews also get the language switcher (CHG-001);
// sponsor and admin screens stay in English.
// Figma is desktop-only; on phones the layout must stack into one column (NFR-13).
import { useContext, useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router'
import { AuthContext } from '../../features/f1_accounts/authContext.js'
import { LanguageContext } from '../i18n/languageContext.js'
import LanguageSwitcher from '../i18n/LanguageSwitcher.jsx'
import { NAV_BY_ROLE, ROLE_KEYS, ROLE_LABELS } from './navConfig.js'

function navLinkClass({ isActive }) {
  return `block rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-[#0c6e80] text-white' : 'text-[#a9d5dd] hover:bg-[#0e4a56] hover:text-white'
  }`
}

export default function AppLayout() {
  const { user, checking, signOut } = useContext(AuthContext)
  const { t } = useContext(LanguageContext)
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  if (checking) {
    return <p className="p-8 text-center text-sm text-[#7d949c]">Checking your session…</p>
  }
  if (!user) return <Navigate to="/signin" replace />

  const isCrew = user.role === 'CREW_MEMBER'
  const label = (item) => (isCrew && item.key ? t(item.key) : item.label)

  async function handleLogOut() {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      navigate('/signin', { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#edf2f4] md:flex-row">
      <aside className="flex flex-col bg-[#0a3a44] p-4 text-white md:w-60 md:shrink-0">
        <p className="text-base font-bold leading-tight">{isCrew ? t('app.name') : 'Collection Verification'}</p>
        <p className="mb-6 text-xs text-[#a9d5dd]">{isCrew ? t('app.organisation') : 'Ocean Plastic Recovery'}</p>

        <nav className="mb-5 flex gap-1 overflow-x-auto md:block md:space-y-1">
          {(NAV_BY_ROLE[user.role] || []).map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {label(item)}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 border-t border-[#0e4a56] pt-4">
          {isCrew && <LanguageSwitcher tone="dark" />}
          <div>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-[#a9d5dd]">{isCrew ? t(ROLE_KEYS[user.role]) : ROLE_LABELS[user.role]}</p>
          </div>
          <button
            type="button"
            onClick={handleLogOut}
            disabled={signingOut}
            className="min-h-10 w-full rounded-lg border border-[#0e4a56] px-3 text-left text-sm font-medium text-[#a9d5dd] hover:bg-[#0e4a56] hover:text-white disabled:opacity-60"
          >
            {isCrew ? t('nav.log_out') : 'Log out'}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
