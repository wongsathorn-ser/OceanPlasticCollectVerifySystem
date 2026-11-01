// F1 · Accounts & access - owner: Wongsathorn Sereephap
// Provides the signed-in user to the whole app. Not used yet; wrap <App />
// with it in src/main.jsx when it is implemented.
import { AuthContext } from './authContext.js'

export default function AuthProvider({ children }) {
  // TODO(F1): load GET /api/auth/me on start (useEffect), keep the user in
  // state (useState or useReducer), expose signIn / signOut helpers.
  return <AuthContext value={null}>{children}</AuthContext>
}
