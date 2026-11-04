// F1 · Accounts & access - API calls (owner: Wongsathorn Sereephap).
//
// Every F1 page gets its data through these functions only. They call the
// FastAPI backend (server/app/features/f1_accounts/router.py) with the shared
// apiFetch helper, which sends the session cookie and turns {"detail": ...}
// errors into ApiError (err.status, err.detail).
import { apiFetch } from '../../shared/api/client.js'

// Shows the "demo accounts" hint on the sign-in page. The backend keeps its
// data in memory with seeded demo users until the database exists.
export const SHOW_DEMO_ACCOUNTS = true

// ---------- /api/auth ----------

// FR-1.1: returns the user and sets the HttpOnly session cookie
export const login = (username, password) => apiFetch('/auth/login', { method: 'POST', body: { username, password } })

// FR-1.8: ends the session
export const logout = () => apiFetch('/auth/logout', { method: 'POST' })

// FR-1.2: signed-in user, or ApiError 401 when nobody is signed in
export const getMe = () => apiFetch('/auth/me')

// FR-1.4: creates a PENDING account. form = {name, email, username, password, role}
export const register = (form) => apiFetch('/auth/register', { method: 'POST', body: form })

// FR-1.8
export const changePassword = (currentPassword, newPassword) =>
  apiFetch('/auth/change-password', {
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
  })

// ---------- /api/admin (ADMIN only) ----------

// FR-1.6: PENDING users, newest first
export const listAccountRequests = () => apiFetch('/admin/requests')

// FR-1.6: the admin may correct the requested role
export const approveRequest = (id, role) => apiFetch(`/admin/requests/${id}/approve`, { method: 'POST', body: { role } })

export const rejectRequest = (id) => apiFetch(`/admin/requests/${id}/reject`, { method: 'POST' })

// FR-1.7: everyone except PENDING requests (the page filters while you type)
export const listUsers = () => apiFetch('/admin/users')

// FR-1.7, BR-7: also signs the person out everywhere
export const suspendUser = (id) => apiFetch(`/admin/users/${id}/suspend`, { method: 'POST' })

export const reactivateUser = (id) => apiFetch(`/admin/users/${id}/reactivate`, { method: 'POST' })
