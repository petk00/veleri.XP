const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

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

const DOCUMENT_TYPES = ['Ponuda', 'Otpremnica'];

const assertRequestAccess = async (requestId, user) => {
  const isAdmin = user.role_name === 'Administrator';
  const query = isAdmin
    ? 'SELECT id_purchase_request, fk_request_status FROM PurchaseRequest WHERE id_purchase_request = ? LIMIT 1'
    : `SELECT id_purchase_request, fk_request_status
       FROM PurchaseRequest
       WHERE id_purchase_request = ? AND fk_created_by_user = ?
       LIMIT 1`;
  const params = isAdmin ? [requestId] : [requestId, user.id_user];
  const [rows] = await db.query(query, params);

  return rows[0] || null;
};

const getAttachmentForUser = async (attachmentId, user) => {
  const isAdmin = user.role_name === 'Administrator';
  const query = isAdmin
    ? `SELECT
         a.id_attachment,
         a.file_name,
         a.file_path,
         a.file_type,
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
         a.fk_uploaded_by_user,
         a.fk_purchase_request
       FROM Attachment a
       INNER JOIN PurchaseRequest pr ON pr.id_purchase_request = a.fk_purchase_request
       WHERE a.id_attachment = ? AND pr.fk_created_by_user = ?
       LIMIT 1`;
  const params = isAdmin ? [attachmentId] : [attachmentId, user.id_user];
  const [rows] = await db.query(query, params);

  return rows[0] || null;
};

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
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// POST /api/requests/:id/attachments
router.post('/:id/attachments', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'Fajl nije uploadan ili tip nije dozvoljen.',
    });
  }

  const { id } = req.params;
  const { document_type } = req.body;
  const userId = req.user.id_user;

  if (!document_type || !DOCUMENT_TYPES.includes(document_type)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      message: `Tip dokumenta mora biti jedan od: ${DOCUMENT_TYPES.join(', ')}.`,
    });
  }

  try {
    const request = await assertRequestAccess(id, req.user);

    if (!request) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Zahtjev nije pronađen.' });
    }

    const [result] = await db.query(
      `INSERT INTO Attachment
        (fk_purchase_request, fk_uploaded_by_user, file_name, file_path, file_type, document_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, req.file.originalname, req.file.path, req.file.mimetype, document_type]
    );
    // Upiši u status history (audit trail za dokumente)
    const currentStatus = request.fk_request_status;
    await db.query(
      `INSERT INTO RequestStatusHistory
        (fk_purchase_request, fk_request_status, fk_changed_by_user, comment)
       VALUES (?, ?, ?, ?)`,
      [
        id,
        currentStatus,
        userId,
        `Dokument dodan: ${document_type} - ${req.file.originalname}`,
      ]
    );
    return res.status(201).json({
      message: 'Fajl uspješno uploadan.',
      id_attachment: result.insertId,
      file_name: req.file.originalname,
      document_type,
    });
  } catch (error) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    console.error('POST attachment error:', error);
    return res.status(500).json({
      message: 'Greška pri spremanju fajla.',
      error: error.message,
    });
  }
});

// GET /api/requests/:id/attachments
router.get('/:id/attachments', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const request = await assertRequestAccess(id, req.user);

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

// GET /api/attachments/download/:id
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

// DELETE /api/attachments/delete/:id
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id_user;
  const isAdmin = req.user.role_name === 'Administrator';

  try {
    const attachment = await getAttachmentForUser(id, req.user);

    if (!attachment) {
      return res.status(404).json({ message: 'Fajl nije pronađen.' });
    }

    if (!isAdmin && attachment.fk_uploaded_by_user !== userId) {
      return res.status(403).json({
        message: 'Nemate dozvolu za brisanje ovog fajla.',
      });
    }

    await db.query('DELETE FROM Attachment WHERE id_attachment = ?', [id]);

    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    res.json({ message: 'Fajl uspješno obrisan.' });
  } catch (error) {
    console.error('DELETE attachment error:', error);
    res.status(500).json({
      message: 'Greška pri brisanju fajla.',
      error: error.message,
    });
  }
});

module.exports = router;
