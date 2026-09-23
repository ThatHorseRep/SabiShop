import { expect, test } from '@playwright/test'
import { navigate, openApp, openTab } from './support'

test.describe('Manager business journey', () => {
  test('MANAGER-01 reviews canonical reports, stock truth, and staff activity', async ({
    page,
  }) => {
    await openApp(page, 'user-ngozi')
    await navigate(page, 'Management')

    await expect(
      page.getByRole('button', { name: /Ngozi Balogun Manager/i }),
    ).toBeVisible()
    await expect(
      page.getByText('Total sales after discount').first(),
    ).toBeVisible()
    await expect(page.getByText('₦170,500.00').first()).toBeVisible()
    await expect(page.getByText('₦35,300.00').first()).toBeVisible()

    await openTab(page, 'Stock')
    await expect(page.getByText('Rice — 50kg bag')).toBeVisible()
    await expect(page.getByText('Negative stock').first()).toBeVisible()
    await expect(page.getByText('−2').first()).toBeVisible()
    await expect(
      page.getByText(/the dashboard does not adjust stock/i),
    ).toBeVisible()

    await openTab(page, /Staff & incentives/)
    await expect(
      page.getByRole('heading', { name: 'Chidi Okoro' }),
    ).toBeVisible()
    await expect(page.getByText(/sale\.completed:SAL-4001/)).toBeVisible()
    await expect(
      page.getByText(/Return RET-6601 requested on SAL-4002/),
    ).toBeVisible()
  })

  test('MANAGER-02 authorizes and settles a return while preserving the original sale', async ({
    page,
  }) => {
    await openApp(page, 'user-ngozi')
    await navigate(page, 'Money')
    await openTab(page, 'Sale returns')
    await page.getByRole('button', { name: /SAL-3002/ }).click()

    await expect(page.getByText('RET-6501').first()).toBeVisible()
    await page.getByRole('button', { name: 'Verify purchase' }).click()
    await expect(page.getByText('Return verified').first()).toBeVisible()

    await page.getByRole('button', { name: 'Approve return' }).click()
    const approveDialog = page.getByRole('dialog', { name: 'Approve return' })
    await approveDialog
      .getByRole('radio', { name: /Held \/ requires inspection/ })
      .check()
    await approveDialog.getByRole('button', { name: 'Approve return' }).click()
    await expect(page.getByText('Return approved').first()).toBeVisible()

    await page.getByRole('button', { name: 'Apply return' }).click()
    await expect(page.getByText('Return applied').first()).toBeVisible()
    await expect(page.getByText(/Due of ₦65,000\.00/)).toBeVisible()

    await page.getByRole('button', { name: 'Record refund settlement' }).click()
    const settlementDialog = page.getByRole('dialog', {
      name: 'Record refund settlement',
    })
    await settlementDialog
      .getByRole('button', { name: 'Record settlement' })
      .click()
    await expect(page.getByText('Settlement recorded').first()).toBeVisible()
    await expect(
      page.getByText(/Settled of ₦65,000\.00 via cash/),
    ).toBeVisible()
    await expect(page.getByText('Completed — Fully returned')).toBeVisible()

    await openTab(page, 'History')
    await expect(page.getByText(/Return applied · Sale return/)).toBeVisible()
  })

  test('MANAGER-03 applies a material correction only with reason and separate approval', async ({
    page,
  }) => {
    await openApp(page, 'user-ngozi')
    await navigate(page, 'Money')
    await openTab(page, 'Corrections')
    await page.getByRole('button', { name: /SAL-3001/ }).click()
    await page.getByRole('button', { name: 'Correct record' }).click()

    const dialog = page.getByRole('dialog', { name: 'Correct record' })
    await dialog.getByLabel('What is incorrect?').selectOption('quantity')
    await dialog.getByLabel('Corrected quantity').fill('1')
    await dialog.getByLabel('Reason').fill('Only one bag was handed over.')
    await expect(dialog.getByText('Original accepted state')).toBeVisible()
    await expect(dialog.getByText('Corrected state (proposed)')).toBeVisible()
    await expect(dialog.getByText(/Expected effects/)).toBeVisible()
    await dialog.getByLabel('Separate approval').selectOption('user-nkechi')
    await dialog.getByRole('button', { name: 'Apply correction' }).click()

    await expect(page.getByText('Correction applied').first()).toBeVisible()
    await expect(page.getByText(/1 correction\(s\)/)).toBeVisible()
    await openTab(page, 'History')
    await expect(
      page.getByText(/Correction applied · Correction/),
    ).toBeVisible()
  })

  test('MANAGER-04 reconciles a cash variance and confirms the official result', async ({
    page,
  }) => {
    await openApp(page, 'user-ngozi')
    await navigate(page, 'Money')
    await openTab(page, 'Reconciliation')

    await page.getByRole('button', { name: 'Count cash' }).click()
    const countDialog = page.getByRole('dialog', { name: 'Count cash' })
    await countDialog.getByLabel('Counted cash (₦)').fill('143500')
    await countDialog
      .getByRole('button', { name: 'Record physical count' })
      .click()

    await page.getByRole('button', { name: 'Prepare reconciliation' }).click()
    await expect(
      page.getByText('Reconciliation prepared').first(),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: 'Discrepancy requiring investigation',
      }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Resolve discrepancy' }).click()
    const resolveDialog = page.getByRole('dialog', {
      name: 'Resolve discrepancy',
    })
    await resolveDialog
      .getByLabel('Investigation outcome')
      .fill('Transport cash was taken before the count.')
    await resolveDialog
      .getByRole('button', { name: 'Resolve discrepancy' })
      .click()

    const confirm = page.getByRole('button', {
      name: 'Confirm reconciliation',
    })
    await expect(confirm).toBeEnabled()
    await confirm.click()
    await expect(
      page.getByText('Reconciliation confirmed').first(),
    ).toBeVisible()
    await expect(
      page.getByText(/original figures were not rewritten/i),
    ).toBeVisible()
  })
})
