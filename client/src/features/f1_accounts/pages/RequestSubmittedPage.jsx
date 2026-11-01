// F1 · Accounts & access - owner: Wongsathorn Sereephap
// Figma: 03 Request submitted ("Request sent") | Spec: FR-1.5
import { Link, useLocation } from 'react-router'
import { ROLE_LABELS } from '../../../shared/layout/navConfig.js'
import AuthLayout from '../components/AuthLayout.jsx'
import { CheckIcon } from '../components/icons.jsx'
import { firstName } from '../utils.js'

export default function RequestSubmittedPage() {
  // Name and role come from the Create an account page (navigate state); they are
  // missing if someone opens this URL directly, so the text works without them.
  const { state } = useLocation()
  const name = state?.name ? firstName(state.name) : ''
  const roleLabel = state?.role ? ROLE_LABELS[state.role] : ''

  return (
    <AuthLayout>
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e3f2ea] text-[#1b6e4a]">
          <CheckIcon className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#0c1d23]">Request sent</h1>
        <p className="mt-3 text-sm text-[#46616b]">
          {name && `Thanks, ${name}. `}
          An administrator will check your request{roleLabel && ` to join as ${roleLabel}`}. You can sign in once it
          has been approved.
        </p>
        <Link
          to="/signin"
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#dbe5e8] bg-white text-sm font-medium text-[#0c1d23] hover:bg-[#edf2f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c6e80]"
        >
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
