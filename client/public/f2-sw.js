// Cache app resources, NEVER cookie-authenticated API data or photo responses.
const CACHE = 'ocean-f2-shell-v1'
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/record', '/favicon.svg', '/f2-manifest.webmanifest'])))
  self.skipWaiting()
})
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()) })
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return
  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    try {
      const response = await fetch(event.request)
      if (response.ok && !response.headers.get('content-type')?.includes('application/json')) {
        await cache.put(event.request, response.clone())
      }
      return response
    } catch {
      const cached = await cache.match(event.request)
      if (cached) return cached
      if (event.request.mode === 'navigate') {
        const shell = await cache.match('/record')
        if (shell) return shell
      }
      return Response.error()
    }
  })())
})
