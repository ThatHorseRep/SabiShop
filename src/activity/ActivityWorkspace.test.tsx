import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LanguageProvider } from '../language'
import { ActivityWorkspace } from './ActivityWorkspace'

describe('ActivityWorkspace', () => {
  it('renders the activity header and filters', () => {
    render(
      <LanguageProvider>
        <ActivityWorkspace actorId="user-chidi" />
      </LanguageProvider>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Activity' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'All events' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sales' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Stock movements' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cash & shift' }),
    ).toBeInTheDocument()
  })

  it('filters events when a category is selected', () => {
    render(
      <LanguageProvider>
        <ActivityWorkspace actorId="user-chidi" />
      </LanguageProvider>,
    )

    const salesFilter = screen.getByRole('button', { name: 'Sales' })
    fireEvent.click(salesFilter)

    expect(salesFilter).toHaveClass('activity-filter-btn--active')
    expect(screen.getByText(/Cash sale completed/i)).toBeInTheDocument()
  })

  it('filters events using the search bar', () => {
    render(
      <LanguageProvider>
        <ActivityWorkspace actorId="user-chidi" />
      </LanguageProvider>,
    )

    const searchInput = screen.getByPlaceholderText(
      /Search events by ID, actor, or type/i,
    )
    fireEvent.change(searchInput, { target: { value: 'Musa' } })

    expect(screen.getByText(/Alhaji Musa paid/i)).toBeInTheDocument()
  })
})
