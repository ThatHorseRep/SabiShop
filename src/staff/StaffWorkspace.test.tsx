import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StaffWorkspace } from './StaffWorkspace'

function renderWorkspace(actorId = 'user-chidi') {
  const onOpenArea = vi.fn()
  const view = render(
    <StaffWorkspace
      actorId={actorId}
      onActorChange={() => undefined}
      onOpenArea={onOpenArea}
      online
      pendingCount={2}
      conflictCount={0}
      storageUnavailable={false}
      update={null}
      onOpenSystemState={() => undefined}
    />,
  )
  return { onOpenArea, ...view }
}

describe('staff home workspace', () => {
  it('centers normal work: business day, own sales, cash in hand, and money out', () => {
    renderWorkspace()

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByText('Today at a glance')).toBeInTheDocument()
    expect(screen.getByText('Business day open')).toBeInTheDocument()
    expect(screen.getByText(/shared drawer/i)).toBeInTheDocument()

    // Cash in Hand is the operational figure, labelled as expected and not
    // yet counted — never a routine Actual Cash entry.
    expect(screen.getAllByText('₦113,000.00').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/What the system expects in the drawer/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Actual Cash is never entered here/i),
    ).toBeInTheDocument()

    // Six sales attributed to the staff member inside the business day;
    // yesterday's sale is excluded by the session boundary.
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('SAL-5001')).toBeInTheDocument()
    expect(screen.getByText('SAL-5006')).toBeInTheDocument()
    expect(screen.queryByText('SAL-4998')).not.toBeInTheDocument()

    // Money out of the till: the manager's cash out and the applied return's
    // cash refund, each with its reason.
    expect(screen.getByText('Cash out')).toBeInTheDocument()
    expect(screen.getByText('Cash refund from till')).toBeInTheDocument()
    expect(
      screen.getByText(/Transport for the evening delivery/i),
    ).toBeInTheDocument()
    expect(screen.getByText('−₦1,500.00')).toBeInTheDocument()
    expect(screen.getByText('−₦4,500.00')).toBeInTheDocument()
  })

  it('shows honest, provisional personal performance and open-return caveats', () => {
    renderWorkspace()

    expect(screen.getByText('My performance')).toBeInTheDocument()
    expect(
      screen.getByText('Provisional — gates passed so far'),
    ).toBeInTheDocument()
    expect(screen.getByText('₦15,300.00')).toBeInTheDocument()
    expect(
      screen.getByText(/Not payable until management releases it/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Open returns that can still change these figures/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/RET-7502 on SAL-5005/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Nothing changes until management applies it; once applied, the figures above recalculate automatically/i,
      ),
    ).toBeInTheDocument()

    // The applied partial return is already reflected (recalculated), not
    // hidden: the sale carries its derived state.
    expect(screen.getByText('Partially returned')).toBeInTheDocument()
  })

  it('exposes stock and product access without cost or margin information', async () => {
    const user = userEvent.setup()
    renderWorkspace()

    expect(screen.getByText('Stock and products')).toBeInTheDocument()
    expect(screen.getByText('Spark Plug NGK')).toBeInTheDocument()
    expect(screen.getByText('₦850.00')).toBeInTheDocument()
    expect(screen.getByText('38 in stock')).toBeInTheDocument()
    // Management-only figures and labels never appear on the staff surface.
    expect(screen.queryByText('Profit before expenses')).toBeNull()
    expect(screen.queryByText('Cost of stock sold')).toBeNull()
    expect(screen.queryByText('Total sales after discount')).toBeNull()
    expect(screen.queryByText('Acquisition cost')).toBeNull()

    // Negative stock stays visible as an actionable exception.
    expect(
      screen.getByText('Negative stock: Fuel Filter Inline'),
    ).toBeInTheDocument()
    expect(screen.getByText('Stock exception · -1')).toBeInTheDocument()

    const search = screen.getByLabelText('Search products')
    await user.type(search, 'wiper')
    expect(screen.getByText('Wiper Blade 22 inch')).toBeInTheDocument()
    expect(screen.queryByText('Spark Plug NGK')).not.toBeInTheDocument()
  })

  it('shows necessary customer actions and own recorded repayments', () => {
    renderWorkspace()

    expect(screen.getByText('Customer work')).toBeInTheDocument()
    expect(screen.getAllByText('Ada Obi').length).toBeGreaterThan(0)
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('₦30,200.00')).toBeInTheDocument()
    expect(screen.getAllByText('Emeka Duru').length).toBeGreaterThan(0)
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByText('₦31,800.00')).toBeInTheDocument()
    expect(screen.getByText(/Repayments I recorded today/i)).toBeInTheDocument()
    expect(screen.getByText('₦11,000.00')).toBeInTheDocument()
  })

  it('surfaces sync state without blocking local work', () => {
    renderWorkspace()

    expect(screen.getByText('Sync and device')).toBeInTheDocument()
    expect(screen.getByText('Sync pending · 2')).toBeInTheDocument()
    expect(
      screen.getByText(/Offline is a mode of operation, not a failure/i),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: 'Open system state' }),
    ).toBeInTheDocument()
  })

  it('navigates to the owning workspace for real work and never mutates here', async () => {
    const user = userEvent.setup()
    const { onOpenArea } = renderWorkspace()

    await user.click(screen.getByRole('button', { name: 'Start a sale' }))
    expect(onOpenArea).toHaveBeenCalledWith('sell')

    await user.click(
      screen.getByRole('button', { name: 'Open Money & Reconciliation' }),
    )
    expect(onOpenArea).toHaveBeenCalledWith('money')
  })
})
