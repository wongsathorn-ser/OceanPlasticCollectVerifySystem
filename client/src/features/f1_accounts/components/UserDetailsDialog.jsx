// F1 · Accounts & access - "manage account" dialog opened from the Users list (FR-1.7).
// Figma only shows a chevron on each row, so this dialog is our design for
// suspend / reactivate. It uses the native <dialog> opened in useEffect, like the
// "controlling non-React widgets" example in React Fundamentals Part 2.
import { useEffect, useRef, useState } from 'react'
import { ROLE_LABELS } from '../../../shared/layout/navConfig.js'
import { reactivateUser, suspendUser } from '../api.js'
import { firstName, monthYear } from '../utils.js'
import AccountStatusBadge from './AccountStatusBadge.jsx'
import Alert from './Alert.jsx'
import Avatar from './Avatar.jsx'
import Button from './Button.jsx'
import { XIcon } from './icons.jsx'

export default function UserDetailsDialog({ user, isSelf, onClose, onUpdated }) {
  const dialogRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  async function changeStatus(action) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const updated = action === 'suspend' ? await suspendUser(user.id) : await reactivateUser(user.id)
      onUpdated(updated)
      setMessage(action === 'suspend' ? 'Account suspended.' : 'Account reactivated.')
    } catch (err) {
      setError(err.detail || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const rows = [
    ['Email', user.email],
    ['Role', ROLE_LABELS[user.role]],
    ['Member since', monthYear(user.created_at)],
  ]

  return (
    <dialog
      ref={dialogRef}
      // Escape key: let the parent remove the dialog (the cleanup above closes it).
      // Using onCancel instead of onClose keeps it working with StrictMode's double effects.
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      aria-labelledby="user-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-6 text-[#0c1d23] shadow-xl backdrop:bg-[#0c1d23]/50"
    >
      <div className="flex items-start gap-3">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 id="user-dialog-title" className="truncate text-lg font-bold">
            {user.name}
          </h2>
          <p className="text-sm text-[#7d949c]">@{user.username}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-10 place-items-center rounded-lg text-[#7d949c] hover:bg-[#edf2f4]"
        >
          <XIcon className="size-5" />
        </button>
      </div>

      <dl className="mt-5 divide-y divide-[#edf2f4] border-y border-[#edf2f4] text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2.5">
            <dt className="text-[#7d949c]">{label}</dt>
            <dd className="truncate text-right font-semibold">{value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-[#7d949c]">Status</dt>
          <dd>
            <AccountStatusBadge status={user.status} />
          </dd>
        </div>
      </dl>

      <div className="mt-5 space-y-3">
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}

        {user.status === 'ACTIVE' &&
          (isSelf ? (
            <p className="text-sm text-[#46616b]">This is your own account, so it cannot be suspended here.</p>
          ) : (
            <>
              <p className="text-sm text-[#46616b]">
                Suspending signs {firstName(user.name)} out and stops them signing in. Their records stay exactly as
                they are.
              </p>
              <Button variant="danger" className="w-full" onClick={() => changeStatus('suspend')} disabled={busy}>
                {busy ? 'Suspending…' : 'Suspend account'}
              </Button>
            </>
          ))}

        {user.status === 'SUSPENDED' && (
          <Button className="w-full" onClick={() => changeStatus('reactivate')} disabled={busy}>
            {busy ? 'Reactivating…' : 'Reactivate account'}
          </Button>
        )}

        {user.status === 'REJECTED' && (
          <p className="text-sm text-[#46616b]">
            This account request was rejected. The person can contact an administrator to ask again.
          </p>
        )}
      </div>
    </dialog>
  )
}
