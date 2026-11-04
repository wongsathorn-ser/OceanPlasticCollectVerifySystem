// F1 · Accounts & access - TEMPORARY hint on the sign-in page (api.js SHOW_DEMO_ACCOUNTS).
// Lists the demo users the backend seeds into memory (server/.../f1_accounts/seed.py).
// Remove when the database and real accounts exist.
const DEMO_ACCOUNTS = [
  ['mreyes', 'Crew member'],
  ['smendes', 'Sponsor / Management'],
  ['admin', 'Administrator'],
  ['tiversen', 'Suspended crew member'],
]

export default function MockAccountsHint() {
  return (
    <details className="mt-6 rounded-xl border border-dashed border-[#c8d4d9] bg-white/60 px-4 py-3 text-xs text-[#46616b]">
      <summary className="cursor-pointer font-semibold">Prototype: demo accounts</summary>
      <p className="mt-2">
        Password for every demo account: <code className="font-semibold">password123</code> (for{' '}
        <code className="font-semibold">admin</code>: <code>ADMIN_PASSWORD</code> from <code>.env</code> if it is set).
        The backend keeps data in memory, so restarting it resets everything.
      </p>
      <ul className="mt-2 space-y-1">
        {DEMO_ACCOUNTS.map(([username, role]) => (
          <li key={username}>
            <code className="font-semibold">{username}</code> - {role}
          </li>
        ))}
      </ul>
    </details>
  )
}
