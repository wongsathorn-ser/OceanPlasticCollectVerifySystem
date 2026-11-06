// F3 · Crew home & history - API calls (owner: Kaung Khant Paing).
import { apiFetch } from '../../shared/api/client.js'

/**
 * Get crew member personal summary (today, month, pending).
 * Spec: FR-3.1, BR-2
 */
export const getMySummary = () => apiFetch('/me/summary')

/**
 * Get crew member's collection records, newest first.
 * @param {string} [status] - Optional filter: PENDING | VERIFIED | REJECTED
 * Spec: FR-3.2
 */
export const getMyRecords = (status) => {
  const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : ''
  return apiFetch(`/records/mine${query}`)
}

/**
 * Get single record detail.
 * Spec: FR-3.3
 */
export const getRecordById = (id) => apiFetch(`/records/${encodeURIComponent(id)}`)

/**
 * Crew overview for Sponsor / Management.
 * @param {string} [search]
 * @param {string} [period] - today | month | all
 * Spec: FR-3.4, BR-12
 */
export const getCrewOverview = (search = '', period = '') => {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (period) params.append('period', period)
  const qs = params.toString()
  return apiFetch(`/crew${qs ? `?${qs}` : ''}`)
}

/**
 * Crew member details for Sponsor / Management.
 * Spec: FR-3.5
 */
export const getCrewMember = (id) => apiFetch(`/crew/${encodeURIComponent(id)}`)
