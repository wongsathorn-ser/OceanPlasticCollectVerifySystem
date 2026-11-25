// SHARED FILE - route guard used by App.jsx for every signed-in page.
// Not signed in -> /signin. Signed in with the wrong role -> that role's home.
// The backend checks roles too (require_role); this only keeps people on their own screens.
import { useContext } from 'react'
import { Navigate } from 'react-router'
import { AuthContext } from '../../features/f1_accounts/authContext.js'
import { ROLE_HOME } from '../../features/f1_accounts/constants.js'

export default function RequireRole({ roles, children }) {
  const { user, checking } = useContext(AuthContext)
  if (checking) return null
  if (!user) return <Navigate to="/signin" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />
  return children
}
