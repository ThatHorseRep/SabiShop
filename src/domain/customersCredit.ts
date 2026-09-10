import {
  customerOutstanding,
  moneyFromMinor,
  type Currency,
  type Money,
} from './finance'
import { canApprove, type Role } from './stateMachines'

export type CreditStatus = 'allowed' | 'restricted' | 'blocked'

export type RepaymentMethod = 'cash' | 'bank_transfer' | 'pos_card' | 'custom'

export type RepaymentConfirmation = {
  state: 'confirmed_success'
  confirmedBy: string
  confirmedAt?: string
  externalReference?: string
}

export type RepaymentComponent = {
  method: RepaymentMethod
  amountMinor: bigint
  customMethodId?: string
  confirmation: RepaymentConfirmation
}

export type RepaymentAllocation = {
  debtId: string
  amountMinor: bigint
}

export type ManagementAuthorization = {
  approverId: string
  approverRole: Role
}

export type Customer = {
  id: string
  businessId: string
  name: string
  phone: string
  creditStatus: CreditStatus
  creditLimitMinor?: bigint
  currency: Currency
}

export type CreditHistoryEventType =
  | 'customer.created'
  | 'customer.credit_status_changed'
  | 'customer.credit_limit_changed'
  | 'credit.sale.recorded'
  | 'credit.repayment.recorded'
  | 'credit.return.recorded'
  | 'credit.write_off.recorded'
  | 'credit.correction.recorded'
  | 'credit.sale.reversed'
  | 'credit.dispute.recorded'
  | 'credit.dispute.resolved'

export type CreditHistoryEvent = {
  id: string
  type: CreditHistoryEventType
  businessId: string
  customerId: string
  actorId: string
  actorRole?: Role
  occurredAt: string
  clientEventId: string
  referenceId?: string
  debtId?: string
  saleId?: string
  amountMinor?: bigint
  resultingOutstandingMinor?: bigint
  reason?: string
  resolution?: string
  approval?: ManagementAuthorization
  overLimitApproval?: ManagementAuthorization
  dueDate?: string
  correctionIncreaseMinor?: bigint
  correctionReductionMinor?: bigint
  correctedAmountMinor?: bigint
  allocations?: RepaymentAllocation[]
  components?: RepaymentComponent[]
}

export type CreditDebt = {
  id: string
  businessId: string
  customerId: string
  saleId: string
  currency: Currency
  originalAmountMinor: bigint
  dueDate?: string
  disputed: boolean
  disputeReason?: string
  saleReversed: boolean
}

export type DebtState =
  | 'outstanding'
  | 'partially_repaid'
  | 'paid'
  | 'cleared_by_return'
  | 'cleared_by_correction'
  | 'written_off'
  | 'reversed'

export type DebtSnapshot = CreditDebt & {
  outstandingMinor: bigint
  state: DebtState
  isDue: boolean
  isOverdue: boolean
}

export type CustomerCreditError =
  | 'INVALID_CUSTOMER'
  | 'DUPLICATE_CUSTOMER'
  | 'CUSTOMER_NOT_FOUND'
  | 'DEBT_NOT_FOUND'
  | 'INVALID_AMOUNT'
  | 'CREDIT_NOT_ALLOWED'
  | 'RESTRICTED_CREDIT_CONFIGURATION_REQUIRED'
  | 'CREDIT_APPROVAL_REQUIRED'
  | 'OVER_LIMIT_EXCEPTION_REQUIRED'
  | 'MANAGEMENT_AUTHORIZATION_REQUIRED'
  | 'INVALID_REPAYMENT'
  | 'ALLOCATION_MISMATCH'
  | 'ALLOCATION_EXCEEDS_OUTSTANDING'
  | 'INVALID_RETURN'
  | 'INVALID_WRITE_OFF'
  | 'INVALID_CORRECTION'
  | 'DEBT_ALREADY_REVERSED'
  | 'INVALID_DISPUTE'
  | 'CURRENCY_MISMATCH'

export class CustomersCreditError extends Error {
  constructor(
    readonly code: CustomerCreditError,
    message: string,
  ) {
    super(message)
    this.name = 'CustomersCreditError'
  }
}

