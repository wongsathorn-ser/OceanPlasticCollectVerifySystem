// F3 · Crew home & history - owner: Kaung Khant Paing
// Figma: 03 Personal dashboard | Spec: FR-3.1, BR-2
import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthContext } from '../../f1_accounts/authContext.js'
import { getMyRecords, getMySummary } from '../api.js'
import RecordCard from '../components/RecordCard.jsx'
import { DEFAULT_RECORDS } from '../mockData.js'

// Fallback summary (BR-2: verified and pending weight kept separate)
const DEFAULT_SUMMARY = {
  today_verified_kg: 0,
  today_pending_kg: 680,
  month_verified_kg: 540,
  month_pending_kg: 680,
  pending_count: 2,
}

// Reads any un-synced collection records stored on this phone
function getOfflineRecords() {
  try {
    const raw = localStorage.getItem('ocean_offline_records')
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export default function CrewHomePage() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()

  const [summary, setSummary] = useState(DEFAULT_SUMMARY)
  const [recentRecords, setRecentRecords] = useState(DEFAULT_RECORDS.slice(0, 4))
  const [offlineRecords, setOfflineRecords] = useState([])
  const [apiError, setApiError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const crewName = auth?.user?.name || 'Marco Reyes'
  const firstName = crewName.split(' ')[0]

  useEffect(() => {
    let ignore = false

    async function fetchData() {
      // 1. Read offline records
      const offline = getOfflineRecords()
      if (!ignore) setOfflineRecords(offline)

      // 2. Fetch summary stats from API
      try {
        const summaryData = await getMySummary()
        if (!ignore && summaryData) {
          setSummary(summaryData)
          setApiError(null)
        }
      } catch (err) {
        if (!ignore) {
          setApiError({
            status: err.status,
            message: err.detail || err.message || 'Unable to connect to server.',
          })
        }
      }

      // 3. Fetch recent records from API
      try {
        const recordsData = await getMyRecords()
        if (!ignore && Array.isArray(recordsData) && recordsData.length > 0) {
          setRecentRecords(recordsData.slice(0, 4))
        }
      } catch {
        // Fall back to default recent records
      }
    }

    fetchData()

    return () => {
      ignore = true
    }
  }, [reloadKey])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* API Error Banner if request failed (Item 3) */}
      {apiError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3">
          <span>
            ⚠️ <strong>API {apiError.status ? `(${apiError.status})` : 'Error'}:</strong> {apiError.message}. Displaying demo data.
          </span>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="font-semibold underline shrink-0 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Personal Dashboard · Ocean Plastic Recovery
          </p>
        </div>

        {/* Action: Add a collection */}
        <Link
          to="/record"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-800 transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add a collection
        </Link>
      </div>

      {/* 2. Offline Records Alert (if any records are saved on phone) */}
      {offlineRecords.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900">
          <div>
            <p className="text-sm font-bold text-amber-950">
              {offlineRecords.length} {offlineRecords.length === 1 ? 'record' : 'records'} saved on this phone
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              Saved offline. Ready to sync when connected.
            </p>
          </div>
          <button
            onClick={() => navigate('/send')}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors shrink-0"
          >
            Review & Send
          </button>
        </div>
      )}

      {/* 3. Metrics Cards (FR-3.1, BR-2: verified vs pending kept separate) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Total */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {summary.today_verified_kg ?? 0}
            </span>
            <span className="text-sm font-bold text-slate-500">kg verified</span>
          </div>
          <p className="text-xs font-medium text-amber-700 mt-1">
            +{summary.today_pending_kg ?? 0} kg pending review
          </p>
        </div>

        {/* This Month's Total */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">This month</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {summary.month_verified_kg ?? 0}
            </span>
            <span className="text-sm font-bold text-slate-500">kg verified</span>
          </div>
          <p className="text-xs font-medium text-amber-700 mt-1">
            +{summary.month_pending_kg ?? 0} kg pending review
          </p>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending review</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {summary.pending_count ?? 0}
            </span>
            <span className="text-sm font-bold text-slate-500">
              {(summary.pending_count ?? 0) === 1 ? 'record' : 'records'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Awaiting supervisor verification</p>
        </div>

        {/* On This Phone */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">On this phone</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {offlineRecords.length}
            </span>
            <span className="text-sm font-bold text-slate-500">
              {offlineRecords.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {offlineRecords.length > 0 ? 'Waiting to upload' : 'All synced'}
          </p>
        </div>
      </div>

      {/* 4. Action Banner */}
      <div className="rounded-2xl bg-teal-900 p-6 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Ready to record another collection?</h2>
          <p className="text-xs sm:text-sm text-teal-200 mt-0.5">
            Log scale weight, photo of scale display, and GPS coordinates.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link
            to="/record"
            className="rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-bold text-teal-900 hover:bg-teal-50 transition-colors"
          >
            Start collection
          </Link>
          <Link
            to="/history"
            className="rounded-xl bg-teal-800 px-4 py-2 text-xs sm:text-sm font-medium text-teal-100 hover:bg-teal-700 transition-colors"
          >
            View history
          </Link>
        </div>
      </div>

      {/* 5. Recent Records Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent collections</h2>
            <p className="text-xs text-slate-500">Your latest recorded loads</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
          >
            View all history →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentRecords.map((record) => (
            <RecordCard key={record.id || record.record_number} record={record} />
          ))}
        </div>
      </div>

      {/* 6. BR-2 Note */}
      <p className="text-xs text-slate-400">
        Note (BR-2): In accordance with business rules, only verified weights are included in verified totals. Pending records are reported separately until approved by a supervisor.
      </p>
    </div>
  )
}
