<template>
  <q-page class="page">
    <div class="page-shell">

      <!-- ─────────────────────────────
           Page header
           ───────────────────────────── -->
      <header class="page-header">
        <div class="page-header__main">
          <div class="page-header__eyebrow">{{ todayFormatted }}</div>
          <h1 class="page-header__title">
            Dobrodošli, <span class="page-header__name">{{ user?.first_name || 'korisniče' }}</span>
          </h1>
          <p class="page-header__subtitle">{{ subtitle }}</p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" @click="$router.push('/requests/new')">
            <q-icon name="add" size="16px" />
            <span>Novi zahtjev</span>
          </button>
        </div>
      </header>

      <!-- ─────────────────────────────
           Loading
           ───────────────────────────── -->
      <div v-if="loading" class="loading-block">
        <q-spinner color="primary" size="32px" />
      </div>

      <template v-else>

        <!-- ═════════════════════════════
             EMPLOYEE VIEW (jednostavno)
             ═════════════════════════════ -->
        <template v-if="!isAdmin">

          <!-- 🔴 ALERT: Vraćeni zahtjevi (najvažnije za zaposlenika) -->
          <section v-if="returnedRequests.length > 0" class="alert-block alert-block--warning">
            <div class="alert-block__head">
              <div class="alert-block__icon">
                <q-icon name="undo" size="20px" />
              </div>
              <div class="alert-block__head-text">
                <h2 class="alert-block__title">
                  {{ returnedRequests.length === 1
                    ? 'Zahtjev vraćen na dopunu'
                    : `${returnedRequests.length} zahtjeva vraćeno na dopunu` }}
                </h2>
                <p class="alert-block__desc">
                  Pregledajte komentar administratora, ispravite zahtjev i pošaljite ga ponovno.
                </p>
              </div>
            </div>

            <ul class="alert-block__list">
              <li
                v-for="r in returnedRequests"
                :key="r.id_purchase_request"
                class="alert-item"
                @click="$router.push(`/requests/${r.id_purchase_request}`)"
              >
                <div class="alert-item__main">
                  <div class="alert-item__number">{{ r.request_number }}</div>
                  <div class="alert-item__meta">{{ r.department_name }} · {{ formatDate(r.created_at) }}</div>
                </div>
                <q-icon name="chevron_right" size="18px" class="alert-item__chevron" />
              </li>
            </ul>
          </section>

          <!-- Brojač + akcije za zaposlenika -->
          <section class="employee-summary">
            <div class="employee-summary__count">
              <div class="employee-summary__big">{{ inProgressCount }}</div>
              <div class="employee-summary__label">
                {{ inProgressCount === 1 ? 'aktivan zahtjev' : 'aktivnih zahtjeva' }}
              </div>
            </div>

            <div class="employee-summary__actions">
              <button class="action-btn" @click="$router.push('/requests')">
                <q-icon name="list_alt" size="18px" />
                <span>Pogledaj sve zahtjeve</span>
                <q-icon name="chevron_right" size="18px" class="action-btn__chevron" />
              </button>
              <button class="action-btn" @click="$router.push('/requests/new')">
                <q-icon name="add_shopping_cart" size="18px" />
                <span>Pokreni novi zahtjev</span>
                <q-icon name="chevron_right" size="18px" class="action-btn__chevron" />
              </button>
            </div>
          </section>

          <!-- All clear poruka kad nema ničeg -->
          <section v-if="returnedRequests.length === 0 && inProgressCount === 0" class="all-clear">
            <div class="all-clear__icon">
              <q-icon name="check_circle" size="32px" />
            </div>
            <h2 class="all-clear__title">Trenutno nemate aktivnih zahtjeva</h2>
            <p class="all-clear__desc">
              Pokrenite novi zahtjev za nabavu kad bude potrebno.
            </p>
          </section>
        </template>

        <!-- ═════════════════════════════
             ADMIN VIEW (prošireno)
             ═════════════════════════════ -->
        <template v-else>

          <!-- Stats — admin treba pregled -->
          <section class="stats">
            <div class="stat stat--navy">
              <div class="stat__icon"><q-icon name="inbox" size="18px" /></div>
              <div class="stat__body">
                <div class="stat__value">{{ allRequests.length }}</div>
                <div class="stat__label">Ukupno zahtjeva</div>
              </div>
            </div>
            <div class="stat stat--amber">
              <div class="stat__icon"><q-icon name="schedule" size="18px" /></div>
              <div class="stat__body">
                <div class="stat__value">{{ pendingCount }}</div>
                <div class="stat__label">Čeka pregled</div>
              </div>
            </div>
            <div class="stat stat--cyan">
              <div class="stat__icon"><q-icon name="check_circle" size="18px" /></div>
              <div class="stat__body">
                <div class="stat__value">{{ orderedCount }}</div>
                <div class="stat__label">Naručeno</div>
              </div>
            </div>
            <div class="stat stat--green">
              <div class="stat__icon"><q-icon name="task_alt" size="18px" /></div>
              <div class="stat__body">
                <div class="stat__value">{{ closedCount }}</div>
                <div class="stat__label">Završeno</div>
              </div>
            </div>
          </section>

          <!-- Akcijski blok: što čeka admina -->
          <section v-if="adminActionItems.length > 0" class="alert-block alert-block--neutral">
            <div class="alert-block__head">
              <div class="alert-block__icon alert-block__icon--cyan">
                <q-icon name="pending_actions" size="20px" />
              </div>
              <div class="alert-block__head-text">
                <h2 class="alert-block__title">Čeka vašu akciju</h2>
                <p class="alert-block__desc">
                  Zahtjevi raspoređeni po prioritetu — preuzmite, odlučite ili završite.
                </p>
              </div>
            </div>

            <ul class="alert-block__list">
              <li
                v-for="r in adminActionItems"
                :key="r.id_purchase_request"
                class="alert-item"
                @click="$router.push(`/requests/${r.id_purchase_request}`)"
              >
                <div class="alert-item__main">
                  <div class="alert-item__number">{{ r.request_number }}</div>
                  <div class="alert-item__meta">
                    {{ r.department_name }} · {{ r.created_by }}
                  </div>
                </div>
                <span class="alert-item__action" :class="`alert-item__action--${actionType(r).key}`">
                  {{ actionType(r).label }}
                </span>
                <q-icon name="chevron_right" size="18px" class="alert-item__chevron" />
              </li>
            </ul>
          </section>

          <!-- All clear za admina -->
          <section v-else class="all-clear">
            <div class="all-clear__icon">
              <q-icon name="check_circle" size="32px" />
            </div>
            <h2 class="all-clear__title">Sve je obrađeno</h2>
            <p class="all-clear__desc">
              Trenutno nema zahtjeva koji čekaju vašu akciju.
            </p>
          </section>

          <!-- Pregled svih zahtjeva (uvijek vidljivo) -->
          <button class="action-btn action-btn--full" @click="$router.push('/requests')">
            <q-icon name="list_alt" size="18px" />
            <span>Pogledaj sve zahtjeve</span>
            <q-icon name="chevron_right" size="18px" class="action-btn__chevron" />
          </button>
        </template>

      </template>

    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from 'boot/axios';
