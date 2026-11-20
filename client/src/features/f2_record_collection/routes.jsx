// F2 · Record a collection - routes owned by Masaaki Kato.
// Each route is { path, element, roles }; App.jsx picks them up automatically,
// so add new pages here instead of editing App.jsx.
import ChooseBoatPage from './pages/ChooseBoatPage.jsx'
import CollectionSavedPage from './pages/CollectionSavedPage.jsx'
import NewCollectionPage from './pages/NewCollectionPage.jsx'
import SendPage from './pages/SendPage.jsx'
import F2Access from './components/F2Access.jsx'
import { startF2Sync } from './offline/bootstrap.js'

startF2Sync()

// Signed-in pages (inside the side-navigation layout)
export const appRoutes = [
  { path: '/record', element: <F2Access><ChooseBoatPage /></F2Access>, roles: ['CREW_MEMBER'] },
  { path: '/record/details', element: <F2Access><NewCollectionPage /></F2Access>, roles: ['CREW_MEMBER'] },
  { path: '/record/saved', element: <F2Access><CollectionSavedPage /></F2Access>, roles: ['CREW_MEMBER'] },
  { path: '/send', element: <F2Access><SendPage /></F2Access>, roles: ['CREW_MEMBER'] },
]
