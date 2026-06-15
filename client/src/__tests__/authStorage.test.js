import { describe, expect, test } from 'vitest';
import { getStoredUser } from '../utils/authStorage';
// localStorage reset is handled by setup.js via localStorageMock._reset() in beforeEach

describe('getStoredUser', () => {
  test('vraća null ako nema ključa u localStorage', () => {
    expect(getStoredUser()).toBeNull();
  });

  test('vraća parsiranog korisnika za validan JSON', () => {
    const user = { id_user: 1, email: 'test@veleri.hr', role_name: 'Administrator' };
    localStorage.setItem('user', JSON.stringify(user));
    expect(getStoredUser()).toEqual(user);
  });

  test('vraća null i briše ključ za nevažeći JSON', () => {
    localStorage.setItem('user', 'nije-validan{{{');
    expect(getStoredUser()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('vraća null za prazan string (falsy vrijednost)', () => {
    localStorage.setItem('user', '');
    expect(getStoredUser()).toBeNull();
  });

  test('čuva sve atribute korisničkog objekta', () => {
    const user = { id_user: 5, first_name: 'Ana', last_name: 'Perić', role_name: 'Zaposlenik' };
    localStorage.setItem('user', JSON.stringify(user));
    expect(getStoredUser()).toEqual(user);
  });
});