type CreateCustomerInput = {
  businessId: string
  id: string
  name: string
  phone: string
  creditStatus: CreditStatus
  creditLimitMinor?: bigint
  currency?: Currency
  actorId: string
  occurredAt?: string
}

type CreditSaleInput = {
  businessId: string
  customerId: string
  debtId: string
  saleId: string
  amountMinor: bigint
  dueDate?: string
  actorId: string
  actorRole: Role
  clientEventId: string
  creditApproval: ManagementAuthorization
  overLimitApproval?: ManagementAuthorization
  occurredAt?: string
}

type RepaymentInput = {
  businessId: string
  customerId: string
  repaymentId: string
  actorId: string
  actorRole: Role
  clientEventId: string
  components: RepaymentComponent[]
  allocations: RepaymentAllocation[]
  occurredAt?: string
}

export type DebtAmountInput = {
  businessId: string
  customerId: string
  debtId: string
  amountMinor: bigint
  actorId: string
  actorRole: Role
  reason: string
  clientEventId: string
  occurredAt?: string
}

export type CorrectionInput = DebtAmountInput & {
  correctedAmountMinor: bigint
}

type DisputeInput = {
  businessId: string
  customerId: string
  debtId: string
  reason: string
  actorId: string
  actorRole: Role
  clientEventId: string
  occurredAt?: string
}

type DisputeResolutionInput = DisputeInput & {
  actorRole: Role
  resolution: string
}

const now = () => new Date().toISOString()

const isManagement = (role: Role): boolean =>
  role === 'manager' || role === 'owner'

export class CustomersCreditEngine {
  private readonly customers = new Map<string, Customer>()
  private readonly debts = new Map<string, CreditDebt>()
  private readonly events: CreditHistoryEvent[] = []
  private readonly eventsByClientId = new Map<string, CreditHistoryEvent>()
  private nextEventId = 1

  createCustomer(input: CreateCustomerInput): Customer {
    const name = input.name.trim()
    const phone = input.phone.trim()
    if (!name || !phone)
      throw new CustomersCreditError(
        'INVALID_CUSTOMER',
        'A customer record requires a name and phone number',
      )
    if (input.creditLimitMinor !== undefined && input.creditLimitMinor < 0n)
      throw new CustomersCreditError(
        'INVALID_AMOUNT',
        'A credit limit must not be negative',
      )
    const key = `${input.businessId}:${input.id}`
    if (this.customers.has(key))
      throw new CustomersCreditError(
        'DUPLICATE_CUSTOMER',
        'A customer with this ID already exists in the business',
      )
    const customer: Customer = {
      id: input.id,
      businessId: input.businessId,
      name,
      phone,
      creditStatus: input.creditStatus,
      creditLimitMinor: input.creditLimitMinor,
      currency: input.currency ?? 'NGN',
    }
    this.customers.set(key, customer)
    this.append({
      type: 'customer.created',
      businessId: input.businessId,
      customerId: input.id,
      actorId: input.actorId,
      occurredAt: input.occurredAt ?? now(),
      clientEventId: `customer:${input.id}`,
      amountMinor: input.creditLimitMinor,
    })
    return this.cloneCustomer(customer)
  }

  setCreditStatus(
    businessId: string,
    customerId: string,
    creditStatus: CreditStatus,
    actorId: string,
    actorRole: Role,
    reason?: string,
  ): Customer {
    this.assertManagement(actorRole, 'Only management may change credit status')
    const customer = this.getCustomerRecord(businessId, customerId)
    customer.creditStatus = creditStatus
    this.append({
      type: 'customer.credit_status_changed',
      businessId,
      customerId,
      actorId,
      occurredAt: now(),
      clientEventId: `status:${this.nextEventId}`,
      reason,
    })
    return this.cloneCustomer(customer)
  }

