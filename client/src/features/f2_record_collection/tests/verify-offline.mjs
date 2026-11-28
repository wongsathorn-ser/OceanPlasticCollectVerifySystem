// Run: node client/src/features/f2_record_collection/tests/verify-offline.mjs
// Uses only the project's Vite/React dev dependencies and Node's test runner.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

globalThis.window = new EventTarget()
Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true })
const hints = new Map()
globalThis.localStorage = { getItem: (key) => hints.get(key) || null, setItem: (key, value) => hints.set(key, value), removeItem: (key) => hints.delete(key) }
const server = await createServer({ root: fileURLToPath(new URL('../../../../', import.meta.url)), server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const { renderCase } = await server.ssrLoadModule('/src/features/f2_record_collection/tests/OfflineGuardHarness.jsx')
  const { checkLocation, distanceMeters } = await server.ssrLoadModule('/src/features/f2_record_collection/offline/landingSite.js')
  await test('SSR guards allow a cached crew on supported offline routes', () => {
    localStorage.setItem('ocean-f2-last-crew', JSON.stringify({ id: 1, name: 'Test Crew', role: 'CREW_MEMBER' }))
    for (const path of ['/record', '/send', '/home', '/history', '/records/local']) {
      assert.match(renderCase({ user: null, checking: false }, path), /CREW_LOCAL_PAGE/)
    }
  })
  await test('offline hint never grants online or admin access', () => {
    navigator.onLine = true
    assert.doesNotMatch(renderCase({ user: null, checking: false }, '/record'), /CREW_LOCAL_PAGE/)
    navigator.onLine = false
    assert.doesNotMatch(renderCase({ user: null, checking: false }, '/admin/users', ['ADMIN']), /CREW_LOCAL_PAGE/)
    assert.doesNotMatch(renderCase({ user: null, checking: false }, '/profile'), /CREW_LOCAL_PAGE/)
    localStorage.setItem('ocean-f2-last-crew', JSON.stringify({ id: 1, name: 'Invalid Hint', role: 'ADMIN' }))
    assert.doesNotMatch(renderCase({ user: null, checking: false }, '/record'), /CREW_LOCAL_PAGE/)
  })
  await test('100 m location check uses full precision', () => {
    const config = { sites: [{ id: 1, latitude: 0, longitude: 0 }], radius_m: 100 }
    const deg = (m) => m / 6371000 * 180 / Math.PI
    assert.equal(checkLocation(config, { latitude: 0, longitude: deg(99.99) }).allowed, true)
    assert.equal(checkLocation(config, { latitude: 0, longitude: deg(100.01) }).allowed, false)
    assert.equal(checkLocation({ sites: [], radius_m: 100 }, { latitude: 0, longitude: 0 }).allowed, false)
    assert.ok(Number.isFinite(distanceMeters(90, 0, -90, 180)))
  })
} finally { await server.close() }
