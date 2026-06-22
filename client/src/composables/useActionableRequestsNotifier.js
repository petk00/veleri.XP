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
            router.push(`/zahtjevi/${requestId}`);
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
   * SCENARIJ 1 — zahtjevi čekaju pregled (samo admin, session dedup)
   */
  const checkPendingReview = async (userId) => {
    const ids = getIdSet('session', userId);

    const { data } = await api.get('/requests', { params: { status: 'Poslano', limit: 500 } });
    const list = Array.isArray(data.data) ? data.data : [];
    const pending = list.filter((r) => r.status_name === 'Poslano');

    for (const req of pending) {
      const key = `pending:${req.id_purchase_request}`;
      if (ids.has(key)) continue;

      showNotification({
        requestId: req.id_purchase_request,
        icon: 'inbox',
        color: 'dark',
        message: `Zahtjev ${req.request_number} čeka pregled`,
        caption: 'Preuzmite zahtjev na obradu.',
      });

      ids.add(key);
    }

    persistIdSet(ids, 'session', userId);
  };

  /**
   * SCENARIJ 2 — zahtjev vraćen na izmjenu (samo zaposlenik, session dedup)
   */
  const checkReturnedForRevision = async (userId) => {
    const ids = getIdSet('session', userId);

    const { data } = await api.get('/requests', { params: { status: 'Zahtjeva izmjene', limit: 500 } });
    const list = Array.isArray(data.data) ? data.data : [];
    const returned = list.filter((r) => r.status_name === 'Zahtjeva izmjene');

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
   * SCENARIJ 3 — zahtjev odbijen (samo zaposlenik, permanent dedup)
   */
  const checkRejected = async (userId) => {
    const ids = getIdSet('permanent', userId);

    const { data } = await api.get('/requests', { params: { status: 'Odbijeno', limit: 500 } });
    const list = Array.isArray(data.data) ? data.data : [];
    const rejected = list.filter((r) => r.status_name === 'Odbijeno');

    for (const req of rejected) {
      const key = `rejected:${req.id_purchase_request}`;
      if (ids.has(key)) continue;

      showNotification({
        requestId: req.id_purchase_request,
        icon: 'cancel',
        color: 'red-8',
        message: `Zahtjev ${req.request_number} je odbijen`,
        caption: 'Pregledajte razlog odbijanja.',
      });

      ids.add(key);
    }

    persistIdSet(ids, 'permanent', userId);
  };

  /**
   * SCENARIJ 4a — zahtjev preuzet na obradu (zaposlenik, session dedup)
   */
  const checkUnderReview = async (userId) => {
    const ids = getIdSet('session', userId);

    const { data } = await api.get('/requests', { params: { status: 'Na odobrenju', limit: 500 } });
    const list = Array.isArray(data.data) ? data.data : [];

    for (const req of list) {
      const key = `review:${req.id_purchase_request}`;
      if (ids.has(key)) continue;

      showNotification({
        requestId: req.id_purchase_request,
        icon: 'manage_search',
        color: 'blue-grey-7',
        message: `Zahtjev ${req.request_number} je preuzet na obradu`,
        caption: 'Administrator pregledava vaš zahtjev.',
      });

      ids.add(key);
    }

    persistIdSet(ids, 'session', userId);
  };

  /**
   * SCENARIJ 4b — zahtjev odobren (zaposlenik, permanent dedup)
   */
  const checkApproved = async (userId) => {
    const ids = getIdSet('permanent', userId);

    const { data } = await api.get('/requests', { params: { status: 'Naručeno', limit: 500 } });
    const list = Array.isArray(data.data) ? data.data : [];

    for (const req of list) {
      const key = `approved:${req.id_purchase_request}`;
      if (ids.has(key)) continue;

      showNotification({
        requestId: req.id_purchase_request,
        icon: 'check_circle',
        color: 'green-7',
        message: `Zahtjev ${req.request_number} je odobren`,
        caption: 'Vaš zahtjev je odobren i upućen na nabavu.',
      });

      ids.add(key);
    }

    persistIdSet(ids, 'permanent', userId);
  };

  /**
   * SCENARIJ 4c — zahtjev zatvoren (zaposlenik, permanent dedup)
   */
  const checkClosed = async (userId) => {
    const ids = getIdSet('permanent', userId);

    const { data } = await api.get('/requests', { params: { status: 'Zatvoreno', limit: 500 } });
    const list = Array.isArray(data.data) ? data.data : [];

    for (const req of list) {
      const key = `closed:${req.id_purchase_request}`;
      if (ids.has(key)) continue;

      showNotification({
        requestId: req.id_purchase_request,
        icon: 'task_alt',
        color: 'teal-7',
        message: `Zahtjev ${req.request_number} je zatvoren`,
        caption: 'Nabava je završena i zahtjev je zatvoren.',
      });

      ids.add(key);
    }

    persistIdSet(ids, 'permanent', userId);
  };

  /**
   * SCENARIJ 4 — naručeni zahtjev bez otpremnice.
   *
   * Za admina: mode='permanent' — jednom ikad po zahtjevu
   * Za usera:  mode='session'   — jednom po sesiji (podsjetnik pri svakom loginu)
   */
  const checkMissingDeliveryNotes = async (userId, mode = 'session') => {
    const ids = getIdSet(mode, userId);

    const { data } = await api.get('/requests', { params: { status: 'Naručeno', limit: 500 } });
    const list = Array.isArray(data.data) ? data.data : [];
    const ordered = list.filter((r) => r.status_name === 'Naručeno');
    if (ordered.length === 0) return;

    const results = await Promise.all(
      ordered.map((req) =>
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

  // Wrappa svaki scenarij neovisno — greška u jednom ne blokira ostale.
  // 401 preskačemo jer axios interceptor već hendla redirect na login.
  const safeCheck = async (label, fn) => {
    try {
      await fn();
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error(`[notifier] Greška pri provjeri "${label}":`, error);
      }
    }
  };

  /**
   * Glavni ulaz — poziva se iz MainLayout on mount.
   */
  const checkActionableRequests = async () => {
    const user = getStoredUser();
    if (!user) return;

    const isAdmin = user.role_name === 'Administrator';
    const userId = user.id_user;

    if (isAdmin) {
      await safeCheck('pending-review',          () => checkPendingReview(userId));
      await safeCheck('missing-delivery-notes',  () => checkMissingDeliveryNotes(userId, 'permanent'));
    } else {
      await safeCheck('under-review',            () => checkUnderReview(userId));
      await safeCheck('returned-for-revision',   () => checkReturnedForRevision(userId));
      await safeCheck('approved',                () => checkApproved(userId));
      await safeCheck('rejected',                () => checkRejected(userId));
      await safeCheck('closed',                  () => checkClosed(userId));
      await safeCheck('missing-delivery-notes',  () => checkMissingDeliveryNotes(userId, 'session'));
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