import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  BellRinging,
  ChartLine,
  Clock,
  CurrencyNgn,
  Fingerprint,
  HandCoins,
  Link as LinkIcon,
  NotePencil,
  Package,
  Receipt,
  ShieldCheck,
  Storefront,
  Truck,
  Users,
  Wallet,
  WifiSlash,
  type Icon,
} from '@phosphor-icons/react'

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

type Faq = { question: string; answer: string }

const faqs: readonly Faq[] = [
  {
    question: 'What is Sabi Shop?',
    answer:
      'Sabi Shop is a lightweight shop operations app for small retail businesses. It records sales, stock, money, customer credit, and staff activity, and turns them into a clear picture of the business.',
  },
  {
    question: 'Who is Sabi Shop for?',
    answer:
      'Small physical goods retail businesses, including shops selling parts, equipment, tools, and similar products, where the owner needs to know what is happening without personally doing every transaction.',
  },
  {
    question: 'Does it work offline?',
    answer:
      'Yes, for supported workflows. Sales and other daily work can continue locally when connectivity drops, and records synchronize when connectivity returns. Conflicts are surfaced for review rather than silently overwritten.',
  },
  {
    question: 'Can my staff use it?',
    answer:
      'Yes. The selling interface is designed for fast everyday shop work, and each staff member sees what their role allows. Staff record sales, repayments, and cash movements, while approval and review controls stay with management.',
  },
  {
    question: 'Can I track customer credit?',
    answer:
      'Yes. Credit sales, repayments, and outstanding debt are tracked per customer, with credit limits and approval rules you control.',
  },
  {
    question: 'Can I track inventory?',
    answer:
      'Yes. Stock received, sold, returned, and adjusted is tracked per product, and low stock and out of stock items are surfaced for attention.',
  },
  {
    question: 'Can I record different payment methods?',
    answer:
      'Yes. Cash, transfer, POS or card payments, and credit are supported, including split payments across methods.',
  },
  {
    question: 'What happens when a sale needs correction?',
    answer:
      'Corrections are controlled and traceable. The original record is preserved, the correction carries a reason, and consequential changes follow your approval rules. Mistakes are corrected without pretending they never happened.',
  },
  {
    question: 'Can Sabi Shop work for more than one business?',
    answer:
      "Each business keeps its own separate records. Sabi Shop is built so one business's data is never mixed with another's.",
  },
  {
    question: 'How do I get started?',
    answer:
      'Choose Get Started to open the working product. Account setup and onboarding are being finalized, so today the button opens the product workspace directly.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
}

type Feature = { icon: Icon; title: string; detail: string }

const outcomes: readonly Feature[] = [
  {
    icon: Receipt,
    title: 'Know your sales',
    detail:
      'What sold, when, at what price, and who recorded it. Every sale stays explainable.',
  },
  {
    icon: Package,
    title: 'Know your stock',
    detail:
      'What you have, what came in, what moved out, and what needs restocking.',
  },
  {
    icon: CurrencyNgn,
    title: 'Know your money',
    detail:
      'Cash, transfers, and card payments kept distinct, with expenses, owner funding, and withdrawals traceable.',
  },
  {
    icon: HandCoins,
    title: 'Know who owes you',
    detail:
      'Credit sales, repayments, and outstanding obligations, so debt never becomes a guess.',
  },
  {
    icon: BellRinging,
    title: 'Know what needs attention',
    detail:
      'Discrepancies, approvals, returns, and stock exceptions surface for review instead of staying hidden.',
  },
]

const productAreas: readonly Feature[] = [
  {
    icon: Storefront,
    title: 'Sell',
    detail:
      'Record sales quickly, with discounts and split payments handled clearly.',
  },
  {
    icon: Package,
    title: 'Products & Inventory',
    detail: 'Track what came in, what moved, and what remains.',
  },
  {
    icon: Users,
    title: 'Customers & Credit',
    detail: 'Follow who owes you and what has been repaid.',
  },
  {
    icon: Truck,
    title: 'Suppliers & Purchasing',
    detail:
      'Keep purchases, supplier obligations, and received stock connected.',
  },
  {
    icon: Wallet,
    title: 'Money',
    detail: 'See cash, transfers, expenses, and reconciliation in one place.',
  },
  {
    icon: Clock,
    title: 'Activity',
    detail: 'Every important action leaves a traceable record.',
  },
  {
    icon: ChartLine,
    title: 'Management',
    detail: 'Review performance, exceptions, and what needs decisions.',
  },
]

const trustItems: readonly Feature[] = [
  {
    icon: Fingerprint,
    title: 'Traceable activity',
    detail:
      'Important actions record who did what and when, so questions have answers.',
  },
  {
    icon: NotePencil,
    title: 'Controlled corrections',
    detail:
      'Mistakes can be corrected without pretending they never happened. Corrections keep their reasons and their history.',
  },
  {
    icon: ShieldCheck,
    title: 'Clear authority',
    detail:
      'Price overrides, credit, and consequential corrections follow the permissions you set.',
  },
  {
    icon: WifiSlash,
    title: 'Offline support',
    detail:
      'Keep working when connectivity is unreliable. Supported workflows continue locally and synchronize when connectivity returns.',
  },
]

const problemLines = [
  'Sales happen all day, at the counter and on the phone.',
  'Stock moves with every sale, delivery, and return.',
  'Customers buy on credit and repay on their own schedule.',
  'Money arrives as cash, transfers, and card payments, and leaves for expenses and restocking.',
  'Staff keep the shop moving while the owner is away.',
]

const taglineWords = ['Run', 'the', 'shop.', 'See', 'the', 'business.']

const audienceExamples = [
  'Retail shops',
  'Parts shops',
  'Equipment shops',
  'Hardware and tool shops',
  'Similar physical goods businesses',
]

const headerLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#what-it-covers', label: 'What it covers' },
  { href: '#faq', label: 'FAQ' },
]

