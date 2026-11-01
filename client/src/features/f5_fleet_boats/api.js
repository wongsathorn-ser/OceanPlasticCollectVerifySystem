// F5 · Fleet & boats - API calls (owner: Natthachaimongkol Chayopathum).
// TODO(F5): one function per endpoint, all through the shared apiFetch:
//
//   import { apiFetch } from '../../shared/api/client.js'
//   export const getFleetSummary = (period) =>
//     apiFetch(`/fleet/summary?period=${period}`)
//
// Endpoints (paths after /api, see docs/requirements/system_requirements.txt section 7):
//   GET /boats
//   POST /boats
//   PATCH /boats/{id}
//   GET /fleet/summary?period=month|year
//   GET /fleet/boats/{id}?period=
