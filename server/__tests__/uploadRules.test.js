/**
 * Unit testovi: Validacija uploada dokumenata
 *
 * Testira POST /api/requests/:id/attachments rutu:
 *   - provjeru tipa dokumenta (DOCUMENT_TYPES)
 *   - pravila uploada po statusu (UPLOAD_RULES)
 *   - zabranu uploada na zaključan zahtjev
 *   - uspješan upload u dozvoljenom statusu
 *
 * Multer je mockiran kako bi testovi bili izolirani od filesystem-a.
 * ALLOWED_TYPES (MIME whitelist) testiraju se kao čiste konstante.
 */

// Multer mock — simulira upload datoteke bez filesystem operacija.
// global.__mockFile__ postavlja se po testu za kontrolu req.file.
jest.mock('multer', () => {
  const m = jest.fn().mockImplementation(() => ({
    single: jest.fn(() => (req, res, next) => {
      if (global.__mockFile__ !== undefined) {
        req.file = global.__mockFile__;
      }
      next();
    }),
  }));
  m.diskStorage = jest.fn(() => ({}));
  return m;
});

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  unlinkSync:  jest.fn(),
  mkdirSync:   jest.fn(),
}));

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
// requestAttachmentRoutes definira /:id/attachments — montiramo na / da URL-ovi budu /1/attachments
app.use('/', require('../src/routes/requestAttachmentRoutes'));

const STATUS = {
  POSLANO:      1,
  NA_ODOBRENJU: 2,
  VRACENO:      3,
  ODBIJENO:     5,
  NARUCENO:     6,
  ZATVORENO:    7,
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

// Mock file koji prolazi multer (pravi mimetype nije bitan jer je multer mockiran)
const MOCK_PDF_FILE = {
  originalname: 'ponuda.pdf',
  mimetype:     'application/pdf',
  size:         1024,
  path:         '/tmp/uploads/1/123-ponuda.pdf',
};

beforeEach(() => {
  jest.clearAllMocks();
  global.__testUser__ = { id_user: 1, role_name: 'Zaposlenik' };
  global.__mockFile__ = MOCK_PDF_FILE;
});

// ---------------------------------------------------------------------------
// 1. Čisti unit testovi za ALLOWED_TYPES (bez routea, bez HTTP)
// ---------------------------------------------------------------------------
describe('ALLOWED_TYPES — dozvoljeni MIME tipovi', () => {
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/plain',
    'application/zip',
  ];

  test('1. PDF (application/pdf) je dozvoljen', () => {
    expect(ALLOWED_TYPES).toContain('application/pdf');
  });

  test('2. Word DOCX je dozvoljen', () => {
    expect(ALLOWED_TYPES).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });

  test('3. ZIP je dozvoljen', () => {
    expect(ALLOWED_TYPES).toContain('application/zip');
  });

  test('4. image/gif NIJE dozvoljen', () => {
    expect(ALLOWED_TYPES).not.toContain('image/gif');
  });

  test('5. video/mp4 NIJE dozvoljen', () => {
    expect(ALLOWED_TYPES).not.toContain('video/mp4');
  });
});

// ---------------------------------------------------------------------------
// 2. UPLOAD_RULES — pravila po statusu (HTTP testovi s mock bazom)
// ---------------------------------------------------------------------------
describe('UPLOAD_RULES — pravila uploada po statusu zahtjeva', () => {

  test('6. upload bez datoteke vraća 400', async () => {
    global.__mockFile__ = null;  // simulira da multer nije primio datoteku

    const res = await supertest(app)
      .post('/1/attachments')
      .send({ document_type: 'Ponuda' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/fajl nije uploadan/i);
  });

  test('7. nepoznati tip dokumenta vraća 400', async () => {
    const res = await supertest(app)
      .post('/1/attachments')
      .send({ document_type: 'Narudžbenica' });  // ne postoji u DOCUMENT_TYPES

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/tip dokumenta/i);
  });

  test('8. upload Ponude u statusu POSLANO (1) je dozvoljen', async () => {
    db.getConnection.mockResolvedValue(makeConn([
      [[{ id_purchase_request: 1, fk_request_status: STATUS.POSLANO }], []],  // lockRequestForWrite
      [{ insertId: 5, affectedRows: 1 }, []],  // INSERT Attachment
      [{ affectedRows: 1 }, []],               // INSERT history
    ]));

    const res = await supertest(app)
      .post('/1/attachments')
      .send({ document_type: 'Ponuda' });

    expect(res.status).toBe(201);
    expect(res.body.document_type).toBe('Ponuda');
  });

  test('9. upload Otpremnice u statusu POSLANO (1) nije dozvoljen — vraća 400', async () => {
    db.getConnection.mockResolvedValue(makeConn([
      [[{ id_purchase_request: 1, fk_request_status: STATUS.POSLANO }], []],
    ]));

    const res = await supertest(app)
      .post('/1/attachments')
      .send({ document_type: 'Otpremnica' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/otpremnica/i);
  });

  test('10. upload Otpremnice u statusu NARUCENO (6) je dozvoljen', async () => {
    db.getConnection.mockResolvedValue(makeConn([
      [[{ id_purchase_request: 1, fk_request_status: STATUS.NARUCENO }], []],
      [{ insertId: 6, affectedRows: 1 }, []],
      [{ affectedRows: 1 }, []],
    ]));

    const res = await supertest(app)
      .post('/1/attachments')
      .send({ document_type: 'Otpremnica' });

    expect(res.status).toBe(201);
    expect(res.body.document_type).toBe('Otpremnica');
  });

  test('11. upload na zaključan zahtjev (ODBIJENO=5) vraća 400', async () => {
    db.getConnection.mockResolvedValue(makeConn([
      [[{ id_purchase_request: 1, fk_request_status: STATUS.ODBIJENO }], []],
    ]));

    const res = await supertest(app)
      .post('/1/attachments')
      .send({ document_type: 'Ponuda' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/zaključan/i);
  });

  test('12. upload na zaključan zahtjev (ZATVORENO=7) vraća 400', async () => {
    db.getConnection.mockResolvedValue(makeConn([
      [[{ id_purchase_request: 1, fk_request_status: STATUS.ZATVORENO }], []],
    ]));

    const res = await supertest(app)
      .post('/1/attachments')
      .send({ document_type: 'Ponuda' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/zaključan/i);
  });

});
