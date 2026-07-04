/**
 * Unit testovi: calcBudgetImpact — utjecaj odobrenja zahtjeva na budžet odjela
 *
 * Čista funkcija bez baze: potrošeno + iznos zahtjeva vs. limit odjela.
 * Koristi se u PATCH /api/requests/:id/status (akcija odobri) za audit
 * bilješku o prekoračenju i odgovara prikazu u dijalogu odobravanja.
 */

const { calcBudgetImpact } = require('../src/services/budgetService');

describe('calcBudgetImpact — izračun utjecaja na limit odjela', () => {

  test('1. unutar limita — nema prekoračenja', () => {
    const r = calcBudgetImpact(10000, 8200, 1500);
    expect(r.spentAfter).toBe(9700);
    expect(r.percentAfter).toBe(97);
    expect(r.overLimit).toBe(false);
  });

  test('2. prekoračenje limita', () => {
    const r = calcBudgetImpact(10000, 8200, 3300);
    expect(r.spentAfter).toBe(11500);
    expect(r.percentAfter).toBe(115);
    expect(r.overLimit).toBe(true);
  });

  test('3. točno na limitu NIJE prekoračenje', () => {
    const r = calcBudgetImpact(10000, 8000, 2000);
    expect(r.percentAfter).toBe(100);
    expect(r.overLimit).toBe(false);
  });

  test('4. odjel bez limita (0) — prekoračenje se ne prati', () => {
    const r = calcBudgetImpact(0, 5000, 3000);
    expect(r.spentAfter).toBe(8000);
    expect(r.percentAfter).toBeNull();
    expect(r.overLimit).toBe(false);
  });

  test('5. zahtjev bez iznosa (null) pridonosi 0', () => {
    const r = calcBudgetImpact(10000, 9999, null);
    expect(r.spentAfter).toBe(9999);
    expect(r.overLimit).toBe(false);
  });

  test('6. decimalni iznosi iz baze dolaze kao stringovi', () => {
    const r = calcBudgetImpact('1000.00', '900.50', '99.49');
    expect(r.spentAfter).toBeCloseTo(999.99);
    expect(r.overLimit).toBe(false);
  });

  test('7. string iznosi s prekoračenjem', () => {
    const r = calcBudgetImpact('1000.00', '900.50', '99.51');
    expect(r.spentAfter).toBeCloseTo(1000.01);
    expect(r.overLimit).toBe(true);
  });

});
