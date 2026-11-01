// F1 · Accounts & access - MOCK backend (owner: Wongsathorn Sereephap).
//
// TEMPORARY: lets the F1 screens work before the FastAPI endpoints exist.
// It behaves like the planned API (same rules, same {detail} errors via ApiError)
// but keeps everything in memory, so it resets when the page reloads.
// Delete this file once api.js calls the real backend.
//
// Demo sign-ins - the password for all of them is: password123
//   mreyes    Crew member            active
//   smendes   Sponsor / Management   active
//   aosei     Administrator          active
//   tiversen  Crew member            suspended  -> cannot sign in (BR-8)
//   evasquez  Crew member            pending    -> cannot sign in until approved
import { ApiError } from '../../shared/api/client.js'
import { MIN_PASSWORD_LENGTH, REGISTRATION_ROLES } from './constants.js'

const DEMO_PASSWORD = 'password123'
const HOUR = 60 * 60 * 1000
const hoursAgo = (hours) => new Date(Date.now() - hours * HOUR).toISOString()

let nextId = 9
let sessionUserId = null // like the server-side session row (DM-4)

// Field names use snake_case, like the JSON the FastAPI backend will return.
let users = [
  { id: 1, name: 'Marco Reyes', username: 'mreyes', email: 'm.reyes@opr.org', role: 'CREW_MEMBER', status: 'ACTIVE', created_at: '2026-03-02T08:00:00Z' },
  { id: 2, name: 'Lea Novak', username: 'lnovak', email: 'l.novak@opr.org', role: 'CREW_MEMBER', status: 'ACTIVE', created_at: '2026-03-09T08:00:00Z' },
  { id: 3, name: 'Jonas Peret', username: 'jperet', email: 'j.peret@opr.org', role: 'CREW_MEMBER', status: 'ACTIVE', created_at: '2026-04-14T08:00:00Z' },
  { id: 4, name: 'Tomas Iversen', username: 'tiversen', email: 't.iversen@opr.org', role: 'CREW_MEMBER', status: 'SUSPENDED', created_at: '2026-04-20T08:00:00Z' },
  { id: 5, name: 'Amara Osei', username: 'aosei', email: 'a.osei@opr.org', role: 'ADMIN', status: 'ACTIVE', created_at: '2026-01-12T08:00:00Z' },
  { id: 6, name: 'Sofia Mendes', username: 'smendes', email: 's.mendes@opr.org', role: 'SPONSOR_MANAGEMENT', status: 'ACTIVE', created_at: '2026-02-03T08:00:00Z' },
  { id: 7, name: 'Elena Vasquez', username: 'evasquez', email: 'e.vasquez@opr.org', role: 'CREW_MEMBER', status: 'PENDING', created_at: hoursAgo(2) },
  { id: 8, name: 'Priya Raman', username: 'praman', email: 'p.raman@nordsea.com', role: 'SPONSOR_MANAGEMENT', status: 'PENDING', created_at: hoursAgo(48) },
].map((user) => ({ ...user, password: DEMO_PASSWORD }))

// Pretend network delay so loading states are visible.
function wait(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Like the backend's UserOut schema: never send the password back.
function toPublic(user) {
  const { id, name, username, email, role, status, created_at } = user
  return { id, name, username, email, role, status, created_at }
}

function findUser(id) {
  const user = users.find((u) => u.id === id)
  if (!user) throw new ApiError(404, 'Account not found.')
  return user
}

function requireSession() {
  if (sessionUserId === null) throw new ApiError(401, 'Please sign in again.')
  return findUser(sessionUserId)
}

// ---------- /api/auth ----------

export async function login(username, password) {
  await wait()
  const user = users.find((u) => u.username === username.trim().toLowerCase())
  // FR-1.1: generic message - do not reveal which field was wrong
  if (!user || user.password !== password) throw new ApiError(401, 'Incorrect username or password.')
  // BR-8: only ACTIVE accounts can sign in
  if (user.status === 'PENDING') throw new ApiError(403, 'Your account is waiting for an administrator to approve it.')
  if (user.status === 'REJECTED') throw new ApiError(403, 'Your account request was not approved. Please contact the administrator.')
  if (user.status === 'SUSPENDED') throw new ApiError(403, 'Your account is suspended. Please contact the administrator.')
  sessionUserId = user.id
  return toPublic(user)
}

export async function logout() {
  await wait(150)
  sessionUserId = null
}

export async function getMe() {
  await wait(150)
  return toPublic(requireSession())
}

export async function register({ name, email, username, password, role }) {
  await wait()
  const cleanUsername = username.trim().toLowerCase()
  const cleanEmail = email.trim().toLowerCase()
  if (!REGISTRATION_ROLES.includes(role)) throw new ApiError(400, 'Choose Crew member or Sponsor / Management.') // BR-9
  if (password.length < MIN_PASSWORD_LENGTH) throw new ApiError(400, `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`)
  if (users.some((u) => u.username === cleanUsername)) throw new ApiError(409, 'That username is already taken. Please choose another one.')
  if (users.some((u) => u.email === cleanEmail)) throw new ApiError(409, 'An account with this email address already exists.')
  const user = {
    id: nextId++,
    name: name.trim(),
    username: cleanUsername,
    email: cleanEmail,
    role,
    status: 'PENDING', // FR-1.4: waits for an administrator
    created_at: new Date().toISOString(),
    password,
  }
  users = [...users, user]
  return toPublic(user)
}

export async function changePassword(currentPassword, newPassword) {
  await wait()
  const user = requireSession()
  if (user.password !== currentPassword) throw new ApiError(400, 'Your current password is not correct.')
  if (newPassword.length < MIN_PASSWORD_LENGTH) throw new ApiError(400, `The new password needs at least ${MIN_PASSWORD_LENGTH} characters.`)
  user.password = newPassword
}

// ---------- /api/admin ----------

export async function listAccountRequests() {
  await wait()
  return users
    .filter((u) => u.status === 'PENDING')
    .sort((a, b) => b.created_at.localeCompare(a.created_at)) // newest first, as in Figma
    .map(toPublic)
}

export async function approveRequest(id, role) {
  await wait()
  const user = findUser(id)
  if (user.status !== 'PENDING') throw new ApiError(409, 'This request has already been handled.')
  if (!REGISTRATION_ROLES.includes(role)) throw new ApiError(400, 'Choose a valid role.')
  user.role = role // FR-1.6: the admin may correct the requested role
  user.status = 'ACTIVE'
  return toPublic(user)
}

export async function rejectRequest(id) {
  await wait()
  const user = findUser(id)
  if (user.status !== 'PENDING') throw new ApiError(409, 'This request has already been handled.')
  user.status = 'REJECTED'
  return toPublic(user)
}

export async function listUsers() {
  await wait()
  // Pending people are handled on the Requests screen, so Users shows the rest.
  return users.filter((u) => u.status !== 'PENDING').map(toPublic)
}

export async function suspendUser(id) {
  await wait()
  const user = findUser(id)
  if (user.id === sessionUserId) throw new ApiError(400, 'You cannot suspend your own account.')
  if (user.status !== 'ACTIVE') throw new ApiError(409, 'Only active accounts can be suspended.')
  user.status = 'SUSPENDED' // BR-7: the real backend also ends this user's sessions
  return toPublic(user)
}

export async function reactivateUser(id) {
  await wait()
  const user = findUser(id)
  if (user.status !== 'SUSPENDED') throw new ApiError(409, 'Only suspended accounts can be reactivated.')
  user.status = 'ACTIVE'
  return toPublic(user)
}
