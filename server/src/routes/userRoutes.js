const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:9000';

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (req.user?.role_name !== 'Administrator') {
    return res.status(403).json({ message: 'Pristup dozvoljen samo administratoru.' });
  }
  next();
};

// GET /api/users — lista svih korisnika (admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id_user, u.first_name, u.last_name, u.email, u.is_active,
              r.name AS role_name
       FROM AppUser u
       JOIN Role r ON r.id_role = u.fk_role
       ORDER BY u.last_name, u.first_name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Greška pri dohvatu korisnika.' });
  }
});

// GET /api/users/roles — lista dostupnih uloga
router.get('/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id_role, name FROM Role ORDER BY id_role');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Greška pri dohvatu uloga.' });
  }
});

// POST /api/users — kreiraj korisnika i pošalji invite mail
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { first_name, last_name, email, role_id } = req.body;

  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !role_id) {
    return res.status(400).json({ message: 'Sva polja su obavezna.' });
  }

  if (!email.toLowerCase().endsWith('@veleri.hr')) {
    return res.status(400).json({ message: 'Email mora biti na domeni @veleri.hr.' });
  }

  try {
    const [existing] = await db.query('SELECT id_user FROM AppUser WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Korisnik s tim emailom već postoji.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const placeholderHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

    await db.query(
      `INSERT INTO AppUser (fk_role, first_name, last_name, email, password_hash, is_active, invite_token, invite_token_expires)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      [role_id, first_name.trim(), last_name.trim(), email.toLowerCase(), placeholderHash, token, expires]
    );

    const inviteLink = `${CLIENT_URL}/#/set-password?token=${token}`;

    res.status(201).json({ message: 'Korisnik kreiran.', inviteLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri kreiranju korisnika.' });
  }
});

// PUT /api/users/:id — uredi korisnika
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, role_id } = req.body;

  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !role_id) {
    return res.status(400).json({ message: 'Sva polja su obavezna.' });
  }

  if (!email.toLowerCase().endsWith('@veleri.hr')) {
    return res.status(400).json({ message: 'Email mora biti na domeni @veleri.hr.' });
  }

  try {
    const [conflict] = await db.query(
      'SELECT id_user FROM AppUser WHERE email = ? AND id_user != ?',
      [email.toLowerCase(), id]
    );
    if (conflict.length > 0) {
      return res.status(409).json({ message: 'Email je već u upotrebi.' });
    }

    const [result] = await db.query(
      `UPDATE AppUser SET first_name = ?, last_name = ?, email = ?, fk_role = ? WHERE id_user = ?`,
      [first_name.trim(), last_name.trim(), email.toLowerCase(), role_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Korisnik nije pronađen.' });
    }

    res.json({ message: 'Korisnik ažuriran.' });
  } catch (err) {
    res.status(500).json({ message: 'Greška pri ažuriranju korisnika.' });
  }
});

// PATCH /api/users/:id/status — aktiviraj / deaktiviraj
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ message: 'is_active mora biti boolean.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE AppUser SET is_active = ? WHERE id_user = ?',
      [is_active ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Korisnik nije pronađen.' });
    }

    res.json({ message: is_active ? 'Korisnik aktiviran.' : 'Korisnik deaktiviran.' });
  } catch (err) {
    res.status(500).json({ message: 'Greška pri promjeni statusa.' });
  }
});

// POST /api/users/:id/reset-link — generiraj novi invite/reset link
router.post('/:id/reset-link', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id_user, first_name, last_name FROM AppUser WHERE id_user = ?', [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Korisnik nije pronađen.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await db.query(
      'UPDATE AppUser SET invite_token = ?, invite_token_expires = ? WHERE id_user = ?',
      [token, expires, id]
    );

    const inviteLink = `${CLIENT_URL}/#/set-password?token=${token}`;
    res.json({ inviteLink });
  } catch (err) {
    res.status(500).json({ message: 'Greška pri generiranju linka.' });
  }
});

// DELETE /api/users/:id — briši korisnika (samo ako nema zahtjeva)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [requests] = await db.query(
      'SELECT COUNT(*) AS cnt FROM PurchaseRequest WHERE fk_created_by_user = ?',
      [id]
    );

    if (requests[0].cnt > 0) {
      return res.status(409).json({
        message: `Korisnik ima ${requests[0].cnt} zahtjev(a) i ne može se obrisati.`,
      });
    }

    const [result] = await db.query('DELETE FROM AppUser WHERE id_user = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Korisnik nije pronađen.' });
    }

    res.json({ message: 'Korisnik obrisan.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri brisanju korisnika.' });
  }
});

module.exports = router;
