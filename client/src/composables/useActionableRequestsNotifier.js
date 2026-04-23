// src/composables/useActionableRequestsNotifier.js
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { api } from 'boot/axios';
import { getStoredUser } from 'src/utils/authStorage';

/**
 * Dva moda deduplikacije:
 *  - 'session'   → sessionStorage, resetira se pri novom loginu / zatvaranju taba
 *  - 'permanent' → localStorage, po-user, prikazuje se JEDNOM IKAD po zahtjevu
 *
 * Permanent ključ sadrži user.id_user tako da različiti korisnici u istom
 * browseru ne dijele dedup state.
 */
const SESSION_KEY = 'notifiedActionableRequests';
const permanentKey = (userId) => `notifiedActionableRequestsPermanent_${userId}`;

const getIdSet = (mode, userId) => {
  try {
    const storage = mode === 'permanent' ? localStorage : sessionStorage;
    const key = mode === 'permanent' ? permanentKey(userId) : SESSION_KEY;
    return new Set(JSON.parse(storage.getItem(key) || '[]'));
  } catch {
    return new Set();
  }
};

const persistIdSet = (ids, mode, userId) => {
  try {
    const storage = mode === 'permanent' ? localStorage : sessionStorage;
    const key = mode === 'permanent' ? permanentKey(userId) : SESSION_KEY;
    storage.setItem(key, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
};

export function useActionableRequestsNotifier() {
  const $q = useQuasar();
  const router = useRouter();

  const showNotification = ({ requestId, message, caption, icon, color }) => {
    $q.notify({
      position: 'bottom',
      timeout: 0,                 // sticky — ostaje dok korisnik ne reagira
      progress: false,
      icon,
      color: color || 'orange-8',
      textColor: 'white',
      message,
      caption,
      classes: 'actionable-request-notify',
      actions: [
        {
          label: 'Pregledaj',
          color: 'white',
          handler: () => {
            router.push(`/requests/${requestId}`);
          },
        },
        {
          label: 'Zatvori',
          color: 'white',
          handler: () => { /* dismiss */ },
        },
      ],
    });
  };

  /**
   * SCENARIJ 1 — zahtjev vraćen na izmjenu (samo zaposlenik, session dedup)
   */
  const checkReturnedForRevision = async (userId) => {
    const ids = getIdSet('session', userId);

    const { data } = await api.get('/requests');
    const list = Array.isArray(data) ? data : [];
    const returned = list.filter((r) => r.status_name === 'Vraćeno na izmjenu');

    for (const req of returned) {
      const key = `revision:${req.id_purchase_request}`;
      if (ids.has(key)) continue;

      showNotification({
        requestId: req.id_purchase_request,
        icon: 'undo',
        color: 'orange-8',
        message: `Zahtjev ${req.request_number} vraćen je na izmjenu`,
        caption: 'Uredi zahtjev prema komentaru i pošalji ga ponovno.',
      });

      ids.add(key);
    }

    persistIdSet(ids, 'session', userId);
  };

  /**
   * SCENARIJ 2 — zahtjev odobren ali fali otpremnica.
   *
   * Za admina: mode='permanent' — jednom ikad po zahtjevu
   * Za usera:  mode='session'   — jednom po sesiji (podsjetnik pri svakom loginu)
   *
   * Napomena o N+1: za svaki 'Odobreno' zahtjev šaljemo i GET attachments.
   * Paralelno ih dohvaćamo; ako ih bude puno razmisli o backend endpointu
   * koji već vraća flag za attachments.
   */
  const checkMissingDeliveryNotes = async (userId, mode = 'session') => {
    const ids = getIdSet(mode, userId);

    const { data } = await api.get('/requests');
    const list = Array.isArray(data) ? data : [];
    const approved = list.filter((r) => r.status_name === 'Odobreno');
    if (approved.length === 0) return;

    const results = await Promise.all(
      approved.map((req) =>
        api.get(`/requests/${req.id_purchase_request}/attachments`)
          .then((res) => ({ req, attachments: res.data || [] }))
          .catch(() => ({ req, attachments: [] })),
      ),
    );

    for (const { req, attachments } of results) {
      const key = `delivery:${req.id_purchase_request}`;
      if (ids.has(key)) continue;

      const hasOtpremnica = attachments.some((a) => a.document_type === 'Otpremnica');
      if (hasOtpremnica) continue;

      showNotification({
        requestId: req.id_purchase_request,
        icon: 'local_shipping',
        color: 'blue-8',
        message: `Zahtjev ${req.request_number} čeka otpremnicu`,
        caption: 'Dodaj otpremnicu kako bi zahtjev mogao biti zatvoren.',
      });

      ids.add(key);
    }

    persistIdSet(ids, mode, userId);
  };

  /**
   * Glavni ulaz — poziva se iz MainLayout on mount.
   */
  const checkActionableRequests = async () => {
    try {
      const user = getStoredUser();
      if (!user) return;

      const isAdmin = user.role_name === 'Administrator';
      const userId = user.id_user;

      if (isAdmin) {
        // Admin: samo scenarij otpremnice, i to JEDNOM IKAD po zahtjevu
        await checkMissingDeliveryNotes(userId, 'permanent');
      } else {
        // Zaposlenik: oba scenarija po sesiji
        await checkReturnedForRevision(userId);
        await checkMissingDeliveryNotes(userId, 'session');
      }
    } catch (error) {
      console.error('Greška pri provjeri zahtjeva koji trebaju akciju:', error);
    }
  };

  /**
   * Reset session dedup-a (pozovi na logout). Permanent storage ostaje
   * netaknut — to je i poanta: admin ne dobija istu notifikaciju dvaput.
   */
  const resetNotifier = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  };

  return {
    checkActionableRequests,
    resetNotifier,
  };
}