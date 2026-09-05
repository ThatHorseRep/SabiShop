export type Role = 'owner' | 'manager' | 'staff' | 'salesperson'
export type BelowFloorMode = 'block_until_authorized' | 'allow_and_flag'
export type SaleLineStatus =
  'completed' | 'returned' | 'cancelled' | 'reversed' | 'corrected'

export type PricingAuthorization = {
  actorId: string
  role: Role
  approvedBy?: string
}

export type Product = {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  aliases: string[]
  modelOrPartNumber?: string
  sellingPriceKobo: number
  priceFloorKobo?: number
  active: boolean
  availableForSale: boolean
  createdAt: string
  updatedAt: string
}

export type PriceChange = {
  productId: string
  field: 'selling_price' | 'price_floor'
  previousValueKobo: number | null
  newValueKobo: number | null
  changedBy: string
  changedAt: string
}

export type Discount = {
  kind: 'percentage' | 'fixed'
  value: number
  reason?: string
}

export type SaleLine = {
  id: string
  productId: string
  productSku: string
  productName: string
  quantity: number
  unitPriceKobo: number
  effectiveFloorKobo: number
  discountKobo: number
  belowFloor: boolean
  flaggedForReview: boolean
  salespersonId: string
  completedAt: string
  status: SaleLineStatus
}

export type PricingSettings = {
  belowFloorMode: BelowFloorMode
  incentivePercentage: number
  minimumQualifyingCompletedSales: number
}

export type IncentivePricingFacts = {
  saleLineId: string
  actualSellingValueKobo: number
  effectiveFloorValueKobo: number
  amountAboveFloorKobo: number
  belowFloor: boolean
  qualifyingCompletedSalesCount: number
  minimumQualifyingCompletedSales: number
  volumeGateMet: boolean
  recalculatedAt: string
}

const managementRoles: Role[] = ['owner', 'manager']

function assertMoney(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new DomainError(
      'INVALID_MONEY',
      `${field} must be a non-negative integer`,
    )
  }
}

function assertManagementAuthorization(
  authorization: PricingAuthorization,
): void {
  if (!managementRoles.includes(authorization.role)) {
    throw new DomainError(
      'FORBIDDEN',
      'Only an Owner or Manager may change pricing configuration',
    )
  }
}

function now(): string {
  return new Date().toISOString()
}

