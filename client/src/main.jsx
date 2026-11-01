// SHARED FILE - app bootstrap (React Router declarative mode, W8 lecture).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* TODO(F1): wrap <App /> with the AuthProvider from features/f1_accounts */}
      <App />
    </BrowserRouter>
  </StrictMode>,
)
