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
 *
 * Više novih zahtjeva u istom scenariju grupira se u JEDNU notifikaciju
 * ("5 zahtjeva čeka pregled") s linkom na filtriranu listu zahtjeva.
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

/**
 * Hrvatska množina po pravilu paukala:
 * 1/21/31 → one, 2-4/22-24 → few, ostalo (uklj. 11-14) → many.
 */
const pluralForm = (n, { one, few, many }) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

const brojZahtjeva = (n) => `${n} ${pluralForm(n, { one: 'zahtjev', few: 'zahtjeva', many: 'zahtjeva' })}`;

export function useActionableRequestsNotifier() {
  const $q = useQuasar();
  const router = useRouter();

  const notifyOptions = ({ icon, message, caption, type }) => ({
    position: 'bottom',
    timeout: 0,                 // sticky — ostaje dok korisnik ne reagira
    progress: false,
    icon,
    message,
    caption,
    classes: `actionable-request-notify actionable-request-notify--${type || 'action'}`,
  });

  const showNotification = ({ requestId, message, caption, icon, type }) => {
    $q.notify({
      ...notifyOptions({ icon, message, caption, type }),
      actions: [
        {
          label: 'Pregledaj',
          color: 'white',
          class: 'notify-action--accent',
          handler: () => {
            router.push(`/zahtjevi/${requestId}`);
          },
        },
        {
          label: 'Zatvori',
          color: 'white',
          flat: true,
          handler: () => { /* dismiss */ },
        },
      ],
    });
  };

  /**
   * Grupna notifikacija za više zahtjeva odjednom — "Pregledaj" vodi na
   * listu zahtjeva filtriranu po odgovarajućem statusu.
   */
  const showGroupNotification = ({ message, caption, icon, type, statusFilter }) => {
    $q.notify({
      ...notifyOptions({ icon, message, caption, type }),
      actions: [
        {
          label: 'Pregledaj',
          color: 'white',
          class: 'notify-action--accent',
          handler: () => {
            router.push({ path: '/zahtjevi', query: { status: statusFilter } });
          },
        },
        {
          label: 'Zatvori',
          color: 'white',
          flat: true,
          handler: () => { /* dismiss */ },
        },
      ],
    });
  };

  /**
   * Zajednička logika: izdvoji zahtjeve koji još nisu notificirani (dedup),
   * pa prikaži pojedinačnu notifikaciju (1 novi) ili grupnu (2+ novih).
   */
  const notifyNewRequests = ({ ids, keyPrefix, requests, icon, type, single, group, statusFilter }) => {
    const fresh = requests.filter((req) => !ids.has(`${keyPrefix}:${req.id_purchase_request}`));
    for (const req of fresh) ids.add(`${keyPrefix}:${req.id_purchase_request}`);

    if (fresh.length === 1) {
      const req = fresh[0];
      showNotification({
        requestId: req.id_purchase_request,
        icon,
        type,
        message: single.message(req),
        caption: single.caption,
      });
    } else if (fresh.length > 1) {
      showGroupNotification({
        icon,
        type,
        message: group.message(fresh.length),
        caption: group.caption,
        statusFilter,
      });
    }
  };

  /**
   * SCENARIJ 1 — zahtjevi čekaju pregled (samo admin, session dedup)
   */
  const checkPendingReview = async (userId) => {
    const ids = getIdSet('session', userId);

    const { data } = await api.get('/requests', { params: { status: 'Poslano', limit: 500 } });
    const list = Array.isArray(data.data) ? data.data : [];
    const pending = list.filter((r) => r.status_name === 'Poslano');

    notifyNewRequests({
      ids,
      keyPrefix: 'pending',
      requests: pending,
      icon: 'inbox',
      type: 'review',
      single: {
        message: (req) => `Zahtjev ${req.request_number} čeka pregled`,
        caption: 'Preuzmite zahtjev na obradu.',
      },
      group: {
        message: (n) => `${brojZahtjeva(n)} ${pluralForm(n, { one: 'čeka', few: 'čekaju', many: 'čeka' })} pregled`,
        caption: 'Otvorite filtriranu listu i preuzmite ih na obradu.',
      },
      statusFilter: 'Poslano',
    });

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

    notifyNewRequests({
      ids,
      keyPrefix: 'revision',
      requests: returned,
      icon: 'undo',
      type: 'revision',
      single: {
        message: (req) => `Zahtjev ${req.request_number} vraćen je na izmjenu`,
        caption: 'Uredi zahtjev prema komentaru i pošalji ga ponovno.',
      },
      group: {
        message: (n) => `${brojZahtjeva(n)} ${pluralForm(n, { one: 'vraćen je', few: 'vraćena su', many: 'vraćeno je' })} na izmjenu`,
        caption: 'Uredite zahtjeve prema komentarima i pošaljite ih ponovno.',
      },
      statusFilter: 'Zahtjeva izmjene',
    });

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

    notifyNewRequests({
      ids,
      keyPrefix: 'rejected',
      requests: rejected,
      icon: 'cancel',
      type: 'rejected',
      single: {
        message: (req) => `Zahtjev ${req.request_number} je odbijen`,
        caption: 'Pregledajte razlog odbijanja.',
      },
      group: {
        message: (n) => `${brojZahtjeva(n)} ${pluralForm(n, { one: 'je odbijen', few: 'su odbijena', many: 'je odbijeno' })}`,
        caption: 'Pregledajte razloge odbijanja.',
      },
      statusFilter: 'Odbijeno',
    });

    persistIdSet(ids, 'permanent', userId);
  };

  /**
   * SCENARIJ 4a — zahtjev preuzet na obradu (zaposlenik, session dedup)
   */
  const checkUnderReview = async (userId) => {
    const ids = getIdSet('session', userId);

    const { data } = await api.get('/requests', { params: { status: 'Na odobrenju', limit: 500 } });
    const list = Array.isArray(data.data) ? data.data : [];

    notifyNewRequests({
      ids,
      keyPrefix: 'review',
      requests: list,
      icon: 'manage_search',
      type: 'underReview',
      single: {
        message: (req) => `Zahtjev ${req.request_number} je preuzet na obradu`,
        caption: 'Administrator pregledava vaš zahtjev.',
      },
      group: {
        message: (n) => `${brojZahtjeva(n)} ${pluralForm(n, { one: 'preuzet je', few: 'preuzeta su', many: 'preuzeto je' })} na obradu`,
        caption: 'Administrator pregledava vaše zahtjeve.',
      },
      statusFilter: 'Na odobrenju',
    });

    persistIdSet(ids, 'session', userId);
  };

  /**
   * SCENARIJ 4b — zahtjev odobren (zaposlenik, permanent dedup)
   */
  const checkApproved = async (userId) => {
    const ids = getIdSet('permanent', userId);

    const { data } = await api.get('/requests', { params: { status: 'Naručeno', limit: 500 } });
    const list = Array.isArray(data.data) ? data.data : [];

    notifyNewRequests({
      ids,
      keyPrefix: 'approved',
      requests: list,
      icon: 'check_circle',
      type: 'approved',
      single: {
        message: (req) => `Zahtjev ${req.request_number} je odobren`,
        caption: 'Vaš zahtjev je odobren i upućen na nabavu.',
      },
      group: {
        message: (n) => `${brojZahtjeva(n)} ${pluralForm(n, { one: 'je odobren', few: 'su odobrena', many: 'je odobreno' })}`,
        caption: 'Vaši zahtjevi su odobreni i upućeni na nabavu.',
      },
      statusFilter: 'Naručeno',
    });

    persistIdSet(ids, 'permanent', userId);
  };

  /**
   * SCENARIJ 4c — zahtjev zatvoren (zaposlenik, permanent dedup)
   */
  const checkClosed = async (userId) => {
    const ids = getIdSet('permanent', userId);

    const { data } = await api.get('/requests', { params: { status: 'Zatvoreno', limit: 500 } });
    const list = Array.isArray(data.data) ? data.data : [];

    notifyNewRequests({
      ids,
      keyPrefix: 'closed',
      requests: list,
      icon: 'task_alt',
      type: 'closed',
      single: {
        message: (req) => `Zahtjev ${req.request_number} je zatvoren`,
        caption: 'Nabava je završena i zahtjev je zatvoren.',
      },
      group: {
        message: (n) => `${brojZahtjeva(n)} ${pluralForm(n, { one: 'je zatvoren', few: 'su zatvorena', many: 'je zatvoreno' })}`,
        caption: 'Nabava je završena i zahtjevi su zatvoreni.',
      },
      statusFilter: 'Zatvoreno',
    });

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

    const missing = results
      .filter(({ attachments }) => !attachments.some((a) => a.document_type === 'Otpremnica'))
      .map(({ req }) => req);

    notifyNewRequests({
      ids,
      keyPrefix: 'delivery',
      requests: missing,
      icon: 'local_shipping',
      type: 'action',
      single: {
        message: (req) => `Zahtjev ${req.request_number} čeka otpremnicu`,
        caption: 'Dodaj otpremnicu kako bi zahtjev mogao biti zatvoren.',
      },
      group: {
        message: (n) => `${brojZahtjeva(n)} ${pluralForm(n, { one: 'čeka', few: 'čekaju', many: 'čeka' })} otpremnicu`,
        caption: 'Dodajte otpremnice kako bi zahtjevi mogli biti zatvoreni.',
      },
      statusFilter: 'ceka_otpremnicu',
    });

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
