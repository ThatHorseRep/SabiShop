import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ExceptionsWorkspace } from './ExceptionsWorkspace'

type User = ReturnType<typeof userEvent.setup>

async function renderWorkspace(actorId = 'user-ngozi') {
  const view = render(
    <ExceptionsWorkspace actorId={actorId} onActorChange={() => {}} />,
  )
  return {
    user: userEvent.setup(),
    view,
    rerender: (nextActorId: string) =>
      view.rerender(
        <ExceptionsWorkspace actorId={nextActorId} onActorChange={() => {}} />,
      ),
  }
}

async function openTab(user: User, name: string | RegExp) {
  await user.click(screen.getByRole('tab', { name }))
}

async function selectSale(user: User, saleId: string) {
  await openTab(user, 'Sale returns')
  await user.click(screen.getByRole('button', { name: new RegExp(saleId) }))
}

describe('Exceptions & reconciliation workspace', () => {
  it('shows the review queue with consequence and required authority', async () => {
    await renderWorkspace()

    expect(screen.getByText(/Review queue · 1/)).toBeInTheDocument()
    expect(
      screen.getByText('Sale return awaiting verification'),
    ).toBeInTheDocument()
    expect(screen.getByText('What happened')).toBeInTheDocument()
    expect(screen.getByText('Why it needs attention')).toBeInTheDocument()
    expect(screen.getByText('Consequence')).toBeInTheDocument()
    expect(screen.getByText('Required authority')).toBeInTheDocument()
    expect(
      screen.getByText('Manager or Owner, separate from the requester'),
    ).toBeInTheDocument()
  })

  it('walks a full sale return: verify, approve with condition, apply, settle refund', async () => {
    const { user } = await renderWorkspace()
    await selectSale(user, 'SAL-3002')

    // The seeded staff request waits for verification.
    expect(screen.getByText('RET-6501')).toBeInTheDocument()
    expect(screen.getByText('Requested')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Verify purchase' }))
    expect(await screen.findByText('Return verified')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Approve return' }))
    const approveDialog = screen.getByRole('dialog', {
      name: 'Approve return',
    })
    await user.click(
      within(approveDialog).getByRole('radio', {
        name: /Held \/ requires inspection/,
      }),
    )
    await user.click(
      within(approveDialog).getByRole('button', { name: 'Approve return' }),
    )
    expect(await screen.findByText('Return approved')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Apply return' }))
    expect(await screen.findByText('Return applied')).toBeInTheDocument()
    expect(screen.getByText(/Due of ₦65,000.00/)).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Record refund settlement' }),
    )
    const settleDialog = screen.getByRole('dialog', {
      name: 'Record refund settlement',
    })
    await user.click(
      within(settleDialog).getByRole('button', { name: 'Record settlement' }),
    )
    expect(await screen.findByText('Settlement recorded')).toBeInTheDocument()
    expect(
      screen.getByText(/Settled of ₦65,000.00 via cash/),
    ).toBeInTheDocument()

    // The original sale stays intact and is now marked fully returned.
    expect(screen.getByText('Completed — Fully returned')).toBeInTheDocument()

    // The settlement and application stay in history.
    await openTab(user, 'History')
    expect(screen.getByText(/Return applied · Sale return/)).toBeInTheDocument()
  })

  it('lets staff request a return but keeps approval management-only', async () => {
    const { user } = await renderWorkspace('user-chidi')
    await selectSale(user, 'SAL-3001')

    await user.click(screen.getByRole('button', { name: 'Request return' }))
    const dialog = screen.getByRole('dialog', { name: 'Request a return' })
    const quantity = within(dialog).getByLabelText(
      'Return quantity for prod-rice',
    )
    await user.clear(quantity)
    await user.type(quantity, '1')
    await user.type(
      within(dialog).getByLabelText('Reason'),
      'Customer brought back one bag.',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Request return' }),
    )
    expect(await screen.findByText('Return requested')).toBeInTheDocument()
    expect(screen.getAllByText('Requested').length).toBeGreaterThan(0)

    // Staff sees the request, but management actions stay unavailable.
    expect(
      screen.getByRole('button', { name: 'Verify purchase' }),
    ).toBeDisabled()
    expect(
      screen.getByText(/Verification confirms the original sale/),
    ).toBeInTheDocument()
  })

  it('rejects a return with no business effect and keeps it visible', async () => {
    const { user } = await renderWorkspace()
    await selectSale(user, 'SAL-3002')

    await user.click(screen.getByRole('button', { name: 'Reject return' }))
    expect(await screen.findByText('Return rejected')).toBeInTheDocument()
    expect(screen.getByText('Rejected')).toBeInTheDocument()
    expect(
      screen.getByText(
        /remains visible as a historical decision and applied no inventory, debt, or settlement effect/,
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Completed — Fully returned')).toBeNull()
  })

  it('applies a material correction with preview, reason, and separate approval', async () => {
    const { user } = await renderWorkspace()
    await openTab(user, 'Corrections')
    await user.click(screen.getByRole('button', { name: /SAL-3001/ }))

    await user.click(screen.getByRole('button', { name: 'Correct record' }))
    const dialog = screen.getByRole('dialog', { name: 'Correct record' })
    await user.selectOptions(
      within(dialog).getByLabelText('What is incorrect?'),
      'quantity',
    )
    await user.clear(within(dialog).getByLabelText('Corrected quantity'))
    await user.type(within(dialog).getByLabelText('Corrected quantity'), '1')
    await user.type(
      within(dialog).getByLabelText('Reason'),
      'Only one bag was actually handed over.',
    )

    expect(
      within(dialog).getByText('Original accepted state'),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText('Corrected state (proposed)'),
    ).toBeInTheDocument()
    expect(within(dialog).getByText(/Expected effects/)).toBeInTheDocument()
    expect(
      within(dialog).getByText(/Stock and weighted-average cost/),
    ).toBeInTheDocument()

    await user.selectOptions(
      within(dialog).getByLabelText('Separate approval'),
      'user-nkechi',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Apply correction' }),
    )
    expect(
      (await screen.findAllByText('Correction applied')).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText(/1 correction\(s\)/)).toBeInTheDocument()
  })

  it('blocks staff from applying a material correction and explains the authority', async () => {
    const { user } = await renderWorkspace('user-chidi')
    await openTab(user, 'Corrections')
    await user.click(screen.getByRole('button', { name: /SAL-3001/ }))

    await user.click(screen.getByRole('button', { name: 'Correct record' }))
    const dialog = screen.getByRole('dialog', { name: 'Correct record' })
    await user.selectOptions(
      within(dialog).getByLabelText('What is incorrect?'),
      'quantity',
    )
    await user.clear(within(dialog).getByLabelText('Corrected quantity'))
    await user.type(within(dialog).getByLabelText('Corrected quantity'), '1')
    await user.type(
      within(dialog).getByLabelText('Reason'),
      'Wrong quantity recorded.',
    )

    expect(
      within(dialog).getByRole('button', { name: 'Apply correction' }),
    ).toBeDisabled()
    expect(
      within(dialog).getByText(
        /Staff cannot apply this correction. Ask a Manager or Owner/,
      ),
    ).toBeInTheDocument()
  })

  it('reverses a sale deliberately and keeps it visible as reversed', async () => {
    const { user } = await renderWorkspace()
    await openTab(user, 'Corrections')
    await user.click(screen.getByRole('button', { name: /SAL-3003/ }))

    await user.click(screen.getByRole('button', { name: 'Reverse sale' }))
    const dialog = screen.getByRole('dialog', { name: 'Reverse sale' })
    expect(within(dialog).getByText(/never deleted/)).toBeInTheDocument()
    await user.type(
      within(dialog).getByLabelText('Reason'),
      'Sale was recorded twice by mistake.',
    )
    await user.selectOptions(
      within(dialog).getByLabelText('Separate approval'),
      'user-nkechi',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Reverse sale' }),
    )
    expect(
      (await screen.findAllByText('Sale reversed')).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('Completed — Reversed')).toBeInTheDocument()

    await openTab(user, 'History')
    expect(screen.getByText(/Sale reversed · Reversal/)).toBeInTheDocument()
  })

  it('runs a supplier return on an unpaid purchase as a payable reduction', async () => {
    const { user } = await renderWorkspace()
    await openTab(user, 'Supplier returns')

    const unpaidCard = screen.getByText(/PUR-2101/).closest('li')!
    await user.click(
      within(unpaidCard).getByRole('button', { name: 'Request return' }),
    )
    const dialog = screen.getByRole('dialog', {
      name: 'Request supplier return',
    })
    const quantity = within(dialog).getByLabelText(
      'Return quantity for prod-rice',
    )
    await user.clear(quantity)
    await user.type(quantity, '2')
    await user.type(
      within(dialog).getByLabelText('Reason'),
      'Two bags arrived torn.',
    )
    expect(
      within(dialog).getByText(/the return value will reduce the payable/),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Request return' }),
    )
    expect(
      await screen.findByText('Supplier return requested'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Verify purchase' }))
    expect(
      await screen.findByText('Supplier return verified'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve return' }))
    expect(
      await screen.findByText('Supplier return approved'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Apply return' }))
    expect(
      await screen.findByText('Supplier return applied'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Payable reduced by ₦104,000.00/),
    ).toBeInTheDocument()
  })

  it('shows a paid purchase supplier return as supplier credit', async () => {
    const { user } = await renderWorkspace()
    await openTab(user, 'Supplier returns')

    const paidCard = screen.getByText(/PUR-2102/).closest('li')!
    expect(
      within(paidCard).getByText('Paid — return creates supplier credit'),
    ).toBeInTheDocument()
    await user.click(
      within(paidCard).getByRole('button', { name: 'Request return' }),
    )
    const dialog = screen.getByRole('dialog', {
      name: 'Request supplier return',
    })
    const quantity = within(dialog).getByLabelText(
      'Return quantity for prod-detergent',
    )
    await user.clear(quantity)
    await user.type(quantity, '3')
    await user.type(
      within(dialog).getByLabelText('Reason'),
      'Wrong fragrance delivered.',
    )
    expect(
      within(dialog).getAllByText(/return value becomes supplier credit/)
        .length,
    ).toBeGreaterThan(0)
    await user.click(
      within(dialog).getByRole('button', { name: 'Request return' }),
    )
    expect(
      await screen.findByText('Supplier return requested'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Verify purchase' }))
    expect(
      await screen.findByText('Supplier return verified'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve return' }))
    expect(
      await screen.findByText('Supplier return approved'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Apply return' }))
    expect(
      await screen.findByText('Supplier return applied'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Supplier credit of ₦8,100.00/)).toBeInTheDocument()
  })

  it('keeps Actual Cash out of the dashboard and requires a deliberate physical count', async () => {
    const { user } = await renderWorkspace('user-chidi')
    await openTab(user, 'Reconciliation')

    expect(screen.getByText('Expected Cash')).toBeInTheDocument()
    expect(screen.getByText('Actual Cash')).toBeInTheDocument()
    expect(screen.getByText('Cash Variance')).toBeInTheDocument()
    expect(screen.getByText('Cash in Hand')).toBeInTheDocument()
    expect(screen.getAllByText('Not counted yet').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/never as a routine dashboard value/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/has not been physically counted yet/),
    ).toBeInTheDocument()

    // No editable Actual Cash input exists on the dashboard — only the count action.
    expect(screen.queryByLabelText(/^Counted cash/)).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Count cash' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Count cash' }))
    const dialog = screen.getByRole('dialog', { name: 'Count cash' })
    expect(
      within(dialog).getByText(/never a routine dashboard value/),
    ).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('Counted cash (₦)'), '143500')
    expect(
      within(dialog).getByText(/Variance against Expected Cash/),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Record physical count' }),
    )
    expect(
      (await screen.findAllByText('Physical count recorded')).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('₦143,500.00').length).toBeGreaterThan(0)
    expect(screen.getByText(/shortage/)).toBeInTheDocument()
  })

  it('raises a discrepancy for investigation, resolves it, closes, and reopens with a reason', async () => {
    const { user } = await renderWorkspace()
    await openTab(user, 'Reconciliation')

    // Count below expected to create a variance.
    await user.click(screen.getByRole('button', { name: 'Count cash' }))
    let dialog = screen.getByRole('dialog', { name: 'Count cash' })
    await user.type(within(dialog).getByLabelText('Counted cash (₦)'), '143500')
    await user.click(
      within(dialog).getByRole('button', { name: 'Record physical count' }),
    )
    expect(
      (await screen.findAllByText('Physical count recorded')).length,
    ).toBeGreaterThan(0)

    await user.click(
      screen.getByRole('button', { name: 'Prepare reconciliation' }),
    )
    expect(
      (await screen.findAllByText('Reconciliation prepared')).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText('Discrepancy requiring investigation'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/investigation signal, not an accusation/),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Resolve discrepancy' }),
    )
    dialog = screen.getByRole('dialog', { name: 'Resolve discrepancy' })
    await user.type(
      within(dialog).getByLabelText('Investigation outcome'),
      'Transport cash was taken before the count.',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Resolve discrepancy' }),
    )
    expect(
      (await screen.findAllByText('Discrepancy resolved')).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText(/original figures were not rewritten/),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Confirm reconciliation' }),
    )
    expect(
      (await screen.findAllByText('Reconciliation confirmed')).length,
    ).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Close business day' }))
    dialog = screen.getByRole('dialog', { name: 'Close business day' })
    await user.click(
      within(dialog).getByRole('button', { name: 'Close business day' }),
    )
    expect(
      (await screen.findAllByText('Business day closed')).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('Closed')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Reopen business day' }),
    )
    dialog = screen.getByRole('dialog', { name: 'Reopen business day' })
    await user.type(
      within(dialog).getByLabelText('Reason'),
      'A missing cash sale was found after closure.',
    )
    await user.selectOptions(
      within(dialog).getByLabelText('Separate approval'),
      'user-nkechi',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Reopen business day' }),
    )
    expect(
      (await screen.findAllByText('Business day reopened')).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('Reopened')).toBeInTheDocument()
    expect(
      screen.getByText(/the earlier closure stays in history/),
    ).toBeInTheDocument()
  })

  it('shows investigation history with actors, reasons, and preserved evidence', async () => {
    const { user } = await renderWorkspace()
    await openTab(user, 'History')

    expect(screen.getAllByText(/Sale completed · Sale/).length).toBeGreaterThan(
      0,
    )
    expect(screen.getByText(/Cash sale recorded · Cash/)).toBeInTheDocument()
    expect(
      screen.getByText(/Opening cash confirmed · Cash/),
    ).toBeInTheDocument()
    expect(screen.getByText(/audit events preserved/)).toBeInTheDocument()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Filter history by kind/ }),
      'cash',
    )
    expect(screen.queryByText(/Sale completed · Sale/)).toBeNull()
    expect(screen.getByText(/Cash out recorded · Cash/)).toBeInTheDocument()
  })
})
