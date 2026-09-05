import { describe, expect, it } from 'vitest'
import {
  calculateSaleFinancials,
  cogsForQuantity,
  customerOutstanding,
  formatMoney,
  money,
  quantity,
  supplierOutstanding,
  taxFromNet,
  taxFromTotal,
  weightedAverageUnitCost,
} from './finance'

describe('financial primitives', () => {
  it('represents kobo exactly and rounds half up', () => {
    expect(formatMoney(money('NGN', '1.005'))).toBe('NGN 1.01')
    expect(formatMoney(money('NGN', '0'))).toBe('NGN 0.00')
  })

  it('rejects binary-number money inputs and negative authoritative amounts', () => {
    expect(() => money('NGN', '-1')).toThrow()
    expect(() => money('NGN', '1e3')).toThrow()
  })

  it('supports fractional quantities deterministically', () => {
    const inventory = {
      quantity: quantity('20'),
      cost: money('NGN', '22900'),
    }
    expect(formatMoney(weightedAverageUnitCost(inventory))).toBe('NGN 1145.00')
    expect(formatMoney(cogsForQuantity(inventory, quantity('0.5')))).toBe(
      'NGN 572.50',
    )
  })

  it('calculates tax separately for exclusive and inclusive totals', () => {
    expect(formatMoney(taxFromNet(money('NGN', '100'), 750n).tax)).toBe(
      'NGN 7.50',
    )
    expect(formatMoney(taxFromTotal(money('NGN', '107.50'), 750n).net)).toBe(
      'NGN 100.00',
    )
  })

  it('calculates gross profit from net recognized selling value minus COGS', () => {
    const result = calculateSaleFinancials({
      currency: 'NGN',
      unitSellingPrice: money('NGN', '1300'),
      quantity: quantity('2'),
      approvedDiscount: money('NGN', '100'),
      taxRateBasisPoints: 750n,
      taxMode: 'exclusive',
      inventory: {
        quantity: quantity('20'),
        cost: money('NGN', '22900'),
      },
    })
    expect(formatMoney(result.grossSellingValue)).toBe('NGN 2600.00')
    expect(formatMoney(result.netRecognizedSellingValue)).toBe('NGN 2500.00')
    expect(formatMoney(result.cogs)).toBe('NGN 2290.00')
    expect(formatMoney(result.grossProfit)).toBe('NGN 210.00')
    expect(formatMoney(result.tax)).toBe('NGN 187.50')
  })

  it('keeps returns, repayments and corrections additive in outstanding balances', () => {
    const customer = customerOutstanding({
      currency: 'NGN',
      creditObligations: [money('NGN', '1000')],
      repayments: [money('NGN', '200')],
      approvedReturnCredits: [money('NGN', '100')],
      approvedWriteOffs: [money('NGN', '50')],
      corrections: [money('NGN', '25')],
    })
    expect(formatMoney(customer)).toBe('NGN 675.00')

    const result = supplierOutstanding({
      currency: 'NGN',
      receivedObligations: [money('NGN', '1000'), money('NGN', '500')],
      settlements: [money('NGN', '400')],
      unpaidReturns: [money('NGN', '100')],
      paidReturnCredits: [money('NGN', '50')],
      corrections: [money('NGN', '25')],
    })
    expect(formatMoney(result)).toBe('NGN 975.00')
  })

  it('does not invent COGS when stock has no reliable positive cost basis', () => {
    expect(() =>
      cogsForQuantity(
        { quantity: quantity('0'), cost: money('NGN', '0') },
        quantity('3'),
      ),
    ).toThrow(/quantity must be positive/i)
  })

  it('rejects an over-discount and preserves zero tax/COGS behavior', () => {
    expect(() =>
      calculateSaleFinancials({
        currency: 'NGN',
        unitSellingPrice: money('NGN', '0'),
        quantity: quantity('0'),
        approvedDiscount: money('NGN', '0.01'),
        taxRateBasisPoints: 0n,
        taxMode: 'exclusive',
        inventory: { quantity: quantity('1'), cost: money('NGN', '0') },
      }),
    ).toThrow()
  })
})
