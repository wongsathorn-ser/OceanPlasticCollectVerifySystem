// SHARED FILE - one source of truth for status colours (NFR-14):
// Pending = amber, Verified = green, Rejected = red,
// "Saved on this phone" (not sent yet) = calm grey/blue, never shown as an error.
export const STATUS_LABELS = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  SAVED_ON_PHONE: 'Saved on this phone',
}

export const STATUS_BADGE_CLASSES = {
  PENDING: 'bg-amber-100 text-amber-800',
  VERIFIED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SAVED_ON_PHONE: 'bg-slate-100 text-slate-700',
}