  setCreditLimit(
    businessId: string,
    customerId: string,
    creditLimitMinor: bigint,
    actorId: string,
    actorRole: Role,
    reason?: string,
  ): Customer {
    this.assertManagement(
      actorRole,
      'Only management may configure credit limits',
    )
    if (creditLimitMinor < 0n)
      throw new CustomersCreditError(
        'INVALID_AMOUNT',
        'A credit limit must not be negative',
      )
    const customer = this.getCustomerRecord(businessId, customerId)
    customer.creditLimitMinor = creditLimitMinor
    this.append({
      type: 'customer.credit_limit_changed',
      businessId,
      customerId,
      actorId,
      occurredAt: now(),
      clientEventId: `limit:${this.nextEventId}`,
      amountMinor: creditLimitMinor,
      reason,
    })
    return this.cloneCustomer(customer)
  }

  recordCreditSale(input: CreditSaleInput): CreditHistoryEvent {
    const duplicate = this.findDuplicate(input.businessId, input.clientEventId)
    if (duplicate) return this.cloneEvent(duplicate)
    if (input.amountMinor <= 0n)
      throw new CustomersCreditError(
        'INVALID_AMOUNT',
        'A credit sale amount must be positive',
      )
    const customer = this.getCustomerRecord(input.businessId, input.customerId)
    if (customer.creditStatus === 'blocked')
      throw new CustomersCreditError(
        'CREDIT_NOT_ALLOWED',
        'Blocked customers cannot complete an ordinary credit sale',
      )
    if (customer.creditStatus === 'restricted')
      throw new CustomersCreditError(
        'RESTRICTED_CREDIT_CONFIGURATION_REQUIRED',
        'Restricted credit requires a configured management-handling rule',
      )
    this.assertSeparateApproval(
      'Credit sales require separate Manager or Owner approval',
      input.actorId,
      input.actorRole,
      input.creditApproval,
    )
    const currentOutstanding = this.getOutstandingForCustomer(
      input.businessId,
      input.customerId,
    ).minor
    const projectedOutstanding = currentOutstanding + input.amountMinor
    const limit = customer.creditLimitMinor
    const overLimit = limit !== undefined && projectedOutstanding > limit
    if (overLimit) {
      if (!input.overLimitApproval)
        throw new CustomersCreditError(
          'OVER_LIMIT_EXCEPTION_REQUIRED',
          'A credit sale above the configured limit requires a management exception',
        )
      this.assertSeparateApproval(
        'An over-limit credit sale requires separate Manager or Owner exception approval',
        input.actorId,
        input.actorRole,
        input.overLimitApproval,
      )
    }
    const debt: CreditDebt = {
      id: input.debtId,
      businessId: input.businessId,
      customerId: input.customerId,
      saleId: input.saleId,
      currency: customer.currency,
      originalAmountMinor: input.amountMinor,
      dueDate: input.dueDate,
      disputed: false,
      saleReversed: false,
    }
    this.debts.set(`${input.businessId}:${input.debtId}`, debt)
    return this.append({
      type: 'credit.sale.recorded',
      businessId: input.businessId,
      customerId: input.customerId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      occurredAt: input.occurredAt ?? now(),
      clientEventId: input.clientEventId,
      debtId: input.debtId,
      saleId: input.saleId,
      amountMinor: input.amountMinor,
      resultingOutstandingMinor: projectedOutstanding,
      approval: input.creditApproval,
      overLimitApproval: overLimit ? input.overLimitApproval : undefined,
      dueDate: input.dueDate,
    })
  }

