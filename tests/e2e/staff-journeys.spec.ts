import { expect, test, type Page } from '@playwright/test'
import {
  addProduct,
  completeSale,
  confirmPayment,
  navigate,
  openApp,
  openTab,
  selectCustomer,
} from './support'

type StoredOperation = {
  operationId: string
  type: string
  syncState: string
  serverAcceptance: string
  conflict?: unknown
}

async function injectManagementConflict(page: Page) {
  const operationId = await page.evaluate(() => {
    const key = 'sabi-shop.sync.operations'
    const raw = window.localStorage.getItem(key)
    if (!raw) throw new Error('The offline sale did not create a sync record')

    const operations = JSON.parse(raw) as StoredOperation[]
    const operation = operations.find((item) => item.type === 'sale.complete')
    if (!operation) throw new Error('No completed sale operation was stored')

    operation.syncState = 'CONFLICT'
    operation.serverAcceptance = 'conflict'
    operation.conflict = {
      code: 'operation_identity_reused',
      message:
        'The same operation identity was delivered with different content.',
      conflictingOperationIds: [operation.operationId],
      requiresHumanReview: true,
      escalatedTo: 'management_review',
    }
    window.localStorage.setItem(key, JSON.stringify(operations))
    return operation.operationId
  })

  expect(operationId).toContain('sale-complete:')
  await page.reload()
}

