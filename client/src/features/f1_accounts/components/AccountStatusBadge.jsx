// F1 · Accounts & access - account status pill (users.status, DM-1).
// Record statuses (Pending / Verified / Rejected) use shared/ui/status.js instead.
const STYLES = {
  PENDING: { label: 'Waiting', className: 'bg-[#fbf0d8] text-[#8a6212]' },
  ACTIVE: { label: 'Active', className: 'bg-[#e3f2ea] text-[#1b6e4a]' },
  SUSPENDED: { label: 'Suspended', className: 'bg-[#f8e4e2] text-[#a5342b]' },
  REJECTED: { label: 'Rejected', className: 'bg-[#edf1f3] text-[#46616b]' },
}

export default function AccountStatusBadge({ status }) {
  const style = STYLES[status] ?? STYLES.REJECTED
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {style.label}
    </span>
  )
}
