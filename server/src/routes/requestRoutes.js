const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

/**
 * STATUS konstante — odgovaraju ID-evima u tablici RequestStatus.
 * Status 4 (Odobreno) postoji u bazi ali se NE koristi u workflowu;
 * "Naručeno" (6) je semantički ekvivalent.
 */
const STATUS = {
  POSLANO: 1,
  NA_ODOBRENJU: 2,
  VRACENO: 3,
  ODBIJENO: 5,
  NARUCENO: 6,
  ZATVORENO: 7,
};

const STATUS_LABELS = {
  1: 'Poslano',
  2: 'Na odobrenju',
  3: 'Vraćeno na dopunu/izmjenu',
  4: 'Odobreno',
  5: 'Odbijeno',
  6: 'Naručeno',
  7: 'Zatvoreno',
};

const LOCKED_STATUSES = [STATUS.ODBIJENO, STATUS.ZATVORENO];
const MAX_JUSTIFICATION_LEN = 1000;

/**
 * Deklarativni state machine. Svaka akcija definira:
 *   from              — dozvoljeni početni status
 *   to                — ciljani status
 *   adminOnly         — samo admin smije izvršiti
 *   creatorOnly       — samo kreator zahtjeva smije izvršiti
 *   requiresComment   — komentar je obavezan
 *   requiresOffer     — mora postojati Ponuda u Attachment
 *   requiresDelivery  — mora postojati Otpremnica u Attachment
 *   requiresAmount    — total_amount mora biti > 0
 *   defaultComment    — fallback tekst u history ako komentar nije zadan
 */
const ACTIONS = {
  preuzmi: {
    from: STATUS.POSLANO,
    to: STATUS.NA_ODOBRENJU,
    adminOnly: true,
    defaultComment: 'Zahtjev preuzet na obradu.',
  },
  odobri: {
    from: STATUS.NA_ODOBRENJU,
    to: STATUS.NARUCENO,
    adminOnly: true,
    requiresOffer: true,
    defaultComment: 'Zahtjev odobren.',
  },
  'vrati-na-izmjenu': {
    from: STATUS.NA_ODOBRENJU,
    to: STATUS.VRACENO,
    adminOnly: true,
    requiresComment: true,
  },
  odbij: {
    from: STATUS.NA_ODOBRENJU,
    to: STATUS.ODBIJENO,
    adminOnly: true,
    requiresComment: true,
  },
  resubmit: {
    from: STATUS.VRACENO,
    to: STATUS.POSLANO,
    creatorOnly: true,
    defaultComment: 'Zahtjev ponovno poslan nakon ispravke.',
  },
  zavrsi: {
    from: STATUS.NARUCENO,
    to: STATUS.ZATVORENO,
    adminOnly: true,
    requiresOffer: true,
    requiresDelivery: true,
    requiresAmount: true,
    defaultComment: 'Zahtjev označen kao završen.',
  },
};

const isAdmin = (user) => user.role_name === 'Administrator';

const getRequestAccessCondition = (user) => {
  if (isAdmin(user)) {
    return { clause: 'pr.id_purchase_request = ?', extraParams: [] };
  }
  return {
    clause: 'pr.id_purchase_request = ? AND pr.fk_created_by_user = ?',
    extraParams: [user.id_user],
  };
};

