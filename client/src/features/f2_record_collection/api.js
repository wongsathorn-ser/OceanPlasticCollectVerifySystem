// F2 · Record a collection - API calls (owner: Masaaki Kato).
// TODO(F2): one function per endpoint, all through the shared apiFetch:
//
//   import { apiFetch } from '../../shared/api/client.js'
//   export const uploadRecord = (formData) =>
//     apiFetch('/records', { method: 'POST', body: formData })
//
// Endpoints (paths after /api, see docs/requirements/system_requirements.txt section 7):
//   POST /records (multipart: photo + fields incl. client_id)
//   GET /boats?active=true (from F5, cache it for offline use)
