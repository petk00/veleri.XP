const crypto = require('crypto');

/**
 * Invite/reset tokeni se u bazi drže kao SHA-256 hash — ukradeni dump
 * baze time ne sadrži upotrebljive invite linkove. Korisniku (i emailu)
 * ide sirovi token; pri postavljanju lozinke uspoređuje se hash.
 * SHA-256 bez salta je dovoljan jer je token 256 bita entropije
 * (nije lozinka koju bi napadač pogađao rječnikom).
 */
const hashInviteToken = (raw) =>
  crypto.createHash('sha256').update(raw).digest('hex');

const generateInviteToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: hashInviteToken(raw) };
};

module.exports = { generateInviteToken, hashInviteToken };
