// F3 · Crew home & history - Single collection record card
import { Link } from 'react-router'
import { formatMaterial } from '../mockData.js'
import DigitalScaleThumbnail from './DigitalScaleThumbnail.jsx'
import StatusBadge from './StatusBadge.jsx'

function formatRecordTime(recordedAt, displayTime) {
  if (displayTime) return displayTime
  if (!recordedAt) return ''

  const date = new Date(recordedAt)
  if (isNaN(date.getTime())) return String(recordedAt)

  const isToday = new Date().toDateString() === date.toDateString()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const time = `${hours}:${minutes}`

  if (isToday) return `Today, ${time}`

  const day = date.getDate()
  const month = date.toLocaleString('en', { month: 'short' })
  return `${day} ${month}, ${time}`
}

export default function RecordCard({ record }) {
  const recordId = record.record_number || record.id
  const boatCode = record.boat_code || record.boat?.code || 'HC-14'
  const formattedTime = formatRecordTime(record.recorded_at, record.display_time)
  const materialLabel = formatMaterial(record.material)

  return (
    <Link
      to={`/records/${recordId}`}
      className="group bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs hover:shadow-md hover:border-slate-200 transition-all block focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <DigitalScaleThumbnail weight={record.weight_kg} photoUrl={record.photo_url} />

        <div className="min-w-0">
          <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {record.weight_kg} kg · {materialLabel}
          </p>
          <p className="text-xs font-normal text-slate-400 mt-0.5 tracking-wide">
            {record.record_number || `REC-${record.id}`}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {boatCode} · {formattedTime}
          </p>
        </div>
      </div>

      <StatusBadge status={record.status} />
    </Link>
  )
}
