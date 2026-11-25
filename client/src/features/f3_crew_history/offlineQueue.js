// F3 · Crew home & history - F2 IndexedDB offline queue & offline crew session helper (FR-3.1, FR-3.2, AC-2).
// Reads unsynced drafts directly from F2's IndexedDB store (`ocean-f2-records`)
// and shares F2's cached offline crew key (`ocean-f2-last-crew`) when offline.
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../f1_accounts/authContext.js'
import { getDraft, listDrafts } from '../f2_record_collection/offline/localDb.js'

const LAST_CREW_KEY = 'ocean-f2-last-crew'

function readCachedCrew() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LAST_CREW_KEY))
    return parsed && parsed.role === 'CREW_MEMBER' ? parsed : null
  } catch {
    return null
  }
}

export function useF3User() {
  const auth = useContext(AuthContext)
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  useEffect(() => {
    if (auth?.checking) return
    try {
      if (auth?.user?.role === 'CREW_MEMBER') {
        const { id, name, role } = auth.user
        localStorage.setItem(LAST_CREW_KEY, JSON.stringify({ id, name, role }))
      } else if (!offline || auth?.user) {
        localStorage.removeItem(LAST_CREW_KEY)
      }
    } catch {
      // Optional offline crew hint; ignore storage quota errors.
    }
  }, [auth?.user, auth?.checking, offline])

  return {
    user: auth?.user || (offline ? readCachedCrew() : null),
    checking: Boolean(auth?.checking),
    offline,
  }
}

export function normalizeOfflineDraft(draft) {
  return {
    ...draft,
    id: draft.client_id,
    record_number: draft.record_number || 'LOCAL',
    status: 'SAVED_ON_PHONE',
  }
}

export async function loadOfflineDrafts(ownerId) {
  if (!ownerId) return []
  try {
    const rows = await listDrafts(ownerId)
    if (!Array.isArray(rows)) return []
    return rows
      .map(normalizeOfflineDraft)
      .sort((a, b) => String(b.recorded_at || '').localeCompare(String(a.recorded_at || '')))
  } catch {
    return []
  }
}

export async function findOfflineDraft(recordId, ownerId) {
  if (!recordId) return null
  try {
    const draft = await getDraft(recordId)
    if (!draft) return null
    if (ownerId && String(draft.owner_id) !== String(ownerId)) return null
    return normalizeOfflineDraft(draft)
  } catch {
    return null
  }
}

export function useOfflineDrafts(ownerId) {
  const [drafts, setDrafts] = useState([])

  useEffect(() => {
    let active = true

    const refresh = () => {
      loadOfflineDrafts(ownerId).then((rows) => {
        if (active) setDrafts(rows)
      })
    }

    refresh()
    window.addEventListener('f2-queue-change', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      active = false
      window.removeEventListener('f2-queue-change', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [ownerId])

  return drafts
}
