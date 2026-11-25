// F3 · Crew home & history - Status badge component
import { useF3Language } from '../i18n.js'

const STATUS_STYLES = {
  PENDING: {
    pillClass: 'bg-[#fef3c7] text-[#92400e]',
    dotClass: 'bg-[#f59e0b]',
  },
  VERIFIED: {
    pillClass: 'bg-[#dcfce7] text-[#15803d]',
    dotClass: 'bg-[#22c55e]',
  },
  REJECTED: {
    pillClass: 'bg-[#fee2e2] text-[#991b1b]',
    dotClass: 'bg-[#ef4444]',
  },
  SAVED_ON_PHONE: {
    pillClass: 'bg-slate-100 text-slate-700',
    dotClass: 'bg-slate-400',
  },
}

export default function StatusBadge({ status }) {
  const { tStatus } = useF3Language()
  const normStatus = (status || '').toUpperCase()
  const style = STATUS_STYLES[normStatus] || {
    pillClass: 'bg-slate-100 text-slate-700',
    dotClass: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0 select-none ${style.pillClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dotClass}`} aria-hidden="true" />
      {tStatus(status)}
    </span>
  )
}
