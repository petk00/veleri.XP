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
    const [rows] = await db.query(
      'SELECT id_fiscal_year, year, is_closed FROM FiscalYear ORDER BY year DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Greška pri dohvatu poslovnih godina.' });
  }
});

// POST /api/fiscal-years — kreira novu godinu i kopira odjele+kategorije iz prethodne
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { year } = req.body;

  if (!year || !Number.isInteger(Number(year)) || year < 2000 || year > 2100) {
    return res.status(400).json({ message: 'Godina mora biti broj između 2000 i 2100.' });
  }

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
      'INSERT INTO FiscalYear (year, is_closed) VALUES (?, 0)', [year]
    );
    const newId = result.insertId;

    // dohvati prethodnu godinu (zadnju zatvorenu)
    const [prev] = await connection.query(
      'SELECT id_fiscal_year FROM FiscalYear WHERE is_closed = 1 ORDER BY year DESC LIMIT 1'
    );

    if (prev.length > 0) {
      const prevId = prev[0].id_fiscal_year;

      const [prevDepts] = await connection.query(
        'SELECT name, department_limit FROM Department WHERE fk_fiscal_year = ?', [prevId]
      );
      if (prevDepts.length > 0) {
        const deptValues = prevDepts.map(d => [newId, d.name, d.department_limit, 1]);
        await connection.query(
          'INSERT INTO Department (fk_fiscal_year, name, department_limit, is_active) VALUES ?',
          [deptValues]
        );
      }

      const [prevCats] = await connection.query(
        'SELECT name, category_limit FROM ItemCategory WHERE fk_fiscal_year = ?', [prevId]
      );
      if (prevCats.length > 0) {
        const catValues = prevCats.map(c => [newId, c.name, c.category_limit, 1]);
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

// PATCH /api/fiscal-years/:id/close
router.patch('/:id/close', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT year, is_closed FROM FiscalYear WHERE id_fiscal_year = ?', [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (rows[0].is_closed) return res.status(400).json({ message: 'Godina je već zatvorena.' });

    if (rows[0].year === new Date().getFullYear()) {
      return res.status(400).json({
        message: `Poslovna godina ${rows[0].year} ne može se zatvoriti dok traje tekuća kalendarska godina.`,
      });
    }

    await db.query(
      'UPDATE FiscalYear SET is_closed = 1 WHERE id_fiscal_year = ?', [id]
    );
    res.json({ message: `Poslovna godina ${rows[0].year} je zatvorena.` });
  } catch (err) {
    res.status(500).json({ message: 'Greška pri zatvaranju poslovne godine.' });
  }
});

// ── Odjeli ──────────────────────────────────────────────────────────────────

// GET /api/fiscal-years/:id/departments
router.get('/:id/departments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id_department, name, is_active FROM Department WHERE fk_fiscal_year = ? ORDER BY name',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Greška pri dohvatu odjela.' });
  }
});

// POST /api/fiscal-years/:id/departments
router.post('/:id/departments', authenticateToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  const fyId = req.params.id;

  if (!name?.trim()) return res.status(400).json({ message: 'Naziv odjela je obavezan.' });

  try {
    const [fy] = await db.query('SELECT is_closed FROM FiscalYear WHERE id_fiscal_year = ?', [fyId]);
    if (fy.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (fy[0].is_closed) return res.status(400).json({ message: 'Zatvorena godina se ne može mijenjati.' });

    const [dup] = await db.query(
      'SELECT id_department FROM Department WHERE fk_fiscal_year = ? AND name = ?',
      [fyId, name.trim()]
    );
    if (dup.length > 0) return res.status(409).json({ message: 'Odjel s tim nazivom već postoji.' });

    const [result] = await db.query(
      'INSERT INTO Department (fk_fiscal_year, name, department_limit, is_active) VALUES (?, ?, 0, 1)',
      [fyId, name.trim()]
    );
    res.status(201).json({ id_department: result.insertId, message: 'Odjel dodan.' });
  } catch (err) {
    res.status(500).json({ message: 'Greška pri dodavanju odjela.' });
  }
});

