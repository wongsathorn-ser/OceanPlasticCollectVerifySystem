// F4 · Verification - persistent backend API calls.
import { apiFetch } from '../../shared/api/client.js'

export const getVerificationQueue = () => apiFetch('/verify/queue')
export const getDecisionHistory = () => apiFetch('/verify/history')
export const getVerificationRecord = (recordId) =>
  apiFetch(`/verify/records/${encodeURIComponent(recordId)}`)
export const verifyRecord = (recordId) =>
  apiFetch(`/records/${encodeURIComponent(recordId)}/verify`, { method: 'POST' })
export const rejectRecord = (recordId, reason) =>
  apiFetch(`/records/${encodeURIComponent(recordId)}/reject`, {
    method: 'POST',
    body: { reason },
  })
