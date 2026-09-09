import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(() => {
  window.localStorage.removeItem('sabi-shop:pos-actor')
})

describe('application shell', () => {
  it('shows the staff work dashboard on the Home destination for a staff session', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByText('Today at a glance')).toBeInTheDocument()
    expect(screen.getAllByText('Cash in Hand').length).toBeGreaterThan(0)
    expect(screen.getAllByText('My sales today').length).toBeGreaterThan(0)
    // Staff never receive management-only analysis on Home.
    expect(
      screen.queryByText('Total sales after discount'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Profit before expenses')).not.toBeInTheDocument()
  })

  it('keeps management analysis off the staff Home and gives management their own pointer', async () => {
    const user = userEvent.setup()
    render(<App />)

    // A staff session never sees the Management destination.
    const rail = screen.getByRole('navigation', { name: 'Primary' })
    expect(
      within(rail).queryByRole('button', { name: 'Management' }),
    ).not.toBeInTheDocument()

    // Switching the reference session to management replaces the staff work
    // surface with the honest foundation state plus the Management pointer.
    await user.selectOptions(
      screen.getByLabelText('Reference session'),
      'user-ngozi',
    )
    expect(screen.getByText('Sabi Shop status')).toBeInTheDocument()
    expect(screen.queryByText('Today at a glance')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Open Management' }),
    ).toBeInTheDocument()
  })

  it('shows connection state and the active reference actor in the header', () => {
    render(<App />)
    const header = screen.getByRole('banner')
    expect(within(header).getByText(/online|offline/i)).toBeInTheDocument()
    expect(within(header).getByText(/chidi okoro/i)).toBeInTheDocument()
  })

  it('navigates to the inventory workspace and keeps the shell session in sync', async () => {
    const user = userEvent.setup()
    render(<App />)

    const rail = screen.getByRole('navigation', { name: 'Primary' })
    await user.click(
      within(rail).getByRole('button', { name: 'Products & Stock' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Products & Stock' }),
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
      screen.getAllByText(/everything recorded on this device is synchronized/i)
        .length,
    ).toBeGreaterThan(0)
  })

  it('navigates to the POS and protects an unfinished sale from casual loss', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Start a sale' }))
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
    expect(screen.getByText('Total sales after discount')).toBeInTheDocument()
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
