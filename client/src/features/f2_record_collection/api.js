import { apiFetch } from '../../shared/api/client.js'

// F5 now exposes the shared DB-backed boat list. Cache only active rows.
export const fetchCollectionBoats = async () => (await apiFetch('/boats')).filter((boat) => boat.active)
export const fetchLandingSites = () => apiFetch('/records/landing-sites')
export const getSubmission = (clientId) => apiFetch(`/records/submissions/${encodeURIComponent(clientId)}`)

export function uploadRecord(draft) {
  const body = new FormData()
  for (const key of ['client_id', 'boat_id', 'weight_kg', 'material', 'note', 'latitude', 'longitude', 'gps_accuracy_m', 'recorded_at']) {
    if (draft[key] != null) body.append(key, String(draft[key]))
  }
  body.append('expected_crew_id', String(draft.owner_id))
  const scale = draft.scale_photo || draft.photo
  if (!draft.plastic_photo || !scale) {
    throw new Error('This record was saved before two-photo recording. Its original photo stays on this device; ask the team to review this legacy record.')
  }
  body.append('plastic_photo', draft.plastic_photo, 'plastic.jpg')
  body.append('scale_photo', scale, 'scale.jpg')
  return apiFetch('/records', { method: 'POST', body })
}
