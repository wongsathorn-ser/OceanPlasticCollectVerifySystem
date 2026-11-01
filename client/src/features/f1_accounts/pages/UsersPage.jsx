// F1 · Accounts & access - owner: Wongsathorn Sereephap
// Figma: Users (Admin) | Spec: FR-1.7, BR-7
import { useContext, useEffect, useState } from 'react'
import { ROLE_LABELS } from '../../../shared/layout/navConfig.js'
import { listUsers } from '../api.js'
import { AuthContext } from '../authContext.js'
import AccountStatusBadge from '../components/AccountStatusBadge.jsx'
import Alert from '../components/Alert.jsx'
import Avatar from '../components/Avatar.jsx'
import Button from '../components/Button.jsx'
import { ChevronRightIcon, LockIcon, SearchIcon } from '../components/icons.jsx'
import InfoBanner from '../components/InfoBanner.jsx'
import PageHeader from '../components/PageHeader.jsx'
import UserDetailsDialog from '../components/UserDetailsDialog.jsx'

// Same columns for the header row and every user row (tablet and desktop)
const COLUMNS = 'md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.7fr)_minmax(0,1fr)_1rem] md:gap-4'

export default function UsersPage() {
  const { user: currentUser } = useContext(AuthContext)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null) // keep only the id (one source of truth)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let ignore = false

    async function loadUsers() {
      setLoading(true)
      setError('')
      try {
        const data = await listUsers()
        if (!ignore) setUsers(data)
      } catch (err) {
        if (!ignore) setError(err.detail || 'Could not load the accounts.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadUsers()
    return () => {
      ignore = true
    }
  }, [reloadCount])

  // Derived values - computed on each render instead of stored in state
  const query = search.trim().toLowerCase()
  const visibleUsers = query
    ? users.filter((u) => [u.name, u.username, u.email].some((value) => value.toLowerCase().includes(query)))
    : users
  const selectedUser = users.find((u) => u.id === selectedId)

  function handleUpdated(updatedUser) {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
  }

  return (
    <>
      <PageHeader title="Users" subtitle={loading ? 'Loading…' : `${users.length} accounts`}>
        <div className="relative w-full sm:w-64">
          <label htmlFor="user-search" className="sr-only">
            Search users
          </label>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8ca1a8]" />
          <input
            id="user-search"
            type="search"
            placeholder="Search users"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#dbe5e8] bg-white pl-9 pr-3 text-sm text-[#0c1d23] placeholder:text-[#9fb2b8] focus:outline-2 focus:outline-[#0c6e80]"
          />
        </div>
      </PageHeader>

      <div className="space-y-4">
        {error && (
          <Alert>
            <span>{error} </span>
            <Button variant="secondary" className="mt-2 h-10" onClick={() => setReloadCount(reloadCount + 1)}>
              Try again
            </Button>
          </Alert>
        )}

        <div className="overflow-hidden rounded-xl border border-[#dbe5e8] bg-white shadow-sm">
          <div className={`hidden bg-[#edf2f4] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#7d949c] ${COLUMNS}`}>
            <span>Name</span>
            <span>Role</span>
            <span>Email</span>
            <span>Status</span>
            <span />
          </div>

          {loading && <p className="px-4 py-6 text-sm text-[#7d949c]">Loading accounts…</p>}

          {!loading && visibleUsers.length === 0 && (
            <p className="px-4 py-6 text-sm text-[#7d949c]">
              {query ? `No accounts match "${search.trim()}".` : 'No accounts yet.'}
            </p>
          )}

          {!loading && visibleUsers.length > 0 && (
            <ul>
              {visibleUsers.map((u) => (
                <li key={u.id} className="border-t border-[#edf2f4] first:border-t-0 md:first:border-t">
                  <button
                    type="button"
                    onClick={() => setSelectedId(u.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f4f7f9] focus-visible:outline-2 focus-visible:outline-[#0c6e80] ${COLUMNS} md:items-center`}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#0c1d23]">{u.name}</span>
                        <span className="block truncate text-xs text-[#7d949c] md:hidden">
                          {ROLE_LABELS[u.role]} · {u.email}
                        </span>
                      </span>
                    </span>
                    <span className="hidden truncate text-sm text-[#46616b] md:block">{ROLE_LABELS[u.role]}</span>
                    <span className="hidden truncate text-sm text-[#46616b] md:block">{u.email}</span>
                    <span className="shrink-0">
                      <AccountStatusBadge status={u.status} />
                    </span>
                    <ChevronRightIcon className="size-4 shrink-0 text-[#8ca1a8]" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <InfoBanner icon={LockIcon}>
          Suspending an account stops the person signing in. Their existing records stay exactly as they are; nothing is
          deleted.
        </InfoBanner>
      </div>

      {selectedUser && (
        <UserDetailsDialog
          user={selectedUser}
          isSelf={currentUser?.id === selectedUser.id}
          onClose={() => setSelectedId(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  )
}
