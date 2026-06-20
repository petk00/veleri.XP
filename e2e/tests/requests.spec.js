// @ts-check
const { test, expect } = require('@playwright/test');
const { ADMIN, EMPLOYEE, login } = require('./helpers');

test.describe('Kreiranje zahtjeva', () => {

  test('zaposlenik kreira zahtjev bez ponude', async ({ page }) => {
    await login(page, EMPLOYEE);

    await page.getByRole('link', { name: 'Novi zahtjev' }).click();
    await expect(page).toHaveURL(/\/requests\/new/);

    // Korak 1: odabir odjela
    await page.locator('.q-select').first().click();
    await page.locator('.q-item').first().click();
    await page.getByRole('button', { name: 'Dalje' }).click();

    // Korak 2: nema ponude
    await page.getByText('Nemam ponudu').click();
    await page.getByRole('button', { name: 'Dalje' }).click();

    // Korak 3: stavke
    await page.getByLabel('Obrazloženje').fill('Testni zahtjev bez ponude — e2e');
    await page.getByRole('button', { name: 'Dodaj stavku' }).click();
    await page.locator('input[placeholder*="Naziv"]').last().fill('Testna stavka');
    await page.locator('input[placeholder*="Količina"], input[type="number"]').last().fill('2');
    await page.getByRole('button', { name: 'Dalje' }).click();

    // Korak 4: pregled i slanje
    await expect(page.getByText('Testni zahtjev bez ponude — e2e')).toBeVisible();
    await page.getByRole('button', { name: 'Pošalji zahtjev' }).click();

    await expect(page).toHaveURL(/\/requests\/\d+/);
    await expect(page.getByText('Poslano')).toBeVisible();
  });

  test('zaposlenik vidi samo vlastite zahtjeve', async ({ page }) => {
    await login(page, EMPLOYEE);
    await page.goto('/#/requests');

    const rows = page.locator('tbody tr, .q-table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      // Zaposlenik ne vidi kolonu "Podnositelj" s tuđim imenima
      await expect(row).not.toContainText('Admin');
    }
  });

  test('admin vidi sve zahtjeve i ima kolonu podnositelja', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/#/requests');
    // Admin ima filter za podnositelja — potvrđuje da vidi sve
    await expect(page.locator('text=Podnositelj').first()).toBeVisible();
  });

});
