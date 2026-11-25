// F3 · Crew home & history - owner: Kaung Khant Paing
// Figma: 03 My history | Spec: FR-3.2
import { useContext, useEffect, useMemo, useState } from 'react'
import { LanguageContext } from '../../../shared/i18n/languageContext.js'
import { getMyRecords } from '../api.js'
import ApiErrorBanner from '../components/ApiErrorBanner.jsx'
import RecordCard from '../components/RecordCard.jsx'
import { DEFAULT_RECORDS } from '../mockData.js'
import { useF3User, useOfflineDrafts } from '../offlineQueue.js'

const FILTER_TABS = [
  { key: 'ALL', labelKey: 'history.filter_all' },
  { key: 'PENDING', labelKey: 'status.pending' },
  { key: 'VERIFIED', labelKey: 'status.verified' },
  { key: 'REJECTED', labelKey: 'status.rejected' },
]

// Item 7: Deduplicate offline records against remote records to prevent duplicate rows after sync
function mergeAndDeduplicateRecords(offlineRecords, remoteRecords) {
  const remoteClientIds = new Set(remoteRecords.map((r) => r.client_id).filter(Boolean))
  const remoteIds = new Set(remoteRecords.map((r) => String(r.id)).filter(Boolean))
  const remoteRecordNumbers = new Set(remoteRecords.map((r) => r.record_number).filter(Boolean))

  const unsyncedOffline = offlineRecords.filter((off) => {
    if (off.client_id && remoteClientIds.has(off.client_id)) return false
    if (off.id && remoteIds.has(String(off.id))) return false
    if (off.record_number && off.record_number !== 'LOCAL' && remoteRecordNumbers.has(off.record_number)) return false
    return true
  })

  return [...unsyncedOffline, ...remoteRecords]
}

export default function MyHistoryPage() {
  const { user, offline } = useF3User()
  const { t } = useContext(LanguageContext)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [remoteRecords, setRemoteRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const offlineRecords = useOfflineDrafts(user?.id)
  const crewName = user?.name || t('role.crew_member')

  // Refresh remote records when online again or when F2 finishes syncing online
  useEffect(() => {
    const onQueueChange = () => {
      if (navigator.onLine) setReloadKey((k) => k + 1)
    }
    const onOnline = () => setReloadKey((k) => k + 1)
    window.addEventListener('f2-queue-change', onQueueChange)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('f2-queue-change', onQueueChange)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  // Load records from backend API (stay calm with local drafts when offline - NFR-14)
  useEffect(() => {
    let ignore = false

    async function fetchData() {
      if (offline) {
        if (!ignore) {
          setApiError(null)
          setLoading(false)
        }
        return
      }

      try {
        const remote = await getMyRecords()
        if (ignore) return

        if (Array.isArray(remote)) {
          setRemoteRecords(remote)
        }
        setApiError(null)
      } catch (err) {
        if (ignore) return
        setApiError({
          status: err.status,
          message: err.detail || err.message || 'Unable to connect to server.',
        })
        setRemoteRecords(DEFAULT_RECORDS)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      ignore = true
    }
  }, [reloadKey, offline])

  const records = useMemo(
    () => mergeAndDeduplicateRecords(offlineRecords, remoteRecords),
    [offlineRecords, remoteRecords],
  )

  // Filter records by selected status tab
  const filteredRecords = useMemo(() => {
    if (activeFilter === 'ALL') return records
    return records.filter(
      (rec) => (rec.status || '').toUpperCase() === activeFilter,
    )
  }, [records, activeFilter])

  const countLabel =
    filteredRecords.length === 1
      ? t('common.record_count_one')
      : t('common.records_count', { count: filteredRecords.length })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* API Error Banner if request failed (Item 3) */}
      <ApiErrorBanner
        error={apiError}
        onRetry={() => {
          setLoading(true)
          setReloadKey((k) => k + 1)
        }}
      />

      {/* Header: Title, Subtitle, and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {t('history.title')}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {crewName} · {countLabel}
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div
          role="tablist"
          aria-label={t('history.filter_label')}
          className="inline-flex items-center self-start sm:self-auto bg-[#eef2f6] p-1 rounded-xl border border-slate-200/50"
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-4 sm:px-5 py-1.5 rounded-lg text-sm font-medium transition-all select-none ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid of Records */}
      <div>
        {loading ? (
          <p className="text-sm text-slate-400 py-8 text-center">{t('history.loading')}</p>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center mt-4">
            <p className="text-base font-semibold text-slate-800">
              {activeFilter === 'ALL'
                ? t('history.empty')
                : t('history.empty_filtered', {
                    status: t(FILTER_TABS.find((tab) => tab.key === activeFilter)?.labelKey || 'status.unknown'),
                  })}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords.map((record) => (
              <RecordCard key={record.id || record.record_number} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
