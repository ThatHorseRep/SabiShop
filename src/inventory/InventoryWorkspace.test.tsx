import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InventoryWorkspace } from './InventoryWorkspace'

const renderWorkspace = (online = true, actorId = 'user-ngozi') =>
  render(
    <InventoryWorkspace
      actorId={actorId}
      onActorChange={() => undefined}
      online={online}
      pendingCount={0}
      storageUnavailable={false}
    />,
  )

describe('inventory and purchasing workspace', () => {
  it('makes negative stock an exception while preserving the source sale', async () => {
    renderWorkspace()

    expect(
      await screen.findByText(/negative stock: rice — 50kg bag/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/SAL-9001/i)).toBeInTheDocument()
    expect(
      screen.getByText(/management investigation is required/i),
    ).toBeInTheDocument()
  })

  it('hides management purchasing and cost information from staff', () => {
    renderWorkspace(true, 'user-chidi')

    expect(
      screen.queryByRole('tab', { name: 'Purchasing' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Cost information hidden')).toBeInTheDocument()
  })

  it('records a count as evidence before applying an authorized correction', async () => {
    renderWorkspace()
    fireEvent.click(screen.getByRole('tab', { name: 'Stock & investigation' }))

    fireEvent.change(screen.getByLabelText('Physical quantity'), {
      target: { value: '10' },
    })
    fireEvent.change(screen.getByLabelText('Count evidence'), {
      target: { value: 'Manager recounted the rice shelf with Ngozi.' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Record count for investigation' }),
    )

    expect(
      await screen.findByText('Stock count recorded', { exact: false }),
    ).toBeInTheDocument()
    expect(screen.getByText(/No stock was overwritten/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Correction reason'), {
      target: {
        value:
          'Ten bags were physically present; the previous sale exceeded recorded stock.',
      },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Apply stock correction' }),
    )

    expect(
      await screen.findByText('Stock correction applied', { exact: false }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/The count and investigation remain part of history/i),
    ).toBeInTheDocument()
  })

  it('shows receiving consequences and records a receipt with bonus stock', async () => {
    renderWorkspace()
    fireEvent.click(screen.getByRole('tab', { name: 'Purchasing' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Receiving' }))

    fireEvent.change(screen.getByLabelText('Paid quantity'), {
      target: { value: '10' },
    })
    fireEvent.change(screen.getByLabelText(/bonus\/free quantity/i), {
      target: { value: '2' },
    })
    fireEvent.change(screen.getByLabelText(/unit acquisition cost/i), {
      target: { value: '1000' },
    })
    fireEvent.change(screen.getByLabelText(/supplier discount/i), {
      target: { value: '600' },
    })
    fireEvent.change(screen.getByLabelText(/amount paid now/i), {
      target: { value: '5000' },
    })
    expect(screen.getByText('Effective unit cost')).toBeInTheDocument()
    expect(screen.getByText('₦783.33')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Record receipt' }))

    const feedback = await screen.findByText('Receipt recorded', {
      exact: false,
    })
    expect(feedback).toBeInTheDocument()
    expect(
      screen.getByText(
        /Inventory increased and supplier payable is now ₦4,399\.96/i,
      ),
    ).toBeInTheDocument()
  })

  it('refuses receiving while offline instead of weakening authorization', async () => {
    renderWorkspace(false)
    fireEvent.click(screen.getByRole('tab', { name: 'Purchasing' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Receiving' }))

    fireEvent.change(screen.getByLabelText('Paid quantity'), {
      target: { value: '1' },
    })
    fireEvent.change(screen.getByLabelText(/unit acquisition cost/i), {
      target: { value: '500' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Record receipt' }))

    expect(
      await screen.findByText('Receipt recorded did not complete'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/this action needs a connection/i),
    ).toBeInTheDocument()
  })

  it('presents supplier return, replacement, and credit states separately', async () => {
    renderWorkspace()
    fireEvent.click(screen.getByRole('tab', { name: 'Purchasing' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Supplier returns' }))

    expect(screen.getAllByText(/RET-4001/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Supplier credit / receivable')).toBeInTheDocument()
    expect(screen.getAllByText('₦5,400.00').length).toBeGreaterThan(0)
    expect(screen.getByText('Replacement receipts')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Record settlement outcome' }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Amount (₦)'), {
      target: { value: '5400' },
    })
    fireEvent.change(screen.getByLabelText('Reference'), {
      target: { value: 'CREDIT-NOTE-77' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Record settlement outcome' }),
    )

    expect(
      await screen.findByText('Supplier settlement recorded', { exact: false }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Only confirmed success/i)).toBeInTheDocument()
  })

  it('traces history from movement to source and resulting state', async () => {
    renderWorkspace()
    fireEvent.click(screen.getByRole('tab', { name: 'History' }))

    fireEvent.change(
      screen.getByLabelText(/search source, reason, actor, or id/i),
      { target: { value: 'SAL-9001' } },
    )

    const saleLabels = await screen.findAllByText('sale')
    const row = saleLabels.find((element) => element.tagName === 'STRONG')
    expect(row).toBeDefined()
    const rowScope = row!.closest('tr')!
    expect(within(rowScope).getByText(/SAL-9001/i)).toBeInTheDocument()
    expect(within(rowScope).getByText(/user-chidi/i)).toBeInTheDocument()
    expect(within(rowScope).getAllByText(/-11/i).length).toBeGreaterThan(0)

    fireEvent.click(within(rowScope).getByRole('button', { name: /SAL-9001/i }))
    expect(screen.getByText('Source transaction')).toBeInTheDocument()
    expect(screen.getByText('receipt-inventory-4')).toBeInTheDocument()
    expect(screen.getByText('₦715,000.00')).toBeInTheDocument()
  })
})
