import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryStorage } from '../sync/offlineSync'
import { CustomerCreditWorkspace } from './CustomerCreditWorkspace'

async function renderWorkspace(options?: {
  actorId?: string
  online?: boolean
}) {
  const store = new MemoryStorage()
  const actorId = options?.actorId ?? 'user-chidi'
  const online = options?.online ?? true
  const view = render(
    <CustomerCreditWorkspace
      actorId={actorId}
      onActorChange={() => {}}
      online={online}
      store={store}
    />,
  )
  return {
    user: userEvent.setup(),
    view,
    rerender: (next: { actorId?: string; online?: boolean }) =>
      view.rerender(
        <CustomerCreditWorkspace
          actorId={next.actorId ?? actorId}
          onActorChange={() => {}}
          online={next.online ?? online}
          store={store}
        />,
      ),
  }
}

async function openCustomersTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: 'Customers' }))
}

async function selectCustomer(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  phone: string,
) {
  await openCustomersTab(user)
  await user.click(
    screen.getByRole('button', { name: new RegExp(`^${name} ${phone}`) }),
  )
}

async function submitCreditSale(
  user: ReturnType<typeof userEvent.setup>,
  amount: string,
  approverValue: string,
  overLimitApproverValue?: string,
) {
  await user.click(screen.getByRole('button', { name: 'Record credit sale' }))
  const dialog = screen.getByRole('dialog', { name: 'Record credit sale' })
  await user.type(within(dialog).getByLabelText('Credit amount'), amount)
  await user.selectOptions(
    within(dialog).getByLabelText('Credit sale approved by'),
    approverValue,
  )
  if (overLimitApproverValue) {
    await user.selectOptions(
      within(dialog).getByLabelText('Over-limit exception approved by'),
      overLimitApproverValue,
    )
  }
  await user.click(
    within(dialog).getByRole('button', { name: 'Record credit sale' }),
  )
  await screen.findAllByText('Credit sale recorded')
}

