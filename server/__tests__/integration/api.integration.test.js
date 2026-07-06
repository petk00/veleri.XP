/**
 * API integracijski testovi s PRAVOM MySQL bazom (bez mockova).
 *
 * Pri pokretanju se kreira zasebna baza `XP_test` iz db/01_schema.sql,
 * db/02_seed.sql i e2e/seed.e2e.sql, pa se montirana Express aplikacija
 * gađa supertestom kroz pune middleware lance (auth, role, validacije,
 * transakcije). Ako MySQL nije dostupan, testovi se preskaču s upozorenjem.
 */

// Env se postavlja PRIJE requirea aplikacije — dotenv ne pregazi postojeće.
process.env.DB_NAME = 'XP_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret-0123456789abcdef';
process.env.LOGIN_RATE_LIMIT_MAX = '1000';
process.env.CHECK_EMAIL_RATE_LIMIT_MAX = '1000';
// Invite email je opcionalan (emailSent fallback) — usmjeri SMTP na zatvoreni
// port da sendInvite padne odmah umjesto da visi na pravom SMTP hostu iz .env
process.env.SMTP_HOST = '127.0.0.1';
process.env.SMTP_PORT = '1';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const request = require('supertest');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');

const ADMIN = { email: 'admin@veleri.hr', password: '12345678' };
const EMPLOYEE = { email: 'zaposlenik@veleri.hr', password: '12345678' };

let app = null;
let db = null;
let dbAvailable = false;

const connConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

beforeAll(async () => {
  let conn;
  try {
    conn = await mysql.createConnection(connConfig);
  } catch {
    console.warn('[integration] MySQL nije dostupan — integracijski testovi se preskaču.');
    return;
  }

  await conn.query('DROP DATABASE IF EXISTS XP_test');
  await conn.query('CREATE DATABASE XP_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await conn.query('USE XP_test');
  for (const file of ['db/01_schema.sql', 'db/02_seed.sql', 'e2e/seed.e2e.sql']) {
    await conn.query(fs.readFileSync(path.join(REPO_ROOT, file), 'utf8'));
  }
  await conn.end();

  app = require('../../src/index');
  db = require('../../src/config/db');
  dbAvailable = true;
}, 30000);

afterAll(async () => {
  if (db) await db.end();
});

/** Vrati supertest agenta s aktivnom sesijom (cookie JWT). */
async function loginAgent(user) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send(user);
  expect(res.status).toBe(200);
  return agent;
}

const itDb = (name, fn, timeout = 15000) =>
  test(name, async () => {
    if (!dbAvailable) return; // preskoči bez baze
    await fn();
  }, timeout);

describe('Autentikacija (integracija)', () => {
  itDb('login s pogrešnom lozinkom vraća 401 bez cookieja', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: ADMIN.email, password: 'kriva-lozinka' });
    expect(res.status).toBe(401);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  itDb('uspješan login postavlja httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.user.role_name).toBe('Administrator');
    const cookie = (res.headers['set-cookie'] || []).join(';');
    expect(cookie).toMatch(/HttpOnly/i);
  });

  itDb('zaštićena ruta bez tokena vraća 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

describe('Korisnici (integracija)', () => {
  itDb('zaposlenik ne može listati korisnike (403)', async () => {
    const agent = await loginAgent(EMPLOYEE);
    const res = await agent.get('/api/users');
    expect(res.status).toBe(403);
  });

  itDb('email izvan @veleri.hr domene je odbijen', async () => {
    const agent = await loginAgent(ADMIN);
    const res = await agent.post('/api/users').send({
      first_name: 'Vanjski', last_name: 'Korisnik',
      email: 'vanjski@gmail.com', role_id: 2,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('@veleri.hr');
  });

  itDb('admin kreira korisnika: invite link + neaktivan dok ne postavi lozinku', async () => {
    const agent = await loginAgent(ADMIN);
    const res = await agent.post('/api/users').send({
      first_name: 'Integracijski', last_name: 'Test',
      email: 'integracijski.test@veleri.hr', role_id: 2,
    });
    expect(res.status).toBe(201);
    expect(res.body.inviteLink).toContain('/set-password?token=');

    const list = await agent.get('/api/users');
    const created = list.body.find((u) => u.email === 'integracijski.test@veleri.hr');
    expect(created).toBeDefined();
    expect(Boolean(created.is_active)).toBe(false);
  });
});

describe('Kategorije i limiti (integracija, SRS 7.1)', () => {
  itDb('limit kategorije iznad godišnjeg budžeta je odbijen', async () => {
    const agent = await loginAgent(ADMIN);
    // Seed: budžet 100000, alocirano po kategorijama 20000
    const res = await agent.post('/api/fiscal-years/1/categories')
      .send({ name: 'Preskupa kategorija', category_limit: 90000 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('premašuju godišnji budžet');
  });

  itDb('kategorija s limitom unutar budžeta se kreira i vraća potrošnju', async () => {
    const agent = await loginAgent(ADMIN);
    const created = await agent.post('/api/fiscal-years/1/categories')
      .send({ name: 'Integracijska kategorija', category_limit: 1000 });
    expect(created.status).toBe(201);

    const list = await agent.get('/api/fiscal-years/1/categories');
    expect(list.status).toBe(200);
    const cat = list.body.categories.find((c) => c.name === 'Integracijska kategorija');
    expect(Number(cat.category_limit)).toBe(1000);
    expect(Number(cat.spent_amount)).toBe(0);
    expect(list.body.unattributed).toEqual({ request_count: 0, total_amount: 0 });

    const del = await agent.delete(`/api/fiscal-years/1/categories/${cat.id_item_category}`);
    expect(del.status).toBe(200);
  });
});

describe('Workflow zahtjeva (integracija)', () => {
  let requestId;

  itDb('zaposlenik kreira zahtjev — dobiva NAB broj i status Poslano', async () => {
    const agent = await loginAgent(EMPLOYEE);
    const res = await agent.post('/api/requests').send({
      fk_fiscal_year: 1,
      fk_department: 1,
      justification: 'Integracijski test zahtjeva',
      estimated_amount: 150,
      comment: 'Napomena iz integracijskog testa',
      items: [{ fk_item_category: 1, item_name: 'Integracijska stavka', quantity: 2 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.request_number).toMatch(/^NAB-\d{4}-\d{4}$/);
    requestId = res.body.id_purchase_request;
  });

  itDb('zaposlenik ne može izvršiti admin akciju preuzmi (403)', async () => {
    const agent = await loginAgent(EMPLOYEE);
    const res = await agent.patch(`/api/requests/${requestId}/status`).send({ action: 'preuzmi' });
    expect(res.status).toBe(403);
  });

  itDb('admin preuzima zahtjev, ali odobrenje bez ponude je odbijeno', async () => {
    const agent = await loginAgent(ADMIN);
    const take = await agent.patch(`/api/requests/${requestId}/status`).send({ action: 'preuzmi' });
    expect(take.status).toBe(200);

    const approve = await agent.patch(`/api/requests/${requestId}/status`).send({ action: 'odobri' });
    expect(approve.status).toBe(400);
  });

  itDb('zaposlenik u listi vidi samo vlastite zahtjeve', async () => {
    const agent = await loginAgent(EMPLOYEE);
    const res = await agent.get('/api/requests');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    // Svi zahtjevi pripadaju zaposleniku (id_user 2 iz seeda)
    for (const r of res.body.data) {
      expect(r.created_by).toContain('Zaposlenik');
    }
  });
});
