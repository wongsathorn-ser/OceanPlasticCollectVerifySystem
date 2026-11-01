// F1 · Accounts & access - owner: Wongsathorn Sereephap
// Figma: 04 Approve access (Admin: Requests) | Spec: FR-1.6
import { useEffect, useState } from 'react'
import { ROLE_LABELS } from '../../../shared/layout/navConfig.js'
import { listAccountRequests } from '../api.js'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import { ShieldIcon, UsersIcon } from '../components/icons.jsx'
import InfoBanner from '../components/InfoBanner.jsx'
import PageHeader from '../components/PageHeader.jsx'
import RequestCard from '../components/RequestCard.jsx'

export default function AccountRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  // Load the pending requests when the page opens (and again after "Try again").
  useEffect(() => {
    let ignore = false

    async function loadRequests() {
      setLoading(true)
      setError('')
      try {
        const data = await listAccountRequests()
        if (!ignore) setRequests(data)
      } catch (err) {
        if (!ignore) setError(err.detail || 'Could not load the account requests.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadRequests()
    return () => {
      ignore = true
    }
  }, [reloadCount])

  function handleDecided(request, action, role) {
    setRequests(requests.filter((r) => r.id !== request.id))
    setNotice(
      action === 'approve'
        ? `${request.name} can now sign in as ${ROLE_LABELS[role]}.`
        : `${request.name}'s request was rejected.`,
    )
  }

  return (
    <>
      <PageHeader
        title="Account requests"
        subtitle={loading ? 'Loading…' : `${requests.length} waiting for approval`}
      />

      <div className="space-y-4">
        <InfoBanner icon={ShieldIcon}>
          Nobody can sign in until you approve them. Approving sets the role they asked for; change it here if it is
          wrong.
        </InfoBanner>

        {notice && <Alert variant="success">{notice}</Alert>}

        {error && (
          <Alert>
            <span>{error} </span>
            <Button variant="secondary" className="mt-2 h-10" onClick={() => setReloadCount(reloadCount + 1)}>
              Try again
            </Button>
          </Alert>
        )}

        {loading && <p className="text-sm text-[#7d949c]">Loading account requests…</p>}

        {!loading && !error && requests.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#c8d4d9] bg-white px-6 py-12 text-center">
            <UsersIcon className="mx-auto size-8 text-[#8ca1a8]" />
            <p className="mt-3 font-semibold text-[#0c1d23]">No requests waiting</p>
            <p className="mt-1 text-sm text-[#7d949c]">New account requests will appear here.</p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} onDecided={handleDecided} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
