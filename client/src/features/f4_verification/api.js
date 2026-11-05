// Temporary browser-only demo data for the F4 screens.
// Replace these functions with apiFetch calls when the backend is ready.

const STORAGE_KEY = 'f4-verification-demo-records'
let memoryRecords = null

const demoRecords = [
  {
    id: 412,
    recordNumber: 'REC-0412',
    crew: 'Marco Reyes',
    boat: 'HC-14 Harbor Cleaner',
    material: 'PET bottles',
    weightKg: 42,
    recordedAt: '2026-10-26T08:30:00',
    photoUrl: '',
    note: 'Collected near the north harbor entrance.',
    latitude: 13.7563,
    longitude: 100.5018,
    gpsAccuracyM: 8,
    status: 'PENDING',
  },
  {
    id: 413,
    recordNumber: 'REC-0413',
    crew: 'Mina Lee',
    boat: 'Blue Dolphin',
    material: 'Fishing net / rope',
    weightKg: 18,
    recordedAt: '2026-10-27T10:15:00',
    photoUrl: '',
    note: 'Small amount of netting recovered.',
    latitude: 13.742,
    longitude: 100.523,
    gpsAccuracyM: 12,
    status: 'PENDING',
  },
  {
    id: 414,
    recordNumber: 'REC-0414',
    crew: 'Arun S.',
    boat: 'HC-14 Harbor Cleaner',
    material: 'HDPE rigid',
    weightKg: 27,
    recordedAt: '2026-10-29T14:05:00',
    photoUrl: '',
    note: 'Containers and rigid plastic pieces.',
    latitude: 13.761,
    longitude: 100.49,
    gpsAccuracyM: 6,
    status: 'PENDING',
  },
]

function copy(value) {
  return JSON.parse(JSON.stringify(value))
}

function readRecords() {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // Use in-memory demo data if local storage is unavailable.
    }
  }

  if (!memoryRecords) memoryRecords = copy(demoRecords)
  return memoryRecords
}

function saveRecords(records) {
  memoryRecords = copy(records)

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    } catch {
      // The demo still works in memory if local storage is unavailable.
    }
  }
}

function makeError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

export async function getVerificationQueue() {
  return copy(
    readRecords()
      .filter((record) => record.status === 'PENDING')
      .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)),
  )
}

export async function getDecisionHistory() {
  return copy(
    readRecords()
      .filter((record) => record.status === 'VERIFIED' || record.status === 'REJECTED')
      .sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt)),
  )
}

export async function getVerificationRecord(recordId) {
  const record = readRecords().find((item) => String(item.id) === String(recordId))
  if (!record) throw makeError(404, 'Record not found.')
  return copy(record)
}

function decideRecord(recordId, status, reason = '') {
  const records = readRecords()
  const record = records.find((item) => String(item.id) === String(recordId))

  if (!record) throw makeError(404, 'Record not found.')

  if (record.status !== 'PENDING') {
    throw makeError(409, 'This record was already decided by another supervisor.')
  }

  if (status === 'REJECTED' && !reason.trim()) {
    throw makeError(400, 'Please provide a rejection reason.')
  }

  record.status = status
  record.reason = reason.trim()
  record.reviewedBy = 'Demo supervisor'
  record.reviewedAt = new Date().toISOString()

  saveRecords(records)
  return copy(record)
}

export async function verifyRecord(recordId) {
  return decideRecord(recordId, 'VERIFIED')
}

export async function rejectRecord(recordId, reason) {
  return decideRecord(recordId, 'REJECTED', reason)
}