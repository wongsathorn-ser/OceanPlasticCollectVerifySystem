import { useEffect, useState } from 'react'
import { getBoats, updateBoat } from '../api.js'
import { useNavigate } from 'react-router'

export default function BoatsPage() {
  const navigate = useNavigate()
  const [boats, setBoats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    loadBoats()
  }, [])

  async function loadBoats() {
    try {
      setLoading(true)
      setError('')

      const result = await getBoats()
      setBoats(result)
    } catch (err) {
      setError(err.message || 'Unable to load boats.')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive(boat) {
    try {
      setUpdatingId(boat.id)
      setError('')

      const updatedBoat = await updateBoat(boat.id, {
        active: !boat.active,
      })

      setBoats((currentBoats) =>
        currentBoats.map((item) =>
          item.id === updatedBoat.id ? updatedBoat : item,
        ),
      )
    } catch (err) {
      setError(err.message || 'Unable to update boat.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-full bg-[#f2f7f8]">

      <header className="flex items-center justify-between border-b border-[#e0eaed] bg-white px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold text-[#123b44]">
            Boats
          </h1>

          <p className="mt-1 text-sm text-[#71858b]">
            {boats.length} registered
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/boats/new')}
          className="rounded-lg bg-[#0c7183] px-5 py-3 text-sm font-semibold text-white hover:bg-[#095d6b]"
        >
          + Add a boat
        </button>
      </header>

      <main className="p-8">

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-[#dbe6e9] bg-white p-8 text-center text-sm text-[#71858b]">
            Loading boats...
          </div>
        ) : (
          <section className="overflow-hidden rounded-xl border border-[#dbe6e9] bg-white">

            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] items-center border-b border-[#e3ecef] bg-[#eef5f6] px-5 py-4 text-[11px] font-bold uppercase tracking-wide text-[#71858b]">
              <span>Boat</span>
              <span>Capacity</span>
              <span>Records</span>
              <span>Status</span>
              <span />
            </div>

            {boats.map((boat) => (
              <div
                key={boat.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] items-center border-b border-[#edf2f3] px-5 py-4 last:border-b-0 hover:bg-[#f8fafb]"
              >

                <div>
                  <p className="text-sm font-semibold text-[#123b44]">
                    {boat.code} · {boat.name}
                  </p>
                </div>

                <div className="text-sm text-[#42616a]">
                  {boat.capacity_kg.toLocaleString()} kg
                </div>

                <div className="text-sm text-[#42616a]">
                  {boat.records} records
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(boat)}
                    disabled={updatingId === boat.id}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      boat.active
                        ? 'bg-[#e3f3e9] text-[#237348]'
                        : 'bg-[#edf0f1] text-[#687b81]'
                    } disabled:opacity-50`}
                  >
                    {updatingId === boat.id
                      ? 'Updating...'
                      : boat.active
                        ? 'Active'
                        : 'Inactive'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/fleet/boats/${boat.id}`)}
                  className="text-lg text-[#8aa0a6] hover:text-[#0c7183]"
                >
                  ›
                </button>
              </div>
            ))}

            {boats.length === 0 && (
              <div className="p-10 text-center text-sm text-[#71858b]">
                No boats found.
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
