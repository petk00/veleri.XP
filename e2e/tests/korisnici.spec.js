// @ts-check
const { test, expect } = require('@playwright/test');
const { ADMIN, EMPLOYEE, login, dismissNotifications } = require('./helpers');

/** Nađi red korisnika na stranici Korisnici (uz pretragu po emailu). */
async function findUserRow(page, userEmail) {
  await page.goto('/#/korisnici');
  await dismissNotifications(page, 300, 2000);
  await page.getByPlaceholder('Pretraži po imenu, emailu ili ulozi...').fill(userEmail);
  const row = page.locator('.user-row', { hasText: userEmail });
  await expect(row).toBeVisible();
  return row;
}

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

  test('deaktivacija korisnika odmah ruši njegovu aktivnu sesiju', async ({ browser }) => {
    // Dva neovisna browser konteksta: zaposlenik s aktivnom sesijom + admin
    const employeeContext = await browser.newContext();
    const employeePage = await employeeContext.newPage();
    await login(employeePage, EMPLOYEE);

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await login(adminPage, ADMIN);

    try {
      // Admin deaktivira zaposlenika (ikone redom: uredi, reset, status, obriši)
      const row = await findUserRow(adminPage, EMPLOYEE.email);
      await row.locator('.icon-btn').nth(2).click();
      await adminPage.getByRole('button', { name: 'Deaktiviraj' }).click();
      await expect(row.getByText('Neaktivan', { exact: true })).toBeVisible();

      // Zaposlenikova postojeća sesija pada na prvom sljedećem zahtjevu —
      // auth middleware čita is_active iz baze, a 401 ga vraća na login
      await employeePage.goto('/#/zahtjevi');
      await expect(employeePage).toHaveURL(/\/#\/login/);
    } finally {
      // Reaktiviraj zaposlenika bez obzira na ishod — ostali testovi ga koriste
      const row = await findUserRow(adminPage, EMPLOYEE.email);
      if (await row.getByText('Neaktivan', { exact: true }).count() > 0) {
        await row.locator('.icon-btn').nth(2).click();
        await adminPage.getByRole('button', { name: 'Aktiviraj' }).click();
        await expect(row.getByText('Aktivan', { exact: true })).toBeVisible();
      }
      await employeeContext.close();
      await adminContext.close();
    }
  });

});