describe('Customers & Credit workspace', () => {
  it('shows the overview with outstanding credit, attention, and recent activity', async () => {
    await renderWorkspace()

    expect(screen.getByText('Total outstanding debt')).toBeInTheDocument()
    expect(screen.getAllByText('₦70,000.00').length).toBeGreaterThan(0)
    expect(screen.getByText('Needs attention')).toBeInTheDocument()
    expect(screen.getByText('Restricted credit')).toBeInTheDocument()
    expect(screen.getByText('Disputed debt')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('Recent repayments')).toBeInTheDocument()
    expect(screen.getByText('Recent credit activity')).toBeInTheDocument()
  })

  it('searches customers by name and phone and keeps similar names distinguishable', async () => {
    const { user } = await renderWorkspace()
    await openCustomersTab(user)

    const search = screen.getByRole('searchbox', {
      name: /search customers by name or phone/i,
    })
    await user.type(search, 'Ada')
    expect(
      screen.getByRole('button', { name: /^Ada Obi 0803 111 2233/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^Ada Obiora 0803 111 9988/ }),
    ).toBeInTheDocument()

    await user.clear(search)
    await user.type(search, '0805')
    expect(
      screen.getByRole('button', { name: /^Emeka Duru 0805 444 8899/ }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Ada Obi/ })).toBeNull()

    await user.clear(search)
    await user.type(search, 'zzzz')
    expect(screen.getByText('No customers found.')).toBeInTheDocument()
  })

  it('shows the customer profile with credit status, limit, and independently traceable debts', async () => {
    const { user } = await renderWorkspace()
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    expect(screen.getAllByText('Credit allowed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('₦150,000.00').length).toBeGreaterThan(0)
    expect(screen.getByText('Total outstanding debt')).toBeInTheDocument()
    expect(screen.getAllByText('₦20,000.00').length).toBeGreaterThan(0)
    expect(screen.getByText('debt-ada-1')).toBeInTheDocument()
    expect(screen.getByText('debt-ada-2')).toBeInTheDocument()
    expect(screen.getByText('Partially repaid')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
    expect(screen.getByText(/Original sale ₦35,000.00/)).toBeInTheDocument()
    expect(screen.getByText('Credit history')).toBeInTheDocument()
  })

  it('records a credit sale with consequence preview and separate approval', async () => {
    const { user } = await renderWorkspace()
    await selectCustomer(user, 'Emeka Duru', '0805 444 8899')

    await user.click(screen.getByRole('button', { name: 'Record credit sale' }))
    const dialog = screen.getByRole('dialog', { name: 'Record credit sale' })
    expect(within(dialog).getAllByText(/Emeka Duru/).length).toBeGreaterThan(0)
    await user.type(within(dialog).getByLabelText('Credit amount'), '10000')
    await user.selectOptions(
      within(dialog).getByLabelText('Credit sale approved by'),
      'user-nkechi',
    )
    expect(
      within(dialog).getByText(
        /increase outstanding debt from ₦40,000\.00 to ₦50,000\.00/,
      ),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Record credit sale' }),
    )

    await screen.findAllByText('Credit sale recorded')
    expect(
      screen.getByText(/Outstanding debt is now ₦50,000\.00/),
    ).toBeInTheDocument()
    expect(screen.getAllByText('₦50,000.00').length).toBeGreaterThan(0)
  })

  it('requires a separate over-limit exception when projected debt exceeds the limit', async () => {
    const { user } = await renderWorkspace()
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    await user.click(screen.getByRole('button', { name: 'Record credit sale' }))
    const dialog = screen.getByRole('dialog', { name: 'Record credit sale' })
    await user.type(within(dialog).getByLabelText('Credit amount'), '200000')
    expect(
      within(dialog).getByText('Over-limit exception required'),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        /exceeds the credit limit ₦150,000\.00 by ₦70,000\.00/,
      ),
    ).toBeInTheDocument()
    await user.selectOptions(
      within(dialog).getByLabelText('Credit sale approved by'),
      'user-ngozi',
    )
    await user.selectOptions(
      within(dialog).getByLabelText('Over-limit exception approved by'),
      'user-nkechi',
    )
    expect(
      within(dialog).getByText(
        /increase outstanding debt from ₦20,000\.00 to ₦220,000\.00/,
      ),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Record credit sale' }),
    )

    await screen.findAllByText('Credit sale recorded')
    expect(
      screen.getByText(/Outstanding debt is now ₦220,000\.00/),
    ).toBeInTheDocument()
  })

  it('refuses blocked credit and explains that restricted credit needs management handling', async () => {
    const { user } = await renderWorkspace()

    await selectCustomer(user, 'Tunde Bala', '0810 999 3355')
    await user.click(screen.getByRole('button', { name: 'Record credit sale' }))
    const blockedDialog = screen.getByRole('dialog', {
      name: 'Record credit sale',
    })
    expect(
      within(blockedDialog).getByText('Credit is blocked'),
    ).toBeInTheDocument()
    expect(within(blockedDialog).queryByLabelText('Credit amount')).toBeNull()
    await user.click(
      within(blockedDialog).getByRole('button', { name: 'Close' }),
    )

    await selectCustomer(user, 'Funke Adeyemi', '0807 222 1144')
    await user.click(screen.getByRole('button', { name: 'Record credit sale' }))
    const restrictedDialog = screen.getByRole('dialog', {
      name: 'Record credit sale',
    })
    expect(
      within(restrictedDialog).getByText('Credit is restricted'),
    ).toBeInTheDocument()
    expect(
      within(restrictedDialog).getByText(
        /requires additional management handling/i,
      ),
    ).toBeInTheDocument()
  })

  it('records a partial repayment allocated across multiple debts', async () => {
    const { user } = await renderWorkspace()
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    // Create a second open debt so the repayment must allocate across both.
    await submitCreditSale(user, '5000', 'user-ngozi')

    await user.click(screen.getByRole('button', { name: 'Record repayment' }))
    const dialog = screen.getByRole('dialog', { name: 'Record repayment' })
    await user.type(within(dialog).getByLabelText('Amount'), '22000')
    await user.click(
      within(dialog).getByRole('checkbox', { name: 'Payment confirmed' }),
    )

    expect(
      within(dialog).getByLabelText('Allocation for debt debt-ada-1'),
    ).toHaveValue('20000')
    expect(
      within(dialog).getByText(/reduce debt-ada-1 from ₦20,000\.00 to ₦0\.00/),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(/from ₦25,000\.00 to ₦3,000\.00/),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Record repayment' }),
    )

    await screen.findAllByText('Repayment recorded')
    expect(
      screen.getByText(/Resulting outstanding debt is ₦3,000\.00/),
    ).toBeInTheDocument()
    expect(screen.getByText('debt-ada-1')).toBeInTheDocument()
    expect(screen.getAllByText('Paid').length).toBeGreaterThan(0)
  })

  it('does not record a repayment until the payment is confirmed', async () => {
    const { user } = await renderWorkspace()
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    await user.click(screen.getByRole('button', { name: 'Record repayment' }))
    const dialog = screen.getByRole('dialog', { name: 'Record repayment' })
    await user.type(within(dialog).getByLabelText('Amount'), '5000')

    expect(
      within(dialog).getByRole('button', { name: 'Record repayment' }),
    ).toBeDisabled()

    await user.click(
      within(dialog).getByRole('checkbox', { name: 'Payment confirmed' }),
    )
    expect(
      within(dialog).getByRole('button', { name: 'Record repayment' }),
    ).toBeEnabled()
  })

  it('records an approved return that reduces the obligation without rewriting the sale', async () => {
    const { user } = await renderWorkspace({ actorId: 'user-ngozi' })
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    const debtCard = screen
      .getAllByRole('article')
      .find((element) => element.textContent?.includes('debt-ada-1'))!
    await user.click(
      within(debtCard).getByRole('button', { name: 'Record approved return' }),
    )
    const dialog = screen.getByRole('dialog', {
      name: 'Record approved return on credit sale',
    })
    await user.type(within(dialog).getByLabelText(/Amount/), '2000')
    await user.type(
      within(dialog).getByLabelText(/Return reason/),
      'One wiper blade returned unused.',
    )
    expect(
      within(dialog).getByText(/SAL-8011 remains ₦35,000\.00/),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        /reduce the resulting obligation from ₦20,000\.00 to ₦18,000\.00/,
      ),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Record approved return' }),
    )

    await screen.findAllByText('Approved return recorded')
    expect(screen.getByText(/Approved returns −₦7,000\.00/)).toBeInTheDocument()
    expect(screen.getByText(/Outstanding ₦18,000\.00/)).toBeInTheDocument()
  })

  it('records a write-off with a reason and keeps the debt visible', async () => {
    const { user } = await renderWorkspace({ actorId: 'user-ngozi' })
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    const debtCard = screen
      .getAllByRole('article')
      .find((element) => element.textContent?.includes('debt-ada-1'))!
    await user.click(
      within(debtCard).getByRole('button', { name: 'Write off' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Record write-off' })
    await user.type(within(dialog).getByLabelText(/Amount/), '1000')
    await user.type(
      within(dialog).getByLabelText(/Write-off reason/),
      'Customer is unreachable; management approved partial forgiveness.',
    )
    expect(
      within(dialog).getByText(
        /reduce the collectible outstanding amount by ₦1,000\.00, from ₦20,000\.00 to ₦19,000\.00/,
      ),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Record write-off' }),
    )

    await screen.findAllByText('Write-off recorded')
    expect(screen.getByText(/Written off −₦1,000\.00/)).toBeInTheDocument()
    expect(screen.getByText('debt-ada-1')).toBeInTheDocument()
  })

  it('raises and resolves a dispute while keeping the debt visible', async () => {
    const { user } = await renderWorkspace()
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    const debtCard = screen
      .getAllByRole('article')
      .find((element) => element.textContent?.includes('debt-ada-1'))!
    await user.click(
      within(debtCard).getByRole('button', { name: 'Raise dispute' }),
    )
    const disputeDialog = screen.getByRole('dialog', {
      name: 'Record debt dispute',
    })
    await user.type(
      within(disputeDialog).getByLabelText(/What is being disputed\?/),
      'Customer says part of this sale was already settled in cash.',
    )
    expect(
      within(disputeDialog).getByText(
        /remains visible and outstanding while it is investigated/,
      ),
    ).toBeInTheDocument()
    await user.click(
      within(disputeDialog).getByRole('button', { name: 'Record dispute' }),
    )
    await screen.findAllByText('Dispute recorded')
    expect(screen.getAllByText('Disputed').length).toBeGreaterThan(0)
    expect(screen.getByText(/Outstanding ₦20,000\.00/)).toBeInTheDocument()
  })

  it('resolves a seeded dispute as management with a documented outcome', async () => {
    const { user } = await renderWorkspace({ actorId: 'user-ngozi' })
    await selectCustomer(user, 'Yemi Adeyinka', '0802 333 6677')

    expect(screen.getAllByText('Disputed').length).toBeGreaterThan(0)
    expect(screen.getByText(/Outstanding ₦10,000\.00/)).toBeInTheDocument()

    const debtCard = screen
      .getAllByRole('article')
      .find((element) => element.textContent?.includes('debt-yemi-1'))!
    await user.click(
      within(debtCard).getByRole('button', { name: 'Resolve dispute' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Resolve debt dispute' })
    await user.type(
      within(dialog).getByLabelText(/Investigation outcome/),
      'The ₦3,000 cash receipt was found and recorded as a repayment.',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Resolve dispute' }),
    )

    await screen.findAllByText('Dispute resolved')
    expect(
      screen.getByText(/investigation history remains part of the record/),
    ).toBeInTheDocument()
  })

  it('corrects a credit sale while preserving repayments and returns', async () => {
    const { user } = await renderWorkspace({ actorId: 'user-ngozi' })
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    const debtCard = screen
      .getAllByRole('article')
      .find((element) => element.textContent?.includes('debt-ada-1'))!
    await user.click(
      within(debtCard).getByRole('button', { name: 'Correct credit sale' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Correct credit sale' })
    expect(within(dialog).getByText(/already has/i)).toBeInTheDocument()
    const amount = within(dialog).getByLabelText(/Corrected total obligation/)
    await user.clear(amount)
    await user.type(amount, '30000')
    await user.type(
      within(dialog).getByLabelText(/Correction reason/),
      'Quantity was overstated on the original sale.',
    )
    expect(
      within(dialog).getByText(
        /Original obligation ₦35,000\.00 → correction −₦5,000\.00 → corrected obligation ₦30,000\.00/,
      ),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Apply correction' }),
    )

    await screen.findAllByText('Correction applied')
    expect(
      screen.getByText(/resulting outstanding debt ₦15,000\.00/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Corrections −₦5,000\.00/)).toBeInTheDocument()
  })

  it('blocks a correction that would go below what was already settled', async () => {
    const { user } = await renderWorkspace({ actorId: 'user-ngozi' })
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    const debtCard = screen
      .getAllByRole('article')
      .find((element) => element.textContent?.includes('debt-ada-1'))!
    await user.click(
      within(debtCard).getByRole('button', { name: 'Correct credit sale' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Correct credit sale' })
    const amount = within(dialog).getByLabelText(/Corrected total obligation/)
    await user.clear(amount)
    await user.type(amount, '10000')
    await user.type(
      within(dialog).getByLabelText(/Correction reason/),
      'Attempt to reduce below settled amount.',
    )
    expect(
      within(dialog).getByText(/cannot be reduced below/i),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole('button', { name: 'Apply correction' }),
    ).toBeDisabled()
  })

  it('keeps management controls away from staff with an explicit explanation', async () => {
    const { user } = await renderWorkspace()
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    expect(
      screen.queryByRole('button', { name: 'Change credit status' }),
    ).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Change credit limit' }),
    ).toBeNull()
    expect(
      screen.getByText(/require a Manager or the Owner/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Record repayment' }),
    ).toBeInTheDocument()
  })

  it('changes credit status with consequence explanation', async () => {
    const { user } = await renderWorkspace({ actorId: 'user-ngozi' })
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    await user.click(
      screen.getByRole('button', { name: 'Change credit status' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Change credit status' })
    await user.selectOptions(
      within(dialog).getByLabelText('New credit status'),
      'blocked',
    )
    expect(
      within(dialog).getByText(/from Credit allowed to Credit blocked/),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        /not be able to complete an ordinary credit sale/,
      ),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Change credit status' }),
    )

    await screen.findAllByText('Credit status changed')
    expect(screen.getAllByText('Credit blocked').length).toBeGreaterThan(0)
  })

  it('changes the credit limit and shows the available credit consequence', async () => {
    const { user } = await renderWorkspace({ actorId: 'user-ngozi' })
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    await user.click(
      screen.getByRole('button', { name: 'Change credit limit' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Change credit limit' })
    const amount = within(dialog).getByLabelText('New credit limit')
    await user.clear(amount)
    await user.type(amount, '200000')
    expect(
      within(dialog).getByText(/Available credit will become ₦180,000\.00/),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Change credit limit' }),
    )

    await screen.findAllByText('Credit limit changed')
    expect(
      screen.getByText(/Available credit ₦180,000\.00/),
    ).toBeInTheDocument()
  })

  it('creates a customer with name and phone only', async () => {
    const { user } = await renderWorkspace()
    await openCustomersTab(user)

    await user.click(screen.getByRole('button', { name: 'Add customer' }))
    const dialog = screen.getByRole('dialog', { name: 'Add customer' })
    await user.type(within(dialog).getByLabelText('Customer name'), 'Bola Ogun')
    await user.type(
      within(dialog).getByLabelText('Phone number'),
      '0809 123 4567',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Add customer' }),
    )

    await screen.findAllByText('Customer created')
    expect(screen.getByText(/does not authorize credit/)).toBeInTheDocument()
    expect(screen.getAllByText('Bola Ogun').length).toBeGreaterThan(0)
  })

  it('records repayments offline with sync pending, then synchronizes', async () => {
    const { user, rerender } = await renderWorkspace({ online: false })
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    expect(screen.getByText('Offline')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Record repayment' }))
    const dialog = screen.getByRole('dialog', { name: 'Record repayment' })
    await user.type(within(dialog).getByLabelText('Amount'), '5000')
    await user.click(
      within(dialog).getByRole('checkbox', { name: 'Payment confirmed' }),
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Record repayment' }),
    )

    await screen.findAllByText('Repayment recorded')
    expect(screen.getByText('Sync pending · 1')).toBeInTheDocument()

    rerender({ online: true })
    await user.click(screen.getByRole('button', { name: 'Synchronize now' }))
    await screen.findByText('Synchronization')
    expect(
      screen.getByText(/delivered for authoritative revalidation/),
    ).toBeInTheDocument()
  })

  it('refuses offline management actions and explains that nothing was saved', async () => {
    const { user } = await renderWorkspace({
      actorId: 'user-ngozi',
      online: false,
    })
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    const debtCard = screen
      .getAllByRole('article')
      .find((element) => element.textContent?.includes('debt-ada-1'))!
    await user.click(
      within(debtCard).getByRole('button', { name: 'Write off' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Record write-off' })
    await user.type(within(dialog).getByLabelText(/Amount/), '1000')
    await user.type(
      within(dialog).getByLabelText(/Write-off reason/),
      'Testing offline refusal.',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Record write-off' }),
    )

    await screen.findByText('Write-off recorded did not complete')
    expect(
      screen.getByText(/needs a connection and cannot be performed offline/),
    ).toBeInTheDocument()
    expect(screen.getByText('Nothing was saved.')).toBeInTheDocument()
    expect(screen.getByText(/Reconnect and try again/)).toBeInTheDocument()
    expect(screen.queryByText('Sync pending')).toBeNull()
  })

  it('reverses a credit sale and keeps repayments in history', async () => {
    const { user } = await renderWorkspace({ actorId: 'user-ngozi' })
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    const debtCard = screen
      .getAllByRole('article')
      .find((element) => element.textContent?.includes('debt-ada-1'))!
    await user.click(
      within(debtCard).getByRole('button', { name: 'Reverse credit sale' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Reverse credit sale' })
    expect(
      within(dialog).getByText(
        /records the remaining obligation ₦20,000\.00 as reversed/,
      ),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(/₦10,000\.00 already repaid remains in history/),
    ).toBeInTheDocument()
    await user.type(
      within(dialog).getByLabelText(/Reversal reason/),
      'The sale was recorded against the wrong customer.',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Reverse credit sale' }),
    )

    await screen.findAllByText('Credit sale reversed')
    expect(screen.getAllByText('Reversed').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/This customer has no outstanding credit/),
    ).toBeInTheDocument()
  })

  it('filters the cross-customer credit activity ledger', async () => {
    const { user } = await renderWorkspace()
    await user.click(screen.getByRole('tab', { name: 'Credit activity' }))

    expect(
      screen.getByText(/most recent credit events across all customers/),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Credit sale recorded').length).toBeGreaterThan(
      0,
    )

    await user.selectOptions(
      screen.getByLabelText('Show'),
      'credit.repayment.recorded',
    )
    expect(screen.getAllByText('Repayment recorded').length).toBeGreaterThan(0)
    expect(screen.queryByText('Credit sale recorded')).toBeNull()
  })

  it('exposes debt history events with actors and reasons', async () => {
    const { user } = await renderWorkspace()
    await selectCustomer(user, 'Ada Obi', '0803 111 2233')

    const debtCard = screen
      .getAllByRole('article')
      .find((element) => element.textContent?.includes('debt-ada-1'))!
    await user.click(within(debtCard).getByText(/Debt history \(3 events\)/))
    expect(
      within(debtCard).getByText('Approved return on credit sale'),
    ).toBeInTheDocument()
    expect(
      within(debtCard).getByText(/Two spark plugs returned unused/),
    ).toBeInTheDocument()
    expect(
      within(debtCard).getByText(/Approved by user-ngozi/),
    ).toBeInTheDocument()
  })
})
