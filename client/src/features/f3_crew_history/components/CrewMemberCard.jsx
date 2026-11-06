// F3 · Crew home & history - Crew member card for Sponsor / Management
import { Link } from 'react-router'

export default function CrewMemberCard({ member }) {
  const boatsText = Array.isArray(member.boats)
    ? member.boats.join(' · ')
    : member.boats || 'HC-14'

  const verifiedPercent = member.verified_percentage ?? 0
  const recordsCount = member.records_count ?? 0
  const verifiedWeight =
    member.verified_weight_display ??
    (member.verified_kg !== undefined ? `${(member.verified_kg / 1000).toFixed(1)} t` : '0.0 t')

  return (
    <Link
      to={`/crew/${member.id}`}
      className="group bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md hover:border-slate-200 transition-all block focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
    >
      {/* Top Row: Avatar + Name + Boats (Left), Weight + "verified" (Right) */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ddf0f1] text-[#0d4a52] font-bold text-sm shrink-0 select-none">
            {member.initials || member.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate group-hover:text-teal-700 transition-colors">
              {member.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 tracking-wide truncate">
              {boatsText}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="font-bold text-slate-900 text-base sm:text-lg leading-tight">
            {verifiedWeight}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 font-normal">verified</p>
        </div>
      </div>

      {/* Middle Row: Progress Bar (Verified %) */}
      <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
        <div
          className="h-full bg-[#1b6b55] rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, verifiedPercent))}%` }}
        />
      </div>

      {/* Bottom Row: Metadata (% verified · n records · Last: date) */}
      <p className="text-xs text-slate-400 mt-3 font-normal">
        {verifiedPercent}% verified · {recordsCount} records · Last: {member.last_record_display || '—'}
      </p>
    </Link>
  )
}