test.describe('Staff selling journey', () => {
  test('STAFF-01 signs in through the reference session and a cash sale reduces sellable stock', async ({
    page,
  }) => {
    await openApp(page, 'user-chidi')
    await expect(
      page.getByRole('button', { name: /Chidi Okoro Staff/i }),
    ).toBeVisible()

    await navigate(page, 'Sell')
    await addProduct(page, 'Car Battery 12V 65Ah')
    await expect(page.getByText('₦95,000.00').first()).toBeVisible()
    await confirmPayment(page, 'Cash', 'Confirm cash received')
    await completeSale(page)

    await page.getByRole('button', { name: 'View receipt' }).click()
    const receipt = page.getByRole('dialog', { name: /Receipt SR-/ })
    await expect(receipt.getByText('Nkechi Hardware')).toBeVisible()
    await expect(receipt.getByText('Car Battery 12V 65Ah')).toBeVisible()
    await expect(receipt.getByText('Cash ₦95,000.00')).toBeVisible()
    await receipt.getByRole('button', { name: 'Close dialog' }).click()

    // Seeded stock was five. After one sale, a new basket of five must be
    // blocked instead of silently creating more inventory.
    await page.getByRole('button', { name: 'New sale' }).click()
    await addProduct(page, 'Car Battery 12V 65Ah')
    for (let index = 0; index < 4; index += 1) {
      await page
        .getByRole('button', { name: /Increase Car Battery.*quantity/i })
        .click()
    }
    await expect(page.getByText('Not enough sellable stock')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()
  })

  test('STAFF-02 uses permitted bank-transfer and custom payment methods', async ({
    page,
  }) => {
    await openApp(page, 'user-chidi')
    await navigate(page, 'Sell')

    await addProduct(page, 'Wiper Blade 22 inch')
    await page.getByRole('button', { name: 'Transfer', exact: true }).click()
    await expect(page.getByText('Not confirmed').first()).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()
    await page
      .getByRole('textbox', { name: /reference for bank transfer/i })
      .fill('NIP-99123')
    await page
      .getByRole('button', { name: 'Confirm transfer received' })
      .click()
    await completeSale(page)
    await expect(page.getByText(/Bank transfer ₦5,200\.00/)).toBeVisible()

    await page.getByRole('button', { name: 'New sale' }).click()
    await addProduct(page, 'Spark Plug NGK')
    await confirmPayment(page, 'USSD Transfer', 'Confirm payment received')
    await completeSale(page)
    await expect(page.getByText(/USSD Transfer ₦850\.00/)).toBeVisible()
  })

  test('STAFF-03 treats a failed card payment as unsuccessful and recovers without recording it', async ({
    page,
  }) => {
    await openApp(page, 'user-chidi')
    await navigate(page, 'Sell')
    await addProduct(page, 'Spark Plug NGK')

    await page.getByRole('button', { name: 'POS / Card' }).click()
    await page.getByRole('button', { name: 'Mark as failed' }).click()
    await expect(page.getByText('Payment failed').first()).toBeVisible()
    await expect(
      page.getByText(/not recorded as a successful payment/i),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()

    await page.getByRole('button', { name: 'Retry' }).click()
    await page.getByRole('button', { name: 'Confirm card approved' }).click()
    await completeSale(page)
    await expect(page.getByText(/POS \/ Card ₦850\.00/)).toBeVisible()
  })

  test('STAFF-04 completes an authorized credit sale and the customer debt becomes observable', async ({
    page,
  }) => {
    await openApp(page, 'user-chidi')
    await navigate(page, 'Sell')
    await addProduct(page, 'Brake Pads Front')
    await selectCustomer(page, 'Ada Obi')
    await expect(page.getByText('Credit allowed').first()).toBeVisible()

    await confirmPayment(page, 'Credit', 'Confirm credit approved')
    const approval = page.getByRole('dialog', {
      name: 'Credit sale approval',
    })
    await expect(
      approval.getByText(/Outstanding debt will increase by 18,000\.00/),
    ).toBeVisible()
    await expect(
      approval.getByText(
        /Outstanding debt becomes 18,000\.00 of 150,000\.00 limit/,
      ),
    ).toBeVisible()
    await approval.getByRole('button', { name: 'Approve' }).click()
    await completeSale(page)
    await expect(page.getByText(/Customer: Ada Obi/i)).toBeVisible()

    // The credit engine—not just the receipt—must carry the new obligation.
    await page.getByRole('button', { name: 'New sale' }).click()
    await addProduct(page, 'Spark Plug NGK')
    await selectCustomer(page, 'Ada Obi')
    await expect(page.getByText('₦18,000.00').first()).toBeVisible()
  })

  test('STAFF-05 receives honest operational feedback for blocked credit and is denied management-only corrections', async ({
    page,
  }) => {
    await openApp(page, 'user-chidi')
    await navigate(page, 'Sell')
    await addProduct(page, 'Spark Plug NGK')
    await selectCustomer(page, 'Tunde Bala')
    await page.getByRole('button', { name: 'Credit', exact: true }).click()
    await expect(page.getByText(/Tunde Bala cannot use credit/i)).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Complete Sale/i }),
    ).toBeDisabled()

    await navigate(page, 'Money')
    const abandonDialog = page.getByRole('dialog', {
      name: 'Leave the unfinished sale?',
    })
    await abandonDialog.getByRole('button', { name: 'Clear basket' }).click()
    await expect(page.getByRole('button', { name: 'Management' })).toHaveCount(
      0,
    )
    await openTab(page, 'Corrections')
    await page.getByRole('button', { name: /SAL-3001/ }).click()
    await page.getByRole('button', { name: 'Correct record' }).click()
    const dialog = page.getByRole('dialog', { name: 'Correct record' })
    await dialog.getByLabel('What is incorrect?').selectOption('quantity')
    await dialog.getByLabel('Corrected quantity').fill('1')
    await dialog.getByLabel('Reason').fill('Wrong quantity recorded.')
    await expect(
      dialog.getByRole('button', { name: 'Apply correction' }),
    ).toBeDisabled()
    await expect(
      dialog.getByText(/Staff cannot apply this correction/i),
    ).toBeVisible()
  })

  test('STAFF-06 records an offline sale and synchronizes it when connectivity returns', async ({
    page,
  }) => {
    await openApp(page, 'user-chidi')
    await page.context().setOffline(true)
    await navigate(page, 'Sell')
    await addProduct(page, 'Spark Plug NGK')
    await confirmPayment(page, 'Cash', 'Confirm cash received')
    await completeSale(page)

    await expect(
      page.getByText('Recorded on this device · Sync pending'),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Synchronize now' }),
    ).toHaveCount(0)

    await page.context().setOffline(false)
    await page.getByRole('button', { name: 'Synchronize now' }).click()
    await expect(
      page.getByText('Recorded on this device · Sync pending'),
    ).toBeHidden()
  })

  test('STAFF-07 can count and prepare reconciliation but cannot confirm the official result', async ({
    page,
  }) => {
    await openApp(page, 'user-chidi')
    await navigate(page, 'Money')
    await openTab(page, 'Reconciliation')

    await page.getByRole('button', { name: 'Count cash' }).click()
    const dialog = page.getByRole('dialog', { name: 'Count cash' })
    await dialog.getByLabel('Counted cash (₦)').fill('143500')
    await dialog.getByRole('button', { name: 'Record physical count' }).click()
    await expect(
      page.getByText('Physical count recorded').first(),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Prepare reconciliation' }).click()
    await expect(
      page.getByText('Reconciliation prepared').first(),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: 'Discrepancy requiring investigation',
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Confirm reconciliation' }),
    ).toBeDisabled()
    await expect(
      page.getByText(/Management confirms the official reconciliation/i),
    ).toBeVisible()
  })

  test('STAFF-08 surfaces a sync conflict for management review without discarding local work', async ({
    page,
  }) => {
    await openApp(page, 'user-chidi')
    await page.context().setOffline(true)
    await navigate(page, 'Sell')
    await addProduct(page, 'Spark Plug NGK')
    await confirmPayment(page, 'Cash', 'Confirm cash received')
    await completeSale(page)

    await page.context().setOffline(false)
    await injectManagementConflict(page)
    await page.getByRole('button', { name: /Two versions · 1/ }).click()
    await expect(
      page.getByRole('heading', { name: 'System state' }),
    ).toBeVisible()
    await expect(
      page.getByText(/manager or owner must review both versions/i),
    ).toBeVisible()
  })

  test('STAFF-09 completes a phone-sized sale without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openApp(page, 'user-chidi')
    const mobileNav = page.getByRole('navigation', { name: 'Primary mobile' })
    await expect(mobileNav).toBeVisible()
    await mobileNav.getByRole('button', { name: 'Sell', exact: true }).click()

    await addProduct(page, 'Spark Plug NGK')
    await confirmPayment(page, 'Cash', 'Confirm cash received')
    await completeSale(page)
    await expect(page.getByText(/Cash ₦850\.00/)).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
