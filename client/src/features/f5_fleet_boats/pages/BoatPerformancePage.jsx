import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getFleetBoat } from '../api.js'

export default function BoatPerformancePage() {
  const navigate = useNavigate()
  const { boatId } = useParams()

  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadBoatPerformance() {
      try {
        setLoading(true)
        setError('')

        const result = await getFleetBoat(boatId, period)
        setData(result)
      } catch (err) {
        setError(err.message || 'Unable to load boat performance.')
      } finally {
        setLoading(false)
      }
    }

    loadBoatPerformance()
  }, [boatId, period])

  if (loading) {
    return (
      <div className="p-8 text-sm text-[#71858b]">
        Loading boat performance...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-full bg-[#f2f7f8]">

      <header className="flex items-center justify-between border-b border-[#e0eaed] bg-white px-8 py-5">

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/boats')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d5e0e3] text-lg text-[#42616a] hover:bg-[#f5f8f9]"
          >
            ‹
          </button>

          <div>
            <h1 className="text-2xl font-bold text-[#123b44]">
              {data.code} · {data.name}
            </h1>

            <p className="mt-1 text-sm text-[#71858b]">
              Capacity {data.capacity_kg.toLocaleString()} kg ·{' '}
              {data.active ? 'active' : 'inactive'}
            </p>
          </div>
        </div>

        <div className="flex rounded-lg bg-[#edf3f5] p-1">
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`rounded-md px-5 py-2 text-sm font-medium ${
              period === 'month'
                ? 'bg-white text-[#123b44] shadow-sm'
                : 'text-[#61777d]'
            }`}
          >
            This month
          </button>

          <button
            type="button"
            onClick={() => setPeriod('year')}
            className={`rounded-md px-5 py-2 text-sm font-medium ${
              period === 'year'
                ? 'bg-white text-[#123b44] shadow-sm'
                : 'text-[#61777d]'
            }`}
          >
            This year
          </button>
        </div>
      </header>

      <main className="space-y-5 p-8">

        <section className="grid grid-cols-4 overflow-hidden rounded-xl border border-[#dbe6e9] bg-white">

          <SummaryCard
            value={`${(data.verified_kg / 1000).toFixed(1)} t`}
            label="VERIFIED"
            highlight
          />

          <SummaryCard
            value={data.records}
            label="RECORDS"
          />

          <SummaryCard
            value={`${(data.pending_kg / 1000).toFixed(1)} t`}
            label="PENDING"
          />

          <SummaryCard
            value={data.crew}
            label="CREW"
          />

        </section>

        <div className="grid grid-cols-[1.7fr_0.9fr] gap-5">

          <section className="rounded-xl border border-[#dbe6e9] bg-white p-5">

            <h2 className="text-sm font-bold text-[#123b44]">
              What this boat brings in
            </h2>

            <p className="mt-1 text-xs text-[#819399]">
              {period === 'month' ? 'November 2026' : '2026'} · verified only
            </p>

            <div className="mt-5 space-y-4">
              {data.material_breakdown.map((item) => {
                const maxWeight = Math.max(
                  ...data.material_breakdown.map(
                    (material) => material.verified_kg,
                  ),
                )

                const width =
                  maxWeight > 0
                    ? (item.verified_kg / maxWeight) * 100
                    : 0

                return (
                  <div
                    key={item.material}
                    className="grid grid-cols-[90px_1fr_55px] items-center gap-3"
                  >
                    <span className="text-xs font-medium text-[#42616a]">
                      {shortMaterialName(item.material)}
                    </span>

                    <div className="h-3 overflow-hidden rounded bg-[#e8eff1]">
                      <div
                        className="h-full rounded bg-[#0c7183]"
                        style={{ width: `${width}%` }}
                      />
                    </div>

                    <span className="text-right text-xs font-semibold text-[#294a52]">
                      {(item.verified_kg / 1000).toFixed(1)} t
                    </span>
                  </div>
                )
              })}
            </div>

          </section>

          <section className="rounded-xl border border-[#dbe6e9] bg-white p-5">

            <h2 className="text-sm font-bold text-[#123b44]">
              Recent records
            </h2>

            <div className="mt-4 space-y-3">

              {data.recent_records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg border border-[#e2eaed] p-3"
                >
                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <p className="text-sm font-semibold text-[#123b44]">
                        {record.weight_kg.toLocaleString()} kg ·{' '}
                        {shortMaterialName(record.material)}
                      </p>

                      <p className="mt-1 text-xs text-[#819399]">
                        {record.record_number}
                      </p>

                      <p className="mt-1 text-xs text-[#819399]">
                        {formatDate(record.recorded_at)}
                      </p>
                    </div>

                    <StatusBadge status={record.status} />

                  </div>
                </div>
              ))}

            </div>
          </section>

        </div>
      </main>
    </div>
  )
}

function SummaryCard({ value, label, highlight = false }) {
  return (
    <div
      className={`border-r border-[#dbe6e9] px-5 py-5 last:border-r-0 ${
        highlight ? 'bg-[#0d5965] text-white' : 'bg-white'
      }`}
    >
      <p
        className={`text-xl font-bold ${
          highlight ? 'text-white' : 'text-[#123b44]'
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${
          highlight ? 'text-[#c8e2e6]' : 'text-[#71858b]'
        }`}
      >
        {label}
      </p>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: 'bg-[#fff3d6] text-[#8a6200]',
    VERIFIED: 'bg-[#e3f3e9] text-[#237348]',
    REJECTED: 'bg-[#fde8e6] text-[#a33730]',
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        styles[status] || 'bg-[#edf0f1] text-[#687b81]'
      }`}
    >
      {status}
    </span>
  )
}

function shortMaterialName(material) {
  const names = {
    'PET bottles': 'PET',
    'HDPE rigid': 'HDPE',
    'Fishing net / rope': 'Nets',
    'LDPE film': 'Film',
    Mixed: 'Mixed',
  }

  return names[material] || material
}

function formatDate(value) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
