import { useEffect, useState } from 'react'
import './AdminLogin.css'
import studioLogo from './assets/Midnight M Tattoo Studio Emblem.png'

async function getResponseData(response) {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    throw new Error('The account service returned an unexpected response.')
  }

  const result = await response.json()

  if (!response.ok) {
    const error = new Error(result.message || 'The request could not be completed.')
    error.status = response.status
    throw error
  }

  return result
}

function UserAccount() {
  const [email, setEmail] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    document.documentElement.dataset.theme =
      localStorage.getItem('moise-theme') === 'dark' ? 'dark' : 'light'
  }, [])

  useEffect(() => {
    let active = true

    fetch('/api/user/session')
      .then((response) => {
        if (response.status === 401) {
          window.location.replace('/login')
          return null
        }

        return getResponseData(response)
      })
      .then((result) => {
        if (active && result) setEmail(result.email)
      })
      .catch((requestError) => {
        if (active) setMessage(requestError.message || 'Unable to verify your account.')
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleLogout() {
    setBusy(true)
    setMessage('')

    try {
      const response = await fetch('/api/user/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Unable to sign out. Please try again.')
      window.location.replace('/login')
    } catch (requestError) {
      setMessage(requestError.message || 'Unable to sign out.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-shell">
        <a className="admin-login-back" href="/">Back to the studio</a>

        <section className="admin-login-card" aria-labelledby="user-account-title">
          <a className="admin-login-brand" href="/" aria-label="Moise Tattoo home">
            <img src={studioLogo} alt="" />
            <span>
              <strong>Moise</strong>
              <small>Tattoo studio</small>
            </span>
          </a>

          <p className="admin-login-eyebrow">YOUR STUDIO ACCOUNT</p>
          <h1 id="user-account-title">My account</h1>
          {checkingSession ? (
            <p className="admin-login-intro" role="status">Checking your account…</p>
          ) : email ? (
            <>
              <p className="admin-login-intro">Signed in as {email}</p>
              <p className="admin-login-access-note">
                Customer accounts cannot access the admin dashboard or booking records.
              </p>
              <div className="admin-login-form">
                <button type="button" onClick={handleLogout} disabled={busy}>
                  {busy ? 'Please wait…' : 'Sign out'}
                </button>
              </div>
              <a className="admin-login-switch" href="/">Return to the studio</a>
            </>
          ) : (
            <>
              <p className="admin-login-intro" role="alert">
                {message || 'Unable to verify your account.'}
              </p>
              <a className="admin-login-switch" href="/login">Go to sign in</a>
            </>
          )}
          {message && email && <p className="admin-login-message" role="alert">{message}</p>}
        </section>
      </div>
    </main>
  )
}

export default UserAccount
