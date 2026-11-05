import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getVerificationQueue } from '../api.js'

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function VerifyQueuePage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    getVerificationQueue()
      .then((items) => {
        if (active) setRecords(items)
      })
      .catch(() => {
        if (active) setError('Could not load the verification queue.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const totalWeight = records.reduce((total, record) => total + record.weightKg, 0)

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0c6e80]">
            Sponsor / Management
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#123b44]">Verify</h1>
          <p className="mt-1 text-sm text-[#61777d]">
            Review collection evidence and record details.
          </p>
        </div>

        <div className="flex rounded-lg border border-[#d5e0e3] bg-white p-1 text-sm">
          <Link
            to="/verify"
            aria-current="page"
            className="rounded-md bg-[#0c6e80] px-4 py-2 font-semibold text-white"
          >
            To verify
          </Link>
          <Link
            to="/verify/history"
            className="rounded-md px-4 py-2 font-semibold text-[#42616a] hover:bg-[#edf4f5]"
          >
            Verified
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[#0c5967] p-4 text-white">
          <p className="text-sm text-[#d1e8eb]">Pending records</p>
          <p className="mt-1 text-2xl font-bold">{records.length}</p>
        </div>
        <div className="rounded-xl border border-[#d8e3e6] bg-white p-4">
          <p className="text-sm text-[#61777d]">Weight awaiting review</p>
          <p className="mt-1 text-2xl font-bold text-[#123b44]">{totalWeight} kg</p>
        </div>
      </div>

      <div
        className="mt-5 rounded-lg border border-[#b9dce1] bg-[#e3f3f5] px-4 py-3 text-sm text-[#285963]"
        role="note"
      >
        Records are listed oldest first. Compare each collection with its evidence before making a decision.
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-[#d8e3e6] bg-white">
        <div className="border-b border-[#e5edef] px-5 py-4">
          <h2 className="font-semibold text-[#123b44]">Pending verification</h2>
          <p className="mt-1 text-sm text-[#71858b]">
            Select a record to review its evidence.
          </p>
        </div>

        {loading ? (
          <p className="px-5 py-10 text-sm text-[#61777d]" role="status">
            Loading queue…
          </p>
        ) : error ? (
          <p className="px-5 py-10 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : records.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-semibold text-[#123b44]">Queue is clear</p>
            <p className="mt-1 text-sm text-[#71858b]">
              There are no pending records to review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#f5f8f9] text-xs uppercase tracking-wide text-[#71858b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Record</th>
                  <th className="px-5 py-3 font-semibold">Crew / boat</th>
                  <th className="px-5 py-3 font-semibold">Material</th>
                  <th className="px-5 py-3 font-semibold">Recorded</th>
                  <th className="px-5 py-3 text-right font-semibold">Weight</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eef0]">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-[#f8fbfb]">
                    <td className="px-5 py-4 font-semibold text-[#123b44]">
                      {record.recordNumber}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#294a52]">{record.crew}</p>
                      <p className="mt-1 text-xs text-[#71858b]">{record.boat}</p>
                    </td>
                    <td className="px-5 py-4 text-[#42616a]">{record.material}</td>
                    <td className="px-5 py-4 text-[#42616a]">
                      {formatDate(record.recordedAt)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-[#123b44]">
                      {record.weightKg} kg
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/verify/${record.id}`}
                        className="inline-block rounded-md bg-[#0c6e80] px-4 py-2 font-semibold text-white hover:bg-[#095968] focus:outline-none focus:ring-2 focus:ring-[#0c6e80] focus:ring-offset-2"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}