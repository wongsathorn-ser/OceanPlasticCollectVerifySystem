// F2 · Record a collection - routes owned by Masaaki Kato.
// Each route is { path, element, roles }; App.jsx picks them up automatically,
// so add new pages here instead of editing App.jsx.
import ChooseBoatPage from './pages/ChooseBoatPage.jsx'
import CollectionSavedPage from './pages/CollectionSavedPage.jsx'
import NewCollectionPage from './pages/NewCollectionPage.jsx'
import SendPage from './pages/SendPage.jsx'

// Signed-in pages (inside the side-navigation layout)
export const appRoutes = [
  { path: '/record', element: <ChooseBoatPage />, roles: ['CREW_MEMBER'] },
  { path: '/record/details', element: <NewCollectionPage />, roles: ['CREW_MEMBER'] },
  { path: '/record/saved', element: <CollectionSavedPage />, roles: ['CREW_MEMBER'] },
  { path: '/send', element: <SendPage />, roles: ['CREW_MEMBER'] },
]
