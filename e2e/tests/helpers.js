// @ts-check
const path = require('path');
const { expect } = require('@playwright/test');

const ADMIN = { email: 'admin@veleri.hr', password: '12345678' };
const EMPLOYEE = { email: 'zaposlenik@veleri.hr', password: '12345678' };

const FIXTURES = {
  ponuda: path.join(__dirname, 'fixtures', 'ponuda.pdf'),
  otpremnica: path.join(__dirname, 'fixtures', 'otpremnica.pdf'),
};

/**
 * Zatvori sticky in-app obavijesti (timeout: 0) koje prekrivaju stranicu i
 * blokiraju klikove. Pojavljuju se asinkrono nakon prijave, pa se čeka da se
 * stanje smiri (settleMs bez novih obavijesti) prije nastavka.
 */
async function dismissNotifications(page, settleMs = 600, maxWaitMs = 4000) {
  const notifications = page.locator('#q-notify .q-notification');
  const deadline = Date.now() + maxWaitMs;
  let quietSince = Date.now();
  while (Date.now() < deadline) {
    if (await notifications.count() > 0) {
      // Naslagane obavijesti presreću klikove jedna drugoj, pa ih uklanjamo iz DOM-a
      await page.evaluate(() => {
        document.querySelectorAll('#q-notify .q-notification').forEach((n) => n.remove());
      });
      quietSince = Date.now();
    } else if (Date.now() - quietSince >= settleMs) {
      return;
    }
    await page.waitForTimeout(100);
  }
}

/**
 * Keš sesija po korisniku (JWT cookie + localStorage user) — svaka prijava kroz
 * UI troši login rate limit na backendu, pa se unutar jednog workera logiramo
 * samo jednom po korisniku, a ostali testovi preuzimaju spremljenu sesiju.
 */
const sessionCache = new Map();

async function login(page, { email, password }) {
  const cached = sessionCache.get(email);
  if (cached) {
    await page.context().addCookies(cached.cookies);
    await page.addInitScript((userJson) => localStorage.setItem('user', userJson), cached.userJson);
    await page.goto('/#/');
    await expect(page.locator('.avatar-btn')).toBeVisible();
    await dismissNotifications(page);
    return;
  }

  await page.goto('/#/login');
  await page.getByLabel('E-mail adresa').fill(email);
  await page.getByRole('button', { name: 'Dalje' }).click();
  await page.getByLabel('Lozinka').fill(password);
  await page.getByRole('button', { name: 'Prijavi se' }).click();
  // Nakon prijave korisnik završava na dashboardu s avatarom u topbaru
  await expect(page.locator('.avatar-btn')).toBeVisible();
  await dismissNotifications(page);

  sessionCache.set(email, {
    cookies: await page.context().cookies(),
    userJson: await page.evaluate(() => localStorage.getItem('user')),
  });
}

/**
 * Otvori Quasar select i odaberi prvu opciju. Klik se ponavlja jer se
 * popup zna izgubiti kad se komponenta re-renderira (npr. blur formatiranje
 * susjednog inputa).
 */
async function pickFirstOption(page, selectLocator) {
  const menuItem = page.locator('.q-menu .q-item').first();
  for (let attempt = 0; attempt < 3; attempt++) {
    await selectLocator.click();
    try {
      await menuItem.waitFor({ state: 'visible', timeout: 2000 });
      break;
    } catch {
      // popup se nije otvorio — pokušaj ponovo
    }
  }
  await menuItem.click();
}

/**
 * Prođe kroz wizard novog zahtjeva i vrati { id, number } kreiranog zahtjeva.
 * Wizard: odjel → svrha → ponuda (auto-advance) → [upload → kategorija | stavke] → komentar → potvrda.
 */
async function createRequest(page, { withOffer = false, amount = '150' } = {}) {
  await page.goto('/#/novizahtjev');
  await dismissNotifications(page, 300, 2000);

  // Korak: odjel — otvori pretragu i odaberi prvi rezultat
  await page.locator('.dept-search-box__input').click();
  await page.locator('.dept-result-item').first().click();
  await page.getByRole('button', { name: 'Dalje' }).click();

  // Korak: svrha
  await page.locator('.svrha-box__input').fill('E2E testni zahtjev — svrha nabave');
  await page.getByRole('button', { name: 'Dalje' }).click();

  // Korak: ponuda da/ne — odabir sam prelazi na sljedeći korak (auto-advance)
  if (withOffer) {
    await page.getByRole('button', { name: 'Da, imam ponudu ili račun' }).click();

    // Korak: upload ponude
    await page.locator('.upload-zone input[type="file"]').setInputFiles(FIXTURES.ponuda);
    await expect(page.locator('.file-list__item')).toHaveCount(1);
    await page.getByRole('button', { name: 'Dalje' }).click();

    // Korak: iznos + kategorija (iznos se parsira na blur)
    await page.locator('.kat-amount-box__input').fill(amount);
    await pickFirstOption(page, page.locator('.kat-select'));
    await page.getByRole('button', { name: 'Dalje' }).click();
  } else {
    await page.getByRole('button', { name: 'Nemam ponudu, ali znam što mi treba' }).click();

    // Korak: stavke
    await pickFirstOption(page, page.locator('.add-item__category'));
    await page.locator('.add-item__name input').fill('E2E testna stavka');
    await page.getByRole('button', { name: 'Dodaj', exact: true }).click();
    await expect(page.locator('.item-list__row')).toHaveCount(1);
    await page.getByRole('button', { name: 'Dalje' }).click();
  }

  // Korak: napomena (opcionalna) — samo dalje
  await page.getByRole('button', { name: 'Dalje' }).click();

  // Korak: potvrda — pošalji i uhvati odgovor API-ja radi id-a
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === 'POST' && /\/api\/requests$/.test(r.url())
    ),
    page.getByRole('button', { name: 'Pošalji na obradu' }).click(),
  ]);
  expect(response.status()).toBe(201);
  const data = await response.json();

  // Pričekaj da wizardov redirect na dashboard stvarno završi — inače
  // router.push('/dashboard') može pregaziti sljedeću navigaciju u testu
  await page.waitForURL(/\/#\/$/);
  return { id: data.id_purchase_request, number: data.request_number };
}

module.exports = { ADMIN, EMPLOYEE, FIXTURES, login, createRequest, dismissNotifications };
