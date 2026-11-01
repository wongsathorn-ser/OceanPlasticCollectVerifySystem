// F1 · Accounts & access - owner: Wongsathorn Sereephap
// The signed-in user, shared with every feature through useContext
// (React Fundamentals Part 2: one file per context).
//
//   import { useContext } from 'react'
//   import { AuthContext } from '../../f1_accounts/authContext.js'
//   const { user } = useContext(AuthContext)   // user.role, user.name, ...
//
// Value: { user, checking, signIn(username, password), signOut() }
//   user      null when nobody is signed in
//   checking  true while the app asks who is signed in (GET /api/auth/me)
import { createContext } from 'react'

export const AuthContext = createContext(null)