  recordRepayment(input: RepaymentInput): CreditHistoryEvent {
    const duplicate = this.findDuplicate(input.businessId, input.clientEventId)
    if (duplicate) return this.cloneEvent(duplicate)
    const customer = this.getCustomerRecord(input.businessId, input.customerId)
    if (input.components.length === 0)
      throw new CustomersCreditError(
        'INVALID_REPAYMENT',
        'A repayment must contain at least one confirmed payment component',
      )
    let componentTotal = 0n
    for (const component of input.components) {
      if (component.amountMinor <= 0n)
        throw new CustomersCreditError(
          'INVALID_REPAYMENT',
          'Repayment components must be positive',
        )
      if (component.method === 'custom' && !component.customMethodId?.trim())
        throw new CustomersCreditError(
          'INVALID_REPAYMENT',
          'Custom repayment methods require a method ID',
        )
      if (component.confirmation.state !== 'confirmed_success')
        throw new CustomersCreditError(
          'INVALID_REPAYMENT',
          'Only confirmed successful repayments can be recorded',
        )
      componentTotal += component.amountMinor
    }
    if (input.allocations.length === 0)
      throw new CustomersCreditError(
        'INVALID_REPAYMENT',
        'A repayment must be allocated to at least one debt',
      )
    const allocationTotals = new Map<string, bigint>()
    let allocationTotal = 0n
    for (const allocation of input.allocations) {
      if (allocation.amountMinor <= 0n)
        throw new CustomersCreditError(
          'INVALID_REPAYMENT',
          'Repayment allocations must be positive',
        )
      const debt = this.getDebtRecord(
        input.businessId,
        input.customerId,
        allocation.debtId,
      )
      if (debt.currency !== customer.currency)
        throw new CustomersCreditError(
          'CURRENCY_MISMATCH',
          'Repayment currency must match the customer debt currency',
        )
      const previous = allocationTotals.get(allocation.debtId) ?? 0n
      allocationTotals.set(allocation.debtId, previous + allocation.amountMinor)
      allocationTotal += allocation.amountMinor
    }
    if (componentTotal !== allocationTotal)
      throw new CustomersCreditError(
        'ALLOCATION_MISMATCH',
        'Repayment components and debt allocations must equal the same amount',
      )
    for (const [debtId, amount] of allocationTotals) {
      const outstanding = this.getOutstandingForDebt(
        input.businessId,
        input.customerId,
        debtId,
      ).minor
      if (amount > outstanding)
        throw new CustomersCreditError(
          'ALLOCATION_EXCEEDS_OUTSTANDING',
          `Repayment allocation exceeds outstanding debt for ${debtId}`,
        )
    }
    const resultingOutstanding =
      this.getOutstandingForCustomer(input.businessId, input.customerId).minor -
      componentTotal
    return this.append({
      type: 'credit.repayment.recorded',
      businessId: input.businessId,
      customerId: input.customerId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      occurredAt: input.occurredAt ?? now(),
      clientEventId: input.clientEventId,
      referenceId: input.repaymentId,
      amountMinor: componentTotal,
      resultingOutstandingMinor: resultingOutstanding,
      allocations: input.allocations,
      components: input.components,
    })
  }

  recordApprovedReturn(input: DebtAmountInput): CreditHistoryEvent {
    const duplicate = this.findDuplicate(input.businessId, input.clientEventId)
    if (duplicate) return this.cloneEvent(duplicate)
    this.assertManagement(
      input.actorRole,
      'Only management may approve returns',
    )
    if (!input.reason.trim())
      throw new CustomersCreditError(
        'INVALID_RETURN',
        'A return reason is required',
      )
    if (input.amountMinor <= 0n)
      throw new CustomersCreditError(
        'INVALID_RETURN',
        'A return amount must be positive',
      )
    const outstanding = this.getOutstandingForDebt(
      input.businessId,
      input.customerId,
      input.debtId,
    ).minor
    if (input.amountMinor > outstanding)
      throw new CustomersCreditError(
        'INVALID_RETURN',
        'A return cannot reduce debt below zero',
      )
    return this.appendDebtReduction(
      input,
      'credit.return.recorded',
      outstanding,
    )
  }

  recordWriteOff(input: DebtAmountInput): CreditHistoryEvent {
    const duplicate = this.findDuplicate(input.businessId, input.clientEventId)
    if (duplicate) return this.cloneEvent(duplicate)
    this.assertManagement(
      input.actorRole,
      'Only management may approve a write-off',
    )
    if (!input.reason.trim())
      throw new CustomersCreditError(
        'INVALID_WRITE_OFF',
        'A write-off reason is required',
      )
    if (input.amountMinor <= 0n)
      throw new CustomersCreditError(
        'INVALID_WRITE_OFF',
        'A write-off amount must be positive',
      )
    const outstanding = this.getOutstandingForDebt(
      input.businessId,
      input.customerId,
      input.debtId,
    ).minor
    if (input.amountMinor > outstanding)
      throw new CustomersCreditError(
        'INVALID_WRITE_OFF',
        'A write-off cannot reduce debt below zero',
      )
    return this.appendDebtReduction(
      input,
      'credit.write_off.recorded',
      outstanding,
    )
  }

