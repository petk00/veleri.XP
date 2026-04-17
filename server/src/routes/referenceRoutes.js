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
      error: error.message,
    });
  }
});

router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id_department,
        name
      FROM Department
      WHERE is_active = 1
      ORDER BY name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error('GET /api/reference/departments error:', error);
    res.status(500).json({
      message: 'Greška pri dohvaćanju odjela.',
      error: error.message,
    });
  }
});

router.get('/item-categories', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id_item_category,
        name
      FROM ItemCategory
      WHERE is_active = 1
      ORDER BY name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error('GET /api/reference/item-categories error:', error);
    res.status(500).json({
      message: 'Greška pri dohvaćanju kategorija.',
      error: error.message,
    });
  }
});

module.exports = router;