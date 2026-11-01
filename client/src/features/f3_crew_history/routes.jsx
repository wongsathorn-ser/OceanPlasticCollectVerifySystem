// F3 · Crew home & history - routes owned by Kaung Khant Paing.
// Each route is { path, element, roles }; App.jsx picks them up automatically,
// so add new pages here instead of editing App.jsx.
import CollectionRecordPage from './pages/CollectionRecordPage.jsx'
import CrewHomePage from './pages/CrewHomePage.jsx'
import CrewMemberPage from './pages/CrewMemberPage.jsx'
import CrewOverviewPage from './pages/CrewOverviewPage.jsx'
import MyHistoryPage from './pages/MyHistoryPage.jsx'

// Signed-in pages (inside the side-navigation layout)
export const appRoutes = [
  { path: '/home', element: <CrewHomePage />, roles: ['CREW_MEMBER'] },
  { path: '/history', element: <MyHistoryPage />, roles: ['CREW_MEMBER'] },
  { path: '/records/:recordId', element: <CollectionRecordPage />, roles: ['CREW_MEMBER', 'SPONSOR_MANAGEMENT'] },
  { path: '/crew', element: <CrewOverviewPage />, roles: ['SPONSOR_MANAGEMENT'] },
  { path: '/crew/:crewId', element: <CrewMemberPage />, roles: ['SPONSOR_MANAGEMENT'] },
]