  validateCreditSaleCorrection(input: CorrectionInput): void {
    this.creditCorrectionContext(input)
  }

  correctCreditSale(input: CorrectionInput): CreditHistoryEvent {
    const context = this.creditCorrectionContext(input)
    if (context.duplicate) return this.cloneEvent(context.duplicate)
    const delta = input.correctedAmountMinor - context.priorEffectiveObligation
    return this.append({
      type: 'credit.correction.recorded',
      businessId: input.businessId,
      customerId: input.customerId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      occurredAt: input.occurredAt ?? now(),
      clientEventId: input.clientEventId,
      debtId: input.debtId,
      saleId: context.debt.saleId,
      amountMinor: delta < 0n ? -delta : delta,
      correctedAmountMinor: input.correctedAmountMinor,
      correctionIncreaseMinor: delta > 0n ? delta : 0n,
      correctionReductionMinor: delta < 0n ? -delta : 0n,
      resultingOutstandingMinor:
        input.correctedAmountMinor - context.nonCorrectionReductions,
      reason: input.reason,
    })
  }

  validateCreditSaleReversal(input: DebtAmountInput): void {
    this.creditReversalContext(input)
  }

  reverseCreditSale(input: DebtAmountInput): CreditHistoryEvent {
    const context = this.creditReversalContext(input)
    if (context.duplicate) return this.cloneEvent(context.duplicate)
    const outstanding = this.getOutstandingForDebt(
      input.businessId,
      input.customerId,
      input.debtId,
    ).minor
    context.debt.saleReversed = true
    return this.append({
      type: 'credit.sale.reversed',
      businessId: input.businessId,
      customerId: input.customerId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      occurredAt: input.occurredAt ?? now(),
      clientEventId: input.clientEventId,
      debtId: input.debtId,
      saleId: context.debt.saleId,
      amountMinor: outstanding,
      resultingOutstandingMinor: 0n,
      reason: input.reason,
    })
  }

  private creditCorrectionContext(input: CorrectionInput): {
    duplicate?: CreditHistoryEvent
    debt: CreditDebt
    priorEffectiveObligation: bigint
    nonCorrectionReductions: bigint
  } {
    const duplicate = this.findDuplicate(input.businessId, input.clientEventId)
    if (duplicate)
      return {
        duplicate,
        debt: this.getDebtRecord(
          input.businessId,
          input.customerId,
          input.debtId,
        ),
        priorEffectiveObligation: 0n,
        nonCorrectionReductions: 0n,
      }
    this.assertManagement(
      input.actorRole,
      'Only management may correct a credit sale',
    )
    if (!input.reason.trim())
      throw new CustomersCreditError(
        'INVALID_CORRECTION',
        'A correction reason is required',
      )
    const debt = this.getDebtRecord(
      input.businessId,
      input.customerId,
      input.debtId,
    )
    if (debt.saleReversed)
      throw new CustomersCreditError(
        'DEBT_ALREADY_REVERSED',
        'A reversed credit sale cannot be corrected',
      )
    const debtEvents = this.debtEvents(
      input.businessId,
      input.customerId,
      input.debtId,
    )
    const priorCorrectionIncrease = debtEvents.reduce(
      (sum, event) => sum + (event.correctionIncreaseMinor ?? 0n),
      0n,
    )
    const priorCorrectionReduction = debtEvents.reduce(
      (sum, event) => sum + (event.correctionReductionMinor ?? 0n),
      0n,
    )
    const priorEffectiveObligation =
      debt.originalAmountMinor +
      priorCorrectionIncrease -
      priorCorrectionReduction
    const nonCorrectionReductions = debtEvents.reduce((sum, event) => {
      if (
        event.type === 'credit.repayment.recorded' ||
        event.type === 'credit.return.recorded' ||
        event.type === 'credit.write_off.recorded'
      )
        return sum + (event.amountMinor ?? 0n)
      return sum
    }, 0n)
    if (input.correctedAmountMinor < nonCorrectionReductions)
      throw new CustomersCreditError(
        'INVALID_CORRECTION',
        'The corrected obligation cannot be reduced below repayments, returns and write-offs',
      )
    return { debt, priorEffectiveObligation, nonCorrectionReductions }
  }

