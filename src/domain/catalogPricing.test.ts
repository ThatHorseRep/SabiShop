import { describe, expect, it } from 'vitest'
import { CatalogPricing, DomainError } from './catalogPricing'

const owner = { actorId: 'owner-1', role: 'owner' as const }
const manager = { actorId: 'manager-1', role: 'manager' as const }
const staff = { actorId: 'staff-1', role: 'staff' as const }

function catalog() {
  const domain = new CatalogPricing({
    belowFloorMode: 'block_until_authorized',
    incentivePercentage: 10,
    minimumQualifyingCompletedSales: 2,
  })
  domain.createProduct({
    id: 'p-1',
    sku: 'PUMP-001',
    name: 'Water pump',
    category: 'Pumps',
    unit: 'piece',
    aliases: ['pump', 'water machine'],
    modelOrPartNumber: 'WP-10',
    sellingPriceKobo: 500_000,
    priceFloorKobo: 450_000,
    active: true,
    availableForSale: true,
  })
  return domain
}

describe('catalog pricing domain', () => {
  it('uses normal pricing and records floor-based facts', () => {
    const domain = catalog()
    const line = domain.priceSaleLine({
      id: 'sale-1',
      productId: 'p-1',
      quantity: 1,
      salespersonId: 'staff-1',
      authorization: staff,
    })

    expect(line.unitPriceKobo).toBe(500_000)
    expect(domain.getIncentivePricingFacts(line.id).amountAboveFloorKobo).toBe(
      50_000,
    )
  })

  it('rejects a configured floor above the selling price', () => {
    const domain = catalog()

    expect(() =>
      domain.updatePricing('p-1', { sellingPriceKobo: 550_000 }, staff),
    ).toThrowError(/Owner or Manager/i)
    expect(() =>
      domain.updatePricing('p-1', { priceFloorKobo: 600_000 }, owner),
    ).toThrowError(DomainError)
  })

  it('requires and accepts an authorized below-floor exception', () => {
    const domain = catalog()
    expect(() =>
      domain.priceSaleLine({
        id: 'sale-1',
        productId: 'p-1',
        unitPriceKobo: 440_000,
        quantity: 1,
        salespersonId: 'staff-1',
        authorization: staff,
      }),
    ).toThrowError(/authorization/i)

    const line = domain.priceSaleLine({
      id: 'sale-2',
      productId: 'p-1',
      unitPriceKobo: 440_000,
      quantity: 1,
      salespersonId: 'staff-1',
      authorization: { ...manager, approvedBy: owner.actorId },
    })
    expect(line.belowFloor).toBe(true)
    expect(line.flaggedForReview).toBe(true)
  })

  it('does not save a failed sale attempt and allows a later retry', () => {
    const domain = catalog()

    expect(() =>
      domain.priceSaleLine({
        id: 'sale-failed',
        productId: 'p-1',
        unitPriceKobo: 440_000,
        quantity: 1,
        salespersonId: 'staff-1',
        authorization: staff,
      }),
    ).toThrowError(/authorization/i)

    const line = domain.priceSaleLine({
      id: 'sale-retry',
      productId: 'p-1',
      unitPriceKobo: 450_000,
      quantity: 1,
      salespersonId: 'staff-1',
      authorization: staff,
    })

    expect(line.id).toBe('sale-retry')
    expect(
      domain.getIncentivePricingFacts(line.id).qualifyingCompletedSalesCount,
    ).toBe(1)
  })

  it('applies discounts without allowing a floor bypass', () => {
    const domain = catalog()
    expect(() =>
      domain.priceSaleLine({
        id: 'sale-1',
        productId: 'p-1',
        quantity: 1,
        discount: { kind: 'percentage', value: 20 },
        salespersonId: 'staff-1',
        authorization: staff,
      }),
    ).toThrowError(/authorization/i)

    const line = domain.priceSaleLine({
      id: 'sale-2',
      productId: 'p-1',
      quantity: 1,
      discount: { kind: 'fixed', value: 50_000 },
      salespersonId: 'staff-1',
      authorization: staff,
    })
    expect(line.unitPriceKobo).toBe(450_000)
    expect(line.belowFloor).toBe(false)
  })

  it('keeps completed sale pricing immutable after product price edits', () => {
    const domain = catalog()
    const line = domain.priceSaleLine({
      id: 'sale-1',
      productId: 'p-1',
      quantity: 1,
      salespersonId: 'staff-1',
      authorization: staff,
    })
    domain.updatePricing(
      'p-1',
      { sellingPriceKobo: 550_000, priceFloorKobo: 500_000 },
      owner,
    )

    expect(line.unitPriceKobo).toBe(500_000)
    expect(domain.getPriceHistory('p-1')).toHaveLength(2)
  })

  it('recalculates the volume gate after a completed sale is reversed', () => {
    const domain = catalog()
    const first = domain.priceSaleLine({
      id: 'sale-1',
      productId: 'p-1',
      quantity: 1,
      salespersonId: 'staff-1',
      authorization: staff,
    })
    domain.priceSaleLine({
      id: 'sale-2',
      productId: 'p-1',
      quantity: 1,
      salespersonId: 'staff-1',
      authorization: staff,
    })
    expect(domain.getIncentivePricingFacts(first.id).volumeGateMet).toBe(true)

    domain.updateSaleLineStatus('sale-2', 'reversed')
    const facts = domain.getIncentivePricingFacts(first.id)
    expect(facts.qualifyingCompletedSalesCount).toBe(1)
    expect(facts.volumeGateMet).toBe(false)
    expect(facts.actualSellingValueKobo).toBe(500_000)
  })

  it('finds products by SKU, alias and part number', () => {
    const domain = catalog()
    expect(domain.searchProducts('water machine')).toHaveLength(1)
    expect(domain.searchProducts('WP-10')[0]?.sku).toBe('PUMP-001')
    expect(domain.searchProducts('unknown')).toHaveLength(0)
  })

  it('excludes inactive products from normal lookup and sale', () => {
    const domain = catalog()
    domain.setProductStatus('p-1', { active: false }, owner)

    expect(domain.searchProducts('pump')).toHaveLength(0)
    expect(domain.searchProducts('pump', true)).toHaveLength(1)
    expect(() =>
      domain.priceSaleLine({
        id: 'sale-1',
        productId: 'p-1',
        quantity: 1,
        salespersonId: 'staff-1',
        authorization: staff,
      }),
    ).toThrowError(/inactive/i)
  })
})
