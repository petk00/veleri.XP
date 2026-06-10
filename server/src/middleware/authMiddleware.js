const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ message: 'Nedostaje autorizacijski token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token nije važeći ili je istekao.' });
  }
};

module.exports = authenticateToken;