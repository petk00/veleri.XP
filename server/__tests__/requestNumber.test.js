/**
 * Unit testovi: Generiranje broja zahtjeva (PR-GGGG-NNNN)
 *
 * Testira logiku generiranja sekvencijalnog broja zahtjeva unutar
 * POST /api/requests rute. MySQL pool i authMiddleware su mockani
 * kako bi testovi bili izolirani od baze podataka.
 */

jest.mock('../src/config/db');
jest.mock('../src/middleware/authMiddleware', () => (req, res, next) => {
  req.user = global.__testUser__ || { id_user: 1, role_name: 'Zaposlenik' };
  next();
});

const supertest = require('supertest');
const express  = require('express');
const db       = require('../src/config/db');

const app = express();
app.use(express.json());
app.use('/api/requests', require('../src/routes/requestRoutes'));

// ---------------------------------------------------------------------------
// Pomoćna funkcija: stvara mock konekciju s unaprijed definiranim odgovorima
// na sequencijalne query pozive.
// mysql2 query() vraća [rows, fields] za SELECT i [OkPacket, fields] za INSERT.
// ---------------------------------------------------------------------------
const makeConn = (queryResults) => {
  const conn = {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit:           jest.fn().mockResolvedValue(undefined),
    rollback:         jest.fn().mockResolvedValue(undefined),
    release:          jest.fn(),
    query:            jest.fn(),
  };
  queryResults.forEach((result) => conn.query.mockResolvedValueOnce(result));
  return conn;
};

// Tijelo zahtjeva koje prolazi sve validacije
const VALID_BODY = {
  fk_fiscal_year: 1,
  fk_department:  1,
  justification:  'Test nabava za diplomski rad.',
  items: [{ fk_item_category: 1, item_name: 'Laptop', quantity: 1 }],
};

// Slijed mock odgovora za uspješno kreiranje prvog zahtjeva
const successQueryResponses = (lastRequestNumber = null) => [
  [[{ year: 2026, is_closed: 0 }],   []],  // 1. SELECT FiscalYear
  [[{ id_department: 1 }],           []],  // 2. SELECT Department (provjera FK)
  [[{ id_item_category: 1 }],        []],  // 3. SELECT ItemCategory (provjera FK)
  [lastRequestNumber                        // 4. SELECT ... FOR UPDATE (zadnji broj)
    ? [{ request_number: lastRequestNumber }]
    : [],
  []],
  [{ insertId: 1, affectedRows: 1 }, []],  // 5. INSERT PurchaseRequest
  [{ affectedRows: 1 },              []],  // 6. INSERT PurchaseRequestItem
  [{ affectedRows: 1 },              []],  // 7. INSERT RequestStatusHistory
];

// ---------------------------------------------------------------------------

beforeEach(() => jest.clearAllMocks());

describe('Generiranje broja zahtjeva (PR-GGGG-NNNN)', () => {

  test('1. prvi zahtjev u godini dobiva broj PR-2026-0001', async () => {
    db.getConnection.mockResolvedValue(makeConn(successQueryResponses(null)));

    const res = await supertest(app).post('/api/requests').send(VALID_BODY);

    expect(res.status).toBe(201);
    expect(res.body.request_number).toBe('PR-2026-0001');
  });

  test('2. drugi zahtjev u godini dobiva PR-2026-0002 (inkrement)', async () => {
    db.getConnection.mockResolvedValue(makeConn(successQueryResponses('PR-2026-0001')));

    const res = await supertest(app).post('/api/requests').send(VALID_BODY);

    expect(res.status).toBe(201);
    expect(res.body.request_number).toBe('PR-2026-0002');
  });

  test('3. sekvenca se pravilno prelama iz 4-znamenkastog zapisa (0099 → 0100)', async () => {
    db.getConnection.mockResolvedValue(makeConn(successQueryResponses('PR-2026-0099')));

    const res = await supertest(app).post('/api/requests').send(VALID_BODY);

    expect(res.status).toBe(201);
    expect(res.body.request_number).toBe('PR-2026-0100');
  });

  test('4. format broja zahtjeva odgovara obrascu PR-GGGG-NNNN', async () => {
    db.getConnection.mockResolvedValue(makeConn(successQueryResponses(null)));

    const res = await supertest(app).post('/api/requests').send(VALID_BODY);

    expect(res.body.request_number).toMatch(/^PR-\d{4}-\d{4}$/);
  });

  test('5. kreiranje zahtjeva u zatvorenoj poslovnoj godini vraća 400', async () => {
    db.getConnection.mockResolvedValue(makeConn([
      [[{ year: 2026, is_closed: 1 }], []],  // Godina je zatvorena
    ]));

    const res = await supertest(app).post('/api/requests').send(VALID_BODY);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/zatvorena/i);
  });

});