// PUT /api/fiscal-years/:id/departments/:deptId
router.put('/:id/departments/:deptId', authenticateToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  const { id: fyId, deptId } = req.params;

  if (!name?.trim()) return res.status(400).json({ message: 'Naziv odjela je obavezan.' });

  try {
    const [fy] = await db.query('SELECT is_closed FROM FiscalYear WHERE id_fiscal_year = ?', [fyId]);
    if (fy.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (fy[0].is_closed) return res.status(400).json({ message: 'Zatvorena godina se ne može mijenjati.' });

    const [dup] = await db.query(
      'SELECT id_department FROM Department WHERE fk_fiscal_year = ? AND name = ? AND id_department != ?',
      [fyId, name.trim(), deptId]
    );
    if (dup.length > 0) return res.status(409).json({ message: 'Odjel s tim nazivom već postoji.' });

    const [result] = await db.query(
      'UPDATE Department SET name = ? WHERE id_department = ? AND fk_fiscal_year = ?',
      [name.trim(), deptId, fyId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Odjel nije pronađen.' });
    res.json({ message: 'Odjel ažuriran.' });
  } catch (err) {
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
    res.status(500).json({ message: 'Greška pri brisanju odjela.' });
  }
});

// ── Kategorije artikala ──────────────────────────────────────────────────────

// GET /api/fiscal-years/:id/categories
router.get('/:id/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id_item_category, name, is_active FROM ItemCategory WHERE fk_fiscal_year = ? ORDER BY name',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Greška pri dohvatu kategorija.' });
  }
});

// POST /api/fiscal-years/:id/categories
router.post('/:id/categories', authenticateToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  const fyId = req.params.id;

  if (!name?.trim()) return res.status(400).json({ message: 'Naziv kategorije je obavezan.' });

  try {
    const [fy] = await db.query('SELECT is_closed FROM FiscalYear WHERE id_fiscal_year = ?', [fyId]);
    if (fy.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (fy[0].is_closed) return res.status(400).json({ message: 'Zatvorena godina se ne može mijenjati.' });

    const [dup] = await db.query(
      'SELECT id_item_category FROM ItemCategory WHERE fk_fiscal_year = ? AND name = ?',
      [fyId, name.trim()]
    );
    if (dup.length > 0) return res.status(409).json({ message: 'Kategorija s tim nazivom već postoji.' });

    const [result] = await db.query(
      'INSERT INTO ItemCategory (fk_fiscal_year, name, category_limit, is_active) VALUES (?, ?, 0, 1)',
      [fyId, name.trim()]
    );
    res.status(201).json({ id_item_category: result.insertId, message: 'Kategorija dodana.' });
  } catch (err) {
    res.status(500).json({ message: 'Greška pri dodavanju kategorije.' });
  }
});

// PUT /api/fiscal-years/:id/categories/:catId
router.put('/:id/categories/:catId', authenticateToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  const { id: fyId, catId } = req.params;

  if (!name?.trim()) return res.status(400).json({ message: 'Naziv kategorije je obavezan.' });

  try {
    const [fy] = await db.query('SELECT is_closed FROM FiscalYear WHERE id_fiscal_year = ?', [fyId]);
    if (fy.length === 0) return res.status(404).json({ message: 'Godina nije pronađena.' });
    if (fy[0].is_closed) return res.status(400).json({ message: 'Zatvorena godina se ne može mijenjati.' });

    const [dup] = await db.query(
      'SELECT id_item_category FROM ItemCategory WHERE fk_fiscal_year = ? AND name = ? AND id_item_category != ?',
      [fyId, name.trim(), catId]
    );
    if (dup.length > 0) return res.status(409).json({ message: 'Kategorija s tim nazivom već postoji.' });

    const [result] = await db.query(
      'UPDATE ItemCategory SET name = ? WHERE id_item_category = ? AND fk_fiscal_year = ?',
      [name.trim(), catId, fyId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Kategorija nije pronađena.' });
    res.json({ message: 'Kategorija ažurirana.' });
  } catch (err) {
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
    res.status(500).json({ message: 'Greška pri brisanju kategorije.' });
  }
});

module.exports = router;
