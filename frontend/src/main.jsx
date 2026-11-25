import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminDashboard from './AdminDashboard.jsx'

const route = window.location.pathname.replace(/\/+$/, '') || '/'
const isAdminRoute = route === '/admin' || route === '/login'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdminRoute ? (
      <AdminDashboard mode={route === '/login' ? 'login' : 'dashboard'} />
    ) : (
      <App />
    )}
  </StrictMode>,
)
