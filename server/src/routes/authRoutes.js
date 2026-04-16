const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email i lozinka su obavezni.',
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        u.id_user,
        u.first_name,
        u.last_name,
        u.email,
        u.password_hash,
        u.is_active,
        r.id_role,
        r.name AS role_name
      FROM AppUser u
      INNER JOIN Role r ON u.fk_role = r.id_role
      WHERE u.email = ?
      LIMIT 1
      `,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Neispravni podaci za prijavu.',
      });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        message: 'Korisnički račun nije aktivan.',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Neispravni podaci za prijavu.',
      });
    }

    const token = jwt.sign(
      {
        id_user: user.id_user,
        email: user.email,
        role_id: user.id_role,
        role_name: user.role_name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      }
    );

    return res.json({
      message: 'Prijava uspješna.',
      token,
      user: {
        id_user: user.id_user,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role_name: user.role_name,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return res.status(500).json({
      message: 'Greška pri prijavi.',
      error: error.message,
    });
  }
});

module.exports = router;