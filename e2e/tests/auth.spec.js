// @ts-check
const { test, expect } = require('@playwright/test');
const { ADMIN, EMPLOYEE, login } = require('./helpers');

test.describe('Autentikacija', () => {

  test('uspješna prijava admina', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL(/\/requests/);
  });

  test('uspješna prijava zaposlenika', async ({ page }) => {
    await login(page, EMPLOYEE);
    await expect(page).toHaveURL(/\/requests/);
  });

  test('neuspješna prijava — pogrešna lozinka', async ({ page }) => {
    await page.goto('/#/login');
    await page.getByLabel('E-mail adresa').fill(ADMIN.email);
    await page.getByRole('button', { name: 'Dalje' }).click();
    await page.getByLabel('Lozinka').fill('pogresna-lozinka');
    await page.getByRole('button', { name: 'Prijavi se' }).click();
    await expect(page.locator('.form-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('neautoriziran pristup preusmjerava na login', async ({ page }) => {
    await page.goto('/#/requests');
    await expect(page).toHaveURL(/\/login/);
  });

  test('odjava čisti sesiju', async ({ page }) => {
    await login(page, EMPLOYEE);
    await page.getByTitle('Odjava').click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/#/requests');
    await expect(page).toHaveURL(/\/login/);
  });

});
