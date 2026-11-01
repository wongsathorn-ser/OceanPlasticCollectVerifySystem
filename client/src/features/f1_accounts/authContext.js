// F1 · Accounts & access - owner: Wongsathorn Sereephap
// The signed-in user, shared with every feature through useContext
// (React Fundamentals Part 2: one file per context).
import { createContext } from 'react'

// TODO(F1): value shape, e.g. { user, loading, signIn, signOut, refresh }
export const AuthContext = createContext(null)
