const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

// STATUS ID-jevi moraju točno odgovarati bazi:
// 1 = Poslano
// 2 = Na odobrenju
// 3 = Vraćeno na dopunu / izmjenu
// 4 = Odobreno
// 5 = Odbijeno
// 6 = Naručeno
// 7 = Zatvoreno
const STATUS = {
  SENT: 1,
  PENDING_APPROVAL: 2,
  RETURNED_FOR_REVISION: 3,
  APPROVED: 4,
  REJECTED: 5,
  ORDERED: 6,
  CLOSED: 7,
};

const getRequestAccessCondition = (user) => {
  if (user.role_name === 'Administrator') {
    return { clause: 'pr.id_purchase_request = ?', params: [] };
  }
  return {
    clause: 'pr.id_purchase_request = ? AND pr.fk_created_by_user = ?',
    params: [user.id_user],
  };
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role_name === 'Administrator';
    const whereClause = isAdmin ? '' : 'WHERE pr.fk_created_by_user = ?';
    const params = isAdmin ? [] : [req.user.id_user];

    const [rows] = await db.query(`
      SELECT
        pr.id_purchase_request,
        pr.request_number,
        fy.year AS fiscal_year,
        d.name AS department_name,
        rs.name AS status_name,
        pr.fk_request_status,
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
    res.status(500).json({ message: 'Greška pri dohvaćanju zahtjeva.', error: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const access = getRequestAccessCondition(req.user);

    const [requestRows] = await db.query(
      `SELECT
        pr.id_purchase_request,
        pr.request_number,
        fy.year AS fiscal_year,
        d.name AS department_name,
        rs.name AS status_name,
        pr.fk_request_status,
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
      WHERE ${access.clause}
      LIMIT 1`,
      [id, ...access.params]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({ message: 'Zahtjev nije pronađen.' });
    }

    const [itemRows] = await db.query(
      `SELECT
        pri.id_purchase_request_item,
        pri.item_name,
        pri.quantity,
        ic.name AS category_name
      FROM PurchaseRequestItem pri
      INNER JOIN ItemCategory ic ON pri.fk_item_category = ic.id_item_category
      WHERE pri.fk_purchase_request = ?
      ORDER BY pri.id_purchase_request_item ASC`,
      [id]
    );

    const [historyRows] = await db.query(
      `SELECT
        rsh.id_request_status_history,
        rsh.fk_request_status AS id_request_status,
        rs.name AS status_name,
        CONCAT(u.first_name, ' ', u.last_name) AS changed_by,
        rsh.changed_at,
        rsh.comment
      FROM RequestStatusHistory rsh
      INNER JOIN RequestStatus rs ON rsh.fk_request_status = rs.id_request_status
      INNER JOIN AppUser u ON rsh.fk_changed_by_user = u.id_user
      WHERE rsh.fk_purchase_request = ?
      ORDER BY rsh.changed_at ASC, rsh.id_request_status_history ASC`,
      [id]
    );

    res.json({ request: requestRows[0], items: itemRows, history: historyRows });
  } catch (error) {
    console.error('GET /api/requests/:id error:', error);
    res.status(500).json({ message: 'Greška pri dohvaćanju detalja zahtjeva.', error: error.message });
  }
});

/**
 * POST /api/requests
 * Kreira novi zahtjev - ide na status "Poslano" (1)
 */
router.post('/', authenticateToken, async (req, res) => {
  const { fk_fiscal_year, fk_department, justification, estimated_amount, items } = req.body;

  if (!fk_fiscal_year || !fk_department) {
    return res.status(400).json({ message: 'Fiskalna godina i odjel su obavezni.' });
  }
  if (!justification || !justification.trim()) {
    return res.status(400).json({ message: 'Razlog nabave je obavezan.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Zahtjev mora sadržavati barem jednu stavku.' });
  }
  for (const [idx, item] of items.entries()) {
    if (!item.fk_item_category || !item.item_name || !item.item_name.trim()) {
      return res.status(400).json({ message: `Stavka #${idx + 1}: kategorija i naziv su obavezni.` });
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return res.status(400).json({ message: `Stavka #${idx + 1}: količina mora biti cijeli broj > 0.` });
    }
  }

  const statusId = STATUS.SENT;
  const userId = req.user.id_user;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [fyRows] = await connection.query(
      'SELECT year FROM FiscalYear WHERE id_fiscal_year = ? LIMIT 1',
      [fk_fiscal_year]
    );
    if (fyRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Fiskalna godina ne postoji.' });
    }

    const year = fyRows[0].year;
    const prefix = `PR-${year}-`;

    const [maxRows] = await connection.query(
      `SELECT request_number FROM PurchaseRequest
       WHERE request_number LIKE ? ORDER BY id_purchase_request DESC LIMIT 1 FOR UPDATE`,
      [`${prefix}%`]
    );

    let nextSeq = 1;
    if (maxRows.length > 0) {
      const lastSeq = parseInt(maxRows[0].request_number.split('-')[2], 10);
      if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }

    const requestNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    const [insertResult] = await connection.query(
      `INSERT INTO PurchaseRequest
        (request_number, fk_fiscal_year, fk_department, fk_request_status,
         fk_created_by_user, total_amount, justification)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [requestNumber, fk_fiscal_year, fk_department, statusId, userId,
       estimated_amount || null, justification.trim()]
    );

    const newRequestId = insertResult.insertId;

    const itemValues = items.map((it) => [newRequestId, it.fk_item_category, it.item_name.trim(), it.quantity]);
    await connection.query(
      'INSERT INTO PurchaseRequestItem (fk_purchase_request, fk_item_category, item_name, quantity) VALUES ?',
      [itemValues]
    );

    await connection.query(
      'INSERT INTO RequestStatusHistory (fk_purchase_request, fk_request_status, fk_changed_by_user, comment) VALUES (?, ?, ?, ?)',
      [newRequestId, statusId, userId, 'Zahtjev kreiran i poslan.']
    );

    await connection.commit();
    return res.status(201).json({
      message: 'Zahtjev je uspješno kreiran.',
      id_purchase_request: newRequestId,
      request_number: requestNumber,
      status_id: statusId,
    });
  } catch (error) {
    await connection.rollback();
    console.error('POST /api/requests error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Konflikt pri generiranju broja zahtjeva. Pokušajte ponovno.' });
    }
    return res.status(500).json({ message: 'Greška pri kreiranju zahtjeva.', error: error.message });
  } finally {
    connection.release();
  }
});

/**
 * PATCH /api/requests/:id/status
 *
 * Admin akcije:
 *   submit-for-review  : Poslano (1) → Na odobrenju (2)
 *   approve            : Na odobrenju (2) → Odobreno (4)  [zahtijeva Ponudu + Iznos]
 *   reject             : Na odobrenju (2) → Odbijeno (5)  [komentar obavezan]
 *   return-for-revision: Na odobrenju (2) → Vraćeno (3)   [komentar obavezan]
 *   complete           : Odobreno (4) → Zatvoreno (7)
 *
 * Korisnik akcije:
 *   resubmit           : Vraćeno (3) → Na odobrenju (2)   [samo kreator]
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { action, comment } = req.body;

  const validActions = ['submit-for-review', 'approve', 'reject', 'return-for-revision', 'complete', 'resubmit'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ message: `Nevažeća akcija. Očekuje se: ${validActions.join(', ')}.` });
  }

  const userActions = ['resubmit'];
  if (!userActions.includes(action) && req.user.role_name !== 'Administrator') {
    return res.status(403).json({ message: 'Samo administrator može obavljati ovu akciju.' });
  }

  if (['reject', 'return-for-revision'].includes(action) && (!comment || !comment.trim())) {
    return res.status(400).json({ message: 'Komentar je obavezan pri odbijanju ili vraćanju na dopunu.' });
  }

  const actionMap = {
    'submit-for-review':   { newStatus: STATUS.PENDING_APPROVAL,     allowedFrom: [STATUS.SENT] },
    'approve':             { newStatus: STATUS.APPROVED,              allowedFrom: [STATUS.PENDING_APPROVAL] },
    'reject':              { newStatus: STATUS.REJECTED,              allowedFrom: [STATUS.PENDING_APPROVAL, STATUS.SENT] },
    'return-for-revision': { newStatus: STATUS.RETURNED_FOR_REVISION, allowedFrom: [STATUS.PENDING_APPROVAL] },
    'complete':            { newStatus: STATUS.CLOSED,                allowedFrom: [STATUS.APPROVED] },
    'resubmit':            { newStatus: STATUS.PENDING_APPROVAL,      allowedFrom: [STATUS.RETURNED_FOR_REVISION] },
  };

  const { newStatus: newStatusId, allowedFrom } = actionMap[action];
  const userId = req.user.id_user;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [requestRows] = await connection.query(
      'SELECT fk_request_status, fk_created_by_user FROM PurchaseRequest WHERE id_purchase_request = ? FOR UPDATE',
      [id]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Zahtjev nije pronađen.' });
    }

    const currentStatus = requestRows[0].fk_request_status;
    const isCreator = requestRows[0].fk_created_by_user === userId;

    if (action === 'resubmit' && !isCreator) {
      await connection.rollback();
      return res.status(403).json({ message: 'Možete ponovno poslati samo svoje zahtjeve.' });
    }

    if ([STATUS.REJECTED, STATUS.CLOSED].includes(currentStatus)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Zahtjev je zaključan i više se ne može mijenjati.' });
    }

    if (!allowedFrom.includes(currentStatus)) {
      await connection.rollback();
      return res.status(400).json({ message: `Zahtjev nije u ispravnom statusu za akciju "${action}".` });
    }

    // Approve: provjeri ponudu i iznos
    if (action === 'approve') {
      const [[offerCount]] = await connection.query(
        'SELECT COUNT(*) as count FROM Attachment WHERE fk_purchase_request = ? AND document_type = "Ponuda"',
        [id]
      );
      const [[amountRow]] = await connection.query(
        'SELECT total_amount FROM PurchaseRequest WHERE id_purchase_request = ?',
        [id]
      );
      if (offerCount.count === 0 || !amountRow.total_amount || amountRow.total_amount <= 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'Zahtjev se ne može odobriti bez ponude i iznosa.' });
      }
    }

    await connection.query(
      'UPDATE PurchaseRequest SET fk_request_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id_purchase_request = ?',
      [newStatusId, id]
    );

    const defaultComments = {
      'submit-for-review':   'Zahtjev poslan na odobrenje.',
      'approve':             'Zahtjev odobren.',
      'reject':              'Zahtjev odbijen.',
      'return-for-revision': 'Zahtjev vraćen na dopunu / izmjenu.',
      'complete':            'Zahtjev zatvoren.',
      'resubmit':            'Zahtjev ponovno poslan na odobravanje nakon ispravke.',
    };

    await connection.query(
      'INSERT INTO RequestStatusHistory (fk_purchase_request, fk_request_status, fk_changed_by_user, comment) VALUES (?, ?, ?, ?)',
      [id, newStatusId, userId, (comment && comment.trim()) ? comment.trim() : defaultComments[action]]
    );

    await connection.commit();
    return res.json({ message: `Akcija "${action}" je uspješno izvršena.`, new_status_id: newStatusId });
  } catch (error) {
    await connection.rollback();
    console.error('PATCH /api/requests/:id/status error:', error);
    return res.status(500).json({ message: 'Greška pri izvršavanju akcije.', error: error.message });
  } finally {
    connection.release();
  }
});

/**
 * PUT /api/requests/:id
 * Admin: bilo koji status osim zaključanih
 * Korisnik: samo "Vraćeno na dopunu / izmjenu" (3), samo svoje
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { fk_department, justification, estimated_amount, items } = req.body;
  const userId = req.user.id_user;
  const isAdmin = req.user.role_name === 'Administrator';

  if (!fk_department) return res.status(400).json({ message: 'Odjel je obavezan.' });
  if (!justification || !justification.trim()) return res.status(400).json({ message: 'Obrazloženje je obavezno.' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Zahtjev mora imati barem jednu stavku.' });

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [requestRows] = await connection.query(
      'SELECT id_purchase_request, fk_request_status, fk_created_by_user FROM PurchaseRequest WHERE id_purchase_request = ? FOR UPDATE',
      [id]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Zahtjev nije pronađen.' });
    }

    const currentStatus = requestRows[0].fk_request_status;
    const isCreator = requestRows[0].fk_created_by_user === userId;

    if ([STATUS.REJECTED, STATUS.CLOSED].includes(currentStatus)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Zahtjev je zaključan i više se ne može mijenjati.' });
    }

    if (!isAdmin) {
      if (currentStatus !== STATUS.RETURNED_FOR_REVISION) {
        await connection.rollback();
        return res.status(403).json({ message: 'Zahtjev se može editirati samo kad je vraćen na dopunu / izmjenu.' });
      }
      if (!isCreator) {
        await connection.rollback();
        return res.status(403).json({ message: 'Možete editirati samo svoje zahtjeve.' });
      }
    }

    await connection.query(
      `UPDATE PurchaseRequest
       SET fk_department = ?, justification = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id_purchase_request = ?`,
      [fk_department, justification.trim(), estimated_amount || null, id]
    );

    await connection.query('DELETE FROM PurchaseRequestItem WHERE fk_purchase_request = ?', [id]);

    const itemValues = items.map((it) => [id, it.fk_item_category, it.item_name.trim(), it.quantity]);
    await connection.query(
      'INSERT INTO PurchaseRequestItem (fk_purchase_request, fk_item_category, item_name, quantity) VALUES ?',
      [itemValues]
    );

    const historyComment = isAdmin
      ? 'Zahtjev izmijenjen od strane administratora.'
      : 'Zahtjev izmijenjen od strane korisnika.';

    await connection.query(
      'INSERT INTO RequestStatusHistory (fk_purchase_request, fk_request_status, fk_changed_by_user, comment) VALUES (?, ?, ?, ?)',
      [id, currentStatus, userId, historyComment]
    );

    await connection.commit();
    return res.json({ message: 'Zahtjev uspješno ažuriran.' });
  } catch (error) {
    await connection.rollback();
    console.error('PUT /api/requests/:id error:', error);
    return res.status(500).json({ message: 'Greška pri ažuriranju zahtjeva.', error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;