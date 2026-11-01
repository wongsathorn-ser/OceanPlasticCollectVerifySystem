// F1 · Accounts & access - small formatting helpers (owner: Wongsathorn Sereephap).
// Only built-in browser APIs (Intl) - no date library needed.

// "Marco Reyes" -> "MR"
export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

// "Marco Reyes" -> "Marco"
export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || ''
}

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const UNITS = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
]

// "2026-11-01T08:00:00Z" -> "2 hours ago"
export function timeAgo(isoDate) {
  const seconds = Math.round((new Date(isoDate).getTime() - Date.now()) / 1000)
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

// "2026-03-02T08:00:00Z" -> "March 2026"
export function monthYear(isoDate) {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(isoDate))
}
