import { useDeferredValue, useEffect, useState } from 'react'
import './AdminDashboard.css'

const bookingStatuses = ['new', 'contacted', 'confirmed', 'cancelled']
const emptySummary = {
  total: 0,
  new: 0,
  contacted: 0,
  confirmed: 0,
  cancelled: 0,
}

async function getResponseData(response) {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    throw new Error('The booking API returned a non-JSON response. Restart the backend and refresh this page.')
  }

  const result = await response.json()

  if (!response.ok) {
    const error = new Error(result.message || 'The request could not be completed.')
    error.status = response.status
    throw error
  }

  return result
}

function AdminDashboard({ mode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(mode === 'dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registering, setRegistering] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [bookings, setBookings] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [summary, setSummary] = useState(emptySummary)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [loginBusy, setLoginBusy] = useState(false)
  const [updatingId, setUpdatingId] = useState('')
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const deferredSearchText = useDeferredValue(searchText)

  useEffect(() => {
    document.documentElement.dataset.theme =
      localStorage.getItem('moise-theme') === 'dark' ? 'dark' : 'light'
  }, [])

  useEffect(() => {
    if (mode === 'login') return undefined

    let active = true

    fetch('/api/admin/session')
      .then(async (response) => {
        if (response.status === 401) {
          if (active) window.location.replace('/login')
          return
        }
        const result = await getResponseData(response)
        if (active) {
          setEmail(result.email)
          setAuthenticated(true)
          if (mode === 'login') window.location.replace('/admin')
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to reach the booking API.')
        }
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })

    return () => {
      active = false
    }
  }, [mode])

  useEffect(() => {
    if (!authenticated) return undefined

    let active = true

    const query = new URLSearchParams({
      status: filter,
      q: deferredSearchText,
      page: String(page),
    })

    fetch(`/api/admin/bookings?${query}`)
      .then((response) => {
        if (response.status === 401) {
          if (active) window.location.replace('/login')
          return null
        }

        return getResponseData(response)
      })
      .then((result) => {
        if (active && result) {
          setBookings(result.bookings)
          setTotal(result.total)
          setPages(result.pages)
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load bookings.')
      })
      .finally(() => {
        if (active) setLoadingBookings(false)
      })

    return () => {
      active = false
    }
  }, [authenticated, deferredSearchText, filter, page, refreshKey])

  useEffect(() => {
    if (!authenticated) return undefined

    let active = true

    fetch('/api/admin/summary')
      .then((response) => {
        if (response.status === 401) {
          if (active) window.location.replace('/login')
          return null
        }

        return getResponseData(response)
      })
      .then((result) => {
        if (active && result) setSummary(result)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load studio metrics.')
      })
      .finally(() => {
        if (active) setSummaryLoading(false)
      })

    return () => {
      active = false
    }
  }, [authenticated, refreshKey])

  async function handleLogin(event) {
    event.preventDefault()
    setLoginBusy(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await getResponseData(response)
      setEmail(result.email)
      window.location.assign('/admin')
    } catch (requestError) {
      setError(requestError.message || 'Unable to log in.')
    } finally {
      setLoginBusy(false)
    }
  }

  async function handleRegister(event) {
    event.preventDefault()
    setLoginBusy(true)
    setError('')

    try {
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword }),
      })
      await getResponseData(response)
      window.location.assign('/admin')
    } catch (requestError) {
      if (requestError.status === 409) {
        setRegistering(false)
        setPassword('')
        setConfirmPassword('')
      }
      setError(requestError.message || 'Unable to register the admin account.')
    } finally {
      setLoginBusy(false)
    }
  }

  async function handleLogout() {
    setError('')

    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Unable to log out. Please try again.')
      window.location.replace('/login')
    } catch (requestError) {
      setError(requestError.message || 'Unable to log out.')
    }
  }

  async function updateBookingStatus(id, status) {
    setUpdatingId(id)
    setError('')

    try {
      const response = await fetch(`/api/admin/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await getResponseData(response)
      setLoadingBookings(true)
      setSummaryLoading(true)
      setRefreshKey((current) => current + 1)
    } catch (requestError) {
      if (requestError.message === 'Authentication required.') {
        window.location.replace('/login')
        return
      }
      setError(requestError.message || 'Unable to update this booking.')
    } finally {
      setUpdatingId('')
    }
  }

  function refreshDashboard() {
    setLoadingBookings(true)
    setSummaryLoading(true)
    setRefreshKey((current) => current + 1)
  }

  function applyStatusFilter(nextFilter) {
    if (nextFilter === filter && page === 1) return

    setLoadingBookings(true)
    setPage(1)
    setFilter(nextFilter)
  }

  function exportCurrentPage() {
    if (!bookings.length) return

    const columns = ['Name', 'Email', 'Style', 'Placement', 'Idea', 'Status', 'Submitted']
    const rows = bookings.map((booking) => [
      booking.name,
      booking.email,
      booking.style,
      booking.placement,
      booking.idea,
      booking.status,
      booking.createdAt,
    ])
    const csvCell = (value) => {
      const text = String(value ?? '')
      const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text
      return `"${safeText.replace(/"/g, '""')}"`
    }
    const csv = [columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
    const file = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `moise-bookings-page-${page}.csv`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <main className="admin-page">
      <div className="admin-shell">
        {!(authenticated && mode === 'dashboard') && (
          <header className="admin-header">
            <a className="admin-brand" href="/">Moise <span>Tattoo studio</span></a>
            <a className="admin-home-link" href="/">Return to website ↗</a>
          </header>
        )}

        {checkingSession ? (
          <p className="admin-loading" role="status">Checking your session…</p>
        ) : mode === 'login' && !authenticated ? (
          <section className="admin-login-card" aria-labelledby="admin-title">
            <p className="eyebrow">PRIVATE STUDIO ACCESS</p>
            <h1 id="admin-title">{registering ? 'Register admin' : 'Admin login'}</h1>
            <p className="admin-intro">
              {registering
                ? 'Create the studio’s first admin account. Registration closes after this account is created.'
                : 'Sign in to manage consultation requests.'}
            </p>
            {error && <p className="admin-error" role="alert">{error}</p>}
            <form
              className="admin-login-form"
              onSubmit={registering ? handleRegister : handleLogin}
            >
              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={registering ? 16 : undefined}
                  maxLength={72}
                />
              </label>
              {registering && (
                <label>
                  Confirm password
                  <input
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    minLength={16}
                    maxLength={72}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </label>
              )}
              <button className="button-link admin-submit" type="submit" disabled={loginBusy}>
                {loginBusy
                  ? registering ? 'Registering…' : 'Signing in…'
                  : registering ? 'Register admin' : 'Sign in'}
              </button>
            </form>
            <button
              className="admin-auth-switch"
              type="button"
              onClick={() => {
                setRegistering((current) => !current)
                setPassword('')
                setConfirmPassword('')
                setError('')
              }}
            >
              {registering ? 'Back to sign in' : 'Register admin'}
            </button>
          </section>
        ) : !authenticated ? (
          <section className="admin-login-card" aria-labelledby="admin-title">
            <p className="eyebrow">PRIVATE STUDIO ACCESS</p>
            <h1 id="admin-title">Session unavailable</h1>
            <p className="admin-intro">
              {error || 'Sign in to access the dashboard.'}
            </p>
            <a className="button-link" href="/login">Go to login</a>
          </section>
        ) : (
          <section className="admin-dashboard" aria-labelledby="admin-title">
            <aside className="admin-sidebar">
              <a className="admin-brand" href="/">
                Moise <span>Tattoo studio</span>
              </a>
              <div className="admin-sidebar-section">
                <p>Workspace</p>
                <a className="admin-nav-link is-active" href="#overview">
                  Overview
                </a>
                <a className="admin-nav-link" href="#requests">
                  Consultations <span>{summaryLoading ? '—' : summary.new}</span>
                </a>
              </div>
              <div className="admin-sidebar-footer">
                <div className="admin-avatar" aria-hidden="true">
                  {email.slice(0, 1).toUpperCase()}
                </div>
                <div className="admin-identity">
                  <span>Signed in as</span>
                  <strong>{email}</strong>
                </div>
                <button className="admin-logout" type="button" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </aside>

            <div className="admin-main">
              <div className="admin-topbar">
                <span>STUDIO MANAGEMENT</span>
                <div className="admin-topbar-actions">
                  <a href="/" className="admin-secondary-button">View website</a>
                  <button
                    className="admin-secondary-button"
                    type="button"
                    onClick={refreshDashboard}
                  >
                    Refresh
                  </button>
                  <button
                    className="admin-primary-button"
                    type="button"
                    onClick={exportCurrentPage}
                    disabled={bookings.length === 0 || loadingBookings}
                  >
                    Export current page
                  </button>
                </div>
              </div>

              <div className="admin-workspace" id="overview">
                <div className="admin-dashboard-heading">
                  <div>
                    <p className="eyebrow">A PRIVATE STUDIO OVERVIEW</p>
                    <h1 id="admin-title">Admin dashboard</h1>
                    <p className="admin-intro">
                      Keep every consultation moving, from first hello to confirmed session.
                    </p>
                  </div>
                  <p className="admin-today">A considered view of your studio</p>
                </div>

                <div className="admin-metrics" aria-label="Booking overview">
                  {[
                    { label: 'All requests', value: 'total', filter: 'all' },
                    { label: 'New enquiries', value: 'new', filter: 'new' },
                    { label: 'In conversation', value: 'contacted', filter: 'contacted' },
                    { label: 'Confirmed', value: 'confirmed', filter: 'confirmed' },
                  ].map((metric) => (
                    <button
                      className={`admin-metric-card${filter === metric.filter ? ' is-selected' : ''}`}
                      key={metric.value}
                      type="button"
                      aria-pressed={filter === metric.filter}
                      onClick={() => applyStatusFilter(metric.filter)}
                    >
                      <span>{metric.label}</span>
                      <strong>{summaryLoading ? '—' : summary[metric.value]}</strong>
                      <small>{metric.filter === 'all' ? 'Across all time' : 'View these requests'}</small>
                    </button>
                  ))}
                </div>

                <section className="admin-request-panel" id="requests" aria-labelledby="requests-title">
                  <div className="admin-panel-heading">
                    <div>
                      <p className="eyebrow">CLIENT INBOX</p>
                      <h2 id="requests-title">Consultation requests</h2>
                      <p>
                        {total} {total === 1 ? 'request' : 'requests'}
                        {searchText && ` matching “${searchText}”`}
                      </p>
                    </div>
                    <span className="admin-live-mark"><i /> Live records</span>
                  </div>

                  <div className="admin-list-toolbar">
                    <label className="admin-search">
                      <span className="sr-only">Search bookings</span>
                      <input
                        type="search"
                        value={searchText}
                        placeholder="Search name, email or idea"
                        onChange={(event) => {
                          setLoadingBookings(true)
                          setPage(1)
                          setSearchText(event.target.value)
                        }}
                      />
                    </label>
                    <label className="admin-filter">
                      <span className="sr-only">Filter by status</span>
                      <select
                        value={filter}
                        onChange={(event) => applyStatusFilter(event.target.value)}
                      >
                        <option value="all">All statuses</option>
                        {bookingStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status[0].toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {error && <p className="admin-error" role="alert">{error}</p>}
                  {loadingBookings ? (
                    <p className="admin-loading" role="status">Loading requests…</p>
                  ) : bookings.length === 0 ? (
                    <div className="admin-empty">
                      <h3>No matching requests</h3>
                      <p>Try a different search or status filter.</p>
                    </div>
                  ) : (
                    <div className="admin-booking-list">
                      {bookings.map((booking) => (
                        <article className="admin-booking-card" key={booking._id}>
                          <div className="admin-booking-heading">
                            <div>
                              <p className="admin-booking-kicker">TATTOO CONSULTATION</p>
                              <h3>{booking.name}</h3>
                              <a href={`mailto:${booking.email}`}>{booking.email}</a>
                            </div>
                            <time dateTime={booking.createdAt}>
                              {new Date(booking.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </time>
                          </div>
                          <p className="admin-booking-idea">{booking.idea}</p>
                          <div className="admin-booking-footer">
                            <div className="admin-booking-details">
                              <span>{booking.style}</span>
                              {booking.placement && <span>{booking.placement}</span>}
                            </div>
                            <label className="admin-status-control">
                              <span>Status</span>
                              <select
                                aria-label={`Change status for ${booking.name}`}
                                className={`status-${booking.status}`}
                                value={booking.status}
                                disabled={updatingId === booking._id}
                                onChange={(event) =>
                                  updateBookingStatus(booking._id, event.target.value)
                                }
                              >
                                {bookingStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status[0].toUpperCase() + status.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  <div className="admin-pagination">
                    <span>{pages ? `Page ${page} of ${pages}` : 'No pages'}</span>
                    <div>
                      <button
                        className="admin-secondary-button"
                        type="button"
                        disabled={page <= 1 || loadingBookings}
                        onClick={() => {
                          setLoadingBookings(true)
                          setPage((current) => current - 1)
                        }}
                      >
                        Previous
                      </button>
                      <button
                        className="admin-secondary-button"
                        type="button"
                        disabled={!pages || page >= pages || loadingBookings}
                        onClick={() => {
                          setLoadingBookings(true)
                          setPage((current) => current + 1)
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default AdminDashboard
