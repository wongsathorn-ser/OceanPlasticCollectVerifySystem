// Used by the development verification runner; not imported by the web app.
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthContext } from '../../f1_accounts/authContext.js'
import AppLayout from '../../../shared/layout/AppLayout.jsx'
import RequireRole from '../../../shared/layout/RequireRole.jsx'

export function renderCase(auth, path, roles = ['CREW_MEMBER']) {
  return renderToString(
    <AuthContext value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route element={<AppLayout />}><Route path="*" element={<RequireRole roles={roles}><div>CREW_LOCAL_PAGE</div></RequireRole>} /></Route></Routes>
      </MemoryRouter>
    </AuthContext>,
  )
}
