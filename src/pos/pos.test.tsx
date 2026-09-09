import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryStorage } from '../sync/offlineSync'
import { CustomersCreditError } from '../domain/customersCredit'
import { PosScreen } from './PosScreen'
import { CompletionView } from './PosReceipt'
import { createPosController, type PosController } from './posController'
import { findActor, sessionForActor } from './posSession'

const staff = findActor('user-chidi')

async function renderPos(options?: {
  actorId?: string
  online?: boolean
  controller?: PosController
}) {
  const actor = findActor(options?.actorId ?? 'user-chidi')
  const controller =
    options?.controller ?? createPosController(new MemoryStorage())
  const session = sessionForActor(actor)
  const onOperationsChanged = vi.fn()
  const view = render(
    <PosScreen
      controller={controller}
      session={session}
      online={options?.online ?? true}
      onActorChange={() => {}}
      onOperationsChanged={onOperationsChanged}
      onSaleStateChange={() => {}}
    />,
  )
  return {
    user: userEvent.setup(),
    controller,
    view,
    onOperationsChanged,
  }
}

async function addProduct(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  const button = await screen.findByRole('button', {
    name: new RegExp(`Add ${name}`, 'i'),
  })
  await user.click(button)
}

async function pay(
  user: ReturnType<typeof userEvent.setup>,
  method: string,
  confirmLabel: string,
) {
  await user.click(screen.getByRole('button', { name: method }))
  await user.click(screen.getByRole('button', { name: confirmLabel }))
}

async function completeSale(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Complete Sale/i }))
  await screen.findByRole('heading', { name: 'Sale completed' })
}

