import { apiFetch } from '../../shared/api/client.js'

// F5's /boats is still a mock. This F2 endpoint reads the shared boats table.
export const fetchCollectionBoats = () => apiFetch('/records/boats')
export const getSubmission = (clientId) => apiFetch(`/records/submissions/${encodeURIComponent(clientId)}`)

export function uploadRecord(draft) {
  const body = new FormData()
  for (const key of ['client_id', 'boat_id', 'weight_kg', 'material', 'note', 'latitude', 'longitude', 'gps_accuracy_m', 'recorded_at']) {
    if (draft[key] != null) body.append(key, String(draft[key]))
  }
  body.append('expected_crew_id', String(draft.owner_id))
  body.append('photo', draft.photo, 'scale.jpg')
  return apiFetch('/records', { method: 'POST', body })
}
