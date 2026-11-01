// F4 · Verification - API calls (owner: Hein Thant Si Thu).
// TODO(F4): one function per endpoint, all through the shared apiFetch:
//
//   import { apiFetch } from '../../shared/api/client.js'
//   export const verifyRecord = (id) =>
//     apiFetch(`/records/${id}/verify`, { method: 'POST' })
//
// Endpoints (paths after /api, see docs/requirements/system_requirements.txt section 7):
//   GET /verify/queue
//   GET /verify/history
//   POST /records/{id}/verify
//   POST /records/{id}/reject (body: {reason})
