// SHARED FILE - signed-in layout: side navigation + page content (<Outlet />).
// Template version: shows the menus of all three roles so everyone can click
// through the placeholder pages. TODO(F1): show only the signed-in user's menu
// (NAV_BY_ROLE[user.role]), their name/role in the footer, and a log-out button.
// Figma is desktop-only; on phones the layout must stack into one column (NFR-13).
import { NavLink, Outlet } from 'react-router'
import { NAV_BY_ROLE, ROLE_LABELS } from './navConfig.js'

function navLinkClass({ isActive }) {
  return `block rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-[#0c6e80] text-white' : 'text-[#a9d5dd] hover:bg-[#0e4a56] hover:text-white'
  }`
}

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#edf2f4] md:flex-row">
      <aside className="bg-[#0a3a44] p-4 text-white md:w-60 md:shrink-0">
        <p className="text-base font-bold leading-tight">Collection Verification</p>
        <p className="mb-6 text-xs text-[#a9d5dd]">Ocean Plastic Recovery</p>

        {Object.entries(NAV_BY_ROLE).map(([role, items]) => (
          <nav key={role} className="mb-5">
            <p className="mb-1 px-3 text-xs uppercase tracking-wide text-[#7d949c]">{ROLE_LABELS[role]}</p>
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        ))}
      </aside>

      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
