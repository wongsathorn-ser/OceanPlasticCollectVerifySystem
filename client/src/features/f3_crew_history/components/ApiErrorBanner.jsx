// F3 · Crew home & history - Shared API error banner
import { useF3Language } from '../i18n.js'

export default function ApiErrorBanner({ error, onRetry, showingDemo = true }) {
  const { t, tServerError } = useF3Language()
  if (!error) return null

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3">
      <span>
        ⚠️ <strong>API {error.status ? `(${error.status})` : t('common.error')}:</strong> {tServerError(error.message)}
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
