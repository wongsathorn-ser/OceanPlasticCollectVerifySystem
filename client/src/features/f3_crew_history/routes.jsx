// F3 · Crew home & history - routes owned by Kaung Khant Paing.
// Each route is { path, element, roles }; App.jsx picks them up automatically.
import RequireRole from './components/RequireRole.jsx'
import CollectionRecordPage from './pages/CollectionRecordPage.jsx'
import CrewHomePage from './pages/CrewHomePage.jsx'
import CrewMemberPage from './pages/CrewMemberPage.jsx'
import CrewOverviewPage from './pages/CrewOverviewPage.jsx'
import MyHistoryPage from './pages/MyHistoryPage.jsx'

// Signed-in pages with client-side role enforcement (Item 5)
export const appRoutes = [
  {
    path: '/home',
    element: (
      <RequireRole allowedRoles={['CREW_MEMBER']}>
        <CrewHomePage />
      </RequireRole>
    ),
    roles: ['CREW_MEMBER'],
  },
  {
    path: '/history',
    element: (
      <RequireRole allowedRoles={['CREW_MEMBER']}>
        <MyHistoryPage />
      </RequireRole>
    ),
    roles: ['CREW_MEMBER'],
  },
  {
    path: '/records/:recordId',
    element: (
      <RequireRole allowedRoles={['CREW_MEMBER', 'SPONSOR_MANAGEMENT']}>
        <CollectionRecordPage />
      </RequireRole>
    ),
    roles: ['CREW_MEMBER', 'SPONSOR_MANAGEMENT'],
  },
  {
    path: '/crew',
    element: (
      <RequireRole allowedRoles={['SPONSOR_MANAGEMENT']}>
        <CrewOverviewPage />
      </RequireRole>
    ),
    roles: ['SPONSOR_MANAGEMENT'],
  },
  {
    path: '/crew/:crewId',
    element: (
      <RequireRole allowedRoles={['SPONSOR_MANAGEMENT']}>
        <CrewMemberPage />
      </RequireRole>
    ),
    roles: ['SPONSOR_MANAGEMENT'],
  },
]
