// F1 · Accounts & access - API calls (owner: Wongsathorn Sereephap).
//
// NOW:   every function is answered by the in-memory mock (./mockAccounts.js),
//        so the screens work without the backend.
// LATER: replace each body with the apiFetch call written above it, e.g.
//          import { apiFetch } from '../../shared/api/client.js'
//          export const login = (username, password) =>
//            apiFetch('/auth/login', { method: 'POST', body: { username, password } })
//        The pages only call these functions, so they will not need to change.
import * as mock from './mockAccounts.js'

// Shows the "demo accounts" hint on the sign-in page while there is no backend.
export const USING_MOCK_DATA = true

// POST /api/auth/login {username, password} -> user, sets the session cookie (FR-1.1)
export const login = (username, password) => mock.login(username, password)

// POST /api/auth/logout -> ends the session (FR-1.8)
export const logout = () => mock.logout()

// GET /api/auth/me -> signed-in user, or 401 when nobody is signed in (FR-1.2)
export const getMe = () => mock.getMe()

// POST /api/auth/register {name, email, username, password, role} -> PENDING user (FR-1.4)
export const register = (form) => mock.register(form)

// POST /api/auth/change-password {current_password, new_password} (FR-1.8)
export const changePassword = (currentPassword, newPassword) => mock.changePassword(currentPassword, newPassword)

// GET /api/admin/requests -> PENDING users (FR-1.6)
export const listAccountRequests = () => mock.listAccountRequests()

// POST /api/admin/requests/{id}/approve {role} (FR-1.6)
export const approveRequest = (id, role) => mock.approveRequest(id, role)

// POST /api/admin/requests/{id}/reject (FR-1.6)
export const rejectRequest = (id) => mock.rejectRequest(id)

// GET /api/admin/users (FR-1.7) - search is done on the page for now; later ?search=
export const listUsers = () => mock.listUsers()

// POST /api/admin/users/{id}/suspend (FR-1.7, BR-7)
export const suspendUser = (id) => mock.suspendUser(id)

// POST /api/admin/users/{id}/reactivate (FR-1.7)
export const reactivateUser = (id) => mock.reactivateUser(id)
