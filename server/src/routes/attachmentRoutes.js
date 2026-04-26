const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

/* ───────────────────────────────────────────────
   Konstante
   ─────────────────────────────────────────────── */

const STATUS = {
  POSLANO: 1,
  NA_ODOBRENJU: 2,
  VRACENO: 3,
  ODBIJENO: 5,
  NARUCENO: 6,
  ZATVORENO: 7,
};

const LOCKED_STATUSES = [STATUS.ODBIJENO, STATUS.ZATVORENO];

/**
 * U kojim statusima je dozvoljen upload kojeg dokumenta.
 * Ponuda može tijekom cijelog procesa do approve-a (jer FE wizard
 * šalje ponudu odmah nakon kreiranja, kad je status još Poslano).
 * Otpremnica tek kad je zahtjev odobren (Naručeno).
 */
const UPLOAD_RULES = {
  Ponuda: [STATUS.POSLANO, STATUS.NA_ODOBRENJU, STATUS.VRACENO],
  Otpremnica: [STATUS.NARUCENO],
};

const DOCUMENT_TYPES = Object.keys(UPLOAD_RULES);

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

const MAX_FILE_SIZE = 10 * 1024 * 1024;

/* ───────────────────────────────────────────────
   Helperi
   ─────────────────────────────────────────────── */

const isAdmin = (user) => user.role_name === 'Administrator';

/**
 * Tiha verzija fs.unlinkSync — ne baca grešku ako fajl ne postoji
 * ili je već obrisan. Koristi se u cleanup putanjama gdje smo već
 * usred error handlinga i ne želimo eksploziju maskirati pravu grešku.
 */
const cleanupUploadedFile = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Cleanup uploaded file failed:', err.message);
  }
};

/**
 * Read-only dohvat zahtjeva sa access provjerom.
 * Koristi globalni pool — bez lockova.
 */
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

/**
 * Dohvat zahtjeva s lockom — koristi se UNUTAR transakcije.
 * Bez ovog se može desiti race: dva paralelna uploada / delete-a
 * čitaju isti status i oba prođu provjeru.
 */
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

const getAttachmentForUser = async (attachmentId, user) => {
  const query = isAdmin(user)
    ? `SELECT
         a.id_attachment,
         a.file_name,
         a.file_path,
         a.file_type,
         a.document_type,
         a.fk_uploaded_by_user,
         a.fk_purchase_request
       FROM Attachment a
       WHERE a.id_attachment = ?
       LIMIT 1`
    : `SELECT
         a.id_attachment,
         a.file_name,
         a.file_path,
         a.file_type,
         a.document_type,
         a.fk_uploaded_by_user,
         a.fk_purchase_request
       FROM Attachment a
       INNER JOIN PurchaseRequest pr ON pr.id_purchase_request = a.fk_purchase_request
       WHERE a.id_attachment = ? AND pr.fk_created_by_user = ?
       LIMIT 1`;
  const params = isAdmin(user) ? [attachmentId] : [attachmentId, user.id_user];
  const [rows] = await db.query(query, params);
  return rows[0] || null;
};

/* ───────────────────────────────────────────────
   Multer konfiguracija
   ─────────────────────────────────────────────── */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/attachments', String(req.params.id));
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

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/* ───────────────────────────────────────────────
   POST /api/requests/:id/attachments
   Upload Ponude ili Otpremnice
   ─────────────────────────────────────────────── */

