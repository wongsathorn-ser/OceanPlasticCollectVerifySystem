// SHARED FILE - only composes the routes that each feature exports.
// Add or change your pages in src/features/<your feature>/routes.jsx,
// not here, so five people are not editing the same file.
import { Route, Routes } from 'react-router'
import { appRoutes as f1AppRoutes, publicRoutes as f1PublicRoutes } from './features/f1_accounts/routes.jsx'
import { appRoutes as f2AppRoutes } from './features/f2_record_collection/routes.jsx'
import { appRoutes as f3AppRoutes } from './features/f3_crew_history/routes.jsx'
import { appRoutes as f4AppRoutes } from './features/f4_verification/routes.jsx'
import { appRoutes as f5AppRoutes } from './features/f5_fleet_boats/routes.jsx'
import AppLayout from './shared/layout/AppLayout.jsx'
import HomeRedirect from './shared/layout/HomeRedirect.jsx'
import RequireRole from './shared/layout/RequireRole.jsx'
import NotFoundPage from './shared/pages/NotFoundPage.jsx'

// Pages shown inside the side-navigation layout (signed-in area).
const signedInRoutes = [...f1AppRoutes, ...f2AppRoutes, ...f3AppRoutes, ...f4AppRoutes, ...f5AppRoutes]

export default function App() {
  return (
    <Routes>
      {/* "/" -> the signed-in user's home (crew /home, sponsor /fleet, admin /admin/requests) or /signin */}
      <Route index element={<HomeRedirect />} />

      {/* Public pages (no side navigation): sign in, request an account */}
      {f1PublicRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {/* Signed-in pages: AppLayout sends guests to /signin; RequireRole checks each route's roles */}
      <Route element={<AppLayout />}>
        {signedInRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={<RequireRole roles={route.roles}>{route.element}</RequireRole>} />
        ))}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
