// @ts-check
const { test, expect } = require('@playwright/test');
const { EMPLOYEE, FIXTURES, login, createRequest } = require('./helpers');

test.describe('Dokumenti uz zahtjev', () => {

  test('zaposlenik dodaje i briše ponudu na detaljima zahtjeva', async ({ page }) => {
    await login(page, EMPLOYEE);
    const req = await createRequest(page, { withOffer: false });
    await page.goto(`/#/zahtjevi/${req.id}`);

    // Upload ponude kroz gumb u action baru
    await page.locator('label', { hasText: 'Dodaj ponudu' })
      .locator('input[type="file"]')
      .setInputFiles(FIXTURES.ponuda);
    await expect(page.getByText('Ponuda uspješno dodana.')).toBeVisible();
    const ponudaRow = page.locator('.doc-row', { hasText: 'Ponuda' });
    await expect(ponudaRow.locator('.doc-badge--ok')).toBeVisible();

    // Brisanje dokumenta uz potvrdu
    await ponudaRow.locator('.icon-btn--danger').click();
    await page.getByRole('button', { name: 'Obriši' }).click();
    await expect(page.getByText('Dokument obrisan.')).toBeVisible();
    await expect(ponudaRow.locator('.doc-badge--missing')).toBeVisible();
  });

});
