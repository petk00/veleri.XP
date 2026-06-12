/**
 * Unit testovi: State machine promjene statusa zahtjeva
 *
 * Testira PATCH /api/requests/:id/status rutu:
 *   - validaciju akcija (nepoznata akcija, nedozvoljena u trenutnom statusu)
 *   - provjeru ovlasti (adminOnly, creatorOnly)
 *   - obavezne komentare (requiresComment)
 *   - zaključane statuse (LOCKED_STATUSES)
 *   - provjeru dokumenata (requiresOffer, requiresDelivery)
 *   - provjeru iznosa (requiresAmount)
 *   - uspješan prijelaz statusa
 */

jest.mock('../src/config/db');
jest.mock('../src/middleware/authMiddleware', () => (req, res, next) => {
  req.user = global.__testUser__ || { id_user: 1, role_name: 'Administrator' };
  next();
});

const supertest = require('supertest');
const express  = require('express');
const db       = require('../src/config/db');

const app = express();
app.use(express.json());
app.use('/api/requests', require('../src/routes/requestRoutes'));

// STATUS ID-evi iz baze (odgovaraju RequestStatus tablici)
const STATUS = {
  POSLANO:       1,
  NA_ODOBRENJU:  2,
  VRACENO:       3,
  ODBIJENO:      5,
  NARUCENO:      6,
  ZATVORENO:     7,
};

const makeConn = (queryResults) => {
  const conn = {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit:           jest.fn().mockResolvedValue(undefined),
    rollback:         jest.fn().mockResolvedValue(undefined),
    release:          jest.fn(),
    query:            jest.fn(),
  };
  queryResults.forEach((r) => conn.query.mockResolvedValueOnce(r));
  return conn;
};

// Vraća mock konekciju za tipičan uspješan prijelaz statusa (bez provjere dokumenata)
const connForSimpleTransition = (currentStatus, createdBy = 1) =>
  makeConn([
    [[{ fk_request_status: currentStatus, fk_created_by_user: createdBy, total_amount: null }], []],
    [{ affectedRows: 1 }, []],  // UPDATE status
    [{ affectedRows: 1 }, []],  // INSERT history
  ]);

// Vraća mock konekciju za akcije koje provjeravaju dokumente
const connWithDocs = (currentStatus, docTypes = []) =>
  makeConn([
    [[{ fk_request_status: currentStatus, fk_created_by_user: 1, total_amount: 1000 }], []],
    [docTypes.map((d) => ({ document_type: d })), []],  // SELECT document_type FROM Attachment
    [{ affectedRows: 1 }, []],
    [{ affectedRows: 1 }, []],
  ]);

// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  global.__testUser__ = { id_user: 1, role_name: 'Administrator' };
});

describe('Validacija akcije', () => {

  test('1. nepoznata akcija vraća 400', async () => {
    const res = await supertest(app)
      .patch('/api/requests/1/status')
      .send({ action: 'nepostojeca-akcija' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/nepoznata akcija/i);
  });

  test('2. akcija nije dozvoljena u trenutnom statusu — preuzmi iz NARUCENO vraća 400', async () => {
    db.getConnection.mockResolvedValue(connForSimpleTransition(STATUS.NARUCENO));

    const res = await supertest(app)
      .patch('/api/requests/1/status')
      .send({ action: 'preuzmi' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/nije dozvoljena/i);
  });

});

describe('Provjera ovlasti', () => {

  test('3. adminOnly akcija (preuzmi) od zaposlenika vraća 403', async () => {
    global.__testUser__ = { id_user: 2, role_name: 'Zaposlenik' };

    const res = await supertest(app)
      .patch('/api/requests/1/status')
      .send({ action: 'preuzmi' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/administrator/i);
  });

});

describe('Obavezni komentar', () => {

  test('4. odbij bez komentara vraća 400', async () => {
    const res = await supertest(app)
      .patch('/api/requests/1/status')
      .send({ action: 'odbij' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/komentar.*obavezan/i);
  });

  test('5. odbij s praznim komentarom vraća 400', async () => {
    const res = await supertest(app)
      .patch('/api/requests/1/status')
      .send({ action: 'odbij', comment: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/komentar.*obavezan/i);
  });

});

describe('Zaključani statusi (LOCKED_STATUSES)', () => {

  test('6. akcija na zahtjevu u statusu ODBIJENO (5) vraća 400', async () => {
    db.getConnection.mockResolvedValue(connForSimpleTransition(STATUS.ODBIJENO));

    const res = await supertest(app)
      .patch('/api/requests/1/status')
      .send({ action: 'preuzmi' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/zaključan/i);
  });

  test('7. akcija na zahtjevu u statusu ZATVORENO (7) vraća 400', async () => {
    db.getConnection.mockResolvedValue(connForSimpleTransition(STATUS.ZATVORENO));

    const res = await supertest(app)
      .patch('/api/requests/1/status')
      .send({ action: 'storno', comment: 'Storno zatvorenog' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/zaključan/i);
  });

});

describe('Provjera dokumenata', () => {

  test('8. odobri bez uploadane Ponude vraća 400', async () => {
    // Zahtjev je NA_ODOBRENJU ali nema attachmenta
    db.getConnection.mockResolvedValue(connWithDocs(STATUS.NA_ODOBRENJU, []));

    const res = await supertest(app)
      .patch('/api/requests/1/status')
      .send({ action: 'odobri' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ponudu/i);
  });

  test('9. zavrsi bez Otpremnice (samo Ponuda) vraća 400', async () => {
    db.getConnection.mockResolvedValue(connWithDocs(STATUS.NARUCENO, ['Ponuda']));

    const res = await supertest(app)
      .patch('/api/requests/1/status')
      .send({ action: 'zavrsi' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/otpremnicu/i);
  });

  test('10. zavrsi bez iznosa (total_amount null) vraća 400', async () => {
    db.getConnection.mockResolvedValue(makeConn([
      [[{ fk_request_status: STATUS.NARUCENO, fk_created_by_user: 1, total_amount: null }], []],
      [[{ document_type: 'Ponuda' }, { document_type: 'Otpremnica' }], []],
    ]));

    const res = await supertest(app)
      .patch('/api/requests/1/status')
      .send({ action: 'zavrsi' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/iznos/i);
  });

});

describe('Uspješni prijelazi statusa', () => {

  test('11. preuzmi — Poslano (1) → Na odobrenju (2) vraća 200', async () => {
    db.getConnection.mockResolvedValue(connForSimpleTransition(STATUS.POSLANO));

    const res = await supertest(app)
      .patch('/api/requests/1/status')
      .send({ action: 'preuzmi' });

    expect(res.status).toBe(200);
    expect(res.body.fk_request_status).toBe(STATUS.NA_ODOBRENJU);
  });

  test('12. zavrsi — Naručeno (6) → Zatvoreno (7) s Ponudom, Otpremnicom i iznosom vraća 200', async () => {
    db.getConnection.mockResolvedValue(connWithDocs(STATUS.NARUCENO, ['Ponuda', 'Otpremnica']));

    const res = await supertest(app)
      .patch('/api/requests/1/status')
      .send({ action: 'zavrsi' });

    expect(res.status).toBe(200);
    expect(res.body.fk_request_status).toBe(STATUS.ZATVORENO);
  });

});