function GetStartedLink({ className }: { className?: string }) {
  return (
    <a
      className={`ui-button ui-button--primary ${className ?? ''}`.trim()}
      href={APP_HREF}
    >
      Get Started
    </a>
  )
}

function SectionIcon({ icon: Icon }: { icon: Icon }) {
  return (
    <span className="landing-tile__icon" aria-hidden="true">
      <Icon size={24} weight="regular" />
    </span>
  )
}

/**
 * One conversion objective, one primary CTA. The header keeps a single Get
 * Started action; Sign in is the subordinate secondary path (C05 sections
 * 6, 9). The temporary destination is the working product because onboarding
 * does not exist yet, and no fake signup is presented.
 */
function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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
          <a className="landing-header__sign-in" href={APP_HREF}>
            Sign in
          </a>
          <GetStartedLink className="ui-button--sm landing-header__cta" />
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
            <a
              className="landing-menu__link"
              href={APP_HREF}
              style={{ '--i': headerLinks.length } as CSSProperties}
            >
              Sign in
            </a>
            <GetStartedLink className="landing-menu__cta" />
          </div>
        </div>
      )}
    </header>
  )
}

/**
 * Representative sale workspace built from the application's design language
 * and seed catalogue. It is labelled as representative: figures are example
 * data, never performance claims (C05 sections 12, 46, 57).
 */
function SaleWorkspaceVisual() {
  return (
    <figure className="landing-visual" data-reveal>
      <div className="landing-visual__frame">
        <div className="landing-visual__bar">
          <span className="landing-visual__title">New sale</span>
          <span className="ui-badge ui-badge--offline">
            <WifiSlash size={12} weight="bold" aria-hidden="true" />
            Offline · saved on device
          </span>
        </div>
        <p className="landing-visual__customer">
          Customer · Ada Obi · credit allowed
        </p>
        <table className="landing-visual__items">
          <caption className="visually-hidden">
            Example sale with three line items
          </caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Quantity and price</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Spark Plug NGK</th>
              <td className="numeric">4 × ₦850.00</td>
              <td className="numeric">₦3,400.00</td>
            </tr>
            <tr>
              <th scope="row">Engine Oil 4L SAE 40</th>
              <td className="numeric">1 × ₦12,500.00</td>
              <td className="numeric">₦12,500.00</td>
            </tr>
            <tr>
              <th scope="row">Air Filter Toyota Corolla</th>
              <td className="numeric">2 × ₦6,800.00</td>
              <td className="numeric">₦13,600.00</td>
            </tr>
          </tbody>
        </table>
        <div className="landing-visual__payment">
          <span className="ui-badge ui-badge--neutral">Cash · ₦20,000.00</span>
          <span className="ui-badge ui-badge--neutral">
            Transfer · ₦9,500.00
          </span>
        </div>
        <div className="landing-visual__footer">
          <span className="ui-badge ui-badge--neutral">
            Air Filter Toyota Corolla · 12 in stock
          </span>
          <p className="landing-visual__total">
            <span className="landing-visual__total-label">Total</span>
            <span className="numeric">₦29,500.00</span>
          </p>
        </div>
      </div>
      <figcaption className="landing-visual__caption">
        Representative view of the Sabi Shop sale workspace with example data.
      </figcaption>
    </figure>
  )
}

