// F3 · Crew home & history - Role-based route guard component
import { useContext } from 'react'
import { Link } from 'react-router'
import { AuthContext } from '../../f1_accounts/authContext.js'
import { ROLE_LABELS } from '../../../shared/layout/navConfig.js'

export default function RequireRole({ allowedRoles, children }) {
  const auth = useContext(AuthContext)
  const user = auth?.user

  // If user is signed in with a defined role, enforce allowedRoles
  if (user && user.role && allowedRoles && !allowedRoles.includes(user.role)) {
    const userRoleLabel = ROLE_LABELS[user.role] || user.role
    const homeLink = user.role === 'CREW_MEMBER' ? '/home' : user.role === 'ADMIN' ? '/admin/requests' : '/crew'

    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">
          Your current role (<span className="font-semibold text-slate-700">{userRoleLabel}</span>) does not have permission to view this page.
        </p>
        <Link
          to={homeLink}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return children
}

