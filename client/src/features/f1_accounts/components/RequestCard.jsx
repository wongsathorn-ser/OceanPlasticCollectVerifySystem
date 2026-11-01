// F1 · Accounts & access - one account request on the admin "Account requests" screen.
// Each card keeps its own role choice and busy state (state is local to a component instance).
import { useState } from 'react'
import { ROLE_LABELS } from '../../../shared/layout/navConfig.js'
import { approveRequest, rejectRequest } from '../api.js'
import { REGISTRATION_ROLES } from '../constants.js'
import { timeAgo } from '../utils.js'
import AccountStatusBadge from './AccountStatusBadge.jsx'
import Avatar from './Avatar.jsx'
import Button from './Button.jsx'
import { CheckIcon } from './icons.jsx'
import SelectField from './SelectField.jsx'

export default function RequestCard({ request, onDecided }) {
  const [role, setRole] = useState(request.role) // FR-1.6: admin can correct the requested role
  const [busyAction, setBusyAction] = useState(null) // 'approve' | 'reject' | null
  const [error, setError] = useState('')

  async function decide(action) {
    setBusyAction(action)
    setError('')
    try {
      if (action === 'approve') {
        await approveRequest(request.id, role)
      } else {
        await rejectRequest(request.id)
      }
      onDecided(request, action, role)
    } catch (err) {
      setError(err.detail || 'Something went wrong. Please try again.')
      setBusyAction(null)
    }
  }

  const busy = busyAction !== null

  return (
    <article className="rounded-xl border border-[#dbe5e8] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar name={request.name} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold text-[#0c1d23]">{request.name}</h2>
          <p className="truncate text-xs text-[#8ca1a8]">{request.email}</p>
          <p className="text-xs text-[#8ca1a8]">Requested {timeAgo(request.created_at)}</p>
        </div>
        <AccountStatusBadge status="PENDING" />
      </div>

      <SelectField
        id={`role-${request.id}`}
        label="Role"
        className="mt-4"
        value={role}
        onChange={(event) => setRole(event.target.value)}
        disabled={busy}
      >
        {REGISTRATION_ROLES.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABELS[value]}
          </option>
        ))}
      </SelectField>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#a5342b]">
          {error}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => decide('reject')} disabled={busy}>
          {busyAction === 'reject' ? 'Rejecting…' : 'Reject'}
        </Button>
        <Button onClick={() => decide('approve')} disabled={busy}>
          <CheckIcon className="size-4" />
          {busyAction === 'approve' ? 'Approving…' : 'Approve'}
        </Button>
      </div>
    </article>
  )
}
