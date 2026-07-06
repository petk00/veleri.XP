/**
 * Budžetska matematika za stranicu Financije — izdvojeno radi testiranja.
 */

/**
 * Postotak iskorištenosti limita, zaokružen. Vraća null kad limit nije
 * postavljen (0 ili manje) — tada se trošak ne prati protiv limita.
 */
export function pctOfLimit(limit, spent) {
  const l = Number(limit);
  const s = Number(spent || 0);
  if (!l || l <= 0) return null;
  return Math.round((s / l) * 100);
}

/**
 * Koliko je budžeta slobodno za alokaciju jednom zapisu (odjelu/kategoriji).
 * `allocatedSum` je zbroj SVIH limita, a `currentLimit` limit zapisa koji se
 * uređuje (njegov postojeći limit se oslobađa za ponovnu raspodjelu).
 */
export function availableAllocation(totalBudget, allocatedSum, currentLimit = 0) {
  return Math.max(0, Number(totalBudget || 0) - Number(allocatedSum || 0) + Number(currentLimit || 0));
}

/** Zbroj limita po zadanom polju (npr. 'department_limit' ili 'category_limit'). */
export function sumLimits(rows, field) {
  return rows.reduce((s, r) => s + Number(r[field] || 0), 0);
}
