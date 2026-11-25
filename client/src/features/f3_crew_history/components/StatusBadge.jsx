// F3 · Crew home & history - Status badge component
import { useContext } from 'react'
import { LanguageContext, translate } from '../../../shared/i18n/languageContext.js'
import { AuthContext } from '../../f1_accounts/authContext.js'

const STATUS_KEYS = {
  PENDING: 'status.pending',
  VERIFIED: 'status.verified',
  REJECTED: 'status.rejected',
  SAVED_ON_PHONE: 'status.saved_on_phone',
}

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
  const { user } = useContext(AuthContext)
  const { t: ctxT } = useContext(LanguageContext)
  const isCrew = user?.role !== 'SPONSOR_MANAGEMENT' && user?.role !== 'ADMIN'
  const t = (key, values) => (isCrew ? ctxT(key, values) : translate('en', key, values))

  const normStatus = (status || '').toUpperCase()
  const style = STATUS_STYLES[normStatus] || {
    pillClass: 'bg-slate-100 text-slate-700',
    dotClass: 'bg-slate-400',
  }
  const labelKey = STATUS_KEYS[normStatus]
  const label = labelKey ? t(labelKey) : status || t('status.unknown')

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0 select-none ${style.pillClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dotClass}`} aria-hidden="true" />
      {label}
    </span>
  )
}