import { getStoredUser } from 'src/utils/authStorage';

const user = getStoredUser();
const isAdmin = user?.role_name === 'Administrator';

const loading = ref(true);
const allRequests = ref([]);

const todayFormatted = computed(() => {
  const formatted = new Date().toLocaleDateString('hr-HR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
});

const subtitle = computed(() => {
  if (isAdmin) return 'Pregled zahtjeva i akcija koje čekaju vašu odluku.';
  if (returnedRequests.value.length > 0) return 'Imate zahtjeve koji trebaju vašu pažnju.';
  if (inProgressCount.value > 0) return 'Vaši zahtjevi su u procesu obrade.';
  return 'Trenutno nemate aktivnih zahtjeva.';
});

/* ───────── Brojači ───────── */

const countByStatus = (...names) =>
  allRequests.value.filter(r => names.includes(r.status_name)).length;

// Zaposlenik
const returnedRequests = computed(() =>
  allRequests.value.filter(r => r.status_name === 'Vraćeno na dopunu / izmjenu')
);
const inProgressCount = computed(() =>
  countByStatus('Poslano', 'Na odobrenju', 'Naručeno', 'Vraćeno na dopunu / izmjenu')
);

// Admin
const pendingCount = computed(() => countByStatus('Poslano'));
const orderedCount = computed(() => countByStatus('Naručeno'));
const closedCount = computed(() => countByStatus('Zatvoreno'));

/**
 * Adminove akcijske stavke — sortirane po prioritetu:
 *   1. Poslano (treba preuzeti)
 *   2. Na odobrenju (treba odlučiti)
 *   3. Naručeno (treba završiti — samo ako ima oba dokumenta? svejedno se prikaže
 *      jer admin treba uploadati otpremnicu pa onda završiti)
 */
const adminActionItems = computed(() => {
  const priority = {
    'Poslano': 1,
    'Na odobrenju': 2,
    'Naručeno': 3,
  };
  return allRequests.value
    .filter(r => priority[r.status_name] !== undefined)
    .sort((a, b) => {
      const diff = priority[a.status_name] - priority[b.status_name];
      if (diff !== 0) return diff;
      return new Date(a.created_at) - new Date(b.created_at);
    })
    .slice(0, 8); // ne pretrpati dashboard
});

const actionType = (r) => {
  switch (r.status_name) {
    case 'Poslano':       return { key: 'take', label: 'Preuzmi' };
    case 'Na odobrenju':  return { key: 'decide', label: 'Odluči' };
    case 'Naručeno':      return { key: 'finish', label: 'Završi' };
    default:              return { key: 'view', label: 'Otvori' };
  }
};

/* ───────── Formatters ───────── */

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('hr-HR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

/* ───────── Fetch ───────── */

const fetchData = async () => {
  try {
    const { data } = await api.get('/requests');
    allRequests.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
    allRequests.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => fetchData());
</script>

<style scoped>
/* ─────────────────────────────────
   Page
   ───────────────────────────────── */
.page {
  background: #F5F5F5;
  min-height: 100vh;
  padding: 24px 24px 64px;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: #201F1E;
}

.page-shell {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─────────────────────────────────
   Page header
   ───────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.page-header__main { flex: 1; min-width: 240px; }
.page-header__eyebrow {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #00AFDB;
  margin-bottom: 4px;
}
.page-header__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #201F1E;
  letter-spacing: -0.015em;
  line-height: 1.2;
  margin: 0;
}
.page-header__name { color: #16294E; }
.page-header__subtitle {
  font-size: 0.8125rem;
  color: #605E5C;
  margin: 6px 0 0;
  line-height: 1.5;
}
.page-header__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* ─────────────────────────────────
   Loading
   ───────────────────────────────── */
.loading-block {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

/* ─────────────────────────────────
   Buttons
   ───────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn--primary {
  background: #16294E;
  color: white;
  border-color: #16294E;
}
.btn--primary:hover { background: #0F1F3D; border-color: #0F1F3D; }

/* ─────────────────────────────────
   Alert block (vraćeni zahtjevi / čeka akcija)
   ───────────────────────────────── */
.alert-block {
  background: white;
  border: 1px solid #E1DFDD;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.alert-block--warning {
  border-color: #FBBF77;
  border-left: 3px solid #C2410C;
  background: #FFFBF5;
}
.alert-block--neutral {
  border-left: 3px solid #00AFDB;
}

.alert-block__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px 12px;
}

.alert-block__icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #FFF4ED;
  color: #C2410C;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.alert-block__icon--cyan {
  background: #E1F5FA;
  color: #00708A;
}

.alert-block__head-text { flex: 1; min-width: 0; }

.alert-block__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #201F1E;
  margin: 0 0 2px;
  letter-spacing: -0.005em;
}

.alert-block__desc {
  font-size: 0.8125rem;
  color: #605E5C;
  margin: 0;
  line-height: 1.5;
}

.alert-block__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid #E1DFDD;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #E1DFDD;
  cursor: pointer;
  transition: background 0.12s;
}
.alert-item:last-child { border-bottom: none; }
.alert-item:hover { background: #FAFAFA; }
.alert-block--warning .alert-item:hover { background: #FFF8EE; }

.alert-item__main { flex: 1; min-width: 0; }

.alert-item__number {
  font-size: 0.875rem;
  font-weight: 600;
  color: #16294E;
  letter-spacing: -0.005em;
}

.alert-item__meta {
  font-size: 0.75rem;
  color: #605E5C;
  margin-top: 2px;
}

.alert-item__action {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 11px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  border: 1px solid transparent;
  flex-shrink: 0;
}

.alert-item__action--take   { background: #EEF2FF; color: #3730A3; border-color: #C7D2FE; }
.alert-item__action--decide { background: #FFF4CE; color: #B7791F; border-color: #F2D17C; }
.alert-item__action--finish { background: #DFF6DD; color: #107C10; border-color: #92DDA8; }
.alert-item__action--view   { background: #F8F8F8; color: #605E5C; border-color: #E1DFDD; }

.alert-item__chevron {
  color: #A19F9D;
  flex-shrink: 0;
  transition: transform 0.15s, color 0.15s;
}
.alert-item:hover .alert-item__chevron {
  color: #16294E;
  transform: translateX(2px);
}

/* ─────────────────────────────────
   Employee summary (count + actions)
   ───────────────────────────────── */
.employee-summary {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 12px;
  align-items: stretch;
}

@media (max-width: 700px) {
  .employee-summary { grid-template-columns: 1fr; }
}

.employee-summary__count {
  background: #16294E;
  color: white;
  border-radius: 6px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.employee-summary__big {
  font-size: 2.5rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: white;
}

.employee-summary__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 4px;
}

.employee-summary__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Action button (full-width row style) */
.action-btn {
  all: unset;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: white;
  border: 1px solid #E1DFDD;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.875rem;
  font-weight: 500;
  color: #201F1E;
  flex: 1;
}

.action-btn:hover {
  border-color: #16294E;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.action-btn .q-icon:first-child { color: #00AFDB; }

.action-btn span { flex: 1; }

.action-btn__chevron {
  color: #A19F9D;
  transition: transform 0.15s, color 0.15s;
}

.action-btn:hover .action-btn__chevron {
  color: #16294E;
  transform: translateX(2px);
}

.action-btn--full { width: 100%; }

/* ─────────────────────────────────
   Stats (admin only)
   ───────────────────────────────── */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 800px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
}

.stat {
  background: white;
  border: 1px solid #E1DFDD;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat__icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat--navy   .stat__icon { background: #E8EBF1; color: #16294E; }
.stat--cyan   .stat__icon { background: #E1F5FA; color: #00708A; }
.stat--amber  .stat__icon { background: #FFF4CE; color: #B7791F; }
.stat--green  .stat__icon { background: #DFF6DD; color: #107C10; }

.stat__body { flex: 1; min-width: 0; }

.stat__value {
  font-size: 1.375rem;
  font-weight: 600;
  color: #201F1E;
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat__label {
  font-size: 0.75rem;
  color: #605E5C;
  font-weight: 500;
  margin-top: 2px;
}

/* ─────────────────────────────────
   All clear state
   ───────────────────────────────── */
.all-clear {
  background: white;
  border: 1px solid #E1DFDD;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  padding: 48px 24px;
  text-align: center;
}

.all-clear__icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: #DFF6DD;
  color: #107C10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.all-clear__title {
  font-size: 1rem;
  font-weight: 600;
  color: #201F1E;
  margin: 0 0 4px;
  letter-spacing: -0.005em;
}

.all-clear__desc {
  font-size: 0.8125rem;
  color: #605E5C;
  margin: 0;
  line-height: 1.5;
}

/* ─────────────────────────────────
   Responsive
   ───────────────────────────────── */
@media (max-width: 600px) {
  .page { padding: 16px 12px 48px; }
  .page-header__title { font-size: 1.25rem; }
  .page-header__actions .btn { width: 100%; }
  .alert-block__head { padding: 14px 16px 10px; }
  .alert-item { padding: 10px 16px; }
  .employee-summary__count { padding: 16px 18px; }
  .employee-summary__big { font-size: 2rem; }
}
</style>
