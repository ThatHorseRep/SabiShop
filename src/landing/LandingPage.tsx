import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import {
  ArrowCounterClockwise,
  CheckCircle,
  Plus,
  Storefront,
  Users,
  WifiHigh,
  WifiSlash,
  type Icon,
} from '@phosphor-icons/react'
import {
  landingContent,
  type Feature,
  type LandingCopy,
  type LandingLanguage,
} from './landingContent'

/*
 * Public landing page (C05). One audience (small retail business owners),
 * one primary conversion objective (Get Started), one primary CTA repeated
 * identically at the top and bottom. Product truth outranks the external
 * landing-page methodology: no testimonials, user numbers, revenue claims,
 * performance statistics, customer logos, or other fabricated proof appear
 * anywhere on this page (C05 sections 34-35, 60).
 *
 * The page shares the application's design DNA by consuming the same C03
 * tokens and component classes while staying a separate, more expressive
 * marketing document (C03 section 3.1, C05 sections 43, 54).
 */

const APP_HREF = '/'

interface SimulatorItem {
  id: string
  name: string
  quantity: number
  unitPriceKobo: number
}

const DEFAULT_SIMULATOR_ITEMS: readonly SimulatorItem[] = [
  { id: 'spark-plug', name: 'Spark Plug NGK', quantity: 4, unitPriceKobo: 85000 },
  { id: 'engine-oil', name: 'Engine Oil 4L SAE 40', quantity: 1, unitPriceKobo: 1250000 },
  { id: 'air-filter', name: 'Air Filter Toyota Corolla', quantity: 2, unitPriceKobo: 680000 },
]

const EXTRA_CATALOG_ITEMS: readonly SimulatorItem[] = [
  { id: 'brake-pads', name: 'Brake Pads Front (Corolla)', quantity: 1, unitPriceKobo: 950000 },
  { id: 'oil-filter', name: 'Oil Filter Toyota Genuine', quantity: 1, unitPriceKobo: 320000 },
]

