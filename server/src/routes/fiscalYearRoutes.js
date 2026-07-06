const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

const requireAdmin = (req, res, next) => {
  if (req.user?.role_name !== 'Administrator') {
    return res.status(403).json({ message: 'Pristup dozvoljen samo administratoru.' });
  }
  next();
};

// GET /api/fiscal-years
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT fy.id_fiscal_year, fy.year, fy.is_closed, fy.total_budget,
             COALESCE(SUM(d.department_limit), 0) AS total_allocated
      FROM FiscalYear fy
      LEFT JOIN Department d ON d.fk_fiscal_year = fy.id_fiscal_year
      GROUP BY fy.id_fiscal_year, fy.year, fy.is_closed, fy.total_budget
      ORDER BY fy.year DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri dohvatu poslovnih godina.' });
  }
});

// POST /api/fiscal-years — kreira novu godinu i kopira odjele+kategorije iz prethodne
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { year, total_budget } = req.body;

  if (!year || !Number.isInteger(Number(year)) || year < 2000 || year > 2100) {
    return res.status(400).json({ message: 'Godina mora biti broj između 2000 i 2100.' });
  }
  if (total_budget === undefined || total_budget === null || isNaN(parseFloat(total_budget)) || parseFloat(total_budget) < 0) {
    return res.status(400).json({ message: 'Godišnji budžet mora biti pozitivan broj.' });
  }
  const budget = parseFloat(total_budget);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const currentYear = new Date().getFullYear();
    if (Number(year) > currentYear) {
      await connection.rollback();
      return res.status(400).json({
        message: `Poslovna godina ${year} ne može se otvoriti dok ne počne kalendarska godina ${year}.`,
      });
    }

    const [open] = await connection.query(
      'SELECT id_fiscal_year, year FROM FiscalYear WHERE is_closed = 0 LIMIT 1'
    );
    if (open.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: `Poslovna godina ${open[0].year} je još otvorena. Zatvorite je prije kreiranja nove.`,
      });
    }

    const [existing] = await connection.query(
      'SELECT id_fiscal_year FROM FiscalYear WHERE year = ?', [year]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: `Poslovna godina ${year} već postoji.` });
    }

    const [result] = await connection.query(
      'INSERT INTO FiscalYear (year, is_closed, total_budget) VALUES (?, 0, ?)', [year, budget]
    );
    const newId = result.insertId;

    // dohvati prethodnu godinu (zadnju zatvorenu)
    const [prev] = await connection.query(
      'SELECT id_fiscal_year FROM FiscalYear WHERE is_closed = 1 ORDER BY year DESC LIMIT 1'
    );

    if (prev.length > 0) {
      const prevId = prev[0].id_fiscal_year;

      const [prevDepts] = await connection.query(
        'SELECT name FROM Department WHERE fk_fiscal_year = ?', [prevId]
      );
      if (prevDepts.length > 0) {
        const deptValues = prevDepts.map(d => [newId, d.name, 0, 1]);
        await connection.query(
          'INSERT INTO Department (fk_fiscal_year, name, department_limit, is_active) VALUES ?',
          [deptValues]
        );
      }

      const [prevCats] = await connection.query(
        'SELECT name FROM ItemCategory WHERE fk_fiscal_year = ?', [prevId]
      );
      if (prevCats.length > 0) {
        const catValues = prevCats.map(c => [newId, c.name, 0, 1]);
        await connection.query(
          'INSERT INTO ItemCategory (fk_fiscal_year, name, category_limit, is_active) VALUES ?',
          [catValues]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ message: `Poslovna godina ${year} kreirana.`, id_fiscal_year: newId });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Greška pri kreiranju poslovne godine.' });
  } finally {
    connection.release();
  }
});

