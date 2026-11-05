import { useState } from 'react'
import { createBoat } from '../api.js'
import { useNavigate } from 'react-router'

export default function AddBoatPage() {
  const navigate = useNavigate()

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [capacityKg, setCapacityKg] = useState('')
  const [active, setActive] = useState(true)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')

    if (!code.trim()) {
      setError('Please enter a boat code.')
      return
    }

    if (!name.trim()) {
      setError('Please enter a boat name.')
      return
    }

    const capacity = Number(capacityKg)

    if (!capacity || capacity <= 0) {
      setError('Capacity must be greater than 0 kg.')
      return
    }

    try {
      setSaving(true)

      await createBoat({
        code: code.trim(),
        name: name.trim(),
        capacity_kg: capacity,
        active,
      })

      navigate('/admin/boats')
    } catch (err) {
      setError(err.message || 'Unable to create boat.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (!saving) {
      navigate('/admin/boats')
    }
  }

  return (
    <div className="min-h-full bg-[#f2f7f8]">

      <header className="border-b border-[#e0eaed] bg-white px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold text-[#123b44]">
            Add a boat
          </h1>

          <p className="mt-1 text-sm text-[#71858b]">
            New boats are available to crews straight away
          </p>
        </div>
      </header>

      <main className="flex justify-center p-8">

        <section className="w-full max-w-2xl rounded-xl border border-[#dbe6e9] bg-white p-6">

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label
                  htmlFor="boat-code"
                  className="text-xs font-semibold text-[#294a52]"
                >
                  Boat code <span className="text-red-700">*</span>
                </label>

                <input
                  id="boat-code"
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="HC-15"
                  disabled={saving}
                  className="mt-2 w-full rounded-lg border border-[#cbd9dd] px-3 py-3 text-sm text-[#123b44] outline-none focus:border-[#0c7183] focus:ring-2 focus:ring-[#b9dce1] disabled:bg-[#f5f8f9]"
                />

                <p className="mt-1 text-xs text-[#819399]">
                  Short and unique, as painted on the hull.
                </p>
              </div>

              <div>
                <label
                  htmlFor="boat-name"
                  className="text-xs font-semibold text-[#294a52]"
                >
                  Boat name <span className="text-red-700">*</span>
                </label>

                <input
                  id="boat-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Harbor Cleaner II"
                  disabled={saving}
                  className="mt-2 w-full rounded-lg border border-[#cbd9dd] px-3 py-3 text-sm text-[#123b44] outline-none focus:border-[#0c7183] focus:ring-2 focus:ring-[#b9dce1] disabled:bg-[#f5f8f9]"
                />
              </div>

            </div>

            <div className="mt-5 max-w-xs">
              <label
                htmlFor="boat-capacity"
                className="text-xs font-semibold text-[#294a52]"
              >
                Capacity (kg)
              </label>

              <input
                id="boat-capacity"
                type="number"
                min="1"
                step="1"
                value={capacityKg}
                onChange={(event) => setCapacityKg(event.target.value)}
                placeholder="1800"
                disabled={saving}
                className="mt-2 w-full rounded-lg border border-[#cbd9dd] px-3 py-3 text-sm text-[#123b44] outline-none focus:border-[#0c7183] focus:ring-2 focus:ring-[#b9dce1] disabled:bg-[#f5f8f9]"
              />

              <p className="mt-1 text-xs text-[#819399]">
                Must be greater than 0.
              </p>
            </div>

            <label className="mt-5 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                disabled={saving}
                className="h-4 w-4 accent-[#0c7183]"
              />

              <span className="text-sm text-[#42616a]">
                Available for crews to select
              </span>
            </label>

            <div className="mt-8 flex justify-end gap-3">

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-lg border border-[#cbd9dd] px-5 py-3 text-sm font-semibold text-[#42616a] hover:bg-[#f5f8f9] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#0c7183] px-5 py-3 text-sm font-semibold text-white hover:bg-[#095d6b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : '✓ Save boat'}
              </button>

            </div>

          </form>
        </section>
      </main>
    </div>
  )
}