function formatNaira(kobo: number): string {
  const naira = kobo / 100
  return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function SectionIcon({ icon: Icon }: { icon: Icon }) {
  return (
    <span className="landing-tile__icon" aria-hidden="true">
      <Icon size={24} weight="regular" />
    </span>
  )
}

function GetStartedLink({
  className,
  label = 'Get Started',
}: {
  className?: string
  label?: string
}) {
  return (
    <a
      className={`ui-button ui-button--primary ${className ?? ''}`.trim()}
      href={APP_HREF}
    >
      {label}
    </a>
  )
}

/**
 * Floating glass pill navigation with language switcher (EN / Nigerian Pidgin).
 */
function LandingHeader({
  copy,
  language,
  onLanguageChange,
}: {
  copy: LandingCopy
  language: LandingLanguage
  onLanguageChange: (lang: LandingLanguage) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const headerLinks = [
    { href: '#how-it-works', label: copy.nav.howItWorks },
    { href: '#what-it-covers', label: copy.nav.whatItCovers },
    { href: '#faq', label: copy.nav.faq },
  ]

  useEffect(() => {
    if (!menuOpen) return
    const media = window.matchMedia?.('(min-width: 761px)') ?? null
    const onMediaChange = () => {
      if (media?.matches) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    media?.addEventListener('change', onMediaChange)
    document.body.style.overflow = 'hidden'
    const firstLink = menuRef.current?.querySelector<HTMLElement>('a, button')
    firstLink?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      media?.removeEventListener('change', onMediaChange)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const wrapMenuFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !menuRef.current) return
    const focusable = Array.from(
      menuRef.current.querySelectorAll<HTMLElement>('a, button'),
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <header className="landing-header">
      <div className="landing-header__pill">
        <a className="landing-brand" href="#top">
          <span className="landing-brand__mark" aria-hidden="true">
            <Storefront size={22} weight="fill" />
          </span>
          Sabi Shop
        </a>
        <nav className="landing-header__nav" aria-label="Landing">
          {headerLinks.map((link) => (
            <a
              key={link.href}
              className="landing-header__link"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="landing-header__actions">
          <div className="landing-lang-toggle" role="group" aria-label="Language selection">
            <button
              type="button"
              className={`landing-lang-btn ${language === 'en' ? 'is-active' : ''}`}
              aria-pressed={language === 'en'}
              onClick={() => onLanguageChange('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={`landing-lang-btn ${language === 'pcm' ? 'is-active' : ''}`}
              aria-pressed={language === 'pcm'}
              onClick={() => onLanguageChange('pcm')}
            >
              Pidgin
            </button>
          </div>
          <a className="landing-header__sign-in" href={APP_HREF}>
            {copy.nav.signIn}
          </a>
          <GetStartedLink
            label={copy.nav.getStarted}
            className="ui-button--sm landing-header__cta"
          />
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          className="landing-menu-button"
          aria-expanded={menuOpen}
          aria-controls="landing-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="landing-menu-button__bar" aria-hidden="true" />
          <span className="landing-menu-button__bar" aria-hidden="true" />
        </button>
      </div>
      {menuOpen && (
        <div
          id="landing-menu"
          ref={menuRef}
          className="landing-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onKeyDown={wrapMenuFocus}
        >
          <nav className="landing-menu__nav" aria-label="Landing">
            {headerLinks.map((link, index) => (
              <a
                key={link.href}
                className="landing-menu__link"
                href={link.href}
                style={{ '--i': index } as CSSProperties}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="landing-menu__actions">
            <div className="landing-lang-toggle" role="group" aria-label="Language selection mobile">
              <button
                type="button"
                className={`landing-lang-btn ${language === 'en' ? 'is-active' : ''}`}
                aria-pressed={language === 'en'}
                onClick={() => {
                  onLanguageChange('en')
                  setMenuOpen(false)
                }}
              >
                English
              </button>
              <button
                type="button"
                className={`landing-lang-btn ${language === 'pcm' ? 'is-active' : ''}`}
                aria-pressed={language === 'pcm'}
                onClick={() => {
                  onLanguageChange('pcm')
                  setMenuOpen(false)
                }}
              >
                Nigerian Pidgin
              </button>
            </div>
            <a
              className="landing-menu__link"
              href={APP_HREF}
              style={{ '--i': headerLinks.length } as CSSProperties}
            >
              {copy.nav.signIn}
            </a>
            <GetStartedLink label={copy.nav.getStarted} className="landing-menu__cta" />
          </div>
        </div>
      )}
    </header>
  )
}

/**
 * Representative sale workspace built from the application's design language
 * and seed catalogue. It is interactive so visitors can feel the tactile
 * split payments, offline protection, and instant calculations, while remaining
 * labelled as representative with example data (C05 sections 12, 46, 57).
 */
function SaleWorkspaceVisual({ copy }: { copy: LandingCopy }) {
  const [isOffline, setIsOffline] = useState(true)
  const [items, setItems] = useState<SimulatorItem[]>([...DEFAULT_SIMULATOR_ITEMS])
  const [saleCompleted, setSaleCompleted] = useState(false)

  const totalKobo = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceKobo,
    0,
  )

  // Split payment ratio proportional to standard representative total
  const cashKobo = Math.min(2000000, totalKobo)
  const transferKobo = Math.max(0, totalKobo - cashKobo)

  const handleAddItem = (extraItem: SimulatorItem) => {
    setSaleCompleted(false)
    setItems((current) => {
      const existing = current.find((i) => i.id === extraItem.id)
      if (existing) {
        return current.map((i) =>
          i.id === extraItem.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [...current, { ...extraItem }]
    })
  }

  const handleReset = () => {
    setItems([...DEFAULT_SIMULATOR_ITEMS])
    setIsOffline(true)
    setSaleCompleted(false)
  }

  return (
    <figure className="landing-visual" data-reveal>
      <div className="landing-visual__frame">
        <div className="landing-visual__bar">
          <span className="landing-visual__title">{copy.simulator.title}</span>
          <button
            type="button"
            className="landing-sim__network-toggle"
            onClick={() => setIsOffline((prev) => !prev)}
            aria-label={isOffline ? 'Switch to online simulation' : 'Switch to offline simulation'}
            title="Click to simulate offline / online connection"
          >
            {isOffline ? (
              <span className="ui-badge ui-badge--offline">
                <WifiSlash size={12} weight="bold" aria-hidden="true" />
                {copy.simulator.offlineBadge}
              </span>
            ) : (
              <span className="ui-badge ui-badge--success">
                <WifiHigh size={12} weight="bold" aria-hidden="true" />
                {copy.simulator.onlineBadge}
              </span>
            )}
          </button>
        </div>

        <p className="landing-visual__customer">{copy.simulator.customer}</p>

        <table className="landing-visual__items">
          <caption className="visually-hidden">
            Example sale with line items
          </caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Quantity and price</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <th scope="row">{item.name}</th>
                <td className="numeric">
                  {item.quantity} × {formatNaira(item.unitPriceKobo)}
                </td>
                <td className="numeric">
                  {formatNaira(item.quantity * item.unitPriceKobo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Interactive Quick Add Toolbar */}
        <div className="landing-sim__toolbar" aria-label="Sample items to add">
          <span className="landing-sim__toolbar-label">Try adding:</span>
          {EXTRA_CATALOG_ITEMS.map((extra) => (
            <button
              key={extra.id}
              type="button"
              className="landing-sim__quick-btn"
              onClick={() => handleAddItem(extra)}
            >
              <Plus size={12} weight="bold" aria-hidden="true" />
              {extra.name.split(' ')[0]} {formatNaira(extra.unitPriceKobo)}
            </button>
          ))}
          <button
            type="button"
            className="landing-sim__reset-btn"
            onClick={handleReset}
            title={copy.simulator.reset}
            aria-label={copy.simulator.reset}
          >
            <ArrowCounterClockwise size={13} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <div className="landing-visual__payment">
          <span className="ui-badge ui-badge--neutral">
            Cash · {formatNaira(cashKobo)}
          </span>
          {transferKobo > 0 && (
            <span className="ui-badge ui-badge--neutral">
              Transfer · {formatNaira(transferKobo)}
            </span>
          )}
        </div>

        <div className="landing-visual__footer">
          <span className="ui-badge ui-badge--neutral">
            Air Filter Toyota Corolla · 12 in stock
          </span>
          <p className="landing-visual__total">
            <span className="landing-visual__total-label">{copy.simulator.total}</span>
            <span className="numeric">{formatNaira(totalKobo)}</span>
          </p>
        </div>

        {/* Action Completion Simulation */}
        <div className="landing-sim__actions">
          {saleCompleted ? (
            <div className="landing-sim__stamp" role="status">
              <CheckCircle size={16} weight="fill" aria-hidden="true" />
              <span>{copy.simulator.saleCompleted}</span>
            </div>
          ) : (
            <button
              type="button"
              className="ui-button ui-button--secondary landing-sim__complete-btn"
              onClick={() => setSaleCompleted(true)}
            >
              {copy.simulator.completeSale}
            </button>
          )}
        </div>
      </div>
      <figcaption className="landing-visual__caption">
        {copy.simulator.caption}
      </figcaption>
    </figure>
  )
}

function Hero({ copy }: { copy: LandingCopy }) {
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      {/* Wan2GP Ambient Motion Layer */}
      <div className="landing-hero__ambient" aria-hidden="true">
        <div className="landing-hero__ambient-radial" />
      </div>

      <div className="landing-container landing-hero__grid">
        <div className="landing-hero__copy">
          <p className="landing-eyebrow">
            <span className="landing-eyebrow__dot" aria-hidden="true" />
            {copy.hero.eyebrow}
          </p>
          <h1 className="landing-hero__title" id="hero-title">
            {copy.hero.titleLine1}
            <br />
            {copy.hero.titleLine2}
          </h1>
          <p className="landing-hero__sub">{copy.hero.subtitle}</p>
          <div className="landing-hero__actions">
            <GetStartedLink label={copy.hero.ctaPrimary} />
            <a className="ui-button ui-button--secondary" href="#how-it-works">
              {copy.hero.ctaSecondary}
            </a>
          </div>
          <p className="landing-hero__proof">{copy.hero.proof}</p>
        </div>
        <SaleWorkspaceVisual copy={copy} />
      </div>
    </section>
  )
}

function Problem({ copy }: { copy: LandingCopy }) {
  return (
    <section
      className="landing-section landing-section--sunken"
      aria-labelledby="problem-title"
    >
      <div className="landing-container landing-section__head">
        <h2 className="landing-section__title" id="problem-title" data-reveal>
          {copy.problem.title}
        </h2>
        <p className="landing-section__lead" data-reveal>
          {copy.problem.lead}
        </p>
        <ul className="landing-problem__list">
          {copy.problem.lines.map((line) => (
            <li key={line} data-reveal>
              {line}
            </li>
          ))}
        </ul>
        <p className="landing-problem__transition" data-reveal>
          {copy.problem.transition}
        </p>
      </div>
    </section>
  )
}

function FeatureTile({
  feature,
  variant,
}: {
  feature: Feature
  variant?: 'compact' | 'on-brand'
}) {
  const classes = ['landing-tile']
  if (variant === 'compact') classes.push('landing-tile--compact')
  if (variant === 'on-brand') classes.push('landing-tile--on-brand')
  return (
    <article className={classes.join(' ')} data-reveal>
      <div className="landing-tile__head">
        <SectionIcon icon={feature.icon} />
        {feature.metricBadge && (
          <span className="ui-badge ui-badge--neutral landing-tile__badge">
            {feature.metricBadge}
          </span>
        )}
      </div>
      <h3 className="landing-tile__title">{feature.title}</h3>
      <p className="landing-tile__detail">{feature.detail}</p>
    </article>
  )
}

function Outcomes({ copy }: { copy: LandingCopy }) {
  return (
    <section className="landing-section" aria-labelledby="outcomes-title">
      <div className="landing-container">
        <div className="landing-section__head">
          <h2
            className="landing-section__title"
            id="outcomes-title"
            data-reveal
          >
            {copy.outcomesTitle}
          </h2>
          <p className="landing-section__lead" data-reveal>
            {copy.outcomesLead}
          </p>
        </div>
        <div className="landing-grid landing-grid--outcomes">
          {copy.outcomes.map((outcome) => (
            <FeatureTile key={outcome.title} feature={outcome} />
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Tagline reveal (landing-page-design B11): a separate large-type moment
 * where each word activates individually in reading order as it crosses the
 * viewport.
 */
function TaglineReveal({
  copy,
  sectionRef,
}: {
  copy: LandingCopy
  sectionRef: RefObject<HTMLElement | null>
}) {
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (!('IntersectionObserver' in window)) return
    const words = section.querySelectorAll('.landing-tagline__word')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-active')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.6 },
    )
    words.forEach((word) => observer.observe(word))
    return () => observer.disconnect()
  }, [sectionRef])

  return (
    <section className="landing-tagline" ref={sectionRef} aria-label="Tagline">
      <div className="landing-container">
        <p className="landing-tagline__statement">
          {copy.tagline.words.map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="landing-tagline__word"
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              {word}
              {index < copy.tagline.words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
        <p className="landing-tagline__support" data-reveal>
          Sabi Shop keeps the daily work and the business picture connected.
        </p>
      </div>
    </section>
  )
}

function HowItWorks({ copy }: { copy: LandingCopy }) {
  return (
    <section
      id="how-it-works"
      className="landing-section landing-section--sunken"
      aria-labelledby="how-title"
    >
      <div className="landing-container">
        <div className="landing-section__head">
          <h2 className="landing-section__title" id="how-title" data-reveal>
            {copy.howItWorks.title}
          </h2>
          <p className="landing-section__lead" data-reveal>
            {copy.howItWorks.lead}
          </p>
        </div>
        <ol className="landing-steps">
          {copy.howItWorks.steps.map((step, index) => (
            <li key={step.title} className="landing-step" data-reveal>
              <span className="landing-step__number" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="landing-tile__title">{step.title}</h3>
              <p className="landing-tile__detail">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ProductAreas({ copy }: { copy: LandingCopy }) {
  return (
    <section
      id="what-it-covers"
      className="landing-section"
      aria-labelledby="areas-title"
    >
      <div className="landing-container">
        <div className="landing-section__head">
          <h2 className="landing-section__title" id="areas-title" data-reveal>
            {copy.productAreas.title}
          </h2>
          <p className="landing-section__lead" data-reveal>
            {copy.productAreas.lead}
          </p>
        </div>
        <div className="landing-grid landing-grid--areas">
          {copy.productAreas.items.map((area) => (
            <FeatureTile key={area.title} feature={area} variant="compact" />
          ))}
        </div>
      </div>
    </section>
  )
}

function Trust({ copy }: { copy: LandingCopy }) {
  return (
    <section
      className="landing-section landing-section--brand"
      aria-labelledby="trust-title"
    >
      <div className="landing-container">
        <div className="landing-section__head">
          <h2 className="landing-section__title" id="trust-title" data-reveal>
            {copy.trust.title}
          </h2>
          <p className="landing-section__lead" data-reveal>
            {copy.trust.lead}
          </p>
        </div>
        <div className="landing-grid landing-grid--trust">
          {copy.trust.items.map((item) => (
            <FeatureTile key={item.title} feature={item} variant="on-brand" />
          ))}
        </div>
      </div>
    </section>
  )
}

function Audience({ copy }: { copy: LandingCopy }) {
  return (
    <section className="landing-section" aria-labelledby="audience-title">
      <div className="landing-container">
        <div className="landing-section__head">
          <h2
            className="landing-section__title"
            id="audience-title"
            data-reveal
          >
            {copy.audience.title}
          </h2>
          <p className="landing-section__lead" data-reveal>
            {copy.audience.lead}
          </p>
          <ul className="landing-audience__examples" data-reveal>
            {copy.audience.examples.map((example) => (
              <li key={example} className="ui-badge ui-badge--neutral">
                {example}
              </li>
            ))}
          </ul>
        </div>
        <div className="landing-audience__columns">
          <FeatureTile
            key="owner"
            feature={{
              icon: Storefront,
              title: 'For you, the owner',
              detail:
                'See sales, stock, money, and performance without standing at the counter. The shop keeps moving, and the record keeps up.',
            }}
          />
          <FeatureTile
            key="staff"
            feature={{
              icon: Users,
              title: 'For your staff',
              detail:
                'A simple, fast way to record sales, repayments, and cash movements, and to close a shift knowing the records account for the cash they hand over.',
            }}
          />
        </div>
      </div>
    </section>
  )
}

function Faq({ copy }: { copy: LandingCopy }) {
  return (
    <section
      id="faq"
      className="landing-section landing-section--sunken"
      aria-labelledby="faq-title"
    >
      <div className="landing-container landing-container--narrow">
        <div className="landing-section__head">
          <h2 className="landing-section__title" id="faq-title" data-reveal>
            {copy.faq.title}
          </h2>
          <p className="landing-section__lead" data-reveal>
            {copy.faq.lead}
          </p>
        </div>
        <div className="landing-faq">
          {copy.faq.items.map((faq) => (
            <details
              key={faq.question}
              className="landing-faq__item"
              data-reveal
            >
              <summary className="landing-faq__question">
                {faq.question}
              </summary>
              <p className="landing-faq__answer">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta({ copy }: { copy: LandingCopy }) {
  return (
    <section className="landing-section" aria-labelledby="final-title">
      <div className="landing-container">
        <div className="landing-final" data-reveal>
          <h2 className="landing-final__title" id="final-title">
            {copy.finalCta.title}
          </h2>
          <p className="landing-final__sub">{copy.finalCta.lead}</p>
          <GetStartedLink label={copy.finalCta.button} className="landing-final__cta" />
        </div>
      </div>
    </section>
  )
}

function LandingFooter({ copy }: { copy: LandingCopy }) {
  const headerLinks = [
    { href: '#how-it-works', label: copy.nav.howItWorks },
    { href: '#what-it-covers', label: copy.nav.whatItCovers },
    { href: '#faq', label: copy.nav.faq },
  ]
  return (
    <footer className="landing-footer">
      <div className="landing-container landing-footer__grid">
        <div className="landing-footer__brand">
          <p className="landing-footer__name">Sabi Shop</p>
          <p className="landing-footer__line">{copy.footer.tagline}</p>
        </div>
        <nav className="landing-footer__nav" aria-label="Footer">
          {headerLinks.map((link) => (
            <a
              key={link.href}
              className="landing-footer__link"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
          <a className="landing-footer__link" href={APP_HREF}>
            {copy.nav.signIn}
          </a>
        </nav>
        <div className="landing-footer__actions">
          <GetStartedLink label={copy.nav.getStarted} className="ui-button--sm landing-footer__cta" />
          <p className="landing-footer__note">
            Privacy policy and terms will be published with the public release.
          </p>
        </div>
      </div>
      <div className="landing-container landing-footer__meta">
        <p>© 2026 Sabi Shop. {copy.footer.builtFor}</p>
      </div>
    </footer>
  )
}

export function LandingPage() {
  const taglineRef = useRef<HTMLElement>(null)
  const [language, setLanguage] = useState<LandingLanguage>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('sabi-shop:language')
      if (stored === 'pcm' || stored === 'en') return stored
    }
    return 'en'
  })

  const copy = landingContent[language]

  const handleLanguageChange = (lang: LandingLanguage) => {
    setLanguage(lang)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sabi-shop:language', lang)
      document.documentElement.lang = lang
    }
  }

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
    }
  }, [language])

  // Gentle entrance for sections as they enter the viewport
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const reveals = document.querySelectorAll('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    reveals.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faq.items.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <div id="top">
      <a className="landing-skip-link" href="#main">
        Skip to content
      </a>
      <LandingHeader
        copy={copy}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
      <main id="main">
        <Hero copy={copy} />
        <Problem copy={copy} />
        <Outcomes copy={copy} />
        <TaglineReveal copy={copy} sectionRef={taglineRef} />
        <HowItWorks copy={copy} />
        <ProductAreas copy={copy} />
        <Trust copy={copy} />
        <Audience copy={copy} />
        <Faq copy={copy} />
        <FinalCta copy={copy} />
      </main>
      <LandingFooter copy={copy} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  )
}