// PATCH /api/fiscal-years/:id/budget
router.patch('/:id/budget', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const budget = Number(req.body.total_budget);
  if (isNaN(budget) || budget < 0) {
    return res.status(400).json({ message: 'Iznos budžeta mora biti pozitivan broj.' });
  }
  try {
    const [fy] = await db.query('SELECT is_closed FROM FiscalYear WHERE id_fiscal_year = ?', [id]);
    if (fy.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (fy[0].is_closed) return res.status(400).json({ message: 'Zatvorena godina se ne može mijenjati.' });

    const [sum] = await db.query(
      'SELECT COALESCE(SUM(department_limit), 0) AS total_allocated FROM Department WHERE fk_fiscal_year = ?', [id]
    );
    const allocated = Number(sum[0].total_allocated);
    if (budget < allocated) {
      return res.status(400).json({
        message: `Novi budžet (${budget.toFixed(2)} €) manji je od već alociranog iznosa po odjelima (${allocated.toFixed(2)} €). Smanjite limite odjela prije nego snizite godišnji budžet.`,
      });
    }

    await db.query('UPDATE FiscalYear SET total_budget = ? WHERE id_fiscal_year = ?', [budget, id]);
    res.json({ message: 'Godišnji budžet ažuriran.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri ažuriranju budžeta.' });
  }
});

// PATCH /api/fiscal-years/:id/close
router.patch('/:id/close', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT year, is_closed FROM FiscalYear WHERE id_fiscal_year = ?', [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (rows[0].is_closed) return res.status(400).json({ message: 'Godina je već zatvorena.' });

    const now = new Date();
    const fyYear = rows[0].year;
    if (fyYear >= now.getFullYear()) {
      return res.status(400).json({
        message: `Poslovna godina ${fyYear} ne može se zatvoriti dok traje tekuća kalendarska godina.`,
      });
    }
    const windowStart = new Date(fyYear + 1, 0, 1);
    if (now < windowStart) {
      return res.status(400).json({
        message: `Poslovna godina ${fyYear} ne može se zatvoriti prije 1. siječnja ${fyYear + 1}.`,
      });
    }

    await db.query(
      'UPDATE FiscalYear SET is_closed = 1 WHERE id_fiscal_year = ?', [id]
    );
    res.json({ message: `Poslovna godina ${rows[0].year} je zatvorena.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri zatvaranju poslovne godine.' });
  }
});

// ── Odjeli ──────────────────────────────────────────────────────────────────

// GET /api/fiscal-years/:id/departments
router.get('/:id/departments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.id_department, d.name, d.is_active, d.department_limit,
         COALESCE(SUM(pr.total_amount), 0) AS spent_amount
       FROM Department d
       LEFT JOIN PurchaseRequest pr
         ON pr.fk_department = d.id_department
         AND pr.fk_request_status IN (6, 7)
       WHERE d.fk_fiscal_year = ?
       GROUP BY d.id_department
       ORDER BY d.name`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri dohvatu odjela.' });
  }
});