export class DomainError extends Error {
  constructor(
    readonly code:
      | 'DUPLICATE_SKU'
      | 'INVALID_MONEY'
      | 'INVALID_PRICE_FLOOR'
      | 'FORBIDDEN'
      | 'PRODUCT_INACTIVE'
      | 'PRODUCT_UNAVAILABLE'
      | 'PRICE_BELOW_FLOOR'
      | 'AUTHORIZATION_REQUIRED'
      | 'INVALID_DISCOUNT'
      | 'INVALID_QUANTITY'
      | 'INVALID_SALE_STATUS',
    message: string,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class CatalogPricing {
  private readonly products = new Map<string, Product>()
  private readonly priceHistory: PriceChange[] = []
  private readonly saleLines: SaleLine[] = []

  constructor(
    private readonly settings: PricingSettings = {
      belowFloorMode: 'block_until_authorized',
      incentivePercentage: 0,
      minimumQualifyingCompletedSales: 0,
    },
  ) {
    if (
      settings.incentivePercentage < 0 ||
      settings.incentivePercentage > 100 ||
      !Number.isInteger(settings.minimumQualifyingCompletedSales) ||
      settings.minimumQualifyingCompletedSales < 0
    ) {
      throw new DomainError('INVALID_DISCOUNT', 'Invalid pricing settings')
    }
  }

  createProduct(input: Omit<Product, 'createdAt' | 'updatedAt'>): Product {
    if (
      [...this.products.values()].some((product) => product.sku === input.sku)
    ) {
      throw new DomainError('DUPLICATE_SKU', `SKU ${input.sku} already exists`)
    }
    assertMoney(input.sellingPriceKobo, 'sellingPriceKobo')
    if (
      input.priceFloorKobo !== undefined &&
      (input.priceFloorKobo > input.sellingPriceKobo ||
        input.priceFloorKobo < 0 ||
        !Number.isInteger(input.priceFloorKobo))
    ) {
      throw new DomainError(
        'INVALID_PRICE_FLOOR',
        'Price floor must not exceed the selling price',
      )
    }
    const timestamp = now()
    const product = { ...input, createdAt: timestamp, updatedAt: timestamp }
    this.products.set(product.id, product)
    return { ...product, aliases: [...product.aliases] }
  }

  updatePricing(
    productId: string,
    changes: { sellingPriceKobo?: number; priceFloorKobo?: number },
    authorization: PricingAuthorization,
  ): Product {
    assertManagementAuthorization(authorization)
    const product = this.requireProduct(productId)
    const sellingPriceKobo =
      changes.sellingPriceKobo ?? product.sellingPriceKobo
    const priceFloorKobo =
      changes.priceFloorKobo !== undefined
        ? changes.priceFloorKobo
        : product.priceFloorKobo
    assertMoney(sellingPriceKobo, 'sellingPriceKobo')
    if (
      priceFloorKobo !== undefined &&
      (!Number.isInteger(priceFloorKobo) ||
        priceFloorKobo < 0 ||
        priceFloorKobo > sellingPriceKobo)
    ) {
      throw new DomainError(
        'INVALID_PRICE_FLOOR',
        'Price floor must not exceed the selling price',
      )
    }

    const changedAt = now()
    if (sellingPriceKobo !== product.sellingPriceKobo) {
      this.priceHistory.push({
        productId,
        field: 'selling_price',
        previousValueKobo: product.sellingPriceKobo,
        newValueKobo: sellingPriceKobo,
        changedBy: authorization.actorId,
        changedAt,
      })
    }
    if (priceFloorKobo !== product.priceFloorKobo) {
      this.priceHistory.push({
        productId,
        field: 'price_floor',
        previousValueKobo: product.priceFloorKobo ?? null,
        newValueKobo: priceFloorKobo ?? null,
        changedBy: authorization.actorId,
        changedAt,
      })
    }
    const updated = {
      ...product,
      sellingPriceKobo,
      priceFloorKobo,
      updatedAt: changedAt,
    }
    this.products.set(productId, updated)
    return { ...updated, aliases: [...updated.aliases] }
  }

  setProductStatus(
    productId: string,
    status: { active?: boolean; availableForSale?: boolean },
    authorization: PricingAuthorization,
  ): Product {
    assertManagementAuthorization(authorization)
    const product = this.requireProduct(productId)
    const updated = { ...product, ...status, updatedAt: now() }
    this.products.set(productId, updated)
    return { ...updated, aliases: [...updated.aliases] }
  }

  searchProducts(query: string, includeInactive = false): Product[] {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return [...this.products.values()]
      .filter(
        (product) =>
          (includeInactive || (product.active && product.availableForSale)) &&
          (normalizedQuery.length === 0 ||
            [
              product.name,
              product.sku,
              product.category,
              product.unit,
              product.modelOrPartNumber,
              ...product.aliases,
            ]
              .filter(Boolean)
              .some((field) =>
                field!.toLocaleLowerCase().includes(normalizedQuery),
              )),
      )
      .map((product) => ({ ...product, aliases: [...product.aliases] }))
  }

  priceSaleLine(input: {
    id: string
    productId: string
    quantity: number
    unitPriceKobo?: number
    discount?: Discount
    salespersonId: string
    completedAt?: string
    authorization: PricingAuthorization
  }): SaleLine {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new DomainError(
        'INVALID_QUANTITY',
        'Quantity must be a positive integer',
      )
    }
    const product = this.requireProduct(input.productId)
    if (!product.active) {
      throw new DomainError(
        'PRODUCT_INACTIVE',
        'Inactive products cannot be sold',
      )
    }
    if (!product.availableForSale) {
      throw new DomainError(
        'PRODUCT_UNAVAILABLE',
        'Product is unavailable for sale',
      )
    }
    const unitPriceKobo = input.unitPriceKobo ?? product.sellingPriceKobo
    assertMoney(unitPriceKobo, 'unitPriceKobo')
    const discountKobo = this.discountFor(unitPriceKobo, input.discount)
    const actualUnitPriceKobo = unitPriceKobo - discountKobo
    const effectiveFloorKobo =
      product.priceFloorKobo ?? product.sellingPriceKobo
    const belowFloor = actualUnitPriceKobo < effectiveFloorKobo

    if (
      belowFloor &&
      this.settings.belowFloorMode === 'block_until_authorized'
    ) {
      if (
        !input.authorization.approvedBy ||
        !managementRoles.includes(input.authorization.role) ||
        input.authorization.approvedBy === input.authorization.actorId
      ) {
        throw new DomainError(
          'AUTHORIZATION_REQUIRED',
          'A below-floor sale requires Owner or Manager authorization',
        )
      }
    }
    if (
      actualUnitPriceKobo === 0 &&
      (!input.authorization.approvedBy ||
        !managementRoles.includes(input.authorization.role) ||
        input.authorization.approvedBy === input.authorization.actorId)
    ) {
      throw new DomainError(
        'AUTHORIZATION_REQUIRED',
        'A free sale requires Owner or Manager authorization',
      )
    }

    const line: SaleLine = {
      id: input.id,
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      quantity: input.quantity,
      unitPriceKobo: actualUnitPriceKobo,
      effectiveFloorKobo,
      discountKobo,
      belowFloor,
      flaggedForReview: belowFloor,
      salespersonId: input.salespersonId,
      completedAt: input.completedAt ?? now(),
      status: 'completed',
    }
    this.saleLines.push(line)
    return { ...line }
  }

  getPriceHistory(productId: string): PriceChange[] {
    return this.priceHistory
      .filter((change) => change.productId === productId)
      .map((change) => ({ ...change }))
  }

  updateSaleLineStatus(
    saleLineId: string,
    status: Exclude<SaleLineStatus, 'completed'>,
  ): SaleLine {
    const line = this.saleLines.find((sale) => sale.id === saleLineId)
    if (!line) throw new Error(`Sale line ${saleLineId} was not found`)
    if (!['returned', 'cancelled', 'reversed', 'corrected'].includes(status)) {
      throw new DomainError('INVALID_SALE_STATUS', 'Invalid sale-line status')
    }
    line.status = status
    return { ...line }
  }

  getIncentivePricingFacts(
    saleLineId: string,
    recalculatedAt = now(),
  ): IncentivePricingFacts {
    const line = this.saleLines.find((sale) => sale.id === saleLineId)
    if (!line) throw new Error(`Sale line ${saleLineId} was not found`)
    const qualifyingCompletedSalesCount = this.saleLines.filter(
      (sale) =>
        sale.salespersonId === line.salespersonId &&
        sale.status === 'completed' &&
        !sale.belowFloor,
    ).length
    return {
      saleLineId,
      actualSellingValueKobo: line.unitPriceKobo * line.quantity,
      effectiveFloorValueKobo: line.effectiveFloorKobo * line.quantity,
      amountAboveFloorKobo: Math.max(
        0,
        (line.unitPriceKobo - line.effectiveFloorKobo) * line.quantity,
      ),
      belowFloor: line.belowFloor,
      qualifyingCompletedSalesCount,
      minimumQualifyingCompletedSales:
        this.settings.minimumQualifyingCompletedSales,
      volumeGateMet:
        qualifyingCompletedSalesCount >=
        this.settings.minimumQualifyingCompletedSales,
      recalculatedAt,
    }
  }

  private discountFor(unitPriceKobo: number, discount?: Discount): number {
    if (!discount) return 0
    if (!Number.isFinite(discount.value) || discount.value < 0) {
      throw new DomainError('INVALID_DISCOUNT', 'Discount must be non-negative')
    }
    const discountKobo =
      discount.kind === 'percentage'
        ? Math.round((unitPriceKobo * discount.value) / 100)
        : discount.value
    if (
      !Number.isInteger(discountKobo) ||
      discountKobo > unitPriceKobo ||
      (discount.kind === 'percentage' && discount.value > 100)
    ) {
      throw new DomainError(
        'INVALID_DISCOUNT',
        'Discount cannot make the price negative',
      )
    }
    return discountKobo
  }

  private requireProduct(productId: string): Product {
    const product = this.products.get(productId)
    if (!product) throw new Error(`Product ${productId} was not found`)
    return product
  }
}
