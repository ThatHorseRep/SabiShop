import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('application shell', () => {
  it('shows the home workspace on the reference session', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByText('Foundation status')).toBeInTheDocument()
    expect(screen.getByText(/reference session adapter/i)).toBeInTheDocument()
  })

  it('shows connection state and the active reference actor in the header', () => {
    render(<App />)
    expect(screen.getByText(/online|offline/i)).toBeInTheDocument()
    expect(screen.getByText(/chidi okoro/i)).toBeInTheDocument()
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

  it('navigates to the POS and protects an unfinished sale from casual loss', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Start selling' }))
    expect(screen.getByRole('heading', { name: 'Sell' })).toBeInTheDocument()
    expect(
      screen.getByRole('searchbox', { name: /search products by name/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Start a sale')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /Add Spark Plug NGK/i }),
    )
    expect(
      screen.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()

    const rail = screen.getByRole('navigation', { name: 'Primary' })
    await user.click(within(rail).getByRole('button', { name: 'Home' }))
    expect(
      screen.getByRole('heading', { name: 'Leave the unfinished sale?' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continue sale' }))
    expect(screen.getByRole('heading', { name: 'Sell' })).toBeInTheDocument()
  })
})