function Hero() {
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="landing-container landing-hero__grid">
        <div className="landing-hero__copy">
          <p className="landing-eyebrow">
            <span className="landing-eyebrow__dot" aria-hidden="true" />
            Shop operations for small retail businesses
          </p>
          <h1 className="landing-hero__title" id="hero-title">
            Know what is happening
            <br />
            in your shop.
          </h1>
          <p className="landing-hero__sub">
            Sabi Shop records daily sales, stock, money, and customer credit in
            one connected picture, so you can see what happened, what you still
            have, and what needs attention.
          </p>
          <div className="landing-hero__actions">
            <GetStartedLink />
            <a className="ui-button ui-button--secondary" href="#how-it-works">
              See how it works
            </a>
          </div>
          {/* Proof sits with the claim it supports, as an honest capability
              statement rather than fabricated social proof (C05 section 35). */}
          <p className="landing-hero__proof">
            Built for real shop conditions: multiple staff, cash and transfers,
            customer credit, negotiated prices, and unreliable connectivity.
          </p>
        </div>
        <SaleWorkspaceVisual />
      </div>
    </section>
  )
}

function Problem() {
  return (
    <section
      className="landing-section landing-section--sunken"
      aria-labelledby="problem-title"
    >
      <div className="landing-container landing-section__head">
        <h2 className="landing-section__title" id="problem-title" data-reveal>
          The shop does not pause for paperwork.
        </h2>
        <p className="landing-section__lead" data-reveal>
          A small retail business generates records all day, whether or not
          anyone is writing them down.
        </p>
        <ul className="landing-problem__list">
          {problemLines.map((line) => (
            <li key={line} data-reveal>
              {line}
            </li>
          ))}
        </ul>
        <p className="landing-problem__transition" data-reveal>
          At the end of the day, you still need to know what happened. Sabi Shop
          turns that daily activity into a clear business record as it happens,
          so you are not reconstructing the week from memory.
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
      <SectionIcon icon={feature.icon} />
      <h3 className="landing-tile__title">{feature.title}</h3>
      <p className="landing-tile__detail">{feature.detail}</p>
    </article>
  )
}

