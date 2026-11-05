import { apiFetch } from '../../shared/api/client.js'

export async function getBoats() {
  return apiFetch('/boats')
}

export async function createBoat(boatData) {
  return apiFetch('/boats', {
    method: 'POST',
    body: boatData,
  })
}

export async function updateBoat(boatId, boatData) {
  return apiFetch(`/boats/${boatId}`, {
    method: 'PATCH',
    body: boatData,
  })
}

export async function getFleetSummary(period = 'month') {
  return apiFetch(`/fleet/summary?period=${period}`)
}

export async function getFleetBoat(boatId, period = 'month') {
  return apiFetch(`/fleet/boats/${boatId}?period=${period}`)
}
