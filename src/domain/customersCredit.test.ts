import { describe, expect, it } from 'vitest'
import {
  CustomersCreditEngine,
  CustomersCreditError,
  type RepaymentComponent,
} from './customersCredit'

const managerApproval = {
  approverId: 'manager-1',
  approverRole: 'manager' as const,
}

function confirmed(
  method: RepaymentComponent['method'],
  amountMinor: bigint,
): RepaymentComponent {
  return {
    method,
    amountMinor,
    confirmation: { state: 'confirmed_success', confirmedBy: 'manager-1' },
  }
}

function setup(creditLimitMinor?: bigint) {
  const credit = new CustomersCreditEngine()
  credit.createCustomer({
    businessId: 'business-1',
    id: 'customer-1',
    name: 'Ada Obi',
    phone: '08010000000',
    creditStatus: 'allowed',
    creditLimitMinor,
    actorId: 'staff-1',
  })
  return credit
}

function sale(
  credit: CustomersCreditEngine,
  debtId: string,
  amountMinor: bigint,
  extra: Record<string, unknown> = {},
) {
  return credit.recordCreditSale({
    businessId: 'business-1',
    customerId: 'customer-1',
    debtId,
    saleId: `sale-${debtId}`,
    amountMinor,
    actorId: 'staff-1',
    actorRole: 'staff',
    clientEventId: `sale-event-${debtId}`,
    creditApproval: managerApproval,
    ...extra,
  })
}

function repayment(
  credit: CustomersCreditEngine,
  amountMinor: bigint,
  allocations: Array<{ debtId: string; amountMinor: bigint }>,
  clientEventId = 'repayment-1',
) {
  return credit.recordRepayment({
    businessId: 'business-1',
    customerId: 'customer-1',
    repaymentId: `receipt-${clientEventId}`,
    actorId: 'staff-1',
    actorRole: 'staff',
    clientEventId,
    components: [confirmed('cash', amountMinor)],
    allocations,
  })
}