// POST /api/fiscal-years/:id/departments
router.post('/:id/departments', authenticateToken, requireAdmin, async (req, res) => {
  const { name, department_limit } = req.body;
  const fyId = req.params.id;

  if (!name?.trim()) return res.status(400).json({ message: 'Naziv odjela je obavezan.' });
  const limit = parseFloat(department_limit) >= 0 ? parseFloat(department_limit) : 0;

  try {
    const [fy] = await db.query('SELECT is_closed, total_budget FROM FiscalYear WHERE id_fiscal_year = ?', [fyId]);
    if (fy.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (fy[0].is_closed) return res.status(400).json({ message: 'Zatvorena godina se ne može mijenjati.' });

    const [sumResult] = await db.query(
      'SELECT COALESCE(SUM(department_limit), 0) AS total_allocated FROM Department WHERE fk_fiscal_year = ?',
      [fyId]
    );
    const totalAllocated = Number(sumResult[0].total_allocated);
    const totalBudget = Number(fy[0].total_budget);
    if (totalAllocated + limit > totalBudget) {
      return res.status(400).json({
        message: `Budžet odjela (${(totalAllocated + limit).toFixed(2)} €) premašuje godišnji budžet (${totalBudget.toFixed(2)} €). Slobodno za alokaciju: ${(totalBudget - totalAllocated).toFixed(2)} €.`,
      });
    }

    const [dup] = await db.query(
      'SELECT id_department FROM Department WHERE fk_fiscal_year = ? AND name = ?',
      [fyId, name.trim()]
    );
    if (dup.length > 0) return res.status(409).json({ message: 'Odjel s tim nazivom već postoji.' });

    const [result] = await db.query(
      'INSERT INTO Department (fk_fiscal_year, name, department_limit, is_active) VALUES (?, ?, ?, 1)',
      [fyId, name.trim(), limit]
    );
    res.status(201).json({ id_department: result.insertId, message: 'Odjel dodan.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri dodavanju odjela.' });
  }
});

// PUT /api/fiscal-years/:id/departments/:deptId
router.put('/:id/departments/:deptId', authenticateToken, requireAdmin, async (req, res) => {
  const { name, department_limit } = req.body;
  const { id: fyId, deptId } = req.params;

  if (!name?.trim()) return res.status(400).json({ message: 'Naziv odjela je obavezan.' });
  const limit = parseFloat(department_limit) >= 0 ? parseFloat(department_limit) : 0;

  try {
    const [fy] = await db.query('SELECT is_closed, total_budget FROM FiscalYear WHERE id_fiscal_year = ?', [fyId]);
    if (fy.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (fy[0].is_closed) return res.status(400).json({ message: 'Zatvorena godina se ne može mijenjati.' });

    const [sumResult] = await db.query(
      'SELECT COALESCE(SUM(department_limit), 0) AS total_allocated FROM Department WHERE fk_fiscal_year = ? AND id_department != ?',
      [fyId, deptId]
    );
    const otherAllocated = Number(sumResult[0].total_allocated);
    const totalBudget = Number(fy[0].total_budget);
    if (otherAllocated + limit > totalBudget) {
      return res.status(400).json({
        message: `Budžet odjela (${(otherAllocated + limit).toFixed(2)} €) premašuje godišnji budžet (${totalBudget.toFixed(2)} €). Slobodno za ovaj odjel: ${(totalBudget - otherAllocated).toFixed(2)} €.`,
      });
    }

    const [dup] = await db.query(
      'SELECT id_department FROM Department WHERE fk_fiscal_year = ? AND name = ? AND id_department != ?',
      [fyId, name.trim(), deptId]
    );
    if (dup.length > 0) return res.status(409).json({ message: 'Odjel s tim nazivom već postoji.' });

    const [result] = await db.query(
      'UPDATE Department SET name = ?, department_limit = ? WHERE id_department = ? AND fk_fiscal_year = ?',
      [name.trim(), limit, deptId, fyId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Odjel nije pronađen.' });
    res.json({ message: 'Odjel ažuriran.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri ažuriranju odjela.' });
  }
});

// DELETE /api/fiscal-years/:id/departments/:deptId
router.delete('/:id/departments/:deptId', authenticateToken, requireAdmin, async (req, res) => {
  const { id: fyId, deptId } = req.params;
  try {
    const [fy] = await db.query('SELECT is_closed FROM FiscalYear WHERE id_fiscal_year = ?', [fyId]);
    if (fy.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (fy[0].is_closed) return res.status(400).json({ message: 'Zatvorena godina se ne može mijenjati.' });

    const [inUse] = await db.query(
      'SELECT COUNT(*) AS cnt FROM PurchaseRequest WHERE fk_department = ?', [deptId]
    );
    if (inUse[0].cnt > 0) {
      return res.status(409).json({
        message: `Odjel se koristi u ${inUse[0].cnt} zahtjevu i ne može se obrisati.`,
      });
    }

    const [result] = await db.query(
      'DELETE FROM Department WHERE id_department = ? AND fk_fiscal_year = ?', [deptId, fyId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Odjel nije pronađen.' });
    res.json({ message: 'Odjel obrisan.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri brisanju odjela.' });
  }
});

// ── Kategorije artikala ──────────────────────────────────────────────────────

// GET /api/fiscal-years/:id/categories
//
// Potrošnja po kategoriji: iznos postoji samo na razini zahtjeva (stavke
// nemaju cijenu), pa se kategoriji pripisuju samo zahtjevi čije SVE stavke
// pripadaju toj kategoriji. Zahtjevi s više kategorija vraćaju se zbirno
// kao `unattributed` da potrošnja nigdje ne bude tiho izgubljena.
router.get('/:id/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id_item_category, c.name, c.is_active, c.category_limit,
         COALESCE(s.spent_amount, 0) AS spent_amount
       FROM ItemCategory c
       LEFT JOIN (
         SELECT single_cat.category_id, SUM(single_cat.total_amount) AS spent_amount
         FROM (
           SELECT pr.id_purchase_request,
                  MIN(pri.fk_item_category) AS category_id,
                  pr.total_amount
           FROM PurchaseRequest pr
           JOIN PurchaseRequestItem pri ON pri.fk_purchase_request = pr.id_purchase_request
           WHERE pr.fk_request_status IN (6, 7) AND pr.total_amount IS NOT NULL
           GROUP BY pr.id_purchase_request, pr.total_amount
           HAVING COUNT(DISTINCT pri.fk_item_category) = 1
         ) single_cat
         GROUP BY single_cat.category_id
       ) s ON s.category_id = c.id_item_category
       WHERE c.fk_fiscal_year = ?
       ORDER BY c.name`,
      [req.params.id]
    );

    const [mixed] = await db.query(
      `SELECT COUNT(*) AS request_count, COALESCE(SUM(total_amount), 0) AS total_amount
       FROM (
         SELECT pr.id_purchase_request, pr.total_amount
         FROM PurchaseRequest pr
         JOIN PurchaseRequestItem pri ON pri.fk_purchase_request = pr.id_purchase_request
         WHERE pr.fk_fiscal_year = ? AND pr.fk_request_status IN (6, 7) AND pr.total_amount IS NOT NULL
         GROUP BY pr.id_purchase_request, pr.total_amount
         HAVING COUNT(DISTINCT pri.fk_item_category) > 1
       ) mixed_requests`,
      [req.params.id]
    );

    res.json({
      categories: rows,
      unattributed: {
        request_count: Number(mixed[0].request_count) || 0,
        total_amount: Number(mixed[0].total_amount) || 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri dohvatu kategorija.' });
  }
});

// POST /api/fiscal-years/:id/categories
router.post('/:id/categories', authenticateToken, requireAdmin, async (req, res) => {
  const { name, category_limit } = req.body;
  const fyId = req.params.id;

  if (!name?.trim()) return res.status(400).json({ message: 'Naziv kategorije je obavezan.' });
  const limit = parseFloat(category_limit) >= 0 ? parseFloat(category_limit) : 0;

  try {
    const [fy] = await db.query('SELECT is_closed, total_budget FROM FiscalYear WHERE id_fiscal_year = ?', [fyId]);
    if (fy.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (fy[0].is_closed) return res.status(400).json({ message: 'Zatvorena godina se ne može mijenjati.' });

    const [sumResult] = await db.query(
      'SELECT COALESCE(SUM(category_limit), 0) AS total_allocated FROM ItemCategory WHERE fk_fiscal_year = ?',
      [fyId]
    );
    const totalAllocated = Number(sumResult[0].total_allocated);
    const totalBudget = Number(fy[0].total_budget);
    if (totalAllocated + limit > totalBudget) {
      return res.status(400).json({
        message: `Limiti kategorija (${(totalAllocated + limit).toFixed(2)} €) premašuju godišnji budžet (${totalBudget.toFixed(2)} €). Slobodno za alokaciju: ${(totalBudget - totalAllocated).toFixed(2)} €.`,
      });
    }

    const [dup] = await db.query(
      'SELECT id_item_category FROM ItemCategory WHERE fk_fiscal_year = ? AND name = ?',
      [fyId, name.trim()]
    );
    if (dup.length > 0) return res.status(409).json({ message: 'Kategorija s tim nazivom već postoji.' });

    const [result] = await db.query(
      'INSERT INTO ItemCategory (fk_fiscal_year, name, category_limit, is_active) VALUES (?, ?, ?, 1)',
      [fyId, name.trim(), limit]
    );
    res.status(201).json({ id_item_category: result.insertId, message: 'Kategorija dodana.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri dodavanju kategorije.' });
  }
});

// PUT /api/fiscal-years/:id/categories/:catId
router.put('/:id/categories/:catId', authenticateToken, requireAdmin, async (req, res) => {
  const { name, category_limit } = req.body;
  const { id: fyId, catId } = req.params;

  if (!name?.trim()) return res.status(400).json({ message: 'Naziv kategorije je obavezan.' });
  const limit = parseFloat(category_limit) >= 0 ? parseFloat(category_limit) : 0;

  try {
    const [fy] = await db.query('SELECT is_closed, total_budget FROM FiscalYear WHERE id_fiscal_year = ?', [fyId]);
    if (fy.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (fy[0].is_closed) return res.status(400).json({ message: 'Zatvorena godina se ne može mijenjati.' });

    const [sumResult] = await db.query(
      'SELECT COALESCE(SUM(category_limit), 0) AS total_allocated FROM ItemCategory WHERE fk_fiscal_year = ? AND id_item_category != ?',
      [fyId, catId]
    );
    const otherAllocated = Number(sumResult[0].total_allocated);
    const totalBudget = Number(fy[0].total_budget);
    if (otherAllocated + limit > totalBudget) {
      return res.status(400).json({
        message: `Limiti kategorija (${(otherAllocated + limit).toFixed(2)} €) premašuju godišnji budžet (${totalBudget.toFixed(2)} €). Slobodno za ovu kategoriju: ${(totalBudget - otherAllocated).toFixed(2)} €.`,
      });
    }

    const [dup] = await db.query(
      'SELECT id_item_category FROM ItemCategory WHERE fk_fiscal_year = ? AND name = ? AND id_item_category != ?',
      [fyId, name.trim(), catId]
    );
    if (dup.length > 0) return res.status(409).json({ message: 'Kategorija s tim nazivom već postoji.' });

    const [result] = await db.query(
      'UPDATE ItemCategory SET name = ?, category_limit = ? WHERE id_item_category = ? AND fk_fiscal_year = ?',
      [name.trim(), limit, catId, fyId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Kategorija nije pronađena.' });
    res.json({ message: 'Kategorija ažurirana.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri ažuriranju kategorije.' });
  }
});

// DELETE /api/fiscal-years/:id/categories/:catId
router.delete('/:id/categories/:catId', authenticateToken, requireAdmin, async (req, res) => {
  const { id: fyId, catId } = req.params;
  try {
    const [fy] = await db.query('SELECT is_closed FROM FiscalYear WHERE id_fiscal_year = ?', [fyId]);
    if (fy.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (fy[0].is_closed) return res.status(400).json({ message: 'Zatvorena godina se ne može mijenjati.' });

    const [inUse] = await db.query(
      'SELECT COUNT(*) AS cnt FROM PurchaseRequestItem WHERE fk_item_category = ?', [catId]
    );
    if (inUse[0].cnt > 0) {
      return res.status(409).json({
        message: `Kategorija se koristi u ${inUse[0].cnt} stavci i ne može se obrisati.`,
      });
    }

    const [result] = await db.query(
      'DELETE FROM ItemCategory WHERE id_item_category = ? AND fk_fiscal_year = ?', [catId, fyId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Kategorija nije pronađena.' });
    res.json({ message: 'Kategorija obrisana.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri brisanju kategorije.' });
  }
});

module.exports = router;
