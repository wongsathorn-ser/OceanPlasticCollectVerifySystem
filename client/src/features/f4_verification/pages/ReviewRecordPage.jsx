import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import RejectDialog from '../components/RejectDialog.jsx'
import { getVerificationRecord, rejectRecord, verifyRecord } from '../api.js'

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function Detail({ label, children }) {
  return (
    <div className="border-b border-[#e8eef0] py-3 last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-[#71858b]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[#294a52]">{children || '—'}</dd>
    </div>
  )
}

export default function ReviewRecordPage() {
  const { recordId } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    getVerificationRecord(recordId)
      .then((item) => {
        if (active) setRecord(item)
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Could not load this record.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [recordId])

  async function handleVerify() {
    setError('')
    setSubmitting(true)

    try {
      await verifyRecord(recordId)
      navigate('/verify')
    } catch (decisionError) {
      setError(
        decisionError.status === 409
          ? 'This record was already decided by another supervisor. Return to the queue to see the updated list.'
          : decisionError.message || 'Could not verify this record.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject(reason) {
    setError('')
    setSubmitting(true)

    try {
      await rejectRecord(recordId, reason)
      setRejectOpen(false)
      navigate('/verify')
    } catch (decisionError) {
      if (decisionError.status === 409) setRejectOpen(false)
      setError(
        decisionError.status === 409
          ? 'This record was already decided by another supervisor. Return to the queue to see the updated list.'
          : decisionError.message || 'Could not reject this record.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-[#61777d]" role="status">Loading record…</p>
  }

  if (!record) {
    return (
      <section className="mx-auto max-w-3xl rounded-xl border border-[#d8e3e6] bg-white p-6">
        <h1 className="text-2xl font-bold text-[#123b44]">Record unavailable</h1>
        <p className="mt-2 text-sm text-[#61777d]">{error || 'The record could not be found.'}</p>
        <Link
          to="/verify"
          className="mt-5 inline-block rounded-md bg-[#0c6e80] px-4 py-2 text-sm font-semibold text-white"
        >
          Back to queue
        </Link>
      </section>
    )
  }

  const decided = record.status !== 'PENDING'

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/verify" className="text-sm font-semibold text-[#0c6e80] hover:underline">
            ← Back to queue
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#0c6e80]">
            Evidence review
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#123b44]">Review record</h1>
          <p className="mt-1 text-sm text-[#61777d]">{record.recordNumber}</p>
        </div>

        {record.status === 'PENDING' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRejectOpen(true)}
              disabled={submitting}
              className="rounded-md border border-[#b23a32] px-4 py-2 text-sm font-semibold text-[#a3322b] hover:bg-[#fff3f2] disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={submitting}
              className="rounded-md bg-[#0c6e80] px-4 py-2 text-sm font-semibold text-white hover:bg-[#095968] disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Verify record'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-[#e9b8b4] bg-[#fff3f2] px-4 py-3 text-sm text-[#8c2e29]" role="alert">
          {error}
        </div>
      )}

      {decided && (
        <div className="mt-5 rounded-lg border border-[#d8e3e6] bg-white px-4 py-3 text-sm text-[#42616a]">
          This record has already been decided: <strong>{record.status}</strong>.
          {record.reviewedBy && <span> Reviewer: {record.reviewedBy}.</span>}
          {record.reason && <span> Reason: {record.reason}</span>}
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <section className="overflow-hidden rounded-xl border border-[#d8e3e6] bg-white">
          <div className="border-b border-[#e5edef] px-5 py-4">
            <h2 className="font-semibold text-[#123b44]">Collection evidence</h2>
            <p className="mt-1 text-sm text-[#71858b]">
              Compare the submitted evidence with the recorded details.
            </p>
          </div>

          <div className="p-5">
            {record.photoUrl ? (
              <img
                src={record.photoUrl}
                alt={`Collection evidence for ${record.recordNumber}`}
                className="max-h-[520px] w-full rounded-lg bg-[#0a3037] object-contain"
              />
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg bg-[#0a3037] p-8 text-center text-white">
                <div className="rounded-lg border border-[#1d6672] bg-[#08262c] px-8 py-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8dc8d0]">
                    Demo evidence preview
                  </p>
                  <p className="mt-2 text-5xl font-bold text-[#79d9b2]">
                    {record.weightKg}
                  </p>
                  <p className="text-sm text-[#c2e8e5]">kg recorded</p>
                </div>
                <p className="mt-5 max-w-sm text-sm text-[#c2dfe2]">
                  No photo is attached to this temporary sample record.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-xl border border-[#d8e3e6] bg-white p-5">
          <h2 className="font-semibold text-[#123b44]">Record details</h2>
          <dl className="mt-3">
            <Detail label="Record number">{record.recordNumber}</Detail>
            <Detail label="Crew member">{record.crew}</Detail>
            <Detail label="Boat">{record.boat}</Detail>
            <Detail label="Material">{record.material}</Detail>
            <Detail label="Weight">{record.weightKg} kg</Detail>
            <Detail label="Recorded">{formatDate(record.recordedAt)}</Detail>
            <Detail label="GPS accuracy">
              {record.gpsAccuracyM ? `${record.gpsAccuracyM} m` : '—'}
            </Detail>
            <Detail label="Coordinates">
              {record.latitude && record.longitude
                ? `${record.latitude}, ${record.longitude}`
                : '—'}
            </Detail>
            <Detail label="Crew note">{record.note}</Detail>
          </dl>
        </aside>
      </div>

      {rejectOpen && (
  <RejectDialog
    open={rejectOpen}
    onClose={() => setRejectOpen(false)}
    onSubmit={handleReject}
    submitting={submitting}
  />
)}
    </section>
  )
}