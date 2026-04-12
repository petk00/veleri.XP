const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  res.json({ message: 'API radi' });
});

router.get('/db-test', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({
      message: 'Veza s bazom radi',
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Greška kod spajanja na bazu',
      error: error.message
    });
  }
});

module.exports = router;