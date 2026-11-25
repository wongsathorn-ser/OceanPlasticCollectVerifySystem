// SHARED FILE - "/" sends a signed-in user to their role's home, everyone else to /signin.
import { useContext } from 'react'
import { Navigate } from 'react-router'
import { AuthContext } from '../../features/f1_accounts/authContext.js'
import { ROLE_HOME } from '../../features/f1_accounts/constants.js'

export default function HomeRedirect() {
  const { user, checking } = useContext(AuthContext)
  if (checking) return null
  return <Navigate to={user ? ROLE_HOME[user.role] : '/signin'} replace />
}
