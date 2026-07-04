// Izračun utjecaja odobrenja zahtjeva na budžet odjela.
// Potrošnja je uvijek izvedena (SUM po statusima Naručeno/Zatvoreno),
// pa se ovdje računa samo projekcija: potrošeno + iznos zahtjeva vs. limit.

/**
 * @param {number|string|null} limit  - department_limit odjela
 * @param {number|string|null} spent  - dosadašnja potrošnja odjela (statusi 6/7)
 * @param {number|string|null} amount - total_amount zahtjeva koji se odobrava
 * @returns {{ spentAfter: number, percentAfter: number|null, overLimit: boolean }}
 *   percentAfter je null kad odjel nema definiran limit (limit <= 0) —
 *   tada se prekoračenje ne prati, u skladu s prikazom na stranici Financije.
 */
const calcBudgetImpact = (limit, spent, amount) => {
  const l = Number(limit) || 0;
  const s = Number(spent) || 0;
  const a = Number(amount) || 0;
  const spentAfter = s + a;

  if (l <= 0) {
    return { spentAfter, percentAfter: null, overLimit: false };
  }

  const percentAfter = Math.round((spentAfter / l) * 100);
  return { spentAfter, percentAfter, overLimit: spentAfter > l };
};

module.exports = { calcBudgetImpact };
