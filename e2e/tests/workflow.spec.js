// @ts-check
const { test, expect } = require('@playwright/test');
const { ADMIN, EMPLOYEE, FIXTURES, login, createRequest } = require('./helpers');

test.describe.configure({ mode: 'serial' });

test.describe('Workflow zahtjeva', () => {

  /** Zahtjev s ponudom koji vodimo kroz cijeli životni ciklus. @type {{ id: number, number: string }} */
  let req;

  test('zaposlenik kreira zahtjev s ponudom i iznosom', async ({ page }) => {
    await login(page, EMPLOYEE);
    req = await createRequest(page, { withOffer: true, amount: '150' });
    expect(req.id).toBeTruthy();

    await page.goto(`/#/zahtjevi/${req.id}`);
    await expect(page.locator('.stepper-label--active')).toHaveText('Poslano');
    // Ponuda uploadana kroz wizard je priložena uz zahtjev
    await expect(
      page.locator('.doc-row', { hasText: 'Ponuda' }).locator('.doc-badge--ok')
    ).toBeVisible();
  });

  test('admin preuzima zahtjev — status prelazi u Na odobrenju', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`/#/zahtjevi/${req.id}`);

    await page.getByRole('button', { name: 'Preuzmi na obradu' }).click();
    await expect(page.locator('.stepper-label--active')).toHaveText('Na odobrenju');
  });

  test('admin odobrava zahtjev uz pregled limita — status prelazi u Naručeno', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`/#/zahtjevi/${req.id}`);

    await page.getByRole('button', { name: 'Odobri', exact: true }).click();
    // Dijalog odobravanja prikazuje potrošnju i limit odjela (SRS 7.3)
    await expect(page.locator('.dialog-budget')).toBeVisible();
    await page.locator('.dialog-actions button', { hasText: 'Odobri' }).click();

    await expect(page.locator('.stepper-label--active')).toHaveText('Naručeno');
  });

  test('admin dodaje otpremnicu i završava zahtjev — status Zatvoreno', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(`/#/zahtjevi/${req.id}`);

    await page.locator('label', { hasText: 'Dodaj otpremnicu' })
      .locator('input[type="file"]')
      .setInputFiles(FIXTURES.otpremnica);
    await expect(page.getByText('Otpremnica uspješno dodana.')).toBeVisible();

    await page.getByRole('button', { name: 'Označi završeno' }).click();
    await expect(page.getByText('Zahtjev je označen kao završen.')).toBeVisible();
    // Svi koraci steppera su završeni, a zahtjev je zaključan za izmjene
    await expect(page.locator('.stepper-dot--done')).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Uredi' })).not.toBeVisible();
  });

  test('admin vraća zahtjev na dopunu, zaposlenik ga ponovno šalje', async ({ page, browser }) => {
    // Zaposlenik kreira novi zahtjev u zasebnoj sesiji
    const empContext = await browser.newContext();
    const empPage = await empContext.newPage();
    await login(empPage, EMPLOYEE);
    const returned = await createRequest(empPage, { withOffer: false });

    // Admin: preuzmi pa vrati na dopunu s komentarom
    await login(page, ADMIN);
    await page.goto(`/#/zahtjevi/${returned.id}`);
    await page.getByRole('button', { name: 'Preuzmi na obradu' }).click();
    await expect(page.locator('.stepper-label--active')).toHaveText('Na odobrenju');

    await page.getByRole('button', { name: 'Vrati na dopunu' }).click();
    await page.getByLabel(/Komentar/).fill('Nedostaje obrazloženje — e2e test');
    await page.locator('.dialog-actions button', { hasText: 'Vrati na dopunu' }).click();
    await expect(page.getByText('Zahtijeva izmjene od podnositelja')).toBeVisible();

    // Zaposlenik vidi komentar u povijesti aktivnosti i ponovno šalje
    await empPage.goto(`/#/zahtjevi/${returned.id}`);
    await empPage.getByRole('button', { name: /Povijest aktivnosti/ }).click();
    await expect(empPage.getByText('Nedostaje obrazloženje — e2e test').first()).toBeVisible();
    await empPage.getByRole('button', { name: 'Pošalji ponovno' }).click();
    await expect(empPage.locator('.stepper-label--active')).toHaveText('Poslano');

    await empContext.close();
  });

  test('admin stornira zahtjev — status Odbijeno', async ({ page, browser }) => {
    const empContext = await browser.newContext();
    const empPage = await empContext.newPage();
    await login(empPage, EMPLOYEE);
    const toCancel = await createRequest(empPage, { withOffer: false });
    await empContext.close();

    await login(page, ADMIN);
    await page.goto(`/#/zahtjevi/${toCancel.id}`);

    // Storno je u "..." overflow izborniku
    await page.locator('.action-bar__actions .icon-btn', { hasText: 'more_vert' }).click();
    await page.getByText('Storniraj zahtjev').click();
    await page.getByLabel(/Komentar/).fill('Storno — e2e test');
    await page.locator('.dialog-actions button', { hasText: 'Storniraj' }).click();

    await expect(page.getByText('Zahtjev odbijen')).toBeVisible();
  });

});
