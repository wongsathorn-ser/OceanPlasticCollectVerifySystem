import { syncQueue } from './syncQueue.js'

let started = false
export function startF2Sync() {
  if (started || typeof window === 'undefined') return
  started = true
  const send = () => { syncQueue().catch(() => { /* Session errors keep all drafts on the phone. */ }) }
  window.addEventListener('online', send)
  // This module is imported by the app's F2 route list, even on /home.
  send()
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('/f2-sw.js').catch(() => {})
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifest = document.createElement('link')
      manifest.rel = 'manifest'
      manifest.href = '/f2-manifest.webmanifest'
      document.head.append(manifest)
    }
  }
}
