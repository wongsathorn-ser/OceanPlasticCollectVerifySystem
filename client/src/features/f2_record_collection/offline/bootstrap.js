import { getMe } from '../../f1_accounts/api.js'
import { fetchCollectionBoats, fetchLandingSites } from '../api.js'
import { setMeta } from './localDb.js'
import { syncQueue } from './syncQueue.js'

let started = false
let warming
export function warmOfflineData() {
  if (!navigator.onLine) return Promise.resolve()
  if (!warming) warming = (async () => {
    const user = await getMe()
    if (user.role !== 'CREW_MEMBER') return
    const [boats, sites] = await Promise.all([fetchCollectionBoats(), fetchLandingSites()])
    await Promise.all([setMeta('boats', boats), setMeta('landing-sites', sites)])
  })().finally(() => { warming = null })
  return warming
}
export function startF2Sync() {
  if (started || typeof window === 'undefined') return
  started = true
  const send = () => {
    warmOfflineData().catch(() => {})
    syncQueue().catch(() => { /* Failed sends remain on the device. */ })
  }
  window.addEventListener('online', send)
  send()
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('/f2-sw.js').catch(() => {})
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifest = document.createElement('link')
      manifest.rel = 'manifest'; manifest.href = '/f2-manifest.webmanifest'
      document.head.append(manifest)
    }
  }
}
