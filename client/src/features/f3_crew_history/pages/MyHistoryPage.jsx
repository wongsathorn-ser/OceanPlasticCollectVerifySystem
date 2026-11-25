// F3 · Crew home & history - owner: Kaung Khant Paing
// Figma: 03 My history | Spec: FR-3.2
import { useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../../f1_accounts/authContext.js'
import { getMyRecords } from '../api.js'
import ApiErrorBanner from '../components/ApiErrorBanner.jsx'
import RecordCard from '../components/RecordCard.jsx'
import { DEFAULT_RECORDS, readOfflineRecords } from '../mockData.js'

const FILTER_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'REJECTED', label: 'Rejected' },
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
  const auth = useContext(AuthContext)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const crewName = auth?.user?.name || 'Marco Reyes'

  // Load records from local storage and backend API
  useEffect(() => {
    let ignore = false

    async function fetchData() {
      const offline = readOfflineRecords()
      try {
        const remote = await getMyRecords()
        if (ignore) return

        if (Array.isArray(remote)) {
          setRecords(mergeAndDeduplicateRecords(offline, remote))
        }
        setApiError(null)
      } catch (err) {
        if (ignore) return
        setApiError({
          status: err.status,
          message: err.detail || err.message || 'Unable to connect to server.',
        })
        setRecords(mergeAndDeduplicateRecords(offline, DEFAULT_RECORDS))
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
  }, [reloadKey])

  // Filter records by selected status tab
  const filteredRecords = useMemo(() => {
    if (activeFilter === 'ALL') return records
    return records.filter(
      (rec) => (rec.status || '').toUpperCase() === activeFilter,
    )
  }, [records, activeFilter])

  const countLabel = `${filteredRecords.length} ${filteredRecords.length === 1 ? 'record' : 'records'}`

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
            My history
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {crewName} · {countLabel}
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter collection records"
          className="inline-flex items-center bg-[#eef2f6] p-1 rounded-xl self-start sm:self-auto border border-slate-200/50"
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
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid of Records */}
      <div>
        {loading ? (
          <p className="text-sm text-slate-400 py-8 text-center">Loading records...</p>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center mt-4">
            <p className="text-base font-semibold text-slate-800">
              No {activeFilter !== 'ALL' ? activeFilter.toLowerCase() : ''} records found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {activeFilter === 'ALL'
                ? "You haven't recorded any collections yet."
                : `There are currently no records with ${activeFilter.toLowerCase()} status.`}
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
