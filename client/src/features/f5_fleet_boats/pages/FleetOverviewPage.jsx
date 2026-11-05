import { useEffect, useState } from 'react'
import { getFleetSummary } from '../api.js'
import { useNavigate } from 'react-router'

export default function FleetOverviewPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadFleetSummary() {
      try {
        setLoading(true)
        setError('')

        const result = await getFleetSummary(period)
        setData(result)
      } catch (err) {
        setError(err.message || 'Unable to load fleet summary.')
      } finally {
        setLoading(false)
      }
    }

    loadFleetSummary()
  }, [period])

  if (loading) {
    return (
      <div className="p-8 text-sm text-gray-500">
        Loading fleet summary...
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
        <div>
          <h1 className="text-2xl font-bold text-[#123b44]">
            Fleet
          </h1>

          <p className="mt-1 text-sm text-[#71858b]">
            November 2026 · Sofia Mendes
          </p>
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

        <section className="grid grid-cols-4 overflow-hidden rounded-lg border border-[#dbe6e9] bg-white">
          <SummaryCard
            value={`${(data.verified_kg / 1000).toFixed(1)} t`}
            label="VERIFIED"
          />

          <SummaryCard
            value={`${(data.pending_kg / 1000).toFixed(1)} t`}
            label="PENDING"
          />

          <SummaryCard
            value={data.records}
            label="RECORDS"
          />

          <SummaryCard
            value={data.boats}
            label="BOATS"
          />
        </section>

        <div className="grid grid-cols-[1.7fr_0.9fr] gap-5">

          <section className="rounded-xl border border-[#dbe6e9] bg-white p-5">
            <div className="mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#294a52]">
                Boats · Most verified first
              </h2>
            </div>

            <div className="space-y-1">
              {data.boats_by_verified.map((boat) => (
                <div
                  key={boat.id}
                  className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-[#f5f8f9]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#123b44]">
                      {boat.code} · {boat.name}
                    </p>

                    <p className="mt-1 text-xs text-[#819399]">
                      verified
                    </p>
                  </div>

                  <p className="text-sm font-bold text-[#123b44]">
                    {(boat.verified_kg / 1000).toFixed(1)} t
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-xl border border-[#dbe6e9] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-[#123b44]">
                    {data.pending_records} records are waiting for you
                  </p>

                  <p className="mt-1 text-xs text-[#819399]">
                    Pending weight is not counted until it is verified.
                  </p>
                </div>

                <span className="rounded-full bg-[#fff3d6] px-3 py-1 text-xs font-semibold text-[#8a6200]">
                  To verify
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate('/verify')}
                className="mt-4 w-full rounded-lg bg-[#0c7183] px-4 py-3 text-sm font-semibold text-white hover:bg-[#095d6b]"
              >
                Open verification
              </button>
            </section>
            <section className="rounded-xl border border-[#dbe6e9] bg-white p-5">
              <h2 className="text-sm font-bold text-[#123b44]">
                Verified by material
              </h2>

              <p className="mt-1 text-xs text-[#819399]">
                {period === 'month' ? 'November 2026' : '2026'} · all boats
              </p>

              <div className="mt-4 space-y-3">
                {data.material_breakdown.map((item) => {
                  const maxWeight = Math.max(
                    ...data.material_breakdown.map(
                      (material) => material.verified_kg,
                    ),
                  )

                  const width = (item.verified_kg / maxWeight) * 100

                  return (
                    <div
                      key={item.material}
                      className="grid grid-cols-[80px_1fr_45px] items-center gap-2"
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

          </div>
        </div>
      </main>
    </div>
  )
}

function SummaryCard({ value, label }) {
  return (
    <div className="border-r border-[#dbe6e9] px-5 py-4 last:border-r-0">
      <p className="text-xl font-bold text-[#123b44]">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#71858b]">
        {label}
      </p>
    </div>
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
