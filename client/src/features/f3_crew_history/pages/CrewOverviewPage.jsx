// F3 · Crew home & history - owner: Kaung Khant Paing
// Figma: 05 Crew overview | Spec: FR-3.4, BR-12
import { useEffect, useMemo, useState } from 'react'
import { getCrewOverview } from '../api.js'
import CrewMemberCard from '../components/CrewMemberCard.jsx'
import { DEFAULT_CREW_OVERVIEW } from '../mockData.js'

export default function CrewOverviewPage() {
  const [crewList, setCrewList] = useState(DEFAULT_CREW_OVERVIEW)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Item 6: Debounce search input by 300ms so network requests are not sent on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Load crew list from backend API whenever debounced query changes
  useEffect(() => {
    let ignore = false

    async function fetchData() {
      try {
        const data = await getCrewOverview(debouncedSearch)
        if (ignore) return

        if (Array.isArray(data) && data.length > 0) {
          setCrewList(data)
        } else {
          setCrewList(DEFAULT_CREW_OVERVIEW)
        }
        setApiError(null)
      } catch (err) {
        if (ignore) return
        // Item 3: Surface API failure clearly instead of masking it
        setApiError({
          status: err.status,
          message: err.detail || err.message || 'Unable to connect to server.',
        })
        setCrewList(DEFAULT_CREW_OVERVIEW)
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
  }, [debouncedSearch, reloadKey])

  // Filter crew members by name or boat code in real time for instant UI feedback
  const filteredCrew = useMemo(() => {
    if (!search.trim()) return crewList
    const q = search.toLowerCase()
    return crewList.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        (Array.isArray(m.boats) && m.boats.some((b) => b.toLowerCase().includes(q))),
    )
  }, [crewList, search])

  const peopleCountText = `${filteredCrew.length} ${filteredCrew.length === 1 ? 'person' : 'people'}`

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

      {/* 1. Header with Title, Count, and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Crew</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">November 2026 · {peopleCountText}</p>
        </div>

        {/* Search input with debounced API queries (Item 6) */}
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crew"
            className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Mandatory BR-12 Disclaimer Banner */}
      <div className="flex items-start sm:items-center gap-3 rounded-2xl bg-[#e6f4f5] border border-[#d2ecf0] p-4 text-[#0f4d55]">
        <svg className="w-5 h-5 text-[#0d5963] shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xs sm:text-sm font-medium leading-relaxed">
          How much a person recovers depends on where and when they work. Read this as a record of what each person did, not as a league table.
        </p>
      </div>

      {/* 3. Grid of Crew Member Cards */}
      {loading && filteredCrew.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Loading crew overview...</p>
      ) : filteredCrew.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-sm font-semibold text-slate-700">No crew members found</p>
          <button
            onClick={() => setSearch('')}
            className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCrew.map((member) => (
            <CrewMemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  )
}