describe('customers and credit', () => {
  it('records eligible customers and rejects blocked or restricted credit without inventing policy', () => {
    const credit = setup()
    const event = sale(credit, 'debt-1', 1000n)
    expect(event.type).toBe('credit.sale.recorded')
    expect(
      credit.getOutstandingForCustomer('business-1', 'customer-1').minor,
    ).toBe(1000n)

    credit.setCreditStatus(
      'business-1',
      'customer-1',
      'blocked',
      'manager-1',
      'manager',
      'Payment history',
    )
    expect(() => sale(credit, 'debt-2', 500n)).toThrowError(
      CustomersCreditError,
    )

    credit.setCreditStatus(
      'business-1',
      'customer-1',
      'restricted',
      'manager-1',
      'manager',
    )
    expect(() => sale(credit, 'debt-3', 500n)).toThrowError(
      /Restricted credit requires a configured management-handling rule/,
    )
  })

  it('requires management approval for every credit sale and a separate exception when over limit', () => {
    const credit = setup(1000n)
    expect(() =>
      credit.recordCreditSale({
        businessId: 'business-1',
        customerId: 'customer-1',
        debtId: 'debt-1',
        saleId: 'sale-1',
        amountMinor: 1500n,
        actorId: 'staff-1',
        actorRole: 'staff',
        clientEventId: 'sale-event-1',
        creditApproval: { approverId: 'staff-1', approverRole: 'staff' },
      }),
    ).toThrowError(/separate Manager or Owner approval/)

    expect(() => sale(credit, 'debt-1', 1500n)).toThrowError(
      /management exception/,
    )

    const event = sale(credit, 'debt-1', 1500n, {
      overLimitApproval: managerApproval,
    })
    expect(event.overLimitApproval).toEqual(managerApproval)
    expect(
      credit.getOutstandingForCustomer('business-1', 'customer-1').minor,
    ).toBe(1500n)
  })

  it('supports multiple sales and explicit partial then full repayment across debts', () => {
    const credit = setup(10_000n)
    sale(credit, 'debt-1', 3000n)
    sale(credit, 'debt-2', 2000n)
    expect(credit.listDebts('business-1', 'customer-1')).toHaveLength(2)

    repayment(
      credit,
      1500n,
      [
        { debtId: 'debt-1', amountMinor: 1000n },
        { debtId: 'debt-2', amountMinor: 500n },
      ],
      'repayment-1',
    )
    expect(
      credit.getDebt('business-1', 'customer-1', 'debt-1')?.outstandingMinor,
    ).toBe(2000n)
    expect(
      credit.getDebt('business-1', 'customer-1', 'debt-2')?.outstandingMinor,
    ).toBe(1500n)

    repayment(
      credit,
      3500n,
      [
        { debtId: 'debt-1', amountMinor: 2000n },
        { debtId: 'debt-2', amountMinor: 1500n },
      ],
      'repayment-2',
    )
    expect(
      credit.getOutstandingForCustomer('business-1', 'customer-1').minor,
    ).toBe(0n)
    expect(credit.getDebt('business-1', 'customer-1', 'debt-1')?.state).toBe(
      'paid',
    )
    expect(credit.getDebt('business-1', 'customer-1', 'debt-2')?.state).toBe(
      'paid',
    )
  })

  it('reduces obligation with an approved return while preserving the original sale', () => {
    const credit = setup()
    sale(credit, 'debt-1', 10_000n)
    credit.recordApprovedReturn({
      businessId: 'business-1',
      customerId: 'customer-1',
      debtId: 'debt-1',
      amountMinor: 3000n,
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'Wrong size',
      clientEventId: 'return-1',
    })
    const debt = credit.getDebt('business-1', 'customer-1', 'debt-1')
    expect(debt?.outstandingMinor).toBe(7000n)
    expect(debt?.originalAmountMinor).toBe(10_000n)
  })

  it('supports authorized write-offs and visible disputes that do not erase debt', () => {
    const credit = setup()
    sale(credit, 'debt-1', 1000n)
    credit.recordWriteOff({
      businessId: 'business-1',
      customerId: 'customer-1',
      debtId: 'debt-1',
      amountMinor: 1000n,
      actorId: 'owner-1',
      actorRole: 'owner',
      reason: 'Unrecoverable after review',
      clientEventId: 'write-off-1',
    })
    expect(credit.getDebt('business-1', 'customer-1', 'debt-1')?.state).toBe(
      'written_off',
    )

    sale(credit, 'debt-2', 2000n, { clientEventId: 'sale-event-debt-2' })
    credit.recordDispute({
      businessId: 'business-1',
      customerId: 'customer-1',
      debtId: 'debt-2',
      reason: 'Customer says payment was made outside the shop',
      actorId: 'staff-1',
      actorRole: 'staff',
      clientEventId: 'dispute-1',
    })
    const disputed = credit.getDebt('business-1', 'customer-1', 'debt-2')
    expect(disputed?.disputed).toBe(true)
    expect(disputed?.outstandingMinor).toBe(2000n)

    credit.resolveDispute({
      businessId: 'business-1',
      customerId: 'customer-1',
      debtId: 'debt-2',
      reason: 'Investigation completed',
      actorId: 'manager-1',
      actorRole: 'manager',
      resolution: 'Debt confirmed; repayment still outstanding',
      clientEventId: 'dispute-resolution-1',
    })
    expect(credit.getDebt('business-1', 'customer-1', 'debt-2')?.disputed).toBe(
      false,
    )
  })

  it('applies authorized corrections and reversals as traceable events', () => {
    const credit = setup()
    sale(credit, 'debt-1', 10_000n)
    credit.correctCreditSale({
      businessId: 'business-1',
      customerId: 'customer-1',
      debtId: 'debt-1',
      amountMinor: 10_000n,
      correctedAmountMinor: 8000n,
      actorId: 'manager-1',
      actorRole: 'manager',
      reason: 'Wrong quantity recorded',
      clientEventId: 'correction-1',
    })
    expect(
      credit.getOutstandingForCustomer('business-1', 'customer-1').minor,
    ).toBe(8000n)

    credit.reverseCreditSale({
      businessId: 'business-1',
      customerId: 'customer-1',
      debtId: 'debt-1',
      amountMinor: 0n,
      actorId: 'owner-1',
      actorRole: 'owner',
      reason: 'Sale was entered for the wrong customer',
      clientEventId: 'reversal-1',
    })
    expect(credit.getDebt('business-1', 'customer-1', 'debt-1')?.state).toBe(
      'reversed',
    )
    expect(
      credit.getOutstandingForCustomer('business-1', 'customer-1').minor,
    ).toBe(0n)
  })

  it('treats duplicate repayment submissions and unconfirmed payments correctly', () => {
    const credit = setup()
    sale(credit, 'debt-1', 1000n)
    const first = repayment(
      credit,
      300n,
      [{ debtId: 'debt-1', amountMinor: 300n }],
      'repayment-1',
    )
    const retry = repayment(
      credit,
      300n,
      [{ debtId: 'debt-1', amountMinor: 300n }],
      'repayment-1',
    )
    expect(retry.id).toBe(first.id)
    expect(
      credit
        .listHistory('business-1', 'customer-1')
        .filter((event) => event.type === 'credit.repayment.recorded'),
    ).toHaveLength(1)
    expect(
      credit.getOutstandingForCustomer('business-1', 'customer-1').minor,
    ).toBe(700n)

    expect(() =>
      credit.recordRepayment({
        businessId: 'business-1',
        customerId: 'customer-1',
        repaymentId: 'receipt-2',
        actorId: 'staff-1',
        actorRole: 'staff',
        clientEventId: 'repayment-2',
        components: [
          {
            method: 'bank_transfer',
            amountMinor: 100n,
            confirmation: {
              state: 'confirmed_success',
              confirmedBy: 'staff-1',
            },
          },
        ],
        allocations: [{ debtId: 'debt-1', amountMinor: 90n }],
      }),
    ).toThrowError(/components and debt allocations/)
  })

  it('keeps optional due dates explicit and identifies overdue debt', () => {
    const credit = setup()
    sale(credit, 'debt-1', 1000n, { dueDate: '2000-01-01T00:00:00.000Z' })
    const debt = credit.getDebt('business-1', 'customer-1', 'debt-1')
    expect(debt?.dueDate).toBe('2000-01-01T00:00:00.000Z')
    expect(debt?.isDue).toBe(true)
    expect(debt?.isOverdue).toBe(true)
  })

  it('preserves a complete auditable history with tenant-scoped records', () => {
    const credit = setup(2000n)
    sale(credit, 'debt-1', 1000n, { saleId: 'sale-1' })
    repayment(
      credit,
      400n,
      [{ debtId: 'debt-1', amountMinor: 400n }],
      'repayment-1',
    )
    const history = credit.listHistory('business-1', 'customer-1')
    expect(history.map((event) => event.type)).toEqual([
      'customer.created',
      'credit.sale.recorded',
      'credit.repayment.recorded',
    ])
    expect(history.every((event) => event.businessId === 'business-1')).toBe(
      true,
    )
    expect(history[1].saleId).toBe('sale-1')
    expect(history[1].approval).toEqual(managerApproval)
    expect(history[2].allocations).toEqual([
      { debtId: 'debt-1', amountMinor: 400n },
    ])
    expect(credit.getCustomer('business-2', 'customer-1')).toBeUndefined()
    expect(credit.listHistory('business-2')).toEqual([])
  })
})