  private creditReversalContext(input: DebtAmountInput): {
    duplicate?: CreditHistoryEvent
    debt: CreditDebt
  } {
    const duplicate = this.findDuplicate(input.businessId, input.clientEventId)
    if (duplicate)
      return {
        duplicate,
        debt: this.getDebtRecord(
          input.businessId,
          input.customerId,
          input.debtId,
        ),
      }
    this.assertManagement(
      input.actorRole,
      'Only management may reverse a credit sale',
    )
    if (!input.reason.trim())
      throw new CustomersCreditError(
        'INVALID_CORRECTION',
        'A reversal reason is required',
      )
    const debt = this.getDebtRecord(
      input.businessId,
      input.customerId,
      input.debtId,
    )
    if (debt.saleReversed)
      throw new CustomersCreditError(
        'DEBT_ALREADY_REVERSED',
        'The credit sale has already been reversed',
      )
    return { debt }
  }

  recordDispute(input: DisputeInput): CreditHistoryEvent {
    const duplicate = this.findDuplicate(input.businessId, input.clientEventId)
    if (duplicate) return this.cloneEvent(duplicate)
    const debt = this.getDebtRecord(
      input.businessId,
      input.customerId,
      input.debtId,
    )
    if (debt.disputed)
      throw new CustomersCreditError(
        'INVALID_DISPUTE',
        'The debt is already disputed',
      )
    if (!input.reason.trim())
      throw new CustomersCreditError(
        'INVALID_DISPUTE',
        'A dispute reason is required',
      )
    debt.disputed = true
    debt.disputeReason = input.reason
    return this.append({
      type: 'credit.dispute.recorded',
      businessId: input.businessId,
      customerId: input.customerId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      occurredAt: input.occurredAt ?? now(),
      clientEventId: input.clientEventId,
      debtId: input.debtId,
      saleId: debt.saleId,
      reason: input.reason,
    })
  }

  resolveDispute(input: DisputeResolutionInput): CreditHistoryEvent {
    const duplicate = this.findDuplicate(input.businessId, input.clientEventId)
    if (duplicate) return this.cloneEvent(duplicate)
    this.assertManagement(
      input.actorRole,
      'Only management may resolve a debt dispute',
    )
    const debt = this.getDebtRecord(
      input.businessId,
      input.customerId,
      input.debtId,
    )
    if (!debt.disputed)
      throw new CustomersCreditError(
        'INVALID_DISPUTE',
        'The debt is not disputed',
      )
    if (!input.resolution.trim())
      throw new CustomersCreditError(
        'INVALID_DISPUTE',
        'A dispute resolution is required',
      )
    debt.disputed = false
    debt.disputeReason = undefined
    return this.append({
      type: 'credit.dispute.resolved',
      businessId: input.businessId,
      customerId: input.customerId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      occurredAt: input.occurredAt ?? now(),
      clientEventId: input.clientEventId,
      debtId: input.debtId,
      saleId: debt.saleId,
      resolution: input.resolution,
    })
  }

  getCustomer(businessId: string, customerId: string): Customer | undefined {
    const customer = this.customers.get(`${businessId}:${customerId}`)
    return customer && this.cloneCustomer(customer)
  }

  listCustomers(businessId: string): Customer[] {
    return [...this.customers.values()]
      .filter((customer) => customer.businessId === businessId)
      .map((customer) => this.cloneCustomer(customer))
  }

  getDebt(
    businessId: string,
    customerId: string,
    debtId: string,
  ): DebtSnapshot | undefined {
    const debt = this.debts.get(`${businessId}:${debtId}`)
    if (
      !debt ||
      debt.customerId !== customerId ||
      debt.businessId !== businessId
    )
      return undefined
    return this.snapshotDebt(debt)
  }

  listDebts(businessId: string, customerId: string): DebtSnapshot[] {
    return [...this.debts.values()]
      .filter(
        (debt) =>
          debt.businessId === businessId && debt.customerId === customerId,
      )
      .map((debt) => this.snapshotDebt(debt))
  }

