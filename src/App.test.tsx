import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('application shell', () => {
  it('shows the foundation readiness state', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        name: /shop operations, ready for the workday/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Ready for domain modules')).toHaveAttribute(
      'role',
      'status',
    )
  })

  it('shows connection and sync status', () => {
    render(<App />)
    expect(screen.getByText(/online|offline/i)).toBeInTheDocument()
    expect(screen.getByText(/sync item/i)).toBeInTheDocument()
  })
})
