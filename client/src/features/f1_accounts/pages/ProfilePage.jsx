// F1 · Accounts & access - owner: Wongsathorn Sereephap
// Figma: Profile (all roles) | Spec: FR-1.8
import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ROLE_LABELS } from '../../../shared/layout/navConfig.js'
import { AuthContext } from '../authContext.js'
import Alert from '../components/Alert.jsx'
import Avatar from '../components/Avatar.jsx'
import Button from '../components/Button.jsx'
import ChangePasswordDialog from '../components/ChangePasswordDialog.jsx'
import { ChevronRightIcon, InfoIcon, LockIcon, LogOutIcon, MailIcon } from '../components/icons.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { APP_VERSION } from '../constants.js'
import { monthYear } from '../utils.js'

function IconCircle({ children }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dceef1] text-[#0e4a56]">{children}</span>
  )
}

export default function ProfilePage() {
  const { user, checking, signOut } = useContext(AuthContext)
  const navigate = useNavigate()
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [notice, setNotice] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  if (checking) {
    return <p className="text-sm text-[#7d949c]">Loading your account…</p>
  }

  if (!user) {
    return (
      <>
        <PageHeader title="Profile" subtitle="Your account" />
        <div className="rounded-xl border border-dashed border-[#c8d4d9] bg-white px-6 py-12 text-center">
          <p className="font-semibold text-[#0c1d23]">You are not signed in</p>
          <Link to="/signin" className="mt-2 inline-block text-sm font-semibold text-[#0c6e80] hover:underline">
            Go to sign in
          </Link>
        </div>
      </>
    )
  }

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/signin', { replace: true })
  }

  function handlePasswordChanged() {
    setShowPasswordDialog(false)
    setNotice('Your password has been changed.')
  }

  const details = [
    ['Username', user.username],
    ['Email', user.email],
    ['Role', ROLE_LABELS[user.role]],
    ['Member since', monthYear(user.created_at)],
  ]

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account" />

      {notice && (
        <Alert variant="success" className="mb-4">
          {notice}
        </Alert>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-[#dbe5e8] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-[#0c1d23]">{user.name}</h2>
              <p className="truncate text-sm text-[#7d949c]">
                {ROLE_LABELS[user.role]} · @{user.username}
              </p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-[#7d949c]">{label}</dt>
                <dd className="truncate text-right font-semibold text-[#0c1d23]">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="space-y-4">
          <ul className="divide-y divide-[#edf2f4] overflow-hidden rounded-xl border border-[#dbe5e8] bg-white shadow-sm">
            <li>
              <button
                type="button"
                onClick={() => setShowPasswordDialog(true)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f4f7f9] focus-visible:outline-2 focus-visible:outline-[#0c6e80]"
              >
                <IconCircle>
                  <LockIcon className="size-4" />
                </IconCircle>
                <span className="flex-1 text-sm font-semibold text-[#0c1d23]">Change password</span>
                <ChevronRightIcon className="size-4 text-[#8ca1a8]" />
              </button>
            </li>
            <li className="flex items-center gap-3 px-4 py-3">
              <IconCircle>
                <MailIcon className="size-4" />
              </IconCircle>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#0c1d23]">Email</span>
                <span className="block truncate text-xs text-[#7d949c]">{user.email}</span>
              </span>
            </li>
            <li className="flex items-center gap-3 px-4 py-3">
              <IconCircle>
                <InfoIcon className="size-4" />
              </IconCircle>
              <span>
                <span className="block text-sm font-semibold text-[#0c1d23]">About</span>
                <span className="block text-xs text-[#7d949c]">Version {APP_VERSION}</span>
              </span>
            </li>
          </ul>

          <Button variant="danger" className="w-full" onClick={handleSignOut} disabled={signingOut}>
            <LogOutIcon className="size-4" />
            {signingOut ? 'Logging out…' : 'Log out'}
          </Button>
        </div>
      </div>

      {showPasswordDialog && (
        <ChangePasswordDialog onClose={() => setShowPasswordDialog(false)} onChanged={handlePasswordChanged} />
      )}
    </>
  )
}