  getOutstandingForCustomer(businessId: string, customerId: string): Money {
    const customer = this.getCustomerRecord(businessId, customerId)
    const obligations: Money[] = []
    const repayments: Money[] = []
    const credits: Money[] = []
    const writeOffs: Money[] = []
    const corrections: Money[] = []
    for (const debt of this.listDebtRecords(businessId, customerId)) {
      obligations.push(moneyFromMinor(debt.currency, debt.originalAmountMinor))
      for (const event of this.debtEvents(businessId, customerId, debt.id)) {
        const amount = moneyFromMinor(
          debt.currency,
          this.amountForDebt(event, debt.id),
        )
        if (event.type === 'credit.repayment.recorded') repayments.push(amount)
        else if (
          event.type === 'credit.return.recorded' ||
          event.type === 'credit.write_off.recorded' ||
          event.type === 'credit.sale.reversed'
        )
          credits.push(amount)
        else if (event.type === 'credit.correction.recorded') {
          if (event.correctionIncreaseMinor)
            corrections.push(
              moneyFromMinor(debt.currency, event.correctionIncreaseMinor),
            )
          if (event.correctionReductionMinor)
            credits.push(
              moneyFromMinor(debt.currency, event.correctionReductionMinor),
            )
        }
      }
    }
    return customerOutstanding({
      currency: customer.currency,
      creditObligations: obligations,
      repayments,
      approvedReturnCredits: credits,
      approvedWriteOffs: writeOffs,
      corrections,
    })
  }

  listHistory(businessId: string, customerId?: string): CreditHistoryEvent[] {
    return this.events
      .filter(
        (event) =>
          event.businessId === businessId &&
          (customerId === undefined || event.customerId === customerId),
      )
      .map((event) => this.cloneEvent(event))
  }

  private getOutstandingForDebt(
    businessId: string,
    customerId: string,
    debtId: string,
  ): Money {
    const debt = this.getDebtRecord(businessId, customerId, debtId)
    const obligations: Money[] = [
      moneyFromMinor(debt.currency, debt.originalAmountMinor),
    ]
    const repayments: Money[] = []
    const credits: Money[] = []
    const writeOffs: Money[] = []
    const corrections: Money[] = []
    for (const event of this.debtEvents(businessId, customerId, debtId)) {
      const amount = moneyFromMinor(
        debt.currency,
        this.amountForDebt(event, debtId),
      )
      if (event.type === 'credit.repayment.recorded') repayments.push(amount)
      else if (event.type === 'credit.return.recorded') credits.push(amount)
      else if (event.type === 'credit.write_off.recorded')
        writeOffs.push(amount)
      else if (event.type === 'credit.sale.reversed') credits.push(amount)
      else if (event.type === 'credit.correction.recorded') {
        if (event.correctionIncreaseMinor)
          corrections.push(
            moneyFromMinor(debt.currency, event.correctionIncreaseMinor),
          )
        if (event.correctionReductionMinor)
          credits.push(
            moneyFromMinor(debt.currency, event.correctionReductionMinor),
          )
      }
    }
    return customerOutstanding({
      currency: debt.currency,
      creditObligations: obligations,
      repayments,
      approvedReturnCredits: credits,
      approvedWriteOffs: writeOffs,
      corrections,
    })
  }

  private appendDebtReduction(
    input: DebtAmountInput,
    type: 'credit.return.recorded' | 'credit.write_off.recorded',
    outstandingBefore: bigint,
  ): CreditHistoryEvent {
    return this.append({
      type,
      businessId: input.businessId,
      customerId: input.customerId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      occurredAt: input.occurredAt ?? now(),
      clientEventId: input.clientEventId,
      debtId: input.debtId,
      amountMinor: input.amountMinor,
      resultingOutstandingMinor: outstandingBefore - input.amountMinor,
      reason: input.reason,
    })
  }

