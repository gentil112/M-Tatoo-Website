import { useEffect, useState } from 'react'
import './App.css'
import portraitOne from './assets/seyi-ariyo-ShX35xx2FhA-unsplash.jpg'
import portraitTwo from './assets/seyi-ariyo-mRnpCiQfWPY-unsplash.jpg'
import portraitThree from './assets/seyi-ariyo-ovo6J5KJbg0-unsplash.jpg'
import fineLineImage from './assets/download (3).jpg'
import blackworkImage from './assets/download (2).jpg'
import botanicalImage from './assets/Floral Tattoo.jpg'
import customWorkImage from './assets/seyi-ariyo-ovo6J5KJbg0-unsplash.jpg'
import studioLogo from './assets/Midnight M Tattoo Studio Emblem.png'

const heroSlides = [
  {
    src: portraitOne,
    alt: 'Tattooed man photographed in profile',
  },
  {
    src: portraitTwo,
    alt: 'Tattooed man extending his arm',
  },
  {
    src: portraitThree,
    alt: 'Tattooed man in a three-quarter profile',
  },
]

const navigation = [
  { label: 'Styles', href: '#work' },
  { label: 'The artist', href: '#artist' },
  { label: 'Process', href: '#process' },
]

const styles = [
  { name: 'Fine line', image: fineLineImage },
  { name: 'Blackwork', image: blackworkImage },
  { name: 'Botanical', image: botanicalImage },
  { name: 'Custom work', image: customWorkImage },
]

const processSteps = [
  { title: 'Consultation' },
  { title: 'Design' },
  { title: 'Session' },
  { title: 'Aftercare' },
]

function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  function showPrevious() {
    setActiveSlide((current) =>
      current === 0 ? heroSlides.length - 1 : current - 1,
    )
  }

  function showNext() {
    setActiveSlide((current) => (current + 1) % heroSlides.length)
  }

  return (
    <div className="hero-slider" aria-label="Featured tattoo artwork">
      <div className="hero-slides">
        {heroSlides.map((slide, index) => (
          <figure
            className={`hero-slide${index === activeSlide ? ' is-active' : ''}`}
            key={slide.src}
            aria-hidden={index !== activeSlide}
          >
            <img src={slide.src} alt={slide.alt} />
          </figure>
        ))}
      </div>

      <div className="slider-controls">
        <button
          className="slider-arrow"
          type="button"
          aria-label="Previous image"
          onClick={showPrevious}
        >
          ←
        </button>
        <div className="slider-dots" role="group" aria-label="Choose slide">
          {heroSlides.map((slide, index) => (
            <button
              className={index === activeSlide ? 'is-active' : ''}
              type="button"
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeSlide ? 'true' : undefined}
              key={slide.src}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
        <button
          className="slider-arrow"
          type="button"
          aria-label="Next image"
          onClick={showNext}
        >
          →
        </button>
      </div>
    </div>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('moise-theme') === 'dark' ? 'dark' : 'light',
  )
  const [requestReady, setRequestReady] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

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

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')

    try {
      const formData = new FormData(event.currentTarget)
      const booking = Object.fromEntries(formData.entries())
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to send your request.')
      }

      setFirstName(booking.name.trim().split(/\s+/)[0])
      setRequestReady(true)
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to send your request. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-wrap" id="top">
        <header className="site-header">
          <a className="brand" href="#top" aria-label="Moise Tattoo home">
            <img
              className="brand-mark"
              src={studioLogo}
              alt=""
              aria-hidden="true"
            />
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
            <HeroSlider />
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
                <div className="style-photo">
                  <img src={style.image} alt={`${style.name} tattoo style example`} />
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
                Your consultation request has been received. We’ll be in touch
                using the email address you provided.
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
              <button
                className="button-link form-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Sending request…' : 'Request a consultation'}
                {!submitting && <span aria-hidden="true">↗</span>}
              </button>
              {submitError && (
                <p className="form-error" role="alert">{submitError}</p>
              )}
              <p className="form-disclaimer">
                Your details are sent to the studio for follow-up.
              </p>
            </form>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <a className="footer-brand" href="#top">Moise Tattoo</a>
          <span>Custom tattoos, made personal.</span>
          <a className="admin-footer-link" href="/login">Admin</a>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </>
  )
}

export default App