describe('POS journeys', () => {
  it('completes a normal cash sale with search, quantity, and clear totals', async () => {
    const { user, controller } = await renderPos()

    await user.type(
      screen.getByRole('searchbox', {
        name: /search products by name, sku, or model/i,
      }),
      'spark',
    )
    await addProduct(user, 'Spark Plug NGK')
    await user.click(
      screen.getByRole('button', { name: /Increase Spark Plug NGK quantity/i }),
    )

    expect(screen.getByText('Subtotal')).toBeInTheDocument()
    expect(screen.getAllByText('₦1,700.00').length).toBeGreaterThan(0)

    await pay(user, 'Cash', 'Confirm cash received')
    const complete = screen.getByRole('button', { name: /Complete Sale/i })
    expect(complete).toBeEnabled()
    await completeSale(user)

    expect(screen.getAllByText('₦1,700.00').length).toBeGreaterThan(0)
    expect(controller.engines.inventory.getStock('p-spark-plug').sellable).toBe(
      38_000n,
    )
  })

  it('searches by name and SKU and shows a clear no-result state', async () => {
    const { user } = await renderPos()
    const search = screen.getByRole('searchbox', {
      name: /search products by name, sku, or model/i,
    })

    await user.clear(search)
    await user.type(search, 'battery')
    expect(
      screen.getByRole('button', { name: /Add Car Battery 12V 65Ah/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add Spark Plug/i })).toBeNull()

    await user.clear(search)
    await user.type(search, 'BAT-12V-65')
    expect(
      screen.getByRole('button', { name: /Add Car Battery 12V 65Ah/i }),
    ).toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'zzzz')
    expect(screen.getByText('No products found')).toBeInTheDocument()
  })

  it('blocks an over-stock quantity until a manager approves a stock exception', async () => {
    const { user, controller } = await renderPos()

    await addProduct(user, 'Car Battery 12V 65Ah')
    for (let i = 0; i < 5; i += 1) {
      await user.click(
        screen.getByRole('button', { name: /Increase Car Battery.*quantity/i }),
      )
    }

    expect(screen.getByText('Not enough sellable stock')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Request approval' }))
    const dialog = screen.getByRole('dialog', {
      name: 'Stock exception approval',
    })
    expect(
      within(dialog).getByText(/sellable stock will become negative/i),
    ).toBeInTheDocument()
    await user.type(
      within(dialog).getByLabelText(/reason/i),
      'Shop count pending',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }))

    expect(
      screen.getByText(/Stock exception approved by Ngozi Balogun/i),
    ).toBeInTheDocument()
    await pay(user, 'Cash', 'Confirm cash received')
    await completeSale(user)

    expect(screen.getByText('Stock exception recorded')).toBeInTheDocument()
    expect(controller.engines.inventory.getStock('p-battery').negative).toBe(
      true,
    )
  })

  it('requires approval for a below-floor price and records the approver', async () => {
    const { user, controller } = await renderPos()

    await addProduct(user, 'Air Filter Toyota Corolla')
    await user.click(
      screen.getByRole('button', { name: /Edit price for Air Filter/i }),
    )
    const priceField = await screen.findByLabelText(/unit price/i)
    await user.clear(priceField)
    await user.type(priceField, '5000')
    await user.click(screen.getByRole('button', { name: 'Save price' }))

    expect(
      screen.getByText(/below the price floor and needs/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Approve price' }))
    const dialog = screen.getByRole('dialog', {
      name: 'Below-floor price approval',
    })
    await user.type(
      within(dialog).getByLabelText(/reason/i),
      'Damaged box agreed with customer',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }))

    await pay(user, 'Cash', 'Confirm cash received')
    await completeSale(user)

    const reports = controller.engines.sales.listReports()
    const sale = controller.engines.sales.getSale(
      'biz-nkechi-hardware',
      reports[reports.length - 1].saleId,
    )
    expect(sale?.lines[0].belowFloor).toBe(true)
    expect(sale?.lines[0].pricingApprovedBy).toBe('user-ngozi')
    expect(sale?.lines[0].pricingApprovalReason).toBe(
      'Damaged box agreed with customer',
    )
    expect(
      screen.getByText(/Price exception flagged for review/i),
    ).toBeInTheDocument()
  })

  it('keeps a free sale blocked until management approves it', async () => {
    const { user } = await renderPos()

    await addProduct(user, 'Grease 500g')
    await user.click(
      screen.getByRole('button', { name: /Edit price for Grease/i }),
    )
    const priceField = await screen.findByLabelText(/unit price/i)
    await user.clear(priceField)
    await user.type(priceField, '0')
    await user.click(screen.getByRole('button', { name: 'Save price' }))

    expect(screen.getByText(/A free sale needs/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve price' }))
    const dialog = screen.getByRole('dialog', { name: 'Free sale approval' })
    await user.type(
      within(dialog).getByLabelText(/reason/i),
      'Goodwill replacement',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }))

    expect(screen.getByText('Nothing to pay')).toBeInTheDocument()
    await completeSale(user)
  })

  it('applies tax to the totals before payment', async () => {
    const { user } = await renderPos()

    await addProduct(user, 'Headlamp Bulb H4')
    await user.click(screen.getByRole('button', { name: /Complete Sale/i }))
    expect(
      screen.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()

    await user.selectOptions(screen.getByLabelText(/tax/i), 'vat-exclusive')
    expect(screen.getByText('VAT')).toBeInTheDocument()
    expect(screen.getAllByText('₦4,837.50').length).toBeGreaterThan(0)

    await pay(user, 'Cash', 'Confirm cash received')
    await completeSale(user)
  })

  it('cannot complete a sale on an unconfirmed transfer', async () => {
    const { user } = await renderPos()

    await addProduct(user, 'Wiper Blade 22 inch')
    await user.click(screen.getByRole('button', { name: 'Transfer' }))

    expect(screen.getByText('Not confirmed')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()
    expect(screen.getByText(/Confirm 1 payment/i)).toBeInTheDocument()

    await user.type(
      screen.getByRole('textbox', { name: /reference for bank transfer/i }),
      'NIP-99123',
    )
    await user.click(
      screen.getByRole('button', { name: 'Confirm transfer received' }),
    )
    expect(screen.getByText('Confirmed')).toBeInTheDocument()

    await completeSale(user)
  })

  it('treats a failed payment as unsuccessful and allows recovery', async () => {
    const { user } = await renderPos()

    await addProduct(user, 'Spark Plug NGK')
    await user.click(screen.getByRole('button', { name: 'POS / Card' }))
    await user.click(screen.getByRole('button', { name: 'Mark as failed' }))

    expect(screen.getByText('Payment failed')).toBeInTheDocument()
    expect(
      screen.getByText(/not recorded as a successful payment/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await user.click(
      screen.getByRole('button', { name: 'Confirm card approved' }),
    )
    await completeSale(user)
  })

  it('supports split payments that settle the total exactly', async () => {
    const { user } = await renderPos()

    await addProduct(user, 'Brake Pads Front')
    const cash = screen.getByRole('button', { name: 'Cash' })
    await user.click(cash)
    const cashInput = screen.getByRole('textbox', { name: /amount for cash/i })
    await user.clear(cashInput)
    await user.type(cashInput, '8000')
    await user.click(
      screen.getByRole('button', { name: 'Confirm cash received' }),
    )

    expect(screen.getByText(/Remaining/i)).toHaveTextContent('₦10,000.00')

    await user.click(screen.getByRole('button', { name: 'Transfer' }))
    expect(
      screen.getByRole('textbox', { name: /amount for bank transfer/i }),
    ).toHaveValue('10000')
    await user.click(
      screen.getByRole('button', { name: 'Confirm transfer received' }),
    )

    await completeSale(user)
    expect(
      screen.getByText(/Cash ₦8,000\.00 · Bank transfer ₦10,000\.00/i),
    ).toBeInTheDocument()
  })

  it('requires a customer and separate management approval for credit', async () => {
    const { user, controller } = await renderPos()

    await addProduct(user, 'Brake Pads Front')
    await user.click(screen.getByRole('button', { name: 'Credit' }))

    expect(
      screen.getByText(/Credit sales require a customer/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Select customer' }))
    const picker = screen.getByRole('dialog', { name: 'Select customer' })
    await user.click(within(picker).getByRole('button', { name: /Ada Obi/i }))
    expect(screen.getByText('Ada Obi')).toBeInTheDocument()
    expect(screen.getByText('Credit allowed')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Confirm credit approved' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Credit sale approval' })
    expect(
      within(dialog).getByText(/Outstanding debt will increase by/i),
    ).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }))

    await completeSale(user)
    expect(screen.getByText(/Customer: Ada Obi/i)).toBeInTheDocument()

    const outstanding = controller.engines.customers.getOutstandingForCustomer(
      'biz-nkechi-hardware',
      'c-ada',
    )
    expect(outstanding.minor).toBe(1_800_000n)
  })

  it('refuses credit for a blocked customer', async () => {
    const { user } = await renderPos()

    await addProduct(user, 'Spark Plug NGK')
    await user.click(screen.getByRole('button', { name: 'Add customer' }))
    const picker = screen.getByRole('dialog', { name: 'Select customer' })
    await user.click(
      within(picker).getByRole('button', { name: /Tunde Bala/i }),
    )

    await user.click(screen.getByRole('button', { name: 'Credit' }))
    expect(
      screen.getByText(/Tunde Bala cannot use credit/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()
  })

  it('leaves no sale effects when credit is refused at the composition boundary', () => {
    const controller = createPosController(new MemoryStorage())
    const stockBefore = controller.engines.inventory.getStock('p-spark-plug')
    const reportsBefore = controller.engines.sales.listReports()
    const pricingLineRecorded = (lineId: string) => {
      try {
        controller.engines.pricing.getIncentivePricingFacts(lineId)
        return true
      } catch {
        return false
      }
    }
    const lineBefore = pricingLineRecorded('line-1')

    // Calling the controller directly (the "API without the UI" path) must
    // not commit a sale whose debt the credit engine would refuse.
    expect(() =>
      controller.completeSale({
        actor: staff,
        clientRequestId: 'blocked-credit-request',
        lines: [
          {
            lineId: 'line-1',
            productId: 'p-spark-plug',
            quantity: 1,
          },
        ],
        payments: [
          {
            id: 'pay-1',
            method: 'customer_credit',
            amountKobo: 85_000,
            confirmedBy: 'user-ngozi',
          },
        ],
        customer: { id: 'c-tunde', name: 'Tunde Bala', phone: '0810 999 3355' },
        creditApproval: { approverId: 'user-ngozi', approverRole: 'manager' },
        taxRateBasisPoints: 0n,
        taxMode: 'exclusive',
      }),
    ).toThrowError(CustomersCreditError)

    expect(controller.engines.inventory.getStock('p-spark-plug')).toEqual(
      stockBefore,
    )
    expect(controller.engines.sales.listReports()).toEqual(reportsBefore)
    expect(() =>
      controller.engines.pricing.getIncentivePricingFacts('line-1'),
    ).toThrow()
    expect(pricingLineRecorded('line-1')).toBe(lineBefore)
  })

  it('requires a second exception approval when credit exceeds the limit', async () => {
    const { user, controller } = await renderPos()

    await addProduct(user, 'Engine Oil 4L SAE 40')
    for (let i = 0; i < 3; i += 1) {
      await user.click(
        screen.getByRole('button', { name: /Increase Engine Oil.*quantity/i }),
      )
    }
    await user.click(screen.getByRole('button', { name: 'Add customer' }))
    const picker = screen.getByRole('dialog', { name: 'Select customer' })
    await user.click(
      within(picker).getByRole('button', { name: /Emeka Duru/i }),
    )
    expect(screen.getByText(/Outstanding/i)).toHaveTextContent('60,000.00')

    await user.click(screen.getByRole('button', { name: 'Credit' }))
    await user.click(
      screen.getByRole('button', { name: 'Confirm credit approved' }),
    )
    const dialog = screen.getByRole('dialog', {
      name: /Credit sale approval — over limit/i,
    })
    expect(
      within(dialog).getByText(/exceeds the credit limit/i),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByLabelText(/over-limit exception by/i),
    ).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }))

    await completeSale(user)
    const outstanding = controller.engines.customers.getOutstandingForCustomer(
      'biz-nkechi-hardware',
      'c-emeka',
    )
    expect(outstanding.minor).toBe(11_000_000n)
  })

  it('records an offline sale with sync pending and synchronizes later', async () => {
    const { user, controller, view, onOperationsChanged } = await renderPos({
      online: false,
    })

    await addProduct(user, 'Spark Plug NGK')
    await pay(user, 'Cash', 'Confirm cash received')
    await completeSale(user)

    expect(
      screen.getByText('Recorded on this device · Sync pending'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Synchronize now' })).toBeNull()
    expect(onOperationsChanged).toHaveBeenCalled()
    expect(controller.pendingOperationCount()).toBe(1)

    view.rerender(
      <PosScreen
        controller={controller}
        session={sessionForActor(staff)}
        online={true}
        onActorChange={() => {}}
        onOperationsChanged={onOperationsChanged}
        onSaleStateChange={() => {}}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Synchronize now' }))
    await waitFor(() => {
      expect(
        screen.queryByText('Recorded on this device · Sync pending'),
      ).toBeNull()
    })
    expect(controller.pendingOperationCount()).toBe(0)
  })

  it('creates a customer from the POS with a zero credit limit', async () => {
    const { user, controller } = await renderPos()

    await addProduct(user, 'Spark Plug NGK')
    await user.click(screen.getByRole('button', { name: 'Add customer' }))
    const picker = screen.getByRole('dialog', { name: 'Select customer' })
    await user.click(
      within(picker).getByRole('button', { name: 'Create customer' }),
    )
    await user.type(
      within(picker).getByLabelText(/customer name/i),
      'Bola Ogun',
    )
    await user.type(
      within(picker).getByLabelText(/phone number/i),
      '0802 555 7777',
    )
    await user.click(
      within(picker).getByRole('button', { name: 'Create customer' }),
    )

    expect(screen.getByText('Bola Ogun')).toBeInTheDocument()
    const created = controller.engines.customers
      .listCustomers('biz-nkechi-hardware')
      .find((customer) => customer.name === 'Bola Ogun')
    expect(created?.creditLimitMinor).toBe(0n)
  })

  it('keeps an approval decline explicit and the sale unchanged', async () => {
    const { user } = await renderPos()

    await addProduct(user, 'Air Filter Toyota Corolla')
    await user.click(
      screen.getByRole('button', { name: /Edit price for Air Filter/i }),
    )
    const priceField = await screen.findByLabelText(/unit price/i)
    await user.clear(priceField)
    await user.type(priceField, '5000')
    await user.click(screen.getByRole('button', { name: 'Save price' }))
    await user.click(screen.getByRole('button', { name: 'Approve price' }))

    const dialog = screen.getByRole('dialog', {
      name: 'Below-floor price approval',
    })
    await user.type(
      within(dialog).getByLabelText(/reason/i),
      'Customer negotiated hard',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Decline' }))

    expect(screen.getByText('Request rejected')).toBeInTheDocument()
    expect(screen.getByText(/sale remains unchanged/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()
  })

  it('supports a configured custom payment method', async () => {
    const { user } = await renderPos()

    await addProduct(user, 'Spark Plug NGK')
    await user.click(screen.getByRole('button', { name: 'USSD Transfer' }))
    await user.click(
      screen.getByRole('button', { name: 'Confirm payment received' }),
    )
    await completeSale(user)

    expect(screen.getByText(/USSD Transfer ₦850\.00/i)).toBeInTheDocument()
  })

  it('asks before discarding an unfinished sale', async () => {
    const { user } = await renderPos()

    await addProduct(user, 'Spark Plug NGK')
    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(
      screen.getByRole('heading', { name: 'Leave the unfinished sale?' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear basket' }))

    expect(screen.getByText('Start a sale')).toBeInTheDocument()
  })

  it('shows a useful empty state before any product is added', async () => {
    await renderPos()
    expect(screen.getByText('Start a sale')).toBeInTheDocument()
    expect(
      screen.getByText(/search for a product to add it to the basket/i),
    ).toBeInTheDocument()
  })
})

describe('completion sync conflict state', () => {
  it('surfaces a conflicted sale for authorized review', () => {
    const controller = createPosController(new MemoryStorage())
    const actor = staff
    const sale = controller.completeSale({
      actor,
      clientRequestId: 'sale-conflict-1',
      lines: [
        {
          lineId: 'l1',
          productId: 'p-spark-plug',
          quantity: 1,
        },
      ],
      payments: [
        {
          id: 'pay-1',
          method: 'cash',
          amountKobo: 85_000,
          confirmedBy: actor.id,
        },
      ],
      taxRateBasisPoints: 0n,
      taxMode: 'exclusive',
    })
    render(
      <CompletionView
        sale={sale}
        actor={actor}
        online
        operation={{
          operationId: 'sale-complete:sale-conflict-1',
          businessId: 'biz-nkechi-hardware',
          deviceId: 'device-pos-01',
          actorUserId: actor.id,
          type: 'sale.complete',
          payload: {},
          createdAt: sale.completedAt,
          businessState: 'completed',
          paymentState: 'confirmed',
          authorizationState: 'not_required',
          dependencies: [],
          localRecordedAt: sale.completedAt,
          localState: 'durable',
          serverAcceptance: 'conflict',
          syncState: 'CONFLICT',
        }}
        stockExceptionLines={[]}
        onNewSale={() => {}}
        onSynchronize={() => {}}
        syncing={false}
      />,
    )
    expect(screen.getByText('Sync conflict')).toBeInTheDocument()
    expect(
      screen.getByText(/authorized person must review both versions/i),
    ).toBeInTheDocument()
  })
})
