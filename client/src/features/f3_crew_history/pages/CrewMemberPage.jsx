// F3 · Crew home & history - owner: Kaung Khant Paing
// Figma: 05 Crew member details | Spec: FR-3.5, BR-2
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getCrewMember } from '../api.js'
import RecordCard from '../components/RecordCard.jsx'
import { DEFAULT_CREW_OVERVIEW, DEFAULT_RECORDS } from '../mockData.js'

export default function CrewMemberPage() {
  const { crewId } = useParams()
  const navigate = useNavigate()

  // Match mock member by id without arbitrary fallback (Item 2)
  const matchedMock = DEFAULT_CREW_OVERVIEW.find(
    (m) =>
      m.id?.toLowerCase() === (crewId || '').toLowerCase() ||
      m.user_id?.toLowerCase() === (crewId || '').toLowerCase() ||
      m.name?.toLowerCase().includes((crewId || '').toLowerCase()),
  )

  const [member, setMember] = useState(matchedMock || null)
  const [loading, setLoading] = useState(!matchedMock)
  const [notFound, setNotFound] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false

    async function fetchData() {
      if (!crewId) {
        if (!ignore) setNotFound(true)
        return
      }

      try {
        const data = await getCrewMember(crewId)
        if (ignore) return
        if (data) {
          setMember(data)
          setNotFound(false)
          setApiError(null)
        } else if (!matchedMock) {
          setNotFound(true)
        }
      } catch (err) {
        if (ignore) return
        if (err.status === 404) {
          setMember(null)
          setNotFound(true)
        } else {
          setApiError({
            status: err.status,
            message: err.detail || err.message || 'Unable to fetch crew member from server.',
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
  }, [crewId, reloadKey, matchedMock])

  // Item 2: Render clear not-found state when URL has invalid crew ID
  if (notFound || (!loading && !member)) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Crew member not found</h1>
        <p className="text-sm text-slate-500 mt-2">
          No crew member was found for ID <span className="font-mono font-semibold text-slate-700">{crewId}</span>.
        </p>
        <Link
          to="/crew"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
        >
          Back to crew overview
        </Link>
      </div>
    )
  }

  if (loading && !member) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-slate-400">
        <p className="text-sm">Loading crew member details...</p>
      </div>
    )
  }

  const recentRecords = DEFAULT_RECORDS.slice(0, 3)
  const boatsWorked = member.boats_worked || [
    { code: 'HC-14', name: 'Harbor Cleaner', records: 52, weight_display: '18.2 t' },
    { code: 'RM-07', name: 'River Mouth', records: 22, weight_display: '3.1 t' },
  ]

  // Item 4: Use ?? operator for numeric statistics so 0 is not replaced
  const recordsCount = member.records_count ?? 0
  const pendingCount = member.pending_records_count ?? 0
  const verifiedPercentage = member.verified_percentage ?? 0
  const verifiedWeight =
    member.verified_weight_display ??
    (member.verified_kg !== undefined ? `${(member.verified_kg / 1000).toFixed(1)} t` : '0.0 t')
  const pendingWeight =
    member.pending_weight_display ??
    (member.pending_kg !== undefined ? `${(member.pending_kg / 1000).toFixed(1)} t` : '0.0 t')

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

      {/* 1. Header with Back Button and Name */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/crew')}
          aria-label="Back to crew"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 transition-colors text-slate-700"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{member.name}</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
            Crew member · {member.joined_display || 'joined March 2026'}
          </p>
        </div>
      </div>

      {/* 2. Top Stats: 4 Cards (Item 4: uses ?? for numeric fallbacks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Verified this month */}
        <div className="bg-[#0e3b43] rounded-2xl p-5 text-white shadow-xs flex flex-col justify-between">
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">{verifiedWeight}</p>
          <div className="mt-3">
            <p className="text-xs font-semibold text-teal-100">Verified</p>
            <p className="text-xs text-teal-200/80 mt-0.5">this month</p>
          </div>
        </div>

        {/* Records this month */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{recordsCount}</p>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Records</p>
            <p className="text-xs text-slate-400 mt-0.5">this month</p>
          </div>
        </div>

        {/* Pending weight */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{pendingWeight}</p>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Pending</p>
            <p className="text-xs text-slate-400 mt-0.5">{pendingCount} records</p>
          </div>
        </div>

        {/* Last record */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {member.last_record_display || 'Today'}
          </p>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Last record</p>
            <p className="text-xs text-slate-400 mt-0.5">{member.last_record_boat || 'HC-14'}</p>
          </div>
        </div>
      </div>

      {/* 3. Verification Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="w-full bg-[#eef2f6] h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1b6b55] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, verifiedPercentage))}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-3 font-normal">
          {verifiedPercentage}% of what they recorded is verified
        </p>
      </div>

      {/* 4. Two Columns: Recent Records + Boats Worked */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Records (Clicking any opens CollectionRecordPage) */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            RECENT RECORDS
          </h2>
          <div className="space-y-3">
            {recentRecords.map((record) => (
              <RecordCard key={record.id || record.record_number} record={record} />
            ))}
          </div>
        </div>

        {/* Boats Worked This Month */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            BOATS WORKED THIS MONTH
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100/90 overflow-hidden">
            {boatsWorked.map((boat) => (
              <div key={boat.code} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {boat.code} · {boat.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{boat.records ?? 0} records</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{boat.weight_display}</p>
                  <p className="text-xs text-slate-400 mt-0.5">verified</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
