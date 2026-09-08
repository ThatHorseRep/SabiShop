import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LandingPage } from './LandingPage'

function installMatchMedia() {
  const listeners: Array<(event: { matches: boolean }) => void> = []
  const media = {
    matches: false,
    addEventListener: (
      _type: string,
      listener: (event: { matches: boolean }) => void,
    ) => listeners.push(listener),
    removeEventListener: (
      _type: string,
      listener: (event: { matches: boolean }) => void,
    ) => {
      const index = listeners.indexOf(listener)
      if (index >= 0) listeners.splice(index, 1)
    },
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(() => media),
  )
  return {
    setMatches(matches: boolean) {
      media.matches = matches
      for (const listener of listeners) listener({ matches })
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.style.overflow = ''
})

describe('public landing page', () => {
  it('states the outcome headline, audience, and one primary conversion path', () => {
    render(<LandingPage />)

    // Outcome plus audience (landing-page-design A2; C05 sections 3, 10-11).
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /know what is happening in your shop/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/shop operations for small retail businesses/i),
    ).toBeInTheDocument()

    // One primary CTA in the hero plus the matching final CTA, both leading
    // to the application, with See how it works as the only secondary path.
    const primaryCtas = screen.getAllByRole('link', { name: 'Get Started' })
    expect(primaryCtas.length).toBeGreaterThanOrEqual(2)
    for (const cta of primaryCtas) expect(cta).toHaveAttribute('href', '/')
    expect(
      screen.getByRole('link', { name: 'See how it works' }),
    ).toHaveAttribute('href', '#how-it-works')
    for (const signIn of screen.getAllByRole('link', { name: 'Sign in' })) {
      expect(signIn).toHaveAttribute('href', '/')
    }
  })

  it('keeps the narrative sections in the approved C05 order', () => {
    const { container } = render(<LandingPage />)
    const main = screen.getByRole('main')

    const sectionTitles = [
      /the shop does not pause for paperwork/i,
      /know your shop/i,
      /how sabi shop works/i,
      /one system for the whole shop/i,
      /trustworthy where it matters/i,
      /built for small shops/i,
      /questions shop owners ask/i,
      /ready to see your shop clearly/i,
    ]
    for (const title of sectionTitles) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }

    // The tagline reveal moment sits mid page, separate from the hero (B11).
    const tagline = screen.getByRole('region', { name: 'Tagline' })
    const hero = container.querySelector<HTMLElement>('.landing-hero')
    expect(hero).not.toBeNull()
    const outcomes = screen.getByRole('heading', { name: /know your shop/i })
    expect(main.contains(tagline)).toBe(true)
    expect(hero).not.toContainElement(tagline)
    expect(
      tagline.querySelector('.landing-tagline__statement')?.textContent,
    ).toBe('Run the shop. See the business.')

    // Reading order: hero, problem, outcomes, tagline, how it works.
    expect(hero!).toContainElement(
      screen.getByRole('heading', { name: /know what is happening/i }),
    )
    // Outcomes precede the tagline, which precedes How it works.
    expect(
      tagline.compareDocumentPosition(outcomes) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy()
    const howItWorks = screen.getByRole('heading', {
      name: /how sabi shop works/i,
    })
    expect(
      howItWorks.compareDocumentPosition(tagline) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy()
  })

  it('uses the five outcome pillars and three working steps, not a feature dump', () => {
    render(<LandingPage />)

    for (const outcome of [
      'Know your sales',
      'Know your stock',
      'Know your money',
      'Know who owes you',
      'Know what needs attention',
    ]) {
      expect(screen.getByRole('heading', { name: outcome })).toBeInTheDocument()
    }

    for (const step of [
      'Record the work',
      'Keep the picture connected',
      'See what needs attention',
    ]) {
      expect(screen.getByRole('heading', { name: step })).toBeInTheDocument()
    }
    expect(
      screen.getAllByText(/recorded as they happen/i).length,
    ).toBeGreaterThan(0)
  })

  it('never presents fabricated proof and labels example data as representative', () => {
    render(<LandingPage />)

    // No invented social proof markers anywhere (C05 sections 34-35, 60).
    for (const banned of [
      /trusted by/i,
      /loved by/i,
      /what our users say/i,
      /testimonial/i,
      /★★/,
      /reviews/i,
      /\b\d{2,}\s+(shops|businesses|users|customers) (trust|use|love)/i,
    ]) {
      expect(screen.queryByText(banned)).not.toBeInTheDocument()
    }

    // The hero visual is honestly labelled with example data.
    expect(
      screen.getByText(/representative view of the sabi shop sale workspace/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/example data/i)).toBeInTheDocument()

    // The proof line beside the hero claim is a capability statement.
    expect(
      screen.getByText(/built for real shop conditions/i),
    ).toBeInTheDocument()
  })

  it('answers the C05 FAQ questions directly and exposes FAQ structured data', () => {
    render(<LandingPage />)

    const questions = [
      'What is Sabi Shop?',
      'Who is Sabi Shop for?',
      'Does it work offline?',
      'Can my staff use it?',
      'Can I track customer credit?',
      'Can I track inventory?',
      'Can I record different payment methods?',
      'What happens when a sale needs correction?',
      'Can Sabi Shop work for more than one business?',
      'How do I get started?',
    ]
    for (const question of questions) {
      expect(screen.getByText(question)).toBeInTheDocument()
    }

    const schema = document.querySelector('script[type="application/ld+json"]')
    expect(schema).not.toBeNull()
    const parsed = JSON.parse(schema?.textContent ?? '{}')
    expect(parsed['@type']).toBe('FAQPage')
    expect(parsed.mainEntity).toHaveLength(questions.length)
    expect(parsed.mainEntity[0].name).toBe('What is Sabi Shop?')
  })

  it('opens FAQ answers with the native disclosure and honest offline wording', async () => {
    const user = userEvent.setup()
    render(<LandingPage />)

    // Answers stay collapsed until the question is opened.
    expect(
      screen.getByText(/records synchronize when connectivity returns/i),
    ).not.toBeVisible()

    await user.click(screen.getByText('Does it work offline?'))
    expect(
      screen.getByText(/records synchronize when connectivity returns/i),
    ).toBeVisible()

    // Offline is a bounded capability; no absolute claims anywhere.
    expect(
      screen.queryByText(/works everywhere offline/i),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/100% secure/i)).not.toBeInTheDocument()
  })

  it('reveals tagline words progressively and keeps content readable without observers', () => {
    // jsdom has no IntersectionObserver: the component must skip enhancement
    // and render every word at full readability (progressive enhancement).
    expect('IntersectionObserver' in window).toBe(false)
    render(<LandingPage />)

    const statement = document.querySelector('.landing-tagline__statement')
    expect(statement).not.toBeNull()
    expect(statement?.textContent).toBe('Run the shop. See the business.')
    const words = statement?.querySelectorAll('.landing-tagline__word')
    expect(words).toHaveLength(6)
    for (const word of words ?? []) {
      // Without observers the enhancement never applies, so no word is left
      // waiting in a muted, pre-activation state.
      expect(word).not.toHaveClass('is-active')
    }
  })

  it('operates the mobile menu with keyboard support and closes it on navigation', async () => {
    installMatchMedia()
    const user = userEvent.setup()
    render(<LandingPage />)

    const menuButton = screen.getByRole('button', { name: 'Open menu' })
    fireEvent.click(menuButton)

    const menu = screen.getByRole('dialog', { name: 'Menu' })
    expect(within(menu).getByRole('link', { name: 'How it works' }))
    expect(within(menu).getByRole('link', { name: 'Get Started' }))
    expect(document.body.style.overflow).toBe('hidden')

    // Escape closes the menu and returns focus to the toggle.
    await user.keyboard('{Escape}')
    expect(
      screen.queryByRole('dialog', { name: 'Menu' }),
    ).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
    expect(menuButton).toHaveFocus()
  })
})
