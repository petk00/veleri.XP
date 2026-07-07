const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');
const { detectMimeType } = require('../services/fileTypeService');

const STATUS = {
  POSLANO: 1,
  NA_ODOBRENJU: 2,
  VRACENO: 3,
  ODBIJENO: 5,
  NARUCENO: 6,
  ZATVORENO: 7,
};

const LOCKED_STATUSES = [STATUS.ODBIJENO, STATUS.ZATVORENO];

const UPLOAD_RULES = {
  Ponuda: [STATUS.POSLANO, STATUS.NA_ODOBRENJU, STATUS.VRACENO, STATUS.NARUCENO],
  Otpremnica: [STATUS.NARUCENO],
};

const DOCUMENT_TYPES = Object.keys(UPLOAD_RULES);

// Samo formati čije magic bytes file-type zna verificirati — text/plain i
// stari .doc/.xls (CFB) nemaju pouzdan potpis pa bi provjera uvijek vratila 415.
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'application/zip',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const isAdmin = (user) => user.role_name === 'Administrator';

const cleanupUploadedFile = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Cleanup uploaded file failed:', err.message);
  }
};

const getRequestForRead = async (requestId, user) => {
  const query = isAdmin(user)
    ? `SELECT id_purchase_request, fk_request_status
       FROM PurchaseRequest
       WHERE id_purchase_request = ?
       LIMIT 1`
    : `SELECT id_purchase_request, fk_request_status
       FROM PurchaseRequest
       WHERE id_purchase_request = ? AND fk_created_by_user = ?
       LIMIT 1`;
  const params = isAdmin(user) ? [requestId] : [requestId, user.id_user];
  const [rows] = await db.query(query, params);
  return rows[0] || null;
};

const lockRequestForWrite = async (connection, requestId, user) => {
  const query = isAdmin(user)
    ? `SELECT id_purchase_request, fk_request_status
       FROM PurchaseRequest
       WHERE id_purchase_request = ?
       LIMIT 1
       FOR UPDATE`
    : `SELECT id_purchase_request, fk_request_status
       FROM PurchaseRequest
       WHERE id_purchase_request = ? AND fk_created_by_user = ?
       LIMIT 1
       FOR UPDATE`;
  const params = isAdmin(user) ? [requestId] : [requestId, user.id_user];
  const [rows] = await connection.query(query, params);
  return rows[0] || null;
};

// path.resolve zbog konzistentnosti s download guardom u attachmentRoutes —
// file_path u bazi mora biti relativan od iste (apsolutne) baze.
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOADS_DIR, 'attachments', String(req.params.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tip fajla nije dozvoljen.'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

/* ───────────────────────────────────────────────
   POST /api/requests/:id/attachments
   ─────────────────────────────────────────────── */

router.post('/:id/attachments', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Fajl nije uploadan ili tip nije dozvoljen.' });
  }

  // Verify actual file magic bytes — prevents MIME spoofing
  const detectedMime = await detectMimeType(req.file.path);
  if (!detectedMime || !ALLOWED_TYPES.includes(detectedMime)) {
    cleanupUploadedFile(req.file.path);
    return res.status(415).json({ message: 'Tip fajla nije dozvoljen.' });
  }

  const { id } = req.params;
  const { document_type } = req.body;
  const userId = req.user.id_user;

  if (!document_type || !DOCUMENT_TYPES.includes(document_type)) {
    cleanupUploadedFile(req.file.path);
    return res.status(400).json({
      message: `Tip dokumenta mora biti jedan od: ${DOCUMENT_TYPES.join(', ')}.`,
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const request = await lockRequestForWrite(connection, id, req.user);

    if (!request) {
      cleanupUploadedFile(req.file.path);
      await connection.rollback();
      return res.status(404).json({ message: 'Zahtjev nije pronađen.' });
    }

    const currentStatus = request.fk_request_status;

    if (LOCKED_STATUSES.includes(currentStatus)) {
      cleanupUploadedFile(req.file.path);
      await connection.rollback();
      return res.status(400).json({ message: 'Zahtjev je zaključan — dokumenti se više ne mogu dodavati.' });
    }

    if (!UPLOAD_RULES[document_type].includes(currentStatus)) {
      cleanupUploadedFile(req.file.path);
      await connection.rollback();
      return res.status(400).json({
        message: `${document_type} se ne može uploadati dok je zahtjev u trenutnom statusu.`,
      });
    }

    const relativePath = path.relative(UPLOADS_DIR, req.file.path);

    const [result] = await connection.query(
      `INSERT INTO Attachment
        (fk_purchase_request, fk_uploaded_by_user, file_name, file_path, file_type, document_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, req.file.originalname, relativePath, req.file.mimetype, document_type]
    );

    await connection.query(
      `INSERT INTO RequestStatusHistory
        (fk_purchase_request, fk_request_status, fk_changed_by_user, comment)
       VALUES (?, ?, ?, ?)`,
      [id, currentStatus, userId, `Dokument dodan: ${document_type} — ${req.file.originalname}`]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Fajl uspješno uploadan.',
      id_attachment: result.insertId,
      file_name: req.file.originalname,
      document_type,
      fk_request_status: currentStatus,
    });
  } catch (error) {
    await connection.rollback();
    cleanupUploadedFile(req.file?.path);
    console.error('POST attachment error:', error);
    return res.status(500).json({ message: 'Greška pri spremanju fajla.' });
  } finally {
    connection.release();
  }
});

/* ───────────────────────────────────────────────
   GET /api/requests/:id/attachments
   ─────────────────────────────────────────────── */

router.get('/:id/attachments', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const request = await getRequestForRead(id, req.user);

    if (!request) {
      return res.status(404).json({ message: 'Zahtjev nije pronađen.' });
    }

    const [rows] = await db.query(
      `SELECT
         a.id_attachment,
         a.file_name,
         a.file_type,
         a.document_type,
         a.uploaded_at,
         a.fk_uploaded_by_user,
         CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by
       FROM Attachment a
       INNER JOIN AppUser u ON a.fk_uploaded_by_user = u.id_user
       WHERE a.fk_purchase_request = ?
       ORDER BY a.uploaded_at ASC`,
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error('GET attachments error:', error);
    res.status(500).json({ message: 'Greška pri dohvaćanju fajlova.' });
  }
});

module.exports = router;
