// F1 · Accounts & access - TEMPORARY hint shown on the sign-in page while the
// screens run on mock data (api.js USING_MOCK_DATA). Remove with mockAccounts.js.
const DEMO_ACCOUNTS = [
  ['mreyes', 'Crew member'],
  ['smendes', 'Sponsor / Management'],
  ['aosei', 'Administrator'],
  ['tiversen', 'Suspended crew member'],
]

export default function MockAccountsHint() {
  return (
    <details className="mt-6 rounded-xl border border-dashed border-[#c8d4d9] bg-white/60 px-4 py-3 text-xs text-[#46616b]">
      <summary className="cursor-pointer font-semibold">Prototype: demo accounts (no backend yet)</summary>
      <p className="mt-2">
        Password for every demo account: <code className="font-semibold">password123</code>. New accounts you create
        appear on the admin Requests screen until the page is reloaded.
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
