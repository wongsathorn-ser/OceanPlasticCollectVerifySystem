// F5 · Fleet & boats - routes owned by Natthachaimongkol Chayopathum.
// Each route is { path, element, roles }; App.jsx picks them up automatically,
// so add new pages here instead of editing App.jsx.
import AddBoatPage from './pages/AddBoatPage.jsx'
import BoatPerformancePage from './pages/BoatPerformancePage.jsx'
import BoatsPage from './pages/BoatsPage.jsx'
import FleetOverviewPage from './pages/FleetOverviewPage.jsx'

// Signed-in pages (inside the side-navigation layout)
export const appRoutes = [
  { path: '/fleet', element: <FleetOverviewPage />, roles: ['SPONSOR_MANAGEMENT'] },
  { path: '/fleet/boats/:boatId', element: <BoatPerformancePage />, roles: ['SPONSOR_MANAGEMENT'] },
  { path: '/admin/boats', element: <BoatsPage />, roles: ['ADMIN'] },
  { path: '/admin/boats/new', element: <AddBoatPage />, roles: ['ADMIN'] },
]
