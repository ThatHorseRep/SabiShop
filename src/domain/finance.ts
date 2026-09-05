export type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR' | 'JPY'

export type Money = Readonly<{
  currency: Currency
  minor: bigint
}>

export type Quantity = Readonly<{
  numerator: bigint
  denominator: bigint
}>

export type TaxMode = 'exclusive' | 'inclusive'

export type SaleFinancials = Readonly<{
  grossSellingValue: Money
  approvedDiscount: Money
  netRecognizedSellingValue: Money
  tax: Money
  totalDue: Money
  cogs: Money
  grossProfit: Money
}>

export type WeightedAverageInventory = Readonly<{
  quantity: Quantity
  cost: Money
}>

const CURRENCY_EXPONENT: Record<Currency, number> = {
  NGN: 2,
  USD: 2,
  GBP: 2,
  EUR: 2,
  JPY: 0,
}

const pow10 = (exponent: number): bigint => 10n ** BigInt(exponent)

const gcd = (a: bigint, b: bigint): bigint => {
  let left = a < 0n ? -a : a
  let right = b < 0n ? -b : b
  while (right !== 0n) {
    const remainder = left % right
    left = right
    right = remainder
  }
  return left
}

const normalizeQuantity = (quantity: Quantity): Quantity => {
  if (quantity.denominator <= 0n) {
    throw new Error('quantity denominator must be positive')
  }
  const divisor = gcd(quantity.numerator, quantity.denominator)
  return {
    numerator: quantity.numerator / divisor,
    denominator: quantity.denominator / divisor,
  }
}

const assertSameCurrency = (left: Money, right: Money): void => {
  if (left.currency !== right.currency) {
    throw new Error(`currency mismatch: ${left.currency} and ${right.currency}`)
  }
}

const assertNonNegative = (value: bigint, label: string): void => {
  if (value < 0n) {
    throw new Error(`${label} must not be negative`)
  }
}

const roundHalfUp = (numerator: bigint, denominator: bigint): bigint => {
  if (denominator <= 0n) {
    throw new Error('rounding denominator must be positive')
  }
  const sign = numerator < 0n ? -1n : 1n
  const magnitude = numerator < 0n ? -numerator : numerator
  const rounded = (magnitude * 2n + denominator) / (2n * denominator)
  return sign * rounded
}

const decimalToFraction = (value: string, label: string): Quantity => {
  const trimmed = value.trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(trimmed)) {
    throw new Error(`${label} must be a non-negative decimal string`)
  }
  const [whole, fraction = ''] = trimmed.split('.')
  const denominator = pow10(fraction.length)
  return normalizeQuantity({
    numerator: BigInt(whole) * denominator + BigInt(fraction || '0'),
    denominator,
  })
}

export const quantity = (value: string): Quantity =>
  decimalToFraction(value, 'quantity')

export const money = (currency: Currency, amount: string): Money => {
  const parsed = decimalToFraction(amount, 'money amount')
  const scale = pow10(CURRENCY_EXPONENT[currency])
  const minor = roundHalfUp(parsed.numerator * scale, parsed.denominator)
  assertNonNegative(minor, 'money amount')
  return { currency, minor }
}

export const moneyFromMinor = (currency: Currency, minor: bigint): Money => {
  assertNonNegative(minor, 'money amount')
  return { currency, minor }
}

export const zeroMoney = (currency: Currency): Money =>
  moneyFromMinor(currency, 0n)

export const addMoney = (left: Money, right: Money): Money => {
  assertSameCurrency(left, right)
  return moneyFromMinor(left.currency, left.minor + right.minor)
}

export const subtractMoney = (left: Money, right: Money): Money => {
  assertSameCurrency(left, right)
  return { currency: left.currency, minor: left.minor - right.minor }
}

export const multiplyMoney = (value: Money, factor: Quantity): Money => {
  return {
    currency: value.currency,
    minor: roundHalfUp(value.minor * factor.numerator, factor.denominator),
  }
}

export const formatMoney = (value: Money): string => {
  const exponent = CURRENCY_EXPONENT[value.currency]
  const scale = pow10(exponent)
  const whole = value.minor / scale
  const fraction = (value.minor % scale).toString().padStart(exponent, '0')
  return exponent === 0
    ? `${value.currency} ${whole}`
    : `${value.currency} ${whole}.${fraction}`
}

