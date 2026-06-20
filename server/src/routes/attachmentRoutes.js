const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(__dirname, '../../uploads');

// Handles both legacy absolute paths and new relative paths from UPLOADS_DIR.
const resolveFilePath = (filePath) =>
  path.isAbsolute(filePath) ? filePath : path.join(UPLOADS_DIR, filePath);

const LOCKED_STATUSES = [5, 7]; // Odbijeno, Zatvoreno

const isAdmin = (user) => user.role_name === 'Administrator';

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
   GET /api/attachments/download/:id
   ─────────────────────────────────────────────── */

router.get('/download/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const attachment = await getAttachmentForUser(id, req.user);

    if (!attachment) {
      return res.status(404).json({ message: 'Fajl nije pronađen.' });
    }

    const resolvedPath = path.resolve(resolveFilePath(attachment.file_path));
    if (!resolvedPath.startsWith(UPLOADS_DIR + path.sep) && resolvedPath !== UPLOADS_DIR) {
      return res.status(403).json({ message: 'Pristup odbijen.' });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ message: 'Fajl ne postoji na disku.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
    res.setHeader('Content-Type', attachment.file_type);
    res.sendFile(resolvedPath);
  } catch (error) {
    console.error('GET download error:', error);
    res.status(500).json({ message: 'Greška pri preuzimanju fajla.' });
  }
});

/* ───────────────────────────────────────────────
   DELETE /api/attachments/delete/:id
   ─────────────────────────────────────────────── */

router.delete('/delete/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id_user;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

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

    if (!userIsAdmin && !isCreatorOfRequest) {
      await connection.rollback();
      return res.status(404).json({ message: 'Fajl nije pronađen.' });
    }

    if (!userIsAdmin && !isUploader) {
      await connection.rollback();
      return res.status(403).json({ message: 'Nemate dozvolu za brisanje ovog fajla.' });
    }

    if (LOCKED_STATUSES.includes(attachment.fk_request_status)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Zahtjev je zaključan — dokumenti se više ne mogu brisati.' });
    }

    await connection.query('DELETE FROM Attachment WHERE id_attachment = ?', [id]);

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

    try {
      const diskPath = resolveFilePath(attachment.file_path);
      if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
    } catch (err) {
      console.error('Cleanup file failed:', err.message);
    }

    res.json({ message: 'Fajl uspješno obrisan.' });
  } catch (error) {
    await connection.rollback();
    console.error('DELETE attachment error:', error);
    res.status(500).json({ message: 'Greška pri brisanju fajla.' });
  } finally {
    connection.release();
  }
});

module.exports = router;
