// F1 · Accounts & access - owner: Wongsathorn Sereephap
// Provides the signed-in user to the whole app (wrapped around <App /> in main.jsx).
import { useEffect, useState } from 'react'
import { getMe, login, logout } from './api.js'
import { AuthContext } from './authContext.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  // On start, ask who is signed in. A 401 simply means "nobody" (FR-1.2).
  useEffect(() => {
    let ignore = false

    async function loadSession() {
      try {
        const me = await getMe()
        if (!ignore) setUser(me)
      } catch {
        if (!ignore) setUser(null)
      } finally {
        if (!ignore) setChecking(false)
      }
    }

    loadSession()
    return () => {
      ignore = true
    }
  }, [])

  async function signIn(username, password) {
    const signedIn = await login(username, password)
    setUser(signedIn)
    return signedIn
  }

  async function signOut() {
    await logout()
    setUser(null)
  }

  return <AuthContext value={{ user, checking, signIn, signOut }}>{children}</AuthContext>
}