function Outcomes() {
  return (
    <section className="landing-section" aria-labelledby="outcomes-title">
      <div className="landing-container">
        <div className="landing-section__head">
          <h2
            className="landing-section__title"
            id="outcomes-title"
            data-reveal
          >
            Know your shop
          </h2>
          <p className="landing-section__lead" data-reveal>
            Sabi Shop keeps the questions that matter answerable.
          </p>
        </div>
        <div className="landing-grid landing-grid--outcomes">
          {outcomes.map((outcome) => (
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
 * viewport. Words render at full colour whenever scripting or observers are
 * unavailable, and reduced-motion preferences remove the animation.
 */
function TaglineReveal({
  sectionRef,
}: {
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
          {taglineWords.map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="landing-tagline__word"
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              {word}
              {index < taglineWords.length - 1 ? ' ' : ''}
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

function HowItWorks() {
  const steps: readonly { icon: Icon; title: string; detail: ReactNode }[] = [
    {
      icon: NotePencil,
      title: 'Record the work',
      detail:
        'Sales, payments, stock received, customer credit, repayments, and money activity are recorded as they happen, online or offline.',
    },
    {
      icon: LinkIcon,
      title: 'Keep the picture connected',
      detail:
        'Each sale stays linked to its payment, customer, and stock movement, and to any later return or correction, so records explain each other.',
    },
    {
      icon: BellRinging,
      title: 'See what needs attention',
      detail:
        'Cash differences, outstanding debt, low stock, approvals, and corrections are surfaced for review. Sabi Shop shows you what happened; you decide what to do.',
    },
  ]
  return (
    <section
      id="how-it-works"
      className="landing-section landing-section--sunken"
      aria-labelledby="how-title"
    >
      <div className="landing-container">
        <div className="landing-section__head">
          <h2 className="landing-section__title" id="how-title" data-reveal>
            How Sabi Shop works
          </h2>
          <p className="landing-section__lead" data-reveal>
            One operating model, from the counter to the business picture.
          </p>
        </div>
        <ol className="landing-steps">
          {steps.map((step, index) => (
            <li key={step.title} className="landing-step" data-reveal>
              <span className="landing-step__number" aria-hidden="true">
                {index + 1}
              </span>
              <SectionIcon icon={step.icon} />
              <h3 className="landing-tile__title">{step.title}</h3>
              <p className="landing-tile__detail">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ProductAreas() {
  return (
    <section
      id="what-it-covers"
      className="landing-section"
      aria-labelledby="areas-title"
    >
      <div className="landing-container">
        <div className="landing-section__head">
          <h2 className="landing-section__title" id="areas-title" data-reveal>
            One system for the whole shop
          </h2>
          <p className="landing-section__lead" data-reveal>
            These areas share one connected record. A sale updates stock, a
            repayment updates debt, and a correction keeps its history.
          </p>
        </div>
        <div className="landing-grid landing-grid--areas">
          {productAreas.map((area) => (
            <FeatureTile key={area.title} feature={area} variant="compact" />
          ))}
        </div>
      </div>
    </section>
  )
}

function Trust() {
  return (
    <section
      className="landing-section landing-section--brand"
      aria-labelledby="trust-title"
    >
      <div className="landing-container">
        <div className="landing-section__head">
          <h2 className="landing-section__title" id="trust-title" data-reveal>
            Trustworthy where it matters
          </h2>
          <p className="landing-section__lead" data-reveal>
            Sabi Shop records financially meaningful activity, so traceability
            and control are part of the design, not an afterthought.
          </p>
        </div>
        <div className="landing-grid landing-grid--trust">
          {trustItems.map((item) => (
            <FeatureTile key={item.title} feature={item} variant="on-brand" />
          ))}
        </div>
      </div>
    </section>
  )
}

function Audience() {
  return (
    <section className="landing-section" aria-labelledby="audience-title">
      <div className="landing-container">
        <div className="landing-section__head">
          <h2
            className="landing-section__title"
            id="audience-title"
            data-reveal
          >
            Built for small shops where the owner needs to know
          </h2>
          <p className="landing-section__lead" data-reveal>
            Sabi Shop is designed for small physical goods retail businesses,
            not only one product category.
          </p>
          <ul className="landing-audience__examples" data-reveal>
            {audienceExamples.map((example) => (
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
              icon: ChartLine,
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

function Faq() {
  return (
    <section
      id="faq"
      className="landing-section landing-section--sunken"
      aria-labelledby="faq-title"
    >
      <div className="landing-container landing-container--narrow">
        <div className="landing-section__head">
          <h2 className="landing-section__title" id="faq-title" data-reveal>
            Questions shop owners ask
          </h2>
          <p className="landing-section__lead" data-reveal>
            Direct answers, without the technical dump.
          </p>
        </div>
        <div className="landing-faq">
          {faqs.map((faq) => (
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

function FinalCta() {
  return (
    <section className="landing-section" aria-labelledby="final-title">
      <div className="landing-container">
        <div className="landing-final" data-reveal>
          <h2 className="landing-final__title" id="final-title">
            Ready to see your shop clearly?
          </h2>
          <p className="landing-final__sub">
            Know what is happening in your shop, from the first sale.
          </p>
          {/* The final CTA matches the hero's primary CTA exactly
              (landing-page-design A2; C05 section 6). */}
          <GetStartedLink className="landing-final__cta" />
        </div>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-container landing-footer__grid">
        <div className="landing-footer__brand">
          <p className="landing-footer__name">Sabi Shop</p>
          <p className="landing-footer__line">
            Sabi Shop helps small shops know what happened, what they have, and
            where the money went.
          </p>
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
            Sign in
          </a>
        </nav>
        <div className="landing-footer__actions">
          <GetStartedLink className="ui-button--sm landing-footer__cta" />
          <p className="landing-footer__note">
            Privacy policy and terms will be published with the public release.
          </p>
        </div>
      </div>
      <div className="landing-container landing-footer__meta">
        <p>© 2026 Sabi Shop.</p>
      </div>
    </footer>
  )
}

export function LandingPage() {
  const taglineRef = useRef<HTMLElement>(null)

  // Gentle entrance for sections as they enter the viewport
  // (landing-page-design B7). IntersectionObserver only; never an
  // unthrottled scroll listener. Elements without scripting render normally.
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

  return (
    <div id="top">
      <a className="landing-skip-link" href="#main">
        Skip to content
      </a>
      <LandingHeader />
      <main id="main">
        <Hero />
        <Problem />
        <Outcomes />
        <TaglineReveal sectionRef={taglineRef} />
        <HowItWorks />
        <ProductAreas />
        <Trust />
        <Audience />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  )
}
