// SHARED FILE - one way for every feature to call the FastAPI backend.
//
//   import { apiFetch } from '../../shared/api/client.js'
//   const boats = await apiFetch('/boats?active=true')
//   await apiFetch('/auth/login', { method: 'POST', body: { username, password } })
//   await apiFetch('/records', { method: 'POST', body: formData })   // multipart
//
// The API lives under the same origin at /api (Vite proxy locally, Render
// rewrite in production). Set VITE_API_BASE_URL only if that changes.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail)
    this.status = status // 400 validation, 401 not signed in, 403 wrong role, 404, 409 conflict
    this.detail = detail
  }
}

export async function apiFetch(path, { method = 'GET', body, headers = {}, ...options } = {}) {
  const isFormData = body instanceof FormData
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include', // send the session cookie (FR-1.2)
    headers: isFormData || body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
    body: isFormData || body === undefined ? body : JSON.stringify(body),
    ...options,
  })

  if (!response.ok) {
    // Backend errors use FastAPI's format: {"detail": "<human-readable message>"}
    const data = await response.json().catch(() => ({}))
    const detail = typeof data.detail === 'string' ? data.detail : response.statusText
    throw new ApiError(response.status, detail)
  }

  return response.status === 204 ? null : response.json()
}
