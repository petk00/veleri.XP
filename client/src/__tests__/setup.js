import { beforeEach, vi } from 'vitest';

const makeMockStorage = () => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (idx) => Object.keys(store)[idx] ?? null,
    get length() { return Object.keys(store).length; },
    _reset: () => { store = {}; },
  };
};

export const localStorageMock = makeMockStorage();
export const sessionStorageMock = makeMockStorage();

vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('sessionStorage', sessionStorageMock);

beforeEach(() => {
  localStorageMock._reset();
  sessionStorageMock._reset();
});
