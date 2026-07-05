// @ts-check
const { test, expect } = require('@playwright/test');
const { ADMIN, EMPLOYEE, login, createRequest } = require('./helpers');

test.describe('Kreiranje zahtjeva', () => {

  test('zaposlenik kreira zahtjev bez ponude kroz wizard', async ({ page }) => {
    await login(page, EMPLOYEE);
    const req = await createRequest(page, { withOffer: false });

    await page.goto(`/#/zahtjevi/${req.id}`);
    // .first() — sadržaj se ponavlja u skrivenom print predlošku
    await expect(page.getByText(req.number).first()).toBeVisible();
    await expect(page.locator('.stepper-label--active')).toHaveText('Poslano');
    await expect(page.getByText('E2E testna stavka').first()).toBeVisible();
  });

  test('zaposlenik ne vidi kolonu podnositelja', async ({ page }) => {
    await login(page, EMPLOYEE);
    await page.goto('/#/zahtjevi');
    await expect(page.locator('tbody tr').first()).toBeVisible();
    await expect(page.locator('th', { hasText: 'Podnositelj' })).toHaveCount(0);
  });

  test('admin vidi sve zahtjeve i ima kolonu podnositelja', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/#/zahtjevi');
    await expect(page.locator('th', { hasText: 'Podnositelj' }).first()).toBeVisible();
  });

});
