import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { effectivePermissions } from '../auth/policy'
import { AppShell } from './AppShell'
import {
  navigationFor,
  navigationModel,
  type NavDestinationId,
} from './navigation'
import { SystemStateIndicator } from './indicators'

const staffPermissions = effectivePermissions({ roles: ['staff'] })
const managerPermissions = effectivePermissions({ roles: ['manager'] })

describe('role-aware navigation model', () => {
  it('exposes all nine destinations for management roles', () => {
    const view = navigationFor(managerPermissions)
    const visibleIds = [
      ...(view.home ? [view.home.id] : []),
      ...view.groups.flatMap((group) => group.destinations.map((d) => d.id)),
    ]
    expect(visibleIds).toHaveLength(navigationModel.length)
    expect(visibleIds).toContain('management')
    expect(visibleIds).toContain('money')
    expect(visibleIds).toContain('suppliers-purchasing')
  })

  it('hides management-only areas from staff instead of disabling them', () => {
    const view = navigationFor(staffPermissions)
    const visible = [
      ...(view.home ? [view.home.id] : []),
      ...view.groups.flatMap((group) => group.destinations.map((d) => d.id)),
    ]
    expect(visible).toContain('sell')
    expect(visible).toContain('products-inventory')
    expect(visible).toContain('customers-credit')
    expect(visible).toContain('activity')
    expect(visible).toContain('settings')
    expect(visible).not.toContain('suppliers-purchasing')
    expect(visible).not.toContain('money')
    expect(visible).not.toContain('management')
  })

  it('keeps only home visible before any session exists', () => {
    const view = navigationFor(new Set())
    expect(view.home?.id).toBe('home')
    expect(view.groups).toHaveLength(0)
  })
})

describe('AppShell', () => {
  function renderShell(
    navigation = navigationFor(managerPermissions),
    activeArea: NavDestinationId = 'home',
  ) {
    const onNavigate = vi.fn()
    render(
      <AppShell
        navigation={navigation}
        activeArea={activeArea}
        onNavigate={onNavigate}
        systemState={{
          online: true,
          pendingCount: 0,
          conflictCount: 0,
        }}
        businessName="Nkechi Hardware"
        user={{ displayName: 'Ada Obi', roleLabel: 'Manager' }}
      >
        <p>Workspace content</p>
      </AppShell>,
    )
    return onNavigate
  }

  it('renders the header, business context, and grouped primary navigation', () => {
    renderShell()
    expect(screen.getByText('Sabi Shop')).toBeInTheDocument()
    expect(screen.getByText('Nkechi Hardware')).toBeInTheDocument()
    expect(screen.getByText('Ada Obi')).toBeInTheDocument()
    const rail = screen.getByRole('navigation', { name: 'Primary' })
    for (const destination of navigationModel) {
      expect(
        within(rail).getByRole('button', { name: destination.label }),
      ).toBeInTheDocument()
    }
    expect(
      within(rail).getByRole('button', { name: 'Sell' }),
    ).not.toHaveAttribute('aria-current', 'page')
    expect(within(rail).getByRole('button', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('does not show staff the management navigation', () => {
    renderShell(navigationFor(staffPermissions))
    const rail = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(rail).queryByText('Management')).toBeNull()
    expect(within(rail).queryByText('Suppliers & Purchasing')).toBeNull()
    expect(within(rail).queryByText('Money')).toBeNull()
    expect(
      within(rail).getByRole('button', { name: 'Sell' }),
    ).toBeInTheDocument()
  })

  it('navigates when a destination is selected', async () => {
    const user = userEvent.setup()
    const onNavigate = renderShell()
    const rail = screen.getByRole('navigation', { name: 'Primary' })
    await user.click(within(rail).getByRole('button', { name: 'Sell' }))
    expect(onNavigate).toHaveBeenCalledWith('sell')
  })

  it('opens the mobile More sheet with the remaining destinations', async () => {
    const user = userEvent.setup()
    renderShell()
    await user.click(screen.getByRole('button', { name: 'More' }))
    expect(screen.getByRole('heading', { name: 'More' })).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Products & Inventory' }).length,
    ).toBeGreaterThan(1)
  })
})

describe('SystemStateIndicator', () => {
  it('shows online state', () => {
    render(
      <SystemStateIndicator
        state={{ online: true, pendingCount: 0, conflictCount: 0 }}
      />,
    )
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('distinguishes locally recorded work from failure', () => {
    render(
      <SystemStateIndicator
        state={{ online: true, pendingCount: 3, conflictCount: 0 }}
      />,
    )
    expect(screen.getByText('Sync pending · 3')).toBeInTheDocument()
  })

  it('elevates conflicts above routine sync status', () => {
    render(
      <SystemStateIndicator
        state={{ online: true, pendingCount: 3, conflictCount: 1 }}
      />,
    )
    expect(screen.getByText('Conflict · 1')).toBeInTheDocument()
  })

  it('shows offline as an operating mode, not an error', () => {
    render(
      <SystemStateIndicator
        state={{ online: false, pendingCount: 0, conflictCount: 0 }}
      />,
    )
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })
})
