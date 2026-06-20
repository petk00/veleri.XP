const ADMIN = { email: 'admin@veleri.hr', password: '12345678' };
const EMPLOYEE = { email: 'zaposlenik@veleri.hr', password: '12345678' };

async function login(page, { email, password }) {
  await page.goto('/#/login');
  await page.getByLabel('E-mail adresa').fill(email);
  await page.getByRole('button', { name: 'Dalje' }).click();
  await page.getByLabel('Lozinka').fill(password);
  await page.getByRole('button', { name: 'Prijavi se' }).click();
  await page.waitForURL('**/requests**');
}

module.exports = { ADMIN, EMPLOYEE, login };
