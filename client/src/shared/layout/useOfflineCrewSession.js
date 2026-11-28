// Shared integration fix: use the already-cached crew hint to open crew pages
// offline. This never creates a server session; every API still authenticates.
import { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { AuthContext } from '../../features/f1_accounts/authContext.js'

const KEY = 'ocean-f2-last-crew'
export function readOfflineCrew() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY))
    return value?.role === 'CREW_MEMBER' && Number.isInteger(value.id) && value.id > 0
      && typeof value.name === 'string' ? value : null
  } catch { return null }
}

export function useOfflineCrewSession() {
  const auth = useContext(AuthContext)
  const { pathname } = useLocation()
  const [offline, setOffline] = useState(() => !navigator.onLine)
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  // Only F2/F3 crew screens support local data. Do not grant cached access to
  // account administration, sponsor pages, or F1 pages expecting a live user.
  const localPage = ['/home', '/history', '/record', '/record/details', '/record/saved', '/send'].includes(pathname)
    || pathname.startsWith('/records/')
  const fallback = !auth.user && !auth.checking && offline && localPage ? readOfflineCrew() : null
  return { ...auth, user: auth.user || fallback, offline }
}
