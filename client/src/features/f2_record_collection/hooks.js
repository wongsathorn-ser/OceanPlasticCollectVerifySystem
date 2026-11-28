import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../f1_accounts/authContext.js'
import { fetchCollectionBoats, fetchLandingSites } from './api.js'
import { getMeta, listDrafts, setMeta } from './offline/localDb.js'

const LAST_CREW = 'ocean-f2-last-crew'
function cachedCrew() {
  try { return JSON.parse(localStorage.getItem(LAST_CREW)) } catch { return null }
}

export function useF2User() {
  const auth = useContext(AuthContext)
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  useEffect(() => {
    if (auth?.checking) return
    try {
      if (auth?.user?.role === 'CREW_MEMBER') {
        const { id, name, role } = auth.user
        localStorage.setItem(LAST_CREW, JSON.stringify({ id, name, role }))
      } else if (!offline || auth?.user) localStorage.removeItem(LAST_CREW)
    } catch { /* Local account hint is optional; IndexedDB save errors are shown by the form. */ }
  }, [auth?.user, auth?.checking, offline])
  return { user: auth?.user || (offline ? cachedCrew() : null), checking: auth?.checking, offline }
}

export function useBoats() {
  const [boats, setBoats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cached, setCached] = useState(false)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const rows = await fetchCollectionBoats()
        if (!Array.isArray(rows)) throw new Error('The boat list could not be loaded.')
        await setMeta('boats', rows).catch(() => {})
        if (active) { setBoats(rows); setCached(false); setError('') }
      } catch (failure) {
        const rows = await getMeta('boats').catch(() => [])
        if (active) {
          setBoats(rows || []); setCached(Boolean(rows?.length)); setError(failure.message)
        }
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [version])
  return { boats, loading, error, cached, retry: () => setVersion((value) => value + 1) }
}

export function useQueue(ownerId) {
  const [drafts, setDrafts] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const load = () => {
      if (!ownerId) return
      listDrafts(ownerId).then((rows) => { if (active) { setDrafts(rows); setError('') } })
        .catch((failure) => { if (active) setError(failure.message) })
    }
    load()
    window.addEventListener('f2-queue-change', load)
    window.addEventListener('focus', load)
    return () => { active = false; window.removeEventListener('f2-queue-change', load); window.removeEventListener('focus', load) }
  }, [ownerId])
  return { drafts, error }
}


export function useLandingSites() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cached, setCached] = useState(false)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const value = await fetchLandingSites()
        if (!Array.isArray(value.sites) || !Number.isFinite(value.radius_m) || value.radius_m <= 0) {
          throw new Error('The landing-site configuration could not be loaded.')
        }
        await setMeta('landing-sites', value).catch(() => {})
        if (active) { setConfig(value); setCached(false); setError('') }
      } catch (failure) {
        const value = await getMeta('landing-sites').catch(() => null)
        if (active) { setConfig(value); setCached(Boolean(value)); setError(failure.message) }
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [version])
  return { config, loading, cached, error, retry: () => setVersion((v) => v + 1) }
}
