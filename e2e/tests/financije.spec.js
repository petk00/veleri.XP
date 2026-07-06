// @ts-check
const { test, expect } = require('@playwright/test');
const { ADMIN, login, dismissNotifications } = require('./helpers');

test.describe('Financije (admin)', () => {

  test('pregled budžeta, odjela i kategorija je vidljiv', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/#/financije');
    await dismissNotifications(page, 300, 2000);

    await expect(page.getByText('Pregled budžeta')).toBeVisible();
    await expect(page.getByText('Iskorištenost po odjelima')).toBeVisible();
    await expect(page.getByText('Kategorije artikala')).toBeVisible();
  });

  test('admin dodaje, uređuje i briše kategoriju s limitom', async ({ page }) => {
    const name = `E2E kategorija ${Date.now()}`;

    await login(page, ADMIN);
    await page.goto('/#/financije');
    await dismissNotifications(page, 300, 2000);

    // Dodavanje s limitom (SRS 7.1 — limiti po predmetu nabave)
    await page.locator('.cards-row__side').getByRole('button', { name: 'Dodaj' }).click();
    await expect(page.getByText('Nova kategorija')).toBeVisible();
    await page.locator('.dialog-card input[type="text"]').fill(name);
    await page.locator('.dialog-card input[type="number"]').fill('100');
    await page.getByRole('button', { name: 'Spremi' }).click();
    await expect(page.getByText('Kategorija dodana.')).toBeVisible();

    const row = page.locator('.cat-chip', { hasText: name });
    await expect(row).toBeVisible();
    await expect(row.getByText('100,00')).toBeVisible();

    // Uređivanje — makni limit, red prikazuje "bez limita"
    await row.locator('.icon-btn').first().click();
    await page.locator('.dialog-card input[type="number"]').fill('0');
    await page.getByRole('button', { name: 'Spremi' }).click();
    await expect(page.getByText('Kategorija ažurirana.')).toBeVisible();
    await expect(row.getByText('bez limita')).toBeVisible();

    // Brisanje (kategorija nije korištena pa je dozvoljeno)
    await row.locator('.icon-btn--danger').click();
    await page.getByRole('button', { name: 'Obriši' }).click();
    await expect(page.getByText('Kategorija obrisana.')).toBeVisible();
    await expect(row).toHaveCount(0);
  });

});
