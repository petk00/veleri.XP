// @ts-check
const { test, expect } = require('@playwright/test');
const { ADMIN, EMPLOYEE, login } = require('./helpers');

// Pomoćna funkcija: otvori prvi zahtjev u statusu "Poslano"
async function openFirstSentRequest(page) {
  await page.goto('/#/requests');
  await page.locator('select, .q-select').filter({ hasText: /Status|Sve/ }).first().click();
  await page.locator('.q-item').filter({ hasText: 'Poslano' }).click();
  await page.waitForTimeout(500);
  await page.locator('tbody tr, .request-row').first().click();
  await expect(page).toHaveURL(/\/requests\/\d+/);
}

test.describe('Workflow zahtjeva', () => {

  test('admin preuzima zahtjev — status prelazi u Na odobrenju', async ({ page }) => {
    await login(page, ADMIN);
    await openFirstSentRequest(page);

    await page.getByRole('button', { name: 'Preuzmi' }).click();
    await page.getByRole('button', { name: 'Potvrdi' }).click();

    await expect(page.getByText('Na odobrenju')).toBeVisible();
  });

  test('admin vraća zahtjev na izmjenu — zaposlenik vidi obavijest', async ({ page }) => {
    await login(page, ADMIN);
    await openFirstSentRequest(page);

    // Preuzmi ako je još u Poslano
    const preuzmiBtn = page.getByRole('button', { name: 'Preuzmi' });
    if (await preuzmiBtn.isVisible()) {
      await preuzmiBtn.click();
      await page.getByRole('button', { name: 'Potvrdi' }).click();
    }

    await page.getByRole('button', { name: 'Vrati na izmjenu' }).click();
    await page.getByLabel('Komentar').fill('Nedostaje obrazloženje — e2e test');
    await page.getByRole('button', { name: 'Potvrdi' }).click();

    await expect(page.getByText('Vraćeno')).toBeVisible();
    await expect(page.getByText('Nedostaje obrazloženje — e2e test')).toBeVisible();
  });

  test('zaposlenik ponovo šalje vraćeni zahtjev', async ({ page }) => {
    // Pronađi vraćeni zahtjev kao zaposlenik
    await login(page, EMPLOYEE);
    await page.goto('/#/requests');

    await page.locator('select, .q-select').filter({ hasText: /Status|Sve/ }).first().click();
    await page.locator('.q-item').filter({ hasText: 'Vraćeno' }).click();
    await page.waitForTimeout(500);

    const firstRow = page.locator('tbody tr, .request-row').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await expect(page).toHaveURL(/\/requests\/\d+/);

      await page.getByRole('button', { name: 'Pošalji ponovo' }).click();
      await page.getByRole('button', { name: 'Potvrdi' }).click();

      await expect(page.getByText('Poslano')).toBeVisible();
    } else {
      test.skip(true, 'Nema vraćenih zahtjeva za ovaj test');
    }
  });

  test('zatvoreni zahtjev ne dozvoljava izmjene', async ({ page }) => {
    await login(page, EMPLOYEE);
    await page.goto('/#/requests');

    await page.locator('select, .q-select').filter({ hasText: /Status|Sve/ }).first().click();
    await page.locator('.q-item').filter({ hasText: 'Zatvoreno' }).click();
    await page.waitForTimeout(500);

    const firstRow = page.locator('tbody tr, .request-row').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await expect(page).toHaveURL(/\/requests\/\d+/);

      // Gumb za uređivanje ne smije biti vidljiv
      await expect(page.getByRole('link', { name: 'Uredi' })).not.toBeVisible();
    } else {
      test.skip(true, 'Nema zatvorenih zahtjeva za ovaj test');
    }
  });

});
