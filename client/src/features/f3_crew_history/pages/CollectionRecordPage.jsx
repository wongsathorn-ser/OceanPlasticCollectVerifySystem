// F3 · Crew home & history - owner: Kaung Khant Paing
// Figma: 03 Collection record | Spec: FR-3.3
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getRecordById } from '../api.js'
import StatusBadge from '../components/StatusBadge.jsx'
import { DEFAULT_RECORDS, formatMaterial } from '../mockData.js'

function formatDetailDate(dateInput) {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return String(dateInput)

  const day = date.getDate()
  const month = date.toLocaleString('en', { month: 'short' })
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day} ${month} ${year}, ${hours}:${minutes}`
}

export default function CollectionRecordPage() {
  const { recordId } = useParams()
  const navigate = useNavigate()

  // Match existing mock record if available (without falling back to arbitrary record)
  const matchedMock = DEFAULT_RECORDS.find(
    (r) =>
      r.record_number?.toLowerCase() === (recordId || '').toLowerCase() ||
      r.id?.toLowerCase() === (recordId || '').toLowerCase(),
  )

  const [record, setRecord] = useState(matchedMock || null)
  const [loading, setLoading] = useState(!matchedMock)
  const [notFound, setNotFound] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false

    async function fetchData() {
      if (!recordId) {
        if (!ignore) setNotFound(true)
        return
      }

      // 1. Check local phone storage
      try {
        const raw = localStorage.getItem('ocean_offline_records')
        if (raw) {
          const parsed = JSON.parse(raw)
          const found = parsed.find(
            (item) => item.record_number === recordId || item.id === recordId || item.client_id === recordId,
          )
          if (found && !ignore) {
            setRecord({ ...found, status: 'SAVED_ON_PHONE' })
            setNotFound(false)
            setLoading(false)
            return
          }
        }
      } catch {
        // Ignore parse error
      }

      // 2. Fetch from backend API
      try {
        const data = await getRecordById(recordId)
        if (ignore) return
        if (data) {
          setRecord(data)
          setNotFound(false)
          setApiError(null)
        } else if (!matchedMock) {
          setNotFound(true)
        }
      } catch (err) {
        if (ignore) return
        if (err.status === 404) {
          setRecord(null)
          setNotFound(true)
        } else {
          setApiError({
            status: err.status,
            message: err.detail || err.message || 'Unable to fetch record from server.',
          })
          if (!matchedMock) {
            setNotFound(true)
          }
        }
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
  }, [recordId, reloadKey, matchedMock])

  // Item 1: Render clear not-found state when URL has invalid record ID
  if (notFound || (!loading && !record)) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Record not found</h1>
        <p className="text-sm text-slate-500 mt-2">
          No collection record matches <span className="font-mono font-semibold text-slate-700">{recordId}</span>.
        </p>
        <Link
          to="/history"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
        >
          Back to history
        </Link>
      </div>
    )
  }

  if (loading && !record) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-slate-400">
        <p className="text-sm">Loading collection record...</p>
      </div>
    )
  }

  const recordNumber = record.record_number || `REC-${record.id}`
  const boatCode = record.boat_code || record.boat?.code || 'HC-14'
  const boatName = record.boat_name || record.boat?.name || 'Harbor Cleaner'
  const isRejected = (record.status || '').toUpperCase() === 'REJECTED'
  const reviewerName = record.reviewed_by_name || record.reviewed_by || 'Sofia Mendes'
  const rejectReason =
    record.reason || 'The scale reading is not readable in the photo. Please record this load again.'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* API Error Banner if request failed (Item 3) */}
      {apiError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3">
          <span>
            ⚠️ <strong>API {apiError.status ? `(${apiError.status})` : 'Error'}:</strong> {apiError.message}. Displaying demo data.
          </span>
          <button
            onClick={() => {
              setLoading(true)
              setReloadKey((k) => k + 1)
            }}
            className="font-semibold underline shrink-0 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 transition-colors text-slate-700"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Collection record</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">{recordNumber}</p>
        </div>
      </div>

      {/* 2. Rejection Banner (shown only when REJECTED) */}
      {isRejected && (
        <div className="flex items-start sm:items-center gap-3 rounded-2xl bg-[#fee2e2]/70 border border-rose-100 p-4 text-[#991b1b]">
          <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs sm:text-sm leading-relaxed">
            <span className="font-bold text-rose-950">Rejected by {reviewerName}.</span>{' '}
            <span className="text-rose-900">{rejectReason}</span>
          </p>
        </div>
      )}

      {/* 3. Main Content: Evidence (Left) + Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Evidence */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Evidence</h2>
            <p className="text-xs text-slate-400 mt-0.5">Photographed when the load was recorded</p>
          </div>

          {/* Scale Display Terminal (matches Figma) or Photo */}
          {record.photo_url ? (
            <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200">
              <img src={record.photo_url} alt="Scale photo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-full h-80 sm:h-96 bg-[#0c2227] rounded-2xl flex flex-col items-center justify-center p-6 select-none">
              <div className="border-2 border-[#16424b] rounded-2xl bg-[#061518] px-12 sm:px-16 py-8 sm:py-10 flex flex-col items-center justify-center shadow-2xl min-w-[260px] sm:min-w-[320px]">
                <span className="font-mono text-5xl sm:text-6xl font-bold text-[#2dd4bf] tracking-wider">
                  {record.weight_kg ?? 0}
                </span>
                <span className="font-mono text-xs sm:text-sm font-semibold tracking-widest text-[#155e69] mt-2">
                  kg NET
                </span>
              </div>
              <div className="w-32 sm:w-40 h-2.5 bg-[#154149] rounded-full mt-4" />
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-5">Details</h2>

          <div className="space-y-4 text-sm divide-y divide-slate-100/80">
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400 text-xs sm:text-sm">Record number</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">{recordNumber}</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">Boat</span>
              <span className="text-slate-800 font-medium text-xs sm:text-sm">
                {boatCode} · {boatName}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">Weight</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">{record.weight_kg ?? 0} kg</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">Material</span>
              <span className="text-slate-800 font-medium text-xs sm:text-sm">
                {formatMaterial(record.material)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">Recorded</span>
              <span className="text-slate-800 font-medium text-xs sm:text-sm">
                {formatDetailDate(record.display_time || record.recorded_at)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">Reviewed</span>
              <span className="text-slate-800 font-medium text-xs sm:text-sm">
                {formatDetailDate(record.reviewed_at)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">Status</span>
              <StatusBadge status={record.status} />
            </div>

            {record.note && (
              <div className="flex flex-col pt-3">
                <span className="text-slate-400 text-xs mb-1">Note</span>
                <span className="text-slate-800 text-xs italic">{record.note}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
