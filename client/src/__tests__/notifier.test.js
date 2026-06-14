import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('quasar', () => ({
  useQuasar: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
}));

vi.mock('src/utils/authStorage', () => ({
  getStoredUser: vi.fn(),
}));

vi.mock('boot/axios', () => ({
  api: { get: vi.fn() },
}));

import { useActionableRequestsNotifier } from '../composables/useActionableRequestsNotifier';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { getStoredUser } from 'src/utils/authStorage';
import { api } from 'boot/axios';

const SESSION_KEY = 'notifiedActionableRequests';
const permanentKey = (id) => `notifiedActionableRequestsPermanent_${id}`;

let mockNotify;

beforeEach(() => {
  vi.clearAllMocks();
  // sessionStorage i localStorage se resetiraju u setup.js

  mockNotify = vi.fn();
  vi.mocked(useQuasar).mockReturnValue({ notify: mockNotify });
  vi.mocked(useRouter).mockReturnValue({ push: vi.fn() });
  vi.mocked(getStoredUser).mockReturnValue(null);
  vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
});

const emptyGet = () => Promise.resolve({ data: { data: [] } });

const adminRequest = (id, number) => ({
  id_purchase_request: id,
  request_number: number,
  status_name: 'Poslano',
});

describe('resetNotifier', () => {
  test('briše SESSION_KEY iz sessionStorage', () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(['pending:1']));

    const { resetNotifier } = useActionableRequestsNotifier();
    resetNotifier();

    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  test('ne diže localStorage (permanent storage ostaje netaknut)', () => {
    const key = permanentKey(1);
    localStorage.setItem(key, JSON.stringify(['approved:42']));

    const { resetNotifier } = useActionableRequestsNotifier();
    resetNotifier();

    expect(localStorage.getItem(key)).not.toBeNull();
  });
});

describe('checkActionableRequests', () => {
  test('bez prijavljenog korisnika ne poziva API', async () => {
    vi.mocked(getStoredUser).mockReturnValue(null);

    const { checkActionableRequests } = useActionableRequestsNotifier();
    await checkActionableRequests();

    expect(api.get).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  test('admin put poziva endpoint za Poslano i Naručeno', async () => {
    vi.mocked(getStoredUser).mockReturnValue({ id_user: 1, role_name: 'Administrator' });

    const { checkActionableRequests } = useActionableRequestsNotifier();
    await checkActionableRequests();

    expect(api.get).toHaveBeenCalledWith(
      '/requests',
      expect.objectContaining({ params: expect.objectContaining({ status: 'Poslano' }) }),
    );
    expect(api.get).toHaveBeenCalledWith(
      '/requests',
      expect.objectContaining({ params: expect.objectContaining({ status: 'Naručeno' }) }),
    );
  });

  test('notifikacija se prikazuje za neriješeni zahtjev (admin)', async () => {
    vi.mocked(getStoredUser).mockReturnValue({ id_user: 1, role_name: 'Administrator' });
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (config?.params?.status === 'Poslano') {
        return Promise.resolve({
          data: { data: [adminRequest(42, 'PR-2026-0042')] },
        });
      }
      return emptyGet();
    });

    const { checkActionableRequests } = useActionableRequestsNotifier();
    await checkActionableRequests();

    expect(mockNotify).toHaveBeenCalledOnce();
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Zahtjev PR-2026-0042 čeka pregled' }),
    );
  });

  test('session dedup — isti zahtjev ne okida notifikaciju dvaput', async () => {
    vi.mocked(getStoredUser).mockReturnValue({ id_user: 1, role_name: 'Administrator' });
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (config?.params?.status === 'Poslano') {
        return Promise.resolve({
          data: { data: [adminRequest(42, 'PR-2026-0042')] },
        });
      }
      return emptyGet();
    });

    const { checkActionableRequests } = useActionableRequestsNotifier();
    await checkActionableRequests();
    await checkActionableRequests(); // isti zahtjev, isti tab

    expect(mockNotify).toHaveBeenCalledOnce();
  });

  test('permanent dedup — id se zapisuje u localStorage (admin, fali otpremnica)', async () => {
    vi.mocked(getStoredUser).mockReturnValue({ id_user: 1, role_name: 'Administrator' });
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (config?.params?.status === 'Naručeno') {
        return Promise.resolve({
          data: {
            data: [{ id_purchase_request: 99, request_number: 'PR-2026-0099', status_name: 'Naručeno' }],
          },
        });
      }
      if (url.includes('/attachments')) {
        return Promise.resolve({ data: [] }); // nema otpremnice
      }
      return emptyGet();
    });

    const { checkActionableRequests } = useActionableRequestsNotifier();
    await checkActionableRequests();

    const stored = JSON.parse(localStorage.getItem(permanentKey(1)) || '[]');
    expect(stored).toContain('delivery:99');
  });

  test('zaposlenik put poziva endpoint za Na odobrenju', async () => {
    vi.mocked(getStoredUser).mockReturnValue({ id_user: 2, role_name: 'Zaposlenik' });

    const { checkActionableRequests } = useActionableRequestsNotifier();
    await checkActionableRequests();

    expect(api.get).toHaveBeenCalledWith(
      '/requests',
      expect.objectContaining({ params: expect.objectContaining({ status: 'Na odobrenju' }) }),
    );
  });
});