export const taxFromNet = (
  net: Money,
  taxRateBasisPoints: bigint,
): { net: Money; tax: Money; total: Money } => {
  assertNonNegative(taxRateBasisPoints, 'tax rate')
  const tax = moneyFromMinor(
    net.currency,
    roundHalfUp(net.minor * taxRateBasisPoints, 10_000n),
  )
  return { net, tax, total: addMoney(net, tax) }
}

export const taxFromTotal = (
  total: Money,
  taxRateBasisPoints: bigint,
): { net: Money; tax: Money; total: Money } => {
  assertNonNegative(taxRateBasisPoints, 'tax rate')
  const tax = moneyFromMinor(
    total.currency,
    roundHalfUp(total.minor * taxRateBasisPoints, 10_000n + taxRateBasisPoints),
  )
  return { net: subtractMoney(total, tax), tax, total }
}

export const weightedAverageUnitCost = (
  inventory: WeightedAverageInventory,
): Money => {
  if (inventory.quantity.numerator <= 0n) {
    throw new Error('inventory quantity must be positive')
  }
  return moneyFromMinor(
    inventory.cost.currency,
    roundHalfUp(
      inventory.cost.minor * inventory.quantity.denominator,
      inventory.quantity.numerator,
    ),
  )
}

export const cogsForQuantity = (
  inventory: WeightedAverageInventory,
  soldQuantity: Quantity,
): Money => {
  if (soldQuantity.numerator < 0n) {
    throw new Error('sold quantity must not be negative')
  }
  return multiplyMoney(weightedAverageUnitCost(inventory), soldQuantity)
}

export const calculateSaleFinancials = (input: {
  currency: Currency
  unitSellingPrice: Money
  quantity: Quantity
  approvedDiscount: Money
  taxRateBasisPoints: bigint
  taxMode: TaxMode
  inventory: WeightedAverageInventory
  cogsQuantity?: Quantity
}): SaleFinancials => {
  const grossSellingValue = multiplyMoney(
    input.unitSellingPrice,
    input.quantity,
  )
  assertSameCurrency(grossSellingValue, input.approvedDiscount)
  if (input.approvedDiscount.minor > grossSellingValue.minor) {
    throw new Error('approved discount cannot exceed gross selling value')
  }
  const netRecognizedSellingValue = subtractMoney(
    grossSellingValue,
    input.approvedDiscount,
  )
  const taxed =
    input.taxMode === 'exclusive'
      ? taxFromNet(netRecognizedSellingValue, input.taxRateBasisPoints)
      : taxFromTotal(netRecognizedSellingValue, input.taxRateBasisPoints)
  const cogs = cogsForQuantity(
    input.inventory,
    input.cogsQuantity ?? input.quantity,
  )
  return {
    grossSellingValue,
    approvedDiscount: input.approvedDiscount,
    netRecognizedSellingValue,
    tax: taxed.tax,
    totalDue: taxed.total,
    cogs,
    grossProfit: subtractMoney(netRecognizedSellingValue, cogs),
  }
}

export const outstandingBalance = (input: {
  currency: Currency
  obligations: readonly Money[]
  repayments: readonly Money[]
  credits: readonly Money[]
  writeOffs: readonly Money[]
  corrections?: readonly Money[]
}): Money => {
  const total = [...input.obligations, ...(input.corrections ?? [])].reduce(
    (sum, value) => addMoney(sum, value),
    zeroMoney(input.currency),
  )
  const reductions = [
    ...input.repayments,
    ...input.credits,
    ...input.writeOffs,
  ].reduce((sum, value) => addMoney(sum, value), zeroMoney(input.currency))
  return subtractMoney(total, reductions)
}

export const customerOutstanding = (input: {
  currency: Currency
  creditObligations: readonly Money[]
  repayments: readonly Money[]
  approvedReturnCredits: readonly Money[]
  approvedWriteOffs: readonly Money[]
  corrections?: readonly Money[]
}): Money =>
  outstandingBalance({
    currency: input.currency,
    obligations: input.creditObligations,
    repayments: input.repayments,
    credits: input.approvedReturnCredits,
    writeOffs: input.approvedWriteOffs,
    corrections: input.corrections,
  })

export const supplierOutstanding = (input: {
  currency: Currency
  receivedObligations: readonly Money[]
  settlements: readonly Money[]
  unpaidReturns: readonly Money[]
  paidReturnCredits: readonly Money[]
  corrections?: readonly Money[]
}): Money =>
  outstandingBalance({
    currency: input.currency,
    obligations: input.receivedObligations,
    repayments: input.settlements,
    credits: [...input.unpaidReturns, ...input.paidReturnCredits],
    writeOffs: [],
    corrections: input.corrections,
  })
