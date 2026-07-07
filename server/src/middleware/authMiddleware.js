const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateToken = async (req, res, next) => {
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ message: 'Nedostaje autorizacijski token.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Token nije važeći ili je istekao.' });
  }

  // Uloga i aktivnost se čitaju iz baze umjesto iz tokena — deaktivacija
  // ili promjena uloge vrijedi odmah, ne tek po isteku JWT-a.
  try {
    const [rows] = await db.query(
      `SELECT u.is_active, r.id_role, r.name AS role_name
       FROM AppUser u
       INNER JOIN Role r ON u.fk_role = r.id_role
       WHERE u.id_user = ?
       LIMIT 1`,
      [decoded.id_user]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({ message: 'Korisnički račun nije aktivan.' });
    }

    req.user = {
      ...decoded,
      role_id: rows[0].id_role,
      role_name: rows[0].role_name,
    };
    next();
  } catch (error) {
    console.error('[auth] Provjera korisnika nije uspjela:', error);
    return res.status(500).json({ message: 'Greška pri provjeri autentikacije.' });
  }
};

module.exports = authenticateToken;
