import { expect, test } from '@playwright/test'
import { navigate, openApp, openTab } from './support'

test.describe('Owner business journey', () => {
  test('OWNER-01 enters the reference business and reviews explainable performance and exceptions', async ({
    page,
  }) => {
    await openApp(page, 'user-nkechi')

    await expect(
      page.getByRole('button', { name: /Nkechi Eze Owner/i }),
    ).toBeVisible()
    await navigate(page, 'Management')

    await expect(
      page.getByRole('heading', { name: 'Management' }),
    ).toBeVisible()
    await expect(
      page.getByText('Total sales after discount').first(),
    ).toBeVisible()
    await expect(page.getByText('₦170,500.00').first()).toBeVisible()
    await expect(page.getByText('₦135,200.00').first()).toBeVisible()
    await expect(
      page.getByText(
        /Total sales after discount − Cost of stock sold = ₦35,300\.00/,
      ),
    ).toBeVisible()
    await expect(page.getByText(/Attention · 6/)).toBeVisible()
    await expect(
      page.getByText('Cash count does not match expected cash'),
    ).toBeVisible()
    await expect(
      page.getByText('Negative stock: Detergent — 1 litre'),
    ).toBeVisible()
    await expect(page.getByText('Overdue credit: Ada Obi')).toBeVisible()

    await openTab(page, /Staff & incentives/)
    await expect(
      page.getByRole('heading', { name: 'Chidi Okoro' }),
    ).toBeVisible()
    await expect(page.getByText(/sale\.completed:SAL-4001/)).toBeVisible()
    await expect(
      page.getByText(/release and payout are owned by the incentive module/i),
    ).toBeVisible()
    // User/permission administration is a documented downstream gap. The
    // dashboard must not expose mutation controls that pretend otherwise.
    await expect(
      page.getByRole('button', {
        name: /invite|add user|edit role|manage permission/i,
      }),
    ).toHaveCount(0)

    await navigate(page, 'Settings')
    await expect(page.getByText('Coming in a later module')).toBeVisible()
  })

  test('OWNER-02 reconciles a discrepancy, closes the day, and reopens it without rewriting history', async ({
    page,
  }) => {
    await openApp(page, 'user-nkechi')
    await navigate(page, 'Money')
    await openTab(page, 'Reconciliation')

    await page.getByRole('button', { name: 'Count cash' }).click()
    const countDialog = page.getByRole('dialog', { name: 'Count cash' })
    await countDialog.getByLabel('Counted cash (₦)').fill('143500')
    await expect(
      countDialog.getByText(/Variance against Expected Cash/),
    ).toBeVisible()
    await countDialog
      .getByRole('button', { name: 'Record physical count' })
      .click()
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
    await expect(page.getByText('−₦1,500.00').first()).toBeVisible()

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
    await expect(page.getByText('Discrepancy resolved').first()).toBeVisible()
    await expect(
      page.getByText(/original figures were not rewritten/i),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Confirm reconciliation' }).click()
    await expect(
      page.getByText('Reconciliation confirmed').first(),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Close business day' }).click()
    const closeDialog = page.getByRole('dialog', { name: 'Close business day' })
    await closeDialog
      .getByRole('button', { name: 'Close business day' })
      .click()
    await expect(page.getByText('Business day closed').first()).toBeVisible()

    await page.getByRole('button', { name: 'Reopen business day' }).click()
    const reopenDialog = page.getByRole('dialog', {
      name: 'Reopen business day',
    })
    await reopenDialog
      .getByLabel('Reason')
      .fill('A missing cash sale was found after closure.')
    await reopenDialog
      .getByRole('button', { name: 'Reopen business day' })
      .click()
    await expect(page.getByText('Business day reopened').first()).toBeVisible()
    await expect(
      page.getByText(/earlier closure stays in history/i),
    ).toBeVisible()
  })
})
