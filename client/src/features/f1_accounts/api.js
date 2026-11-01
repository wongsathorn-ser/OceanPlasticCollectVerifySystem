// F1 · Accounts & access - API calls (owner: Wongsathorn Sereephap).
// TODO(F1): one function per endpoint, all through the shared apiFetch:
//
//   import { apiFetch } from '../../shared/api/client.js'
//   export const login = (username, password) =>
//     apiFetch('/auth/login', { method: 'POST', body: { username, password } })
//
// Endpoints (paths after /api, see docs/requirements/system_requirements.txt section 7):
//   POST /auth/register
//   POST /auth/login
//   POST /auth/logout
//   GET /auth/me
//   POST /auth/change-password
//   GET /admin/requests
//   POST /admin/requests/{id}/approve
//   POST /admin/requests/{id}/reject
//   GET /admin/users?search=
//   POST /admin/users/{id}/suspend
//   POST /admin/users/{id}/reactivate
