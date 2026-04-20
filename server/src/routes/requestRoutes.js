const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');
// Status ID-jevi (moraju odgovarati onima u tablici RequestStatus)
const STATUS = {
  DRAFT: 1,
  SUBMITTED: 2,
  APPROVED: 3,
  REJECTED: 4,
  COMPLETED: 5,
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role_name === 'Administrator';

    // Admin vidi sve, zaposlenik vidi samo svoje
    const whereClause = isAdmin
      ? ''
      : 'WHERE pr.fk_created_by_user = ?';

    const params = isAdmin
      ? []
      : [req.user.id_user];

    const [rows] = await db.query(`
      SELECT
        pr.id_purchase_request,
        pr.request_number,
        fy.year AS fiscal_year,
        d.name AS department_name,
        rs.name AS status_name,
        CONCAT(u.first_name, ' ', u.last_name) AS created_by,
        pr.total_amount,
        pr.created_at
      FROM PurchaseRequest pr
      INNER JOIN FiscalYear fy ON pr.fk_fiscal_year = fy.id_fiscal_year
      INNER JOIN Department d ON pr.fk_department = d.id_department
      INNER JOIN RequestStatus rs ON pr.fk_request_status = rs.id_request_status
      INNER JOIN AppUser u ON pr.fk_created_by_user = u.id_user
      ${whereClause}
      ORDER BY pr.created_at DESC, pr.id_purchase_request DESC
    `, params);

    
    res.json(rows);
  } catch (error) {
    console.error('GET /api/requests error:', error);
    res.status(500).json({
      message: 'Greška pri dohvaćanju zahtjeva.',
      error: error.message,
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [requestRows] = await db.query(
      `
      SELECT
        pr.id_purchase_request,
        pr.request_number,
        fy.year AS fiscal_year,
        d.name AS department_name,
        rs.name AS status_name,
        CONCAT(u.first_name, ' ', u.last_name) AS created_by,
        pr.total_amount,
        pr.justification,
        pr.created_at,
        pr.updated_at
      FROM PurchaseRequest pr
      INNER JOIN FiscalYear fy ON pr.fk_fiscal_year = fy.id_fiscal_year
      INNER JOIN Department d ON pr.fk_department = d.id_department
      INNER JOIN RequestStatus rs ON pr.fk_request_status = rs.id_request_status
      INNER JOIN AppUser u ON pr.fk_created_by_user = u.id_user
      WHERE pr.id_purchase_request = ?
      LIMIT 1
      `,
      [id]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        message: 'Zahtjev nije pronađen.',
      });
    }

    const [itemRows] = await db.query(
      `
      SELECT
        pri.id_purchase_request_item,
        pri.item_name,
        pri.quantity,
        ic.name AS category_name
      FROM PurchaseRequestItem pri
      INNER JOIN ItemCategory ic ON pri.fk_item_category = ic.id_item_category
      WHERE pri.fk_purchase_request = ?
      ORDER BY pri.id_purchase_request_item ASC
      `,
      [id]
    );

    const [historyRows] = await db.query(
      `
      SELECT
        rsh.id_request_status_history,
        rs.name AS status_name,
        rs.id_request_status,
        CONCAT(u.first_name, ' ', u.last_name) AS changed_by,
        rsh.changed_at,
        rsh.comment
      FROM RequestStatusHistory rsh
      INNER JOIN RequestStatus rs ON rsh.fk_request_status = rs.id_request_status
      INNER JOIN AppUser u ON rsh.fk_changed_by_user = u.id_user
      WHERE rsh.fk_purchase_request = ?
      ORDER BY rsh.changed_at ASC, rsh.id_request_status_history ASC
      `,
      [id]
    );

    res.json({
      request: requestRows[0],
      items: itemRows,
      history: historyRows,  // ← NOVO
    });
  } catch (error) {
    console.error('GET /api/requests/:id error:', error);
    res.status(500).json({
      message: 'Greška pri dohvaćanju detalja zahtjeva.',
      error: error.message,
    });
  }
});
/**
 * POST /api/requests
 * Kreira novi zahtjev sa svim stavkama i prvi unos u status history.
 *
 * Expected body:
 * {
 *   fk_fiscal_year: number,
 *   fk_department: number,
 *   justification: string,
 *   estimated_amount: number | null,
 *   save_mode: 'draft' | 'submit',
 *   items: [
 *     { fk_item_category: number, item_name: string, quantity: number },
 *     ...
 *   ]
 * }
 */