/**
 * GET /api/requests
 * Lista zahtjeva (admin vidi sve, zaposlenik samo svoje).
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const whereClause = isAdmin(req.user) ? '' : 'WHERE pr.fk_created_by_user = ?';
    const params = isAdmin(req.user) ? [] : [req.user.id_user];

    const [rows] = await db.query(
      `
      SELECT
        pr.id_purchase_request,
        pr.request_number,
        fy.year AS fiscal_year,
        d.name AS department_name,
        pr.fk_request_status,
        CONCAT(u.first_name, ' ', u.last_name) AS created_by,
        pr.total_amount,
        pr.created_at
      FROM PurchaseRequest pr
      INNER JOIN FiscalYear fy ON pr.fk_fiscal_year = fy.id_fiscal_year
      INNER JOIN Department d ON pr.fk_department = d.id_department
      INNER JOIN AppUser u ON pr.fk_created_by_user = u.id_user
      ${whereClause}
      ORDER BY pr.created_at DESC, pr.id_purchase_request DESC
      `,
      params
    );

    res.json(
      rows.map((row) => ({
        ...row,
        status_name: STATUS_LABELS[row.fk_request_status] || `Status #${row.fk_request_status}`,
      }))
    );
  } catch (error) {
    console.error('GET /api/requests error:', error);
    res.status(500).json({
      message: 'Greška pri dohvaćanju zahtjeva.',
      error: error.message,
    });
  }
});

/**
 * GET /api/requests/:id
 * Detalji zahtjeva, stavke, povijest.
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const access = getRequestAccessCondition(req.user);

    const [requestRows] = await db.query(
      `
      SELECT
        pr.id_purchase_request,
        pr.request_number,
        fy.year AS fiscal_year,
        d.name AS department_name,
        pr.fk_request_status,
        CONCAT(u.first_name, ' ', u.last_name) AS created_by,
        pr.total_amount,
        pr.justification,
        pr.created_at,
        pr.updated_at
      FROM PurchaseRequest pr
      INNER JOIN FiscalYear fy ON pr.fk_fiscal_year = fy.id_fiscal_year
      INNER JOIN Department d ON pr.fk_department = d.id_department
      INNER JOIN AppUser u ON pr.fk_created_by_user = u.id_user
      WHERE ${access.clause}
      LIMIT 1
      `,
      [id, ...access.extraParams]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({ message: 'Zahtjev nije pronađen.' });
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
        rsh.fk_request_status,
        CONCAT(u.first_name, ' ', u.last_name) AS changed_by,
        rsh.changed_at,
        rsh.comment
      FROM RequestStatusHistory rsh
      INNER JOIN AppUser u ON rsh.fk_changed_by_user = u.id_user
      WHERE rsh.fk_purchase_request = ?
      ORDER BY rsh.changed_at ASC, rsh.id_request_status_history ASC
      `,
      [id]
    );

    const request = {
      ...requestRows[0],
      status_name:
        STATUS_LABELS[requestRows[0].fk_request_status]
        || `Status #${requestRows[0].fk_request_status}`,
    };

    res.json({
      request,
      items: itemRows,
      history: historyRows.map((entry) => ({
        ...entry,
        status_name:
          STATUS_LABELS[entry.fk_request_status] || `Status #${entry.fk_request_status}`,
      })),
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
 * Kreira novi zahtjev → status 1 (Poslano), prvi unos u history.
 */
