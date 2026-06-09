const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/active-fiscal-year', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id_fiscal_year,
        year
      FROM FiscalYear
      WHERE is_closed = 0
      ORDER BY year DESC
      LIMIT 1
    `);

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Nema aktivne fiskalne godine.',
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('GET /api/reference/active-fiscal-year error:', error);
    res.status(500).json({
      message: 'Greška pri dohvaćanju aktivne fiskalne godine.',
    });
  }
});

router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.id_department, d.name
      FROM Department d
      INNER JOIN FiscalYear fy ON d.fk_fiscal_year = fy.id_fiscal_year
      WHERE fy.is_closed = 0 AND d.is_active = 1
      ORDER BY d.name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error('GET /api/reference/departments error:', error);
    res.status(500).json({
      message: 'Greška pri dohvaćanju odjela.',
    });
  }
});

router.get('/item-categories', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ic.id_item_category, ic.name
      FROM ItemCategory ic
      INNER JOIN FiscalYear fy ON ic.fk_fiscal_year = fy.id_fiscal_year
      WHERE fy.is_closed = 0 AND ic.is_active = 1
      ORDER BY ic.name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error('GET /api/reference/item-categories error:', error);
    res.status(500).json({
      message: 'Greška pri dohvaćanju kategorija.',
    });
  }
});

module.exports = router;