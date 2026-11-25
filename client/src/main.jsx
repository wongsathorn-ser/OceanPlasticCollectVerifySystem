// SHARED FILE - app bootstrap (React Router declarative mode, W8 lecture).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.jsx'
import AuthProvider from './features/f1_accounts/AuthProvider.jsx'
import LanguageProvider from './shared/i18n/LanguageProvider.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* F1: makes the signed-in user available to every page (useContext(AuthContext)) */}
      <AuthProvider>
        {/* CHG-001: chosen language (English / Thai / Burmese) for the crew-facing screens */}
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