router.post('/', authenticateToken, async (req, res) => {
  const {
    fk_fiscal_year,
    fk_department,
    justification,
    estimated_amount,
    items,
  } = req.body;

  if (!fk_fiscal_year || !fk_department) {
    return res.status(400).json({
      message: 'Fiskalna godina i odjel su obavezni.',
    });
  }

  if (!justification || !justification.trim()) {
    return res.status(400).json({
      message: 'Obrazloženje nabave je obavezno.',
    });
  }

  if (justification.length > MAX_JUSTIFICATION_LEN) {
    return res.status(400).json({
      message: `Obrazloženje ne smije biti duže od ${MAX_JUSTIFICATION_LEN} znakova.`,
    });
  }

  if (estimated_amount !== null && estimated_amount !== undefined && estimated_amount !== '') {
    const num = Number(estimated_amount);
    if (!Number.isFinite(num) || num < 0) {
      return res.status(400).json({
        message: 'Procijenjeni iznos mora biti pozitivan broj.',
      });
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: 'Zahtjev mora sadržavati barem jednu stavku.',
    });
  }

  for (const [idx, item] of items.entries()) {
    if (!item.fk_item_category || !item.item_name || !item.item_name.trim()) {
      return res.status(400).json({
        message: `Stavka #${idx + 1}: kategorija i naziv su obavezni.`,
      });
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return res.status(400).json({
        message: `Stavka #${idx + 1}: količina mora biti cijeli broj veći od 0.`,
      });
    }
  }

  const statusId = STATUS.POSLANO;
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
      const lastSeq = parseInt(maxRows[0].request_number.split('-')[2], 10);
      if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }

    const requestNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

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
        estimated_amount === '' || estimated_amount === undefined ? null : estimated_amount,
        justification.trim(),
      ]
    );

    const newRequestId = insertResult.insertId;

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

    await connection.query(
      `
      INSERT INTO RequestStatusHistory
        (fk_purchase_request, fk_request_status, fk_changed_by_user, comment)
      VALUES (?, ?, ?, ?)
      `,
      [newRequestId, statusId, userId, 'Zahtjev kreiran i poslan.']
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Zahtjev je uspješno kreiran.',
      id_purchase_request: newRequestId,
      request_number: requestNumber,
      fk_request_status: statusId,
    });
  } catch (error) {
    await connection.rollback();
    console.error('POST /api/requests error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Konflikt pri generiranju broja zahtjeva. Pokušajte ponovno.',
      });
    }

    return res.status(500).json({
      message: 'Greška pri kreiranju zahtjeva.',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

/**
 * PATCH /api/requests/:id/status
 * Akcije: preuzmi, odobri, vrati-na-izmjenu, odbij, resubmit, zavrsi
 *
 * State machine je definiran u ACTIONS — sve provjere idu kroz jedan tok.
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { action, comment } = req.body;

  const definition = ACTIONS[action];
  if (!definition) {
    return res.status(400).json({
      message: `Nepoznata akcija. Dozvoljene: ${Object.keys(ACTIONS).join(', ')}.`,
    });
  }

  if (definition.adminOnly && !isAdmin(req.user)) {
    return res.status(403).json({
      message: 'Samo administrator može izvršiti ovu akciju.',
    });
  }

  if (definition.requiresComment && (!comment || !comment.trim())) {
    return res.status(400).json({
      message: 'Komentar je obavezan za ovu akciju.',
    });
  }

  const userId = req.user.id_user;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [requestRows] = await connection.query(
      `
      SELECT fk_request_status, fk_created_by_user, total_amount
      FROM PurchaseRequest
      WHERE id_purchase_request = ?
      FOR UPDATE
      `,
      [id]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Zahtjev nije pronađen.' });
    }

    const currentStatus = requestRows[0].fk_request_status;
    const isCreator = requestRows[0].fk_created_by_user === userId;

    if (definition.creatorOnly && !isCreator && !isAdmin(req.user)) {
      await connection.rollback();
      return res.status(403).json({
        message: 'Možete izvršiti ovu akciju samo na svom zahtjevu.',
      });
    }

    if (LOCKED_STATUSES.includes(currentStatus)) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Zahtjev je zaključan i više se ne može mijenjati.',
      });
    }

    if (currentStatus !== definition.from) {
      await connection.rollback();
      return res.status(400).json({
        message: `Akcija "${action}" nije dozvoljena u trenutnom statusu.`,
      });
    }

    // Provjera dokumenata
    if (definition.requiresOffer || definition.requiresDelivery) {
      const [docRows] = await connection.query(
        `
        SELECT document_type
        FROM Attachment
        WHERE fk_purchase_request = ?
          AND document_type IN ('Ponuda', 'Otpremnica')
        `,
        [id]
      );
      const types = new Set(docRows.map((r) => r.document_type));

      if (definition.requiresOffer && !types.has('Ponuda')) {
        await connection.rollback();
        return res.status(400).json({
          message: 'Zahtjev mora imati uploadanu Ponudu.',
        });
      }
      if (definition.requiresDelivery && !types.has('Otpremnica')) {
        await connection.rollback();
        return res.status(400).json({
          message: 'Zahtjev mora imati uploadanu Otpremnicu.',
        });
      }
    }

    // Provjera iznosa
    if (definition.requiresAmount) {
      const amount = Number(requestRows[0].total_amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        await connection.rollback();
        return res.status(400).json({
          message: 'Procijenjeni iznos mora biti unesen prije završetka zahtjeva.',
        });
      }
    }

    await connection.query(
      `
      UPDATE PurchaseRequest
      SET fk_request_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id_purchase_request = ?
      `,
      [definition.to, id]
    );

    const historyComment =
      comment && comment.trim() ? comment.trim() : definition.defaultComment;

    await connection.query(
      `
      INSERT INTO RequestStatusHistory
        (fk_purchase_request, fk_request_status, fk_changed_by_user, comment)
      VALUES (?, ?, ?, ?)
      `,
      [id, definition.to, userId, historyComment]
    );

    await connection.commit();

    return res.json({
      message: `Akcija "${action}" je uspješno izvršena.`,
      fk_request_status: definition.to,
    });
  } catch (error) {
    await connection.rollback();
    console.error('PATCH /api/requests/:id/status error:', error);
    return res.status(500).json({
      message: 'Greška pri izvršavanju akcije.',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

/**
 * PUT /api/requests/:id
 * Editiranje zahtjeva.
 *  - Admin: u bilo kojem nezaključanom statusu (1, 2, 3, 6).
 *  - Zaposlenik: samo kad je status "Vraćeno na izmjenu" (3) i samo svoj zahtjev.
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { fk_department, justification, estimated_amount, items } = req.body;
  const userId = req.user.id_user;
  const userIsAdmin = isAdmin(req.user);

  if (!fk_department) {
    return res.status(400).json({ message: 'Odjel je obavezan.' });
  }
  if (!justification || !justification.trim()) {
    return res.status(400).json({ message: 'Obrazloženje je obavezno.' });
  }
  if (justification.length > MAX_JUSTIFICATION_LEN) {
    return res.status(400).json({
      message: `Obrazloženje ne smije biti duže od ${MAX_JUSTIFICATION_LEN} znakova.`,
    });
  }
  if (estimated_amount !== null && estimated_amount !== undefined && estimated_amount !== '') {
    const num = Number(estimated_amount);
    if (!Number.isFinite(num) || num < 0) {
      return res.status(400).json({
        message: 'Procijenjeni iznos mora biti pozitivan broj.',
      });
    }
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Zahtjev mora imati barem jednu stavku.' });
  }
  for (const [idx, item] of items.entries()) {
    if (!item.fk_item_category || !item.item_name || !item.item_name.trim()) {
      return res.status(400).json({
        message: `Stavka #${idx + 1}: kategorija i naziv su obavezni.`,
      });
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return res.status(400).json({
        message: `Stavka #${idx + 1}: količina mora biti cijeli broj veći od 0.`,
      });
    }
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [requestRows] = await connection.query(
      `
      SELECT fk_request_status, fk_created_by_user
      FROM PurchaseRequest
      WHERE id_purchase_request = ?
      FOR UPDATE
      `,
      [id]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Zahtjev nije pronađen.' });
    }

    const currentStatus = requestRows[0].fk_request_status;
    const isCreator = requestRows[0].fk_created_by_user === userId;

    if (LOCKED_STATUSES.includes(currentStatus)) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Zahtjev je zaključan i više se ne može mijenjati.',
      });
    }

    if (!userIsAdmin) {
      if (currentStatus !== STATUS.VRACENO) {
        await connection.rollback();
        return res.status(403).json({
          message: 'Zahtjev možete editirati samo kad je vraćen na izmjenu.',
        });
      }
      if (!isCreator) {
        await connection.rollback();
        return res.status(403).json({
          message: 'Možete editirati samo svoje zahtjeve.',
        });
      }
    }

    await connection.query(
      `
      UPDATE PurchaseRequest
      SET fk_department = ?,
          justification = ?,
          total_amount = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id_purchase_request = ?
      `,
      [
        fk_department,
        justification.trim(),
        estimated_amount === '' || estimated_amount === undefined ? null : estimated_amount,
        id,
      ]
    );

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
      `
      INSERT INTO PurchaseRequestItem
        (fk_purchase_request, fk_item_category, item_name, quantity)
      VALUES ?
      `,
      [itemValues]
    );

    await connection.query(
      `
      INSERT INTO RequestStatusHistory
        (fk_purchase_request, fk_request_status, fk_changed_by_user, comment)
      VALUES (?, ?, ?, ?)
      `,
      [id, currentStatus, userId, 'Zahtjev izmijenjen.']
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