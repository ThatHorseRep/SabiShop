import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('application shell', () => {
  it('shows the unauthenticated home workspace', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByText('Foundation status')).toBeInTheDocument()
    expect(screen.getByText('Authorization required')).toBeInTheDocument()
    expect(
      screen.getByText(/sign in and choose a business before continuing/i),
    ).toBeInTheDocument()
  })

  it('shows connection and sync status in the header', () => {
    render(<App />)
    expect(screen.getByText(/online|offline/i)).toBeInTheDocument()
    expect(screen.getByText('Not signed in')).toBeInTheDocument()
  })

  it('opens the system state panel from the header indicator', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /online|offline/i }))

    expect(screen.getByText('System state')).toBeInTheDocument()
    expect(
      screen.getByText(/everything recorded on this device is synchronized/i),
    ).toBeInTheDocument()
  })
})
