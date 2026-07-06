// @ts-check
const { test, expect } = require('@playwright/test');
const { ADMIN, login, dismissNotifications } = require('./helpers');

test.describe.configure({ mode: 'serial' });

test.describe('Korisnici (admin)', () => {

  const email = `e2e.test.${Date.now()}@veleri.hr`;

  test('admin kreira korisnika i dobiva invite link', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/#/korisnici');
    await dismissNotifications(page, 300, 2000);

    await page.getByRole('button', { name: 'Novi korisnik' }).click();
    await page.getByPlaceholder('Ime', { exact: true }).fill('E2E');
    await page.getByPlaceholder('Prezime', { exact: true }).fill('Testko');
    await page.getByPlaceholder('ime.prezime@veleri.hr').fill(email);
    await page.locator('.dialog-card select').selectOption({ label: 'Zaposlenik' });
    await page.getByRole('button', { name: 'Kreiraj korisnika' }).click();

    // Invite dialog s linkom za postavljanje lozinke
    await expect(page.getByText('Korisnik kreiran')).toBeVisible();
    await expect(page.locator('.invite-link-text')).toContainText('/set-password?token=');
    await page.getByRole('button', { name: 'Zatvori' }).click();

    // Korisnik je u listi — neaktivan dok ne postavi lozinku kroz invite link
    await page.getByPlaceholder('Pretraži po imenu, emailu ili ulozi...').fill(email);
    const row = page.locator('.user-row', { hasText: email });
    await expect(row).toBeVisible();
    await expect(row.getByText('Neaktivan', { exact: true })).toBeVisible();
  });

  test('email izvan veleri.hr domene je odbijen', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/#/korisnici');
    await dismissNotifications(page, 300, 2000);

    await page.getByRole('button', { name: 'Novi korisnik' }).click();
    await page.getByPlaceholder('Ime', { exact: true }).fill('Vanjski');
    await page.getByPlaceholder('Prezime', { exact: true }).fill('Korisnik');
    await page.getByPlaceholder('ime.prezime@veleri.hr').fill('vanjski@gmail.com');
    await page.locator('.dialog-card select').selectOption({ label: 'Zaposlenik' });
    await page.getByRole('button', { name: 'Kreiraj korisnika' }).click();

    await expect(page.locator('.form-error')).toContainText('@veleri.hr');
    await page.getByRole('button', { name: 'Odustani' }).click();
  });

  test('admin aktivira, deaktivira pa briše korisnika', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/#/korisnici');
    await dismissNotifications(page, 300, 2000);

    await page.getByPlaceholder('Pretraži po imenu, emailu ili ulozi...').fill(email);
    const row = page.locator('.user-row', { hasText: email });
    await expect(row).toBeVisible();

    // Novi korisnik je neaktivan → prvo aktivacija
    // Ikone redom: uredi, reset lozinke, status toggle, obriši
    await row.locator('.icon-btn').nth(2).click();
    await page.getByRole('button', { name: 'Aktiviraj' }).click();
    await expect(row.getByText('Aktivan', { exact: true })).toBeVisible();

    await row.locator('.icon-btn').nth(2).click();
    await page.getByRole('button', { name: 'Deaktiviraj' }).click();
    await expect(row.getByText('Neaktivan', { exact: true })).toBeVisible();

    // Čišćenje: obriši e2e korisnika
    await row.locator('.icon-btn--danger').click();
    await page.getByRole('button', { name: 'Obriši' }).click();
    await expect(page.getByText('Korisnik obrisan.')).toBeVisible();
    await expect(row).toHaveCount(0);
  });

});
