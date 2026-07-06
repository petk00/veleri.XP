import { describe, expect, test } from 'vitest';
import { pctOfLimit, availableAllocation, sumLimits } from '../utils/budgetMath';

describe('pctOfLimit', () => {
  test('računa zaokruženi postotak potrošnje prema limitu', () => {
    expect(pctOfLimit(1000, 500)).toBe(50);
    expect(pctOfLimit(1000, 333)).toBe(33);
    expect(pctOfLimit(1000, 335)).toBe(34);
  });

  test('prekoračenje vraća postotak veći od 100', () => {
    expect(pctOfLimit(5000, 636656)).toBe(12733);
  });

  test('bez limita (0, null, undefined) vraća null — trošak se ne prati', () => {
    expect(pctOfLimit(0, 500)).toBeNull();
    expect(pctOfLimit(null, 500)).toBeNull();
    expect(pctOfLimit(undefined, 500)).toBeNull();
    expect(pctOfLimit(-1, 500)).toBeNull();
  });

  test('string vrijednosti iz API-ja (decimal kolone) se parsiraju', () => {
    expect(pctOfLimit('10000.00', '368.00')).toBe(4);
  });

  test('bez potrošnje vraća 0%', () => {
    expect(pctOfLimit(1000, null)).toBe(0);
    expect(pctOfLimit(1000, 0)).toBe(0);
  });
});

describe('availableAllocation', () => {
  test('slobodno = budžet minus alocirano', () => {
    expect(availableAllocation(100000, 60000)).toBe(40000);
  });

  test('kod uređivanja postojećeg zapisa njegov limit se oslobađa', () => {
    // budžet 100k, alocirano 100k, uređujemo zapis s limitom 30k → slobodno 30k
    expect(availableAllocation(100000, 100000, 30000)).toBe(30000);
  });

  test('nikad ne vraća negativno (postojeći podaci mogu premašivati budžet)', () => {
    expect(availableAllocation(1000001, 3035000)).toBe(0);
  });

  test('prazan budžet vraća 0', () => {
    expect(availableAllocation(0, 0)).toBe(0);
    expect(availableAllocation(null, 0)).toBe(0);
  });
});

describe('sumLimits', () => {
  test('zbraja limite po zadanom polju', () => {
    const cats = [
      { category_limit: '5000.00' },
      { category_limit: 10000 },
      { category_limit: null },
    ];
    expect(sumLimits(cats, 'category_limit')).toBe(15000);
  });

  test('prazna lista vraća 0', () => {
    expect(sumLimits([], 'department_limit')).toBe(0);
  });
});
