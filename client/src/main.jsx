// SHARED FILE - app bootstrap (React Router declarative mode, W8 lecture).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.jsx'
import AuthProvider from './features/f1_accounts/AuthProvider.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* F1: makes the signed-in user available to every page (useContext(AuthContext)) */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
