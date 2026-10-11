import { test, expect } from '@playwright/test';

test.describe('Landing Page Live Interactive Verification', () => {
  test('desktop: language toggle, POS simulator, and interactive workflows', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:4173/landing.html');

    // 1. Check title & initial English copy
    await expect(page).toHaveTitle(/Sabi Shop/);
    await expect(page.locator('#hero-title')).toContainText('Know what is happening');
    await expect(page.locator('#hero-title')).toContainText('in your shop.');

    // 2. Language switch to Nigerian Pidgin
    const langToggle = page.locator('.landing-lang-toggle').first();
    const pidginBtn = langToggle.locator('button', { hasText: 'Pidgin' });
    await pidginBtn.click();
    await expect(page.locator('#hero-title')).toContainText('Know wetin dey happen');
    await expect(page.locator('#hero-title')).toContainText('inside your shop.');
    await page.screenshot({ path: 'work/landing-pidgin-desktop.png', fullPage: false });

    // Switch back to English
    const enBtn = langToggle.locator('button', { hasText: 'EN' });
    await enBtn.click();
    await expect(page.locator('#hero-title')).toContainText('Know what is happening');

    // 3. Test POS Playground Simulation
    const simulator = page.locator('.landing-visual');
    await expect(simulator).toBeVisible();

    // Verify initial total (Spark Plug ₦3,400 + Engine Oil ₦12,500 + Air Filter ₦13,600 = ₦29,500.00)
    await expect(simulator.locator('.landing-visual__total')).toContainText('₦29,500.00');

    // Add Brake Pads (+ ₦9,500 => ₦39,000.00)
    const addBrakePads = simulator.locator('.landing-sim__quick-btn', { hasText: 'Brake' });
    await addBrakePads.click();
    await expect(simulator.locator('.landing-visual__total')).toContainText('₦39,000.00');

    // Toggle Offline / Online status pill
    const networkToggle = simulator.locator('.landing-sim__network-toggle');
    await expect(networkToggle).toContainText('Offline · saved on device');
    await networkToggle.click();
    await expect(networkToggle).toContainText('Online · cloud synced');
    await networkToggle.click();
    await expect(networkToggle).toContainText('Offline · saved on device');

    // Click Complete Sale
    const recordBtn = simulator.locator('.landing-sim__complete-btn');
    await recordBtn.click();
    await expect(simulator.locator('.landing-sim__stamp')).toBeVisible();
    await expect(simulator.locator('.landing-sim__stamp')).toContainText('Sale completed');
    await page.screenshot({ path: 'work/landing-sale-recorded-desktop.png', fullPage: false });

    // Reset simulation
    const resetBtn = simulator.locator('.landing-sim__reset-btn');
    await resetBtn.click();
    await expect(simulator.locator('.landing-sim__stamp')).toHaveCount(0);
    await expect(simulator.locator('.landing-visual__total')).toContainText('₦29,500.00');

    // 4. Test FAQ disclosure
    const firstFaq = page.locator('details.landing-faq__item').first();
    await expect(firstFaq).toBeVisible();
    await firstFaq.locator('summary').click();
    await expect(firstFaq).toHaveAttribute('open', '');
  });

  test('mobile: 390px viewport check, drawer menu & Pidgin switch', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:4173/landing.html');

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Open mobile menu
    const menuBtn = page.locator('.landing-menu-button');
    await menuBtn.click();
    const menu = page.locator('#landing-menu');
    await expect(menu).toBeVisible();

    // Toggle language inside mobile drawer
    const drawerLangBtn = menu.locator('.landing-lang-btn', { hasText: 'Nigerian Pidgin' });
    await drawerLangBtn.click();
    await expect(page.locator('#hero-title')).toContainText('Know wetin dey happen');
    await expect(page.locator('#hero-title')).toContainText('inside your shop.');

    // Re-open menu to test Escape
    await menuBtn.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);

    await page.screenshot({ path: 'work/landing-mobile-pidgin.png', fullPage: false });
  });
});
