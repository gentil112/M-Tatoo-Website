import { useEffect, useState } from 'react'
import './App.css'

const navigation = [
  { label: 'Styles', href: '#work' },
  { label: 'The artist', href: '#artist' },
  { label: 'Process', href: '#process' },
]

const styles = [
  { name: 'Fine line' },
  { name: 'Blackwork' },
  { name: 'Botanical' },
  { name: 'Custom work' },
]

const processSteps = [
  { title: 'Consultation' },
  { title: 'Design' },
  { title: 'Session' },
  { title: 'Aftercare' },
]

function DaggerArtwork() {
  return (
    <svg
      className="hero-art"
      viewBox="0 0 400 520"
      role="img"
      aria-label="Fine-line illustration of a dagger, rose, and laurel"
    >
      <circle pathLength="1" className="draw-later" cx="200" cy="260" r="170" />
      <circle
        pathLength="1"
        className="fine draw-last"
        cx="200"
        cy="260"
        r="156"
      />
      <path pathLength="1" d="M200 40 214 120v210l-14 20-14-20V120Z" />
      <path pathLength="1" className="fine draw-later" d="M200 52v283" />
      <path pathLength="1" d="M150 350q50-20 100 0-50 12-100 0Z" />
      <path pathLength="1" d="M200 362v78" />
      <path pathLength="1" className="draw-last" d="M188 440h24l-4 22h-16Z" />
      <path
        pathLength="1"
        className="draw-last"
        d="M200 190c-30-20-40 15-15 25-15 10 0 30 15 17 15 13 30-7 15-17 25-10 15-45-15-25Z"
      />
      <path
        pathLength="1"
        className="fine draw-last"
        d="M200 200c-10 5-8 18 2 18 8-2 6-12-2-12"
      />
      <path
        pathLength="1"
        className="fine draw-last"
        d="M95 330q-35-70 0-140m10 110q-27-38-5-78m200 108q35-70 0-140m-10 110q27-38 5-78"
      />
      <path className="ornament-fill" d="m200 18 5 10-5 10-5-10Zm0 464 5 10-5 10-5-10Z" />
    </svg>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('moise-theme') === 'dark' ? 'dark' : 'light',
  )
  const [requestReady, setRequestReady] = useState(false)
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('moise-theme', theme)
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute('content', theme === 'light' ? '#f3f2ea' : '#0a3522')
  }, [theme])

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setFirstName(formData.get('name').trim().split(/\s+/)[0])
    setRequestReady(true)
  }

  return (
    <>
      <div className="page-wrap" id="top">
        <header className="site-header">
          <a className="brand" href="#top" aria-label="Moise Tattoo home">
            <svg
              className="brand-mark"
              viewBox="0 0 36 36"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M18 2.5 33.5 18 18 33.5 2.5 18 18 2.5Z" />
              <path d="M12 24V12l6 7 6-7v12" />
            </svg>
            <span className="brand-type">
              <span className="brand-name">Moise</span>
              <span className="brand-subtitle">Tattoo studio</span>
            </span>
          </a>

          <button
            className={`menu-toggle${menuOpen ? ' is-open' : ''}`}
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-controls="primary-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>

          <nav
            className={`primary-nav${menuOpen ? ' is-open' : ''}`}
            id="primary-navigation"
            aria-label="Main navigation"
          >
            {navigation.map((item) => (
              <a key={item.href} href={item.href} onClick={closeMenu}>
                {item.label}
              </a>
            ))}
            <a className="mobile-booking" href="#book" onClick={closeMenu}>
              Book a consultation <span aria-hidden="true">↗</span>
            </a>
          </nav>

          <div className="header-actions">
            <a className="booking-link" href="#book">
              Book a consultation <span aria-hidden="true">↗</span>
            </a>
            <button
              className="theme-toggle"
              type="button"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              aria-pressed={theme === 'light'}
              onClick={() =>
                setTheme((currentTheme) =>
                  currentTheme === 'dark' ? 'light' : 'dark',
                )
              }
            >
              <svg
                className="theme-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                {theme === 'dark' ? (
                  <>
                    <circle cx="12" cy="12" r="3.5" />
                    <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                  </>
                ) : (
                  <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
                )}
              </svg>
              <span className="theme-label">
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </span>
            </button>
          </div>
        </header>

        <main>
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow">MOISE TATTOO · MADE PERSONAL</p>
              <h1 id="hero-title">
                Drawn with care.
                <span>Worn for life.</span>
              </h1>
              <p className="hero-description">
                Thoughtful custom tattoos, designed around you.
              </p>
              <a className="button-link" href="#book">
                Start a conversation <span aria-hidden="true">↗</span>
              </a>
            </div>
            <DaggerArtwork />
          </section>
        </main>
      </div>

      <section className="content-section" id="work">
        <div className="wrap">
          <div className="section-intro">
            <h2>Made personal.</h2>
            <p>A few styles to start your idea.</p>
          </div>
          <div className="style-gallery">
            {styles.map((style) => (
              <article className="style-card" key={style.name}>
                <div className="style-photo" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <h3>{style.name}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="artist-section" id="artist">
        <div className="wrap artist-layout">
          <div className="artist-monogram" aria-hidden="true">M</div>
          <div>
            <p className="eyebrow">THE ARTIST</p>
            <h2>One of a kind.</h2>
          </div>
          <p className="artist-copy">
            Custom tattoos by Moise, made with care and intention.
          </p>
        </div>
      </section>

      <section className="content-section process-section" id="process">
        <div className="wrap">
          <h2>Simple from start to finish.</h2>
          <ol className="process-list">
            {processSteps.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="booking-section" id="book">
        <div className="wrap booking-grid">
          <div className="booking-copy">
            <p className="eyebrow">YOUR NEXT CHAPTER</p>
            <h2>Let’s talk.</h2>
            <p>Tell us your idea and placement.</p>
          </div>

          {requestReady ? (
            <div className="form-success" role="status">
              <h3>Thank you, {firstName}.</h3>
              <p>
                Your details are ready. This form is a design preview and
                doesn’t send messages yet.
              </p>
              <button
                className="text-button"
                type="button"
                onClick={() => setRequestReady(false)}
              >
                Back to the form
              </button>
            </div>
          ) : (
            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>
                  Your name
                  <input name="name" autoComplete="name" required />
                </label>
                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Style
                  <select name="style" defaultValue="">
                    <option value="" disabled>Select a style</option>
                    <option>Fine line</option>
                    <option>Blackwork</option>
                    <option>Botanical</option>
                    <option>Custom work</option>
                    <option>Not sure yet</option>
                  </select>
                </label>
                <label>
                  Placement
                  <input name="placement" placeholder="e.g. forearm" />
                </label>
              </div>
              <label>
                Tell us about your idea
                <textarea
                  name="idea"
                  placeholder="The idea, size, references, or anything else you’d like us to know…"
                  required
                />
              </label>
              <button className="button-link form-submit" type="submit">
                Request a consultation <span aria-hidden="true">↗</span>
              </button>
              <p className="form-disclaimer">
                This preview form does not send or store your details.
              </p>
            </form>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <a className="footer-brand" href="#top">Moise Tattoo</a>
          <span>Custom tattoos, made personal.</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </>
  )
}

export default App
