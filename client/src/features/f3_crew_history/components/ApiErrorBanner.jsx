// F3 · Crew home & history - Shared API error banner
import { useContext } from 'react'
import { LanguageContext, translate } from '../../../shared/i18n/languageContext.js'
import { AuthContext } from '../../f1_accounts/authContext.js'

const CLIENT_ERROR_KEYS = {
  'Unable to connect to server.': 'common.unable_to_connect',
  'Unable to fetch record from server.': 'record_detail.load_error',
}

export default function ApiErrorBanner({ error, onRetry, showingDemo = true }) {
  const { user } = useContext(AuthContext)
  const { t: ctxT, translateServerMessage } = useContext(LanguageContext)
  if (!error) return null

  const isCrew = user?.role !== 'SPONSOR_MANAGEMENT' && user?.role !== 'ADMIN'
  const t = (key, values) => (isCrew ? ctxT(key, values) : translate('en', key, values))
  const clientKey = CLIENT_ERROR_KEYS[error.message]
  const message = !error.message
    ? t('common.unable_to_connect')
    : clientKey
      ? t(clientKey)
      : isCrew
        ? translateServerMessage(error.message)
        : error.message

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3">
      <span>
        ⚠️ <strong>API {error.status ? `(${error.status})` : t('common.error')}:</strong> {message}
        {showingDemo ? ' Displaying demo data.' : ''}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-semibold underline shrink-0 hover:no-underline"
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
