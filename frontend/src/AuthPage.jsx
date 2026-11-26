import { useEffect, useState } from 'react'
import './AdminLogin.css'
import studioLogo from './assets/Midnight M Tattoo Studio Emblem.png'

function AuthPage({ registering = false, admin = false }) {
  const isRegistering = registering && !admin
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme =
      localStorage.getItem('moise-theme') === 'dark' ? 'dark' : 'light'
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setBusy(true)

    const formData = new FormData(event.currentTarget)
    const credentials = {
      email: formData.get('email'),
      password: formData.get('password'),
    }

    if (isRegistering) {
      credentials.confirmPassword = formData.get('confirmPassword')
    }

    try {
      const endpoint = admin
        ? '/api/admin/login'
        : `/api/user/${isRegistering ? 'register' : 'login'}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      const contentType = response.headers.get('content-type') || ''

      if (!contentType.includes('application/json')) {
        throw new Error('The authentication service returned an unexpected response. Check the API deployment.')
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to sign in.')
      }

      window.location.assign(admin ? '/admin' : '/account')
    } catch (requestError) {
      setMessage(requestError.message || 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-shell">
        <a className="admin-login-back" href="/">Back to the studio</a>

        <section className="admin-login-card" aria-labelledby="admin-login-title">
          <a className="admin-login-brand" href="/" aria-label="Moise Tattoo home">
            <img src={studioLogo} alt="" />
            <span>
              <strong>Moise</strong>
              <small>Tattoo studio</small>
            </span>
          </a>

          <p className="admin-login-eyebrow">
            {admin ? 'STUDIO MANAGEMENT' : 'YOUR STUDIO ACCOUNT'}
          </p>
          <h1 id="admin-login-title">
            {admin ? 'Admin sign in' : isRegistering ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="admin-login-intro">
            {admin
              ? 'Sign in to manage consultation requests.'
              : isRegistering
                ? 'Create a customer account for your Moise Tattoo profile.'
                : 'Sign in to your customer account.'}
          </p>
          {isRegistering && (
            <p className="admin-login-access-note">
              Customer accounts cannot access the admin dashboard or booking records.
            </p>
          )}

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="username"
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                placeholder="Enter your password"
                minLength={isRegistering ? 16 : undefined}
                maxLength={72}
                required
              />
            </label>
            {isRegistering && (
              <label>
                Confirm password
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  minLength={16}
                  maxLength={72}
                  required
                />
              </label>
            )}
            <button type="submit" disabled={busy}>
              {busy ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}
            </button>
            {message && <p className="admin-login-message" role="alert">{message}</p>}
          </form>

          {!admin && (
            <a className="admin-login-switch" href={isRegistering ? '/login' : '/register'}>
              {isRegistering ? 'Already have an account? Sign in' : 'Don’t have an account? Register'}
            </a>
          )}
          {admin ? (
            <a className="admin-login-switch" href="/login">Customer sign in</a>
          ) : !isRegistering ? (
            <a className="admin-login-switch" href="/admin/login">Studio administrator? Sign in</a>
          ) : null}
        </section>
      </div>
    </main>
  )
}

export default AuthPage