  private snapshotDebt(debt: CreditDebt): DebtSnapshot {
    const outstanding = this.getOutstandingForDebt(
      debt.businessId,
      debt.customerId,
      debt.id,
    ).minor
    const events = this.debtEvents(debt.businessId, debt.customerId, debt.id)
    const repayments = events.some(
      (event) => event.type === 'credit.repayment.recorded',
    )
    const returns = events.some(
      (event) => event.type === 'credit.return.recorded',
    )
    const writeOffs = events.some(
      (event) => event.type === 'credit.write_off.recorded',
    )
    const corrections = events.some(
      (event) => event.type === 'credit.correction.recorded',
    )
    let state: DebtState
    if (debt.saleReversed) state = 'reversed'
    else if (outstanding > 0n)
      state = repayments ? 'partially_repaid' : 'outstanding'
    else if (writeOffs) state = 'written_off'
    else if (returns) state = 'cleared_by_return'
    else if (corrections) state = 'cleared_by_correction'
    else state = 'paid'
    const asOf = now()
    const isDue = debt.dueDate !== undefined && debt.dueDate <= asOf
    return {
      ...debt,
      outstandingMinor: outstanding,
      state,
      isDue,
      isOverdue: isDue && outstanding > 0n,
    }
  }

  private getCustomerRecord(businessId: string, customerId: string): Customer {
    const customer = this.customers.get(`${businessId}:${customerId}`)
    if (!customer)
      throw new CustomersCreditError(
        'CUSTOMER_NOT_FOUND',
        'Customer was not found in this business',
      )
    return customer
  }

  private getDebtRecord(
    businessId: string,
    customerId: string,
    debtId: string,
  ): CreditDebt {
    const debt = this.debts.get(`${businessId}:${debtId}`)
    if (
      !debt ||
      debt.businessId !== businessId ||
      debt.customerId !== customerId
    )
      throw new CustomersCreditError('DEBT_NOT_FOUND', 'Debt was not found')
    return debt
  }

  private listDebtRecords(
    businessId: string,
    customerId: string,
  ): CreditDebt[] {
    return [...this.debts.values()].filter(
      (debt) =>
        debt.businessId === businessId && debt.customerId === customerId,
    )
  }

  private debtEvents(
    businessId: string,
    customerId: string,
    debtId: string,
  ): CreditHistoryEvent[] {
    return this.events.filter(
      (event) =>
        event.businessId === businessId &&
        event.customerId === customerId &&
        (event.debtId === debtId ||
          event.allocations?.some(
            (allocation) => allocation.debtId === debtId,
          ) === true),
    )
  }

  private amountForDebt(event: CreditHistoryEvent, debtId: string): bigint {
    if (event.type !== 'credit.repayment.recorded')
      return event.amountMinor ?? 0n
    return (
      event.allocations
        ?.filter((allocation) => allocation.debtId === debtId)
        .reduce((sum, allocation) => sum + allocation.amountMinor, 0n) ?? 0n
    )
  }

  private findDuplicate(
    businessId: string,
    clientEventId: string,
  ): CreditHistoryEvent | undefined {
    return this.eventsByClientId.get(`${businessId}:${clientEventId}`)
  }

  private append(input: Omit<CreditHistoryEvent, 'id'>): CreditHistoryEvent {
    const event: CreditHistoryEvent = {
      ...input,
      id: `credit-event-${this.nextEventId++}`,
    }
    this.events.push(event)
    this.eventsByClientId.set(
      `${event.businessId}:${event.clientEventId}`,
      event,
    )
    return this.cloneEvent(event)
  }

  private assertManagement(role: Role, message: string): void {
    if (!isManagement(role))
      throw new CustomersCreditError(
        'MANAGEMENT_AUTHORIZATION_REQUIRED',
        message,
      )
  }

  private assertSeparateApproval(
    message: string,
    requesterId: string,
    requesterRole: Role,
    approval: ManagementAuthorization,
  ): void {
    if (
      !canApprove(
        requesterRole,
        approval.approverRole,
        requesterId,
        approval.approverId,
      )
    )
      throw new CustomersCreditError('CREDIT_APPROVAL_REQUIRED', message)
  }

  private cloneCustomer(customer: Customer): Customer {
    return { ...customer }
  }

  private cloneEvent(event: CreditHistoryEvent): CreditHistoryEvent {
    return {
      ...event,
      approval: event.approval && { ...event.approval },
      overLimitApproval: event.overLimitApproval && {
        ...event.overLimitApproval,
      },
      allocations: event.allocations?.map((allocation) => ({ ...allocation })),
      components: event.components?.map((component) => ({
        ...component,
        confirmation: { ...component.confirmation },
      })),
    }
  }
}
