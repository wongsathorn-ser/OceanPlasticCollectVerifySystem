import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getDecisionHistory } from '../api.js'

function formatDate(value) {
  return value
    ? new Date(value).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—'
}

function StatusBadge({ status }) {
  const styles =
    status === 'VERIFIED'
      ? 'bg-[#e2f4eb] text-[#26724b]'
      : 'bg-[#fff0ed] text-[#a43a31]'

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {status}
    </span>
  )
}

export default function DecisionHistoryPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    getDecisionHistory()
      .then((items) => {
        if (active) setRecords(items)
      })
      .catch(() => {
        if (active) setError('Could not load decision history.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0c6e80]">
            Sponsor / Management
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#123b44]">Verify</h1>
          <p className="mt-1 text-sm text-[#61777d]">
            Review completed verification decisions.
          </p>
        </div>

        <div className="flex rounded-lg border border-[#d5e0e3] bg-white p-1 text-sm">
          <Link
            to="/verify"
            className="rounded-md px-4 py-2 font-semibold text-[#42616a] hover:bg-[#edf4f5]"
          >
            To verify
          </Link>
          <Link
            to="/verify/history"
            aria-current="page"
            className="rounded-md bg-[#0c6e80] px-4 py-2 font-semibold text-white"
          >
            Verified
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-[#d8e3e6] bg-white">
        <div className="border-b border-[#e5edef] px-5 py-4">
          <h2 className="font-semibold text-[#123b44]">Decision history</h2>
          <p className="mt-1 text-sm text-[#71858b]">
            Includes verified and rejected records, with the reviewer and decision time.
          </p>
        </div>

        {loading ? (
          <p className="px-5 py-10 text-sm text-[#61777d]" role="status">
            Loading history…
          </p>
        ) : error ? (
          <p className="px-5 py-10 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : records.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-semibold text-[#123b44]">No decisions yet</p>
            <p className="mt-1 text-sm text-[#71858b]">
              Completed decisions will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[#f5f8f9] text-xs uppercase tracking-wide text-[#71858b]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Record</th>
                  <th className="px-5 py-3 font-semibold">Crew / boat</th>
                  <th className="px-5 py-3 font-semibold">Material</th>
                  <th className="px-5 py-3 font-semibold">Decision</th>
                  <th className="px-5 py-3 font-semibold">Reviewer</th>
                  <th className="px-5 py-3 font-semibold">Reviewed</th>
                  <th className="px-5 py-3 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eef0]">
                {records.map((record) => (
                  <tr key={record.id} className="align-top hover:bg-[#f8fbfb]">
                    <td className="px-5 py-4 font-semibold text-[#123b44]">
                      {record.recordNumber}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#294a52]">{record.crew}</p>
                      <p className="mt-1 text-xs text-[#71858b]">{record.boat}</p>
                    </td>
                    <td className="px-5 py-4 text-[#42616a]">
                      {record.material} · {record.weightKg} kg
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-5 py-4 text-[#42616a]">
                      {record.reviewedBy || '—'}
                    </td>
                    <td className="px-5 py-4 text-[#42616a]">
                      {formatDate(record.reviewedAt)}
                    </td>
                    <td className="max-w-xs whitespace-normal px-5 py-4 text-[#61777d]">
                      {record.reason || '—'}
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