router.post('/:id/attachments', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'Fajl nije uploadan ili tip nije dozvoljen.',
    });
  }

  const { id } = req.params;
  const { document_type } = req.body;
  const userId = req.user.id_user;

  // Validacija document_type prije ulaska u transakciju
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

    // Locked statusi (Odbijeno, Zatvoreno)
    if (LOCKED_STATUSES.includes(currentStatus)) {
      cleanupUploadedFile(req.file.path);
      await connection.rollback();
      return res.status(400).json({
        message: 'Zahtjev je zaključan — dokumenti se više ne mogu dodavati.',
      });
    }

    // Pravila po tipu dokumenta
    if (!UPLOAD_RULES[document_type].includes(currentStatus)) {
      cleanupUploadedFile(req.file.path);
      await connection.rollback();
      return res.status(400).json({
        message: `${document_type} se ne može uploadati dok je zahtjev u trenutnom statusu.`,
      });
    }

    // INSERT attachment
    const [result] = await connection.query(
      `INSERT INTO Attachment
        (fk_purchase_request, fk_uploaded_by_user, file_name, file_path, file_type, document_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, req.file.originalname, req.file.path, req.file.mimetype, document_type]
    );

    // Audit trail
    await connection.query(
      `INSERT INTO RequestStatusHistory
        (fk_purchase_request, fk_request_status, fk_changed_by_user, comment)
       VALUES (?, ?, ?, ?)`,
      [
        id,
        currentStatus,
        userId,
        `Dokument dodan: ${document_type} — ${req.file.originalname}`,
      ]
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
    return res.status(500).json({
      message: 'Greška pri spremanju fajla.',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

/* ───────────────────────────────────────────────
   GET /api/requests/:id/attachments
   Lista dokumenata za zahtjev
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
    res.status(500).json({
      message: 'Greška pri dohvaćanju fajlova.',
      error: error.message,
    });
  }
});

/* ───────────────────────────────────────────────
   GET /api/attachments/download/:id
   Download specifičnog dokumenta
   ─────────────────────────────────────────────── */

router.get('/download/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const attachment = await getAttachmentForUser(id, req.user);

    if (!attachment) {
      return res.status(404).json({ message: 'Fajl nije pronađen.' });
    }

    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ message: 'Fajl ne postoji na disku.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
    res.setHeader('Content-Type', attachment.file_type);
    res.sendFile(attachment.file_path);
  } catch (error) {
    console.error('GET download error:', error);
    res.status(500).json({
      message: 'Greška pri preuzimanju fajla.',
      error: error.message,
    });
  }
});

/* ───────────────────────────────────────────────
   DELETE /api/attachments/delete/:id
   Brisanje (admin uvijek, uploader ako je njegov)
   Blokirano u zaključanim statusima (5, 7).
   Audit trail u RequestStatusHistory.
   ─────────────────────────────────────────────── */

router.delete('/delete/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id_user;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Dohvat attachmenta + zahtjeva s lockom — sve unutar iste transakcije
    const [attachmentRows] = await connection.query(
      `SELECT
         a.id_attachment,
         a.file_name,
         a.file_path,
         a.document_type,
         a.fk_uploaded_by_user,
         a.fk_purchase_request,
         pr.fk_request_status,
         pr.fk_created_by_user
       FROM Attachment a
       INNER JOIN PurchaseRequest pr ON pr.id_purchase_request = a.fk_purchase_request
       WHERE a.id_attachment = ?
       FOR UPDATE`,
      [id]
    );

    if (attachmentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Fajl nije pronađen.' });
    }

    const attachment = attachmentRows[0];
    const userIsAdmin = isAdmin(req.user);
    const isCreatorOfRequest = attachment.fk_created_by_user === userId;
    const isUploader = attachment.fk_uploaded_by_user === userId;

    // Access — admin sve, ne-admin samo ako je vlasnik zahtjeva (može vidjeti
    // i obrisati ono što je sam uploadao)
    if (!userIsAdmin && !isCreatorOfRequest) {
      await connection.rollback();
      return res.status(404).json({ message: 'Fajl nije pronađen.' });
    }

    // Permission za brisanje — admin ili uploader
    if (!userIsAdmin && !isUploader) {
      await connection.rollback();
      return res.status(403).json({
        message: 'Nemate dozvolu za brisanje ovog fajla.',
      });
    }

    // Locked status check
    if (LOCKED_STATUSES.includes(attachment.fk_request_status)) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Zahtjev je zaključan — dokumenti se više ne mogu brisati.',
      });
    }

    // DELETE iz baze
    await connection.query('DELETE FROM Attachment WHERE id_attachment = ?', [id]);

    // Audit trail
    await connection.query(
      `INSERT INTO RequestStatusHistory
        (fk_purchase_request, fk_request_status, fk_changed_by_user, comment)
       VALUES (?, ?, ?, ?)`,
      [
        attachment.fk_purchase_request,
        attachment.fk_request_status,
        userId,
        `Dokument obrisan: ${attachment.document_type} — ${attachment.file_name}`,
      ]
    );

    await connection.commit();

    // Tek nakon uspješnog commita brišemo s diska — DB je istina
    cleanupUploadedFile(attachment.file_path);

    res.json({ message: 'Fajl uspješno obrisan.' });
  } catch (error) {
    await connection.rollback();
    console.error('DELETE attachment error:', error);
    res.status(500).json({
      message: 'Greška pri brisanju fajla.',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;