import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// SHARED FILE - reviewed by the project lead.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // Local dev: forward /api to FastAPI so the browser sees ONE origin
    // (like production behind the Render rewrite). The session cookie then
    // works without CORS. In docker compose the target is http://backend:5000.
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:34242',
        changeOrigin: true,
      },
    },
    // Docker on Windows/macOS does not forward file-change events into the
    // container, so compose turns on polling for hot reload.
    watch: { usePolling: process.env.VITE_USE_POLLING === 'true' },
  },
})
