import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(() => {
  window.localStorage.removeItem('sabi-shop:pos-actor')
})

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

  it('navigates to the inventory workspace and keeps the shell session in sync', async () => {
    const user = userEvent.setup()
    render(<App />)

    const rail = screen.getByRole('navigation', { name: 'Primary' })
    await user.click(
      within(rail).getByRole('button', { name: 'Products & Inventory' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Products & Inventory' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Cost information hidden')).toBeInTheDocument()
    expect(
      screen.queryByRole('tab', { name: 'Purchasing' }),
    ).not.toBeInTheDocument()

    await user.selectOptions(
      screen.getByLabelText('Reference session'),
      'user-ngozi',
    )
    expect(screen.getAllByText(/ngozi balogun/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('tab', { name: 'Purchasing' })).toBeInTheDocument()
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

  it('mounts the management dashboard for a management session and keeps it hidden from staff', async () => {
    window.localStorage.setItem('sabi-shop:pos-actor', 'user-ngozi')
    const user = userEvent.setup()
    render(<App />)

    const rail = screen.getByRole('navigation', { name: 'Primary' })
    await user.click(within(rail).getByRole('button', { name: 'Management' }))

    expect(
      screen.getByRole('heading', { name: 'Management' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Net recognized selling value')).toBeInTheDocument()
    expect(screen.getByText('₦170,500.00')).toBeInTheDocument()

    // Switching the reference session to staff removes the financial view
    // instead of leaking it (C01 sections 5.1, 16.1).
    await user.selectOptions(
      screen.getByLabelText('Reference session'),
      'user-chidi',
    )
    expect(
      screen.getByText(/Management dashboards are restricted/i),
    ).toBeInTheDocument()
    expect(screen.queryByText('₦170,500.00')).not.toBeInTheDocument()
  })
})
