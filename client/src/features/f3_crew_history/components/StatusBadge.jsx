// F3 · Crew home & history - Status badge component

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    pillClass: 'bg-[#fef3c7] text-[#92400e]',
    dotClass: 'bg-[#f59e0b]',
  },
  VERIFIED: {
    label: 'Verified',
    pillClass: 'bg-[#dcfce7] text-[#15803d]',
    dotClass: 'bg-[#22c55e]',
  },
  REJECTED: {
    label: 'Rejected',
    pillClass: 'bg-[#fee2e2] text-[#991b1b]',
    dotClass: 'bg-[#ef4444]',
  },
  SAVED_ON_PHONE: {
    label: 'Saved on this phone',
    pillClass: 'bg-slate-100 text-slate-700',
    dotClass: 'bg-slate-400',
  },
}

export default function StatusBadge({ status }) {
  const normStatus = (status || '').toUpperCase()
  const config = STATUS_CONFIG[normStatus] || {
    label: status || 'Unknown',
    pillClass: 'bg-slate-100 text-slate-700',
    dotClass: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0 select-none ${config.pillClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      {config.label}
    </span>
  )
}
