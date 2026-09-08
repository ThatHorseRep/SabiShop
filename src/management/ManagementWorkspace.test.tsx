import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ManagementWorkspace } from './ManagementWorkspace'

type User = ReturnType<typeof userEvent.setup>

async function renderWorkspace(actorId = 'user-ngozi', onOpenArea = vi.fn()) {
  const view = render(
    <ManagementWorkspace
      actorId={actorId}
      onActorChange={() => {}}
      onOpenArea={onOpenArea}
    />,
  )
  return {
    user: userEvent.setup(),
    view,
    rerender: (nextActorId: string) =>
      view.rerender(
        <ManagementWorkspace
          actorId={nextActorId}
          onActorChange={() => {}}
          onOpenArea={onOpenArea}
        />,
      ),
  }
}

async function openTab(user: User, name: string | RegExp) {
  await user.click(screen.getByRole('tab', { name }))
}

describe('management dashboard', () => {
  it('denies staff the management view instead of showing financial analysis', async () => {
    await renderWorkspace('user-chidi')

    expect(
      screen.getByText(/Management dashboards are restricted/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Net recognized selling value'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('₦170,500.00')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Sales' })).not.toBeInTheDocument()
  })

  it('shows the canonical business performance summary for the event-time period', async () => {
    await renderWorkspace()

    expect(screen.getByText('Net recognized selling value')).toBeInTheDocument()
    expect(screen.getByText('₦170,500.00')).toBeInTheDocument()
    expect(screen.getByText('Tax (VAT)')).toBeInTheDocument()
    expect(screen.getByText('₦975.00')).toBeInTheDocument()
    expect(screen.getByText('₦135,200.00')).toBeInTheDocument()
    expect(screen.getByText('₦35,300.00')).toBeInTheDocument()
    expect(screen.getByText('₦1,200.00')).toBeInTheDocument()
    expect(screen.getByText('₦149,500.00')).toBeInTheDocument()
    expect(
      screen.getByText(/event-time basis · \d+ source records traced/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Cash is not profit/i)).toBeInTheDocument()
  })

  it('keeps gross profit exactly net recognized selling value minus COGS', async () => {
    await renderWorkspace()

    expect(
      screen.getByText(/Net recognized selling value − COGS = ₦35,300.00/),
    ).toBeInTheDocument()
  })

  it('shows position balances derived from their owning records', async () => {
    await renderWorkspace()

    expect(screen.getByText(/Valued at ₦1,034,800.00/)).toBeInTheDocument()
    expect(screen.getByText('1 negative product(s)')).toBeInTheDocument()
    expect(screen.getByText('₦154,250.00')).toBeInTheDocument()
    expect(screen.getByText(/Expected ₦155,000.00/i)).toBeInTheDocument()
    expect(screen.getByText('₦78,000.00')).toBeInTheDocument()
    expect(screen.getByText('₦1,276,400.00')).toBeInTheDocument()
  })

  it('lists attention with consequence and resolution pointers, and can jump to the owning area', async () => {
    const onOpenArea = vi.fn()
    const { user } = await renderWorkspace('user-ngozi', onOpenArea)

    expect(screen.getByText(/Attention · 6/)).toBeInTheDocument()
    expect(
      screen.getByText('Cash count does not match expected cash'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/The business day cannot be officially closed/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Negative stock: Detergent — 1 litre'),
    ).toBeInTheDocument()
    expect(screen.getByText('Overdue credit: Ada Obi')).toBeInTheDocument()
    expect(
      screen.getByText(/Supplier payment PAY-5003 is pending/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Sale return RET-6601 awaiting approval/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Manager correction on own sale flagged for Owner review/,
      ),
    ).toBeInTheDocument()

    const cashItem = screen
      .getByText('Cash count does not match expected cash')
      .closest('li')!
    await user.click(
      within(cashItem).getByRole('button', {
        name: 'Go to Money & Reconciliation',
      }),
    )
    expect(onOpenArea).toHaveBeenCalledWith('money')
  })

  it('drills from the sales summary into the sale record, its business events, and its correction history', async () => {
    const { user } = await renderWorkspace()
    await openTab(user, 'Sales')

    // Sales with report events in the period only by default.
    expect(screen.getByRole('button', { name: 'SAL-4001' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SAL-4002' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SAL-4003' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SAL-4005' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'SAL-4006' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'SAL-4001' }))
    const dialog = screen.getByRole('dialog', { name: 'Sale SAL-4001' })
    expect(within(dialog).getByText('Chidi Okoro')).toBeInTheDocument()
    expect(
      within(dialog).getByText(/Total due ₦139,500.00/),
    ).toBeInTheDocument()
    expect(within(dialog).getByText(/Cash ₦139,500.00/)).toBeInTheDocument()
    expect(within(dialog).getByText('sale.completed')).toBeInTheDocument()
    expect(
      within(dialog).getByText(/sale\.completed:SAL-4001/),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(/Returns & corrections/),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(/This dashboard records no changes/),
    ).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Close' }))

    await user.click(screen.getByRole('button', { name: 'SAL-4002' }))
    const corrected = screen.getByRole('dialog', { name: 'Sale SAL-4002' })
    expect(
      within(corrected).getByText('sale.correction.applied'),
    ).toBeInTheDocument()
    expect(within(corrected).getAllByText('−₦1,000.00').length).toBeGreaterThan(
      0,
    )
    expect(within(corrected).getByText('Return RET-6601')).toBeInTheDocument()
    expect(within(corrected).getByText('Owner review')).toBeInTheDocument()
  })

  it('shows the cash reconciliation exception with its events and expense records', async () => {
    const { user } = await renderWorkspace()
    await openTab(user, /Money & expenses/)

    expect(screen.getByText('₦155,000.00')).toBeInTheDocument()
    expect(screen.getByText('₦154,250.00')).toBeInTheDocument()
    expect(screen.getByText('−₦750.00')).toBeInTheDocument()
    expect(screen.getByText('unresolved')).toBeInTheDocument()
    expect(screen.getByText('Cash from sale SAL-4001')).toBeInTheDocument()
    expect(
      screen.getByText('Change float added to the drawer'),
    ).toBeInTheDocument()
    expect(screen.getByText('EXP-8001')).toBeInTheDocument()
    expect(screen.getByText('Transport & delivery')).toBeInTheDocument()
    expect(
      screen.getByText(/Owner withdrawals are not expenses/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/reconciliation\.prepared/)).toBeInTheDocument()
  })

  it('shows stock health from the inventory ledger including the negative-stock exception', async () => {
    const { user } = await renderWorkspace()
    await openTab(user, 'Inventory')

    expect(screen.getByText('Rice — 50kg bag')).toBeInTheDocument()
    expect(screen.getByText('Cooking oil — 5 litres')).toBeInTheDocument()
    expect(screen.getAllByText('Detergent — 1 litre').length).toBeGreaterThan(1)
    expect(screen.getByText('Negative stock')).toBeInTheDocument()
    expect(screen.getAllByText('−2').length).toBeGreaterThan(0)
    expect(screen.getByText('₦52,000.00')).toBeInTheDocument()
    expect(screen.getByText('₦7,800.00')).toBeInTheDocument()
    expect(
      screen.getByText(/the dashboard does not adjust stock/i),
    ).toBeInTheDocument()
  })

  it('separates customer credit outstanding from supplier obligations with their records', async () => {
    const { user } = await renderWorkspace()
    await openTab(user, /Credit & suppliers/)

    expect(screen.getByText('Ada Obi')).toBeInTheDocument()
    expect(screen.getByText('Bola Adeyemi')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText(/DEBT-4003/)).toBeInTheDocument()
    expect(screen.getByText('₦13,000.00')).toBeInTheDocument()
    expect(screen.getAllByText('₦65,000.00').length).toBeGreaterThan(0)
    expect(screen.getByText('Lagos Wholesale Foods')).toBeInTheDocument()
    expect(screen.getByText('Prime Cleaning Supplies')).toBeInTheDocument()
    expect(screen.getByText(/PUR-5001/)).toBeInTheDocument()
    expect(screen.getByText(/PAY-5003/)).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('shows staff performance and incentive visibility without payout logic', async () => {
    const { user } = await renderWorkspace()
    await openTab(user, /Staff & incentives/)

    expect(screen.getAllByText('Chidi Okoro').length).toBeGreaterThan(0)
    expect(screen.getByText('Eligible (provisional)')).toBeInTheDocument()
    expect(screen.getByText('₦171,500.00')).toBeInTheDocument()
    expect(screen.getByText('₦36,300.00')).toBeInTheDocument()
    expect(screen.getByText('₦18,500.00')).toBeInTheDocument()
    // The Owner has no report events, so she stays "not measured". The
    // Manager's sale sits outside the 24-hour window, but the payment
    // correction applied inside it now produces an honest signed entry —
    // the previous projection silently ignored correction events per
    // salesperson (B13 sections 11 and 13).
    expect(screen.getAllByText(/No qualifying sales in period/).length).toBe(1)
    expect(screen.getAllByText(/Pending volume gate/).length).toBeGreaterThan(0)
    expect(screen.getByText('−₦1,000.00')).toBeInTheDocument()
    expect(
      screen.getByText(/sale\.correction\.applied:SAL-4002/),
    ).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getAllByText('3').length).toBeGreaterThan(1)
    expect(screen.getByText('Not shown')).toBeInTheDocument()
    expect(
      screen.getByText(/release and payout are owned by the incentive module/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/sale.completed:SAL-4001/)).toBeInTheDocument()
    expect(
      screen.getByText(/Return RET-6601 requested on SAL-4002/),
    ).toBeInTheDocument()
  })

  it('changes the canonical figures when the reporting period changes', async () => {
    const { user } = await renderWorkspace()

    await user.selectOptions(screen.getByLabelText('Period'), '7d')
    expect(await screen.findByText('₦300,500.00')).toBeInTheDocument()
    expect(screen.getByText('₦61,300.00')).toBeInTheDocument()

    await openTab(user, /Staff & incentives/)
    expect(screen.getByText('Pending volume gate')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Period'), '30d')
    await openTab(user, /Overview/)
    expect(await screen.findByText('₦311,000.00')).toBeInTheDocument()
    expect(screen.getByText('₦66,400.00')).toBeInTheDocument()
  })

  it('recovers when the actor changes from staff back to management', async () => {
    const { user, rerender } = await renderWorkspace('user-ngozi')
    expect(screen.getByText('₦170,500.00')).toBeInTheDocument()

    rerender('user-chidi')
    expect(
      screen.getByText(/Management dashboards are restricted/i),
    ).toBeInTheDocument()

    rerender('user-nkechi')
    expect(await screen.findByText('₦170,500.00')).toBeInTheDocument()
    expect(user).toBeDefined()
  })
})
