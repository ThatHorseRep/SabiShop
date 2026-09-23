import { expect, type Page } from '@playwright/test'

export type ActorId = 'user-chidi' | 'user-ngozi' | 'user-nkechi'

export const businessName = 'Nkechi Hardware'

/**
 * The current application intentionally uses reference sessions instead of a
 * credential provider. Enter the seeded business as a selected role and keep
 * that limitation visible in the test name/handoff rather than pretending a
 * production sign-in flow exists.
 */
export async function openApp(page: Page, actorId: ActorId) {
  await page.addInitScript((actor) => {
    window.localStorage.setItem('sabi-shop:pos-actor', actor)
  }, actorId)
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  // The business name is intentionally hidden in the compact mobile header,
  // so assert attachment rather than CSS visibility here.
  await expect(page.getByText(businessName).first()).toBeAttached()
}

export async function navigate(page: Page, destination: string) {
  await page.getByRole('button', { name: destination, exact: true }).click()
}

export async function openTab(page: Page, name: string | RegExp) {
  await page.getByRole('tab', { name }).click()
}

export async function addProduct(page: Page, productName: string) {
  const search = page.getByRole('searchbox', {
    name: /search products by name, sku, or model/i,
  })
  await search.fill(productName)
  await page
    .getByRole('button', { name: new RegExp(`Add ${productName}`, 'i') })
    .click()
}

export async function confirmPayment(
  page: Page,
  method: string,
  confirmLabel: string,
) {
  await page.getByRole('button', { name: method, exact: true }).click()
  await page.getByRole('button', { name: confirmLabel, exact: true }).click()
}

export async function completeSale(page: Page) {
  await page.getByRole('button', { name: /Complete Sale/i }).click()
  await expect(
    page.getByRole('heading', { name: 'Sale completed' }),
  ).toBeVisible()
}

export async function selectCustomer(page: Page, customerName: string) {
  await page.getByRole('button', { name: 'Add customer' }).click()
  const dialog = page.getByRole('dialog', { name: 'Select customer' })
  await dialog
    .getByRole('button', { name: new RegExp(customerName, 'i') })
    .click()
  await expect(page.getByText(customerName).first()).toBeVisible()
}
