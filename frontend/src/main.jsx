import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthPage from './AuthPage.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import UserAccount from './UserAccount.jsx'

const route = window.location.pathname.replace(/\/+$/, '') || '/'

if (route === '/admin/login') {
  window.history.replaceState(null, '', '/login')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {route === '/admin/login' || route === '/login' ? (
      <AuthPage />
    ) : route === '/register' ? (
      <AuthPage registering />
    ) : route === '/account' ? (
      <UserAccount />
    ) : route === '/admin' ? (
      <AdminDashboard />
    ) : (
      <App />
    )}
  </StrictMode>,
)