router.post('/', authenticateToken, async (req, res) => {
  const {
    fk_fiscal_year,
    fk_department,
    justification,
    estimated_amount,
    save_mode,
    items,
  } = req.body;

  // --- 1. VALIDACIJA INPUTA ---
  if (!fk_fiscal_year || !fk_department) {
    return res.status(400).json({
      message: 'Fiskalna godina i odjel su obavezni.',
    });
  }

  if (!justification || !justification.trim()) {
    return res.status(400).json({
      message: 'Razlog nabave je obavezan.',
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: 'Zahtjev mora sadržavati barem jednu stavku.',
    });
  }

  for (const [idx, item] of items.entries()) {
    if (!item.fk_item_category || !item.item_name || !item.item_name.trim()) {
      return res.status(400).json({
        message: `Stavka #${idx + 1}: kategorija i naziv artikla su obavezni.`,
      });
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return res.status(400).json({
        message: `Stavka #${idx + 1}: količina mora biti cijeli broj veći od 0.`,
      });
    }
  }

  // --- 2. ODREĐIVANJE STATUSA I USER-A ---
  const statusId = save_mode === 'submit' ? STATUS.SUBMITTED : STATUS.DRAFT;
  const userId = req.user.id_user;

  // --- 3. TRANSAKCIJA ---
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 3a) Dohvati godinu fiskalne godine (trebamo je za request_number)
    const [fyRows] = await connection.query(
      'SELECT year FROM FiscalYear WHERE id_fiscal_year = ? LIMIT 1',
      [fk_fiscal_year]
    );

    if (fyRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Fiskalna godina ne postoji.',
      });
    }

    const year = fyRows[0].year;

    // 3b) Generiraj sljedeći request_number - s FOR UPDATE lock-om
    const prefix = `PR-${year}-`;
    const [maxRows] = await connection.query(
      `
      SELECT request_number
      FROM PurchaseRequest
      WHERE request_number LIKE ?
      ORDER BY id_purchase_request DESC
      LIMIT 1
      FOR UPDATE
      `,
      [`${prefix}%`]
    );

    let nextSeq = 1;
    if (maxRows.length > 0) {
      const lastNumber = maxRows[0].request_number; // npr. "PR-2026-0007"
      const lastSeq = parseInt(lastNumber.split('-')[2], 10);
      if (!Number.isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    const requestNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    // 3c) INSERT u PurchaseRequest (glavni red)
    const [insertResult] = await connection.query(
      `
      INSERT INTO PurchaseRequest
        (request_number, fk_fiscal_year, fk_department, fk_request_status,
         fk_created_by_user, total_amount, justification)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        requestNumber,
        fk_fiscal_year,
        fk_department,
        statusId,
        userId,
        estimated_amount || null,
        justification.trim(),
      ]
    );

    const newRequestId = insertResult.insertId;

    // 3d) INSERT svih stavki odjednom (bulk insert)
    const itemValues = items.map((it) => [
      newRequestId,
      it.fk_item_category,
      it.item_name.trim(),
      it.quantity,
    ]);

    await connection.query(
      `
      INSERT INTO PurchaseRequestItem
        (fk_purchase_request, fk_item_category, item_name, quantity)
      VALUES ?
      `,
      [itemValues]
    );

    // 3e) INSERT prvog unosa u RequestStatusHistory (audit trail)
    const historyComment =
      statusId === STATUS.SUBMITTED
        ? 'Zahtjev kreiran i poslan na odobravanje.'
        : 'Zahtjev kreiran kao skica.';

    await connection.query(
      `
      INSERT INTO RequestStatusHistory
        (fk_purchase_request, fk_request_status, fk_changed_by_user, comment)
      VALUES (?, ?, ?, ?)
      `,
      [newRequestId, statusId, userId, historyComment]
    );

    // 3f) Sve je prošlo -> COMMIT
    await connection.commit();

    return res.status(201).json({
      message: 'Zahtjev je uspješno kreiran.',
      id_purchase_request: newRequestId,
      request_number: requestNumber,
      status_id: statusId,
    });
  } catch (error) {
    // Ako bilo što pukne -> ROLLBACK (sve se vrati kao da nije bilo)
    await connection.rollback();
    console.error('POST /api/requests error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Došlo je do konflikta pri generiranju broja zahtjeva. Pokušajte ponovno.',
      });
    }

    return res.status(500).json({
      message: 'Greška pri kreiranju zahtjeva.',
      error: error.message,
    });
  } finally {
    // Uvijek vrati konekciju u pool, bez obzira je li uspjelo ili puklo
    connection.release();
  }
});

/**
 * PATCH /api/requests/:id/status
 * Odobravanje ili odbijanje zahtjeva (samo Admin).
 *
 * Expected body:
 * {
 *   action: 'approve' | 'reject',
 *   comment: string (opcionalno)
 * }
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { action, comment } = req.body;

  // --- 1. Autorizacija: samo Admin smije odobravati/odbijati ---
  if (req.user.role_name !== 'Administrator') {
    return res.status(403).json({
      message: 'Samo administrator može odobravati ili odbijati zahtjeve.',
    });
  }

  // --- 2. Validacija action-a ---
  if (action !== 'approve' && action !== 'reject' && action !== 'complete') {
    return res.status(400).json({
      message: 'Nevažeća akcija. Očekuje se "approve", "reject" ili "complete".',
    });
  }

  // --- 3. Ako je Reject, komentar je obavezan ---
  if (action === 'reject' && (!comment || !comment.trim())) {
    return res.status(400).json({
      message: 'Komentar je obavezan pri odbijanju zahtjeva.',
    });
  }

  const newStatusId = action === 'approve'
  ? STATUS.APPROVED
  : action === 'reject'
    ? STATUS.REJECTED
    : STATUS.COMPLETED;
  const userId = req.user.id_user;

  // --- 4. Transakcija ---
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 4a) Dohvati trenutni status zahtjeva (s lockom, da se ne može paralelno mijenjati)
    const [requestRows] = await connection.query(
      `
      SELECT fk_request_status
      FROM PurchaseRequest
      WHERE id_purchase_request = ?
      FOR UPDATE
      `,
      [id]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Zahtjev nije pronađen.',
      });
    }

    const currentStatus = requestRows[0].fk_request_status;

    // 4b) Provjeri da je zahtjev u statusu Submitted (samo tad se može odobriti/odbiti)
    const allowedFrom = action === 'complete' ? STATUS.APPROVED : STATUS.SUBMITTED;
      if (currentStatus !== allowedFrom) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Zahtjev nije u statusu "Poslano na odobravanje" i ne može se mijenjati.',
      });
    }

    // 4c) Promijeni status u PurchaseRequest
    await connection.query(
      `
      UPDATE PurchaseRequest
      SET fk_request_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id_purchase_request = ?
      `,
      [newStatusId, id]
    );

    // 4d) Upiši u history (audit trail)
    const historyComment =
      comment && comment.trim()
        ? comment.trim()
        : action === 'approve'
          ? 'Zahtjev odobren.'
          : 'Zahtjev odbijen.';

    await connection.query(
      `
      INSERT INTO RequestStatusHistory
        (fk_purchase_request, fk_request_status, fk_changed_by_user, comment)
      VALUES (?, ?, ?, ?)
      `,
      [id, newStatusId, userId, historyComment]
    );

    await connection.commit();

    return res.json({
      message: action === 'approve' ? 'Zahtjev je odobren.' : 'Zahtjev je odbijen.',
      new_status_id: newStatusId,
    });
  } catch (error) {
    await connection.rollback();
    console.error('PATCH /api/requests/:id/status error:', error);
    return res.status(500).json({
      message: 'Greška pri promjeni statusa zahtjeva.',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

/**
 * PUT /api/requests/:id
 * Ažuriranje zahtjeva (samo Admin).
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { fk_department, justification, estimated_amount, items } = req.body;
  const userId = req.user.id_user;

  if (req.user.role_name !== 'Administrator') {
    return res.status(403).json({
      message: 'Samo administrator može uređivati zahtjeve.',
    });
  }

  if (!fk_department) {
    return res.status(400).json({ message: 'Odjel je obavezan.' });
  }
  if (!justification || !justification.trim()) {
    return res.status(400).json({ message: 'Obrazloženje je obavezno.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Zahtjev mora imati barem jednu stavku.' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Provjeri postoji li zahtjev
    const [requestRows] = await connection.query(
      'SELECT id_purchase_request, fk_request_status FROM PurchaseRequest WHERE id_purchase_request = ? FOR UPDATE',
      [id]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Zahtjev nije pronađen.' });
    }

    // Ažuriraj osnovne podatke
    await connection.query(
      `UPDATE PurchaseRequest
       SET fk_department = ?,
           justification = ?,
           total_amount = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_purchase_request = ?`,
      [fk_department, justification.trim(), estimated_amount || null, id]
    );

    // Obriši stare stavke i upiši nove
    await connection.query(
      'DELETE FROM PurchaseRequestItem WHERE fk_purchase_request = ?',
      [id]
    );

    const itemValues = items.map((it) => [
      id,
      it.fk_item_category,
      it.item_name.trim(),
      it.quantity,
    ]);

    await connection.query(
      `INSERT INTO PurchaseRequestItem
         (fk_purchase_request, fk_item_category, item_name, quantity)
       VALUES ?`,
      [itemValues]
    );

    // Upiši u history
    await connection.query(
      `INSERT INTO RequestStatusHistory
         (fk_purchase_request, fk_request_status, fk_changed_by_user, comment)
       VALUES (?, ?, ?, ?)`,
      [
        id,
        requestRows[0].fk_request_status,
        userId,
        'Zahtjev izmijenjen od strane administratora.',
      ]
    );

    await connection.commit();
    return res.json({ message: 'Zahtjev uspješno ažuriran.' });
  } catch (error) {
    await connection.rollback();
    console.error('PUT /api/requests/:id error:', error);
    return res.status(500).json({
      message: 'Greška pri ažuriranju zahtjeva.',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;