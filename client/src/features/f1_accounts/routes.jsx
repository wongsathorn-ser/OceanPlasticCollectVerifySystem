// F1 · Accounts & access - routes owned by Wongsathorn Sereephap.
// Each route is { path, element, roles }; App.jsx picks them up automatically,
// so add new pages here instead of editing App.jsx.
import AccountRequestsPage from './pages/AccountRequestsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RequestAccountPage from './pages/RequestAccountPage.jsx'
import RequestSubmittedPage from './pages/RequestSubmittedPage.jsx'
import SignInPage from './pages/SignInPage.jsx'
import UsersPage from './pages/UsersPage.jsx'

// Public pages (no side navigation)
export const publicRoutes = [
  { path: '/signin', element: <SignInPage /> },
  { path: '/register', element: <RequestAccountPage /> },
  { path: '/register/submitted', element: <RequestSubmittedPage /> },
]

// Signed-in pages (inside the side-navigation layout)
export const appRoutes = [
  { path: '/admin/requests', element: <AccountRequestsPage />, roles: ['ADMIN'] },
  { path: '/admin/users', element: <UsersPage />, roles: ['ADMIN'] },
  { path: '/profile', element: <ProfilePage />, roles: ['CREW_MEMBER', 'SPONSOR_MANAGEMENT', 'ADMIN'] },
]
