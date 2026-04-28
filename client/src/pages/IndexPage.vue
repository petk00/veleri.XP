<template>
  <q-page class="page">
    <div class="page-shell">

      <!-- Page header -->
      <header class="page-header">
        <div class="page-header__main">
          <div class="page-header__eyebrow">{{ todayFormatted }}</div>
          <h1 class="page-header__title">
            Pozdrav, <span class="page-header__name">{{ user?.first_name || 'korisniče' }}</span>
          </h1>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" @click="$router.push('/requests/new')">
            <q-icon name="add" size="16px" />
            <span>Novi zahtjev</span>
          </button>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="loading-block">
        <q-spinner color="primary" size="32px" />
      </div>

      <!-- Main + sidebar split -->
      <div v-else class="split">

        <!-- ═════════════ MAIN ═════════════ -->
        <main class="main">

          <!-- ───── ADMIN: focus lista ───── -->
          <template v-if="isAdmin">
            <div class="card">
              <div class="card__header">
                <div class="card__header-left">
                  <q-icon :name="focusIcon" size="16px" :class="focusIconClass" />
                  <h2 class="card__title">{{ focusTitle }}</h2>
                </div>
                <span v-if="focusItems.length > 0" class="card__count">{{ focusItems.length }}</span>
              </div>

              <ul v-if="focusItems.length > 0" class="focus-list">
                <li
                  v-for="r in focusItems"
                  :key="r.id_purchase_request"
                  class="focus-item"
                  @click="$router.push(`/requests/${r.id_purchase_request}`)"
                >
                  <div class="focus-item__main">
                    <div class="focus-item__title">
                      <span class="focus-item__number">{{ r.request_number }}</span>
                      <span class="focus-item__separator">·</span>
                      <span class="focus-item__person">{{ r.created_by }}</span>
                    </div>
                    <div class="focus-item__meta">
                      {{ r.department_name }}
                      <template v-if="r.total_amount"> · {{ formatCurrency(r.total_amount) }}</template>
                      · {{ relativeTime(r.created_at) }}
                    </div>
                  </div>
                  <span class="tag" :class="`tag--${focusTagFor(r).key}`">
                    {{ focusTagFor(r).label }}
                  </span>
                  <q-icon name="chevron_right" size="16px" class="focus-item__chevron" />
                </li>
              </ul>

              <div v-else class="empty">
                <q-icon name="check_circle" size="32px" class="empty__icon" />
                <div class="empty__title">{{ emptyTitle }}</div>
                <div class="empty__desc">{{ emptyDesc }}</div>
              </div>
            </div>
          </template>

          <!-- ───── ZAPOSLENIK ───── -->
          <template v-else>

            <!-- Alert: vraćen zahtjev -->
            <div
              v-if="returnedAlertItem"
              class="alert-card"
              @click="$router.push(`/requests/${returnedAlertItem.id_purchase_request}`)"
            >
              <div class="alert-card__head">
                <div class="alert-card__icon">
                  <q-icon name="undo" size="20px" />
                </div>
                <div class="alert-card__head-text">
                  <div class="alert-card__eyebrow">Vraćeno na dopunu / izmjenu</div>
                  <div class="alert-card__title">{{ returnedAlertItem.request_number }}</div>
                  <div class="alert-card__meta">
                    {{ returnedAlertItem.department_name }} · {{ relativeTime(returnedAlertItem.created_at) }}
                  </div>
                </div>
                <q-icon name="chevron_right" size="20px" class="alert-card__chevron" />
              </div>
              <div class="alert-card__body">
                Pregledajte komentar administratora, ispravite zahtjev i pošaljite ga ponovno.
              </div>
            </div>

            <!-- Status zadnjeg zahtjeva (kad nema vraćenog) -->
            <div
              v-else-if="latestRequest"
              class="status-card"
              @click="$router.push(`/requests/${latestRequest.id_purchase_request}`)"
            >
              <div class="status-card__top">
                <div class="status-card__eyebrow">Zadnji zahtjev</div>
                <span class="status-pill" :class="statusClass(latestRequest.status_name)">
                  {{ latestRequest.status_name }}
                </span>
              </div>
              <div class="status-card__number">{{ latestRequest.request_number }}</div>
              <div class="status-card__meta">
                {{ latestRequest.department_name }}
                <template v-if="latestRequest.total_amount"> · {{ formatCurrency(latestRequest.total_amount) }}</template>
                · {{ relativeTime(latestRequest.created_at) }}
              </div>
              <div class="status-card__action">
                Otvori detalje
                <q-icon name="arrow_forward" size="14px" />
              </div>
            </div>

            <!-- Empty (zaposlenik nema nijedan zahtjev) -->
            <div v-else class="card">
              <div class="empty">
                <q-icon name="check_circle" size="32px" class="empty__icon" />
                <div class="empty__title">Nemate aktivnih zahtjeva</div>
                <div class="empty__desc">Pokrenite novi zahtjev za nabavu kad bude potrebno.</div>
              </div>
            </div>

            <!-- Lista ostalih aktivnih zahtjeva -->
            <div v-if="latestRequest && otherActiveBesidesLatest.length > 0" class="card">
              <div class="card__header">
                <div class="card__header-left">
                  <q-icon name="schedule" size="16px" class="ink-muted" />
                  <h2 class="card__title">Ostali aktivni</h2>
                </div>
                <span class="card__count">{{ otherActiveBesidesLatest.length }}</span>
              </div>
              <ul class="focus-list">
                <li
                  v-for="r in otherActiveBesidesLatest.slice(0, 5)"
                  :key="r.id_purchase_request"
                  class="focus-item"
                  @click="$router.push(`/requests/${r.id_purchase_request}`)"
                >
                  <div class="focus-item__main">
                    <div class="focus-item__title">
                      <span class="focus-item__number">{{ r.request_number }}</span>
                      <span class="focus-item__separator">·</span>
                      <span class="focus-item__person">{{ r.department_name }}</span>
                    </div>
                    <div class="focus-item__meta">{{ relativeTime(r.created_at) }}</div>
                  </div>
                  <span class="status-pill" :class="statusClass(r.status_name)">{{ r.status_name }}</span>
                  <q-icon name="chevron_right" size="16px" class="focus-item__chevron" />
                </li>
              </ul>
              <button
                v-if="otherActiveBesidesLatest.length > 5"
                class="card-link"
                @click="$router.push('/requests')"
              >
                Pogledaj sve
                <q-icon name="arrow_forward" size="14px" />
              </button>
            </div>

          </template>

        </main>

        <!-- ═════════════ SIDEBAR ═════════════ -->
        <aside class="sidebar">

          <!-- Quick actions -->
          <div class="card">
            <div class="card__header">
              <div class="card__header-left">
                <q-icon name="bolt" size="16px" class="ink-cyan" />
                <h2 class="card__title">Brze akcije</h2>
              </div>
            </div>
            <ul class="quick-list">
              <li>
                <button class="quick" @click="$router.push('/requests/new')">
                  <q-icon name="add_shopping_cart" size="18px" />
                  <span>Novi zahtjev</span>
                  <q-icon name="chevron_right" size="16px" class="quick__chevron" />
                </button>
              </li>
              <li>
                <button class="quick" @click="$router.push('/requests')">
                  <q-icon name="list_alt" size="18px" />
                  <span>Svi zahtjevi</span>
                  <q-icon name="chevron_right" size="16px" class="quick__chevron" />
                </button>
              </li>
            </ul>
          </div>

          <!-- Stats -->
          <div class="card">
            <div class="stat">
              <span class="stat__label">Ukupno zahtjeva</span>
              <span class="stat__value">{{ allRequests.length }}</span>
            </div>
            <div class="stat stat--bordered">
              <span class="stat__label">Ovaj mjesec</span>
              <span class="stat__value">{{ thisMonthCount }}</span>
            </div>
            <div v-if="isAdmin" class="stat stat--bordered">
              <span class="stat__label">Završeno</span>
              <span class="stat__value">{{ closedCount }}</span>
            </div>
          </div>

        </aside>

      </div>
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

/* ───────── Header ───────── */

const todayFormatted = computed(() => {
  const formatted = new Date().toLocaleDateString('hr-HR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
});

/* ───────── Helpers ───────── */

const countByStatus = (...names) =>
  allRequests.value.filter(r => names.includes(r.status_name)).length;

const relativeTime = (value) => {
  if (!value) return '';
  const now = new Date();
  const date = new Date(value);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'upravo sad';
  if (diffMin < 60) return `prije ${diffMin} min`;
  if (diffH < 24) return `prije ${diffH} ${diffH === 1 ? 'sat' : (diffH < 5 ? 'sata' : 'sati')}`;
  if (diffD < 7) return `prije ${diffD} ${diffD === 1 ? 'dan' : 'dana'}`;
  return date.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (value) => {
  if (value == null) return '';
  return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(value);
};

/* ───────── Admin focus list ───────── */

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
      return new Date(b.created_at) - new Date(a.created_at);
    });
});

const focusItems = computed(() => (isAdmin ? adminActionItems.value : []));
const focusTitle = computed(() => (isAdmin ? 'Čeka vašu akciju' : ''));
const focusIcon = computed(() => (isAdmin ? 'priority_high' : 'schedule'));
const focusIconClass = computed(() => 'ink-cyan');

const emptyTitle = computed(() => (isAdmin ? 'Sve je obrađeno' : 'Nemate aktivnih zahtjeva'));
const emptyDesc = computed(() => isAdmin
  ? 'Trenutno nema zahtjeva koji čekaju vašu akciju.'
  : 'Pokrenite novi zahtjev za nabavu kad bude potrebno.'
);

const focusTagFor = (r) => {
  if (isAdmin) {
    switch (r.status_name) {
      case 'Poslano':       return { key: 'take', label: 'Preuzmi' };
      case 'Na odobrenju':  return { key: 'decide', label: 'Odluči' };
      case 'Naručeno':      return { key: 'finish', label: 'Završi' };
      default:              return { key: 'view', label: 'Otvori' };
    }
  }
  return { key: 'view', label: 'Otvori' };
};

/* ───────── Zaposlenik ───────── */

// Vraćeni zahtjevi
const returnedRequests = computed(() =>
  allRequests.value.filter(r => r.status_name === 'Vraćeno na dopunu / izmjenu')
);
// Najnoviji vraćen za alert
const returnedAlertItem = computed(() => returnedRequests.value[0] || null);

// Najnoviji zahtjev (bilo kojeg statusa)
const latestRequest = computed(() => {
  if (allRequests.value.length === 0) return null;
  return [...allRequests.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
});

// Aktivni (Poslano, Na odobrenju, Naručeno, Vraćeno) bez "zadnjeg"
const otherActiveBesidesLatest = computed(() => {
  if (!latestRequest.value) return [];
  const activeStatuses = ['Poslano', 'Na odobrenju', 'Naručeno', 'Vraćeno na dopunu / izmjenu'];
  return allRequests.value
    .filter(r =>
      activeStatuses.includes(r.status_name)
      && r.id_purchase_request !== latestRequest.value.id_purchase_request
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
});

/* ───────── Status pill class ───────── */

const statusClass = (statusName) => {
  switch ((statusName || '').toLowerCase()) {
    case 'poslano':                       return 'status-pill--sent';
    case 'na odobrenju':                  return 'status-pill--review';
    case 'vraćeno na dopunu / izmjenu':   return 'status-pill--returned';
    case 'naručeno':                      return 'status-pill--ordered';
    case 'zatvoreno':                     return 'status-pill--closed';
    case 'odbijeno':                      return 'status-pill--rejected';
    default:                              return 'status-pill--default';
  }
};

/* ───────── Sidebar stats ───────── */

const thisMonthCount = computed(() => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return allRequests.value.filter(r => {
    const d = new Date(r.created_at);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;
});

const closedCount = computed(() => countByStatus('Zatvoreno'));

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
/* ─────────────────────────────
   Page
   ───────────────────────────── */
.page {
  background: #F5F5F5;
  min-height: 100vh;
  padding: 24px 24px 64px;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: #201F1E;
}

.page-shell {
  max-width: 1200px;
  margin: 0 auto;
}

/* ─────────────────────────────
   Page header
   ───────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
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
.page-header__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* ─────────────────────────────
   Loading
   ───────────────────────────── */
.loading-block {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

/* ─────────────────────────────
   Buttons
   ───────────────────────────── */
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

/* ─────────────────────────────
   Layout split
   ───────────────────────────── */
.split {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  align-items: start;
}

@media (max-width: 900px) {
  .split { grid-template-columns: 1fr; }
}

.main, .sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

/* ─────────────────────────────
   Card
   ───────────────────────────── */
.card {
  background: white;
  border: 1px solid #E1DFDD;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #E1DFDD;
}

.card__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card__title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #201F1E;
  margin: 0;
}

.card__count {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #605E5C;
  background: #F8F8F8;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid #E1DFDD;
}

.ink-cyan { color: #00AFDB; }
.ink-muted { color: #605E5C; }
.ink-warning { color: #C2410C; }

/* ─────────────────────────────
   Alert card (vraćen zahtjev za zaposlenika)
   ───────────────────────────── */
.alert-card {
  background: #FFFBF5;
  border: 1px solid #F2D17C;
  border-left: 3px solid #C2410C;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s;
}
.alert-card:hover {
  background: #FFF7E8;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.alert-card__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px 12px;
}

.alert-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #FFF4ED;
  color: #C2410C;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-card__head-text { flex: 1; min-width: 0; }

.alert-card__eyebrow {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #C2410C;
  margin-bottom: 2px;
}

.alert-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: #16294E;
  letter-spacing: -0.005em;
}

.alert-card__meta {
  font-size: 0.75rem;
  color: #605E5C;
  margin-top: 2px;
}

.alert-card__chevron {
  color: #C2410C;
  flex-shrink: 0;
  margin-top: 8px;
  transition: transform 0.15s;
}
.alert-card:hover .alert-card__chevron { transform: translateX(2px); }

.alert-card__body {
  padding: 0 20px 16px 72px;
  font-size: 0.8125rem;
  color: #424242;
  line-height: 1.5;
}

/* ─────────────────────────────
   Status card (zadnji zahtjev za zaposlenika)
   ───────────────────────────── */
.status-card {
  background: white;
  border: 1px solid #E1DFDD;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  padding: 18px 20px;
  cursor: pointer;
  transition: all 0.15s;
}
.status-card:hover {
  border-color: #16294E;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.status-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.status-card__eyebrow {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #00AFDB;
}

.status-card__number {
  font-size: 1.125rem;
  font-weight: 600;
  color: #16294E;
  letter-spacing: -0.01em;
  margin-bottom: 4px;
}

.status-card__meta {
  font-size: 0.8125rem;
  color: #605E5C;
}

.status-card__action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #E1DFDD;
  font-size: 0.75rem;
  font-weight: 500;
  color: #16294E;
}
.status-card:hover .status-card__action .q-icon {
  transform: translateX(2px);
  transition: transform 0.15s;
}

/* ─────────────────────────────
   Focus list (admin)
   ───────────────────────────── */
.focus-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.focus-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #E1DFDD;
  cursor: pointer;
  transition: background 0.12s;
}
.focus-item:last-child { border-bottom: none; }
.focus-item:hover { background: #FAFAFA; }

.focus-item__main { flex: 1; min-width: 0; }

.focus-item__title {
  font-size: 0.8125rem;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.focus-item__number {
  font-weight: 600;
  color: #16294E;
  letter-spacing: -0.005em;
}

.focus-item__separator {
  color: #C8C6C4;
}

.focus-item__person {
  color: #424242;
  font-weight: 500;
}

.focus-item__meta {
  font-size: 0.6875rem;
  color: #605E5C;
  margin-top: 3px;
}

.focus-item__chevron {
  color: #A19F9D;
  flex-shrink: 0;
  transition: transform 0.15s, color 0.15s;
}
.focus-item:hover .focus-item__chevron {
  color: #16294E;
  transform: translateX(2px);
}

/* ─────────────────────────────
   Tags (admin focus list)
   ───────────────────────────── */
.tag {
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
  white-space: nowrap;
}
.tag--take   { background: #EEF2FF; color: #3730A3; border-color: #C7D2FE; }
.tag--decide { background: #FFF4CE; color: #B7791F; border-color: #F2D17C; }
.tag--finish { background: #DFF6DD; color: #107C10; border-color: #92DDA8; }
.tag--view   { background: #F8F8F8; color: #605E5C; border-color: #E1DFDD; }

/* ─────────────────────────────
   Status pills
   ───────────────────────────── */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 20px;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  border: 1px solid transparent;
  flex-shrink: 0;
}
.status-pill::before {
  content: '';
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
.status-pill--sent     { background: #EEF2FF; color: #3730A3; border-color: #C7D2FE; }
.status-pill--review   { background: #FFF4CE; color: #B7791F; border-color: #F2D17C; }
.status-pill--returned { background: #FFF4ED; color: #C2410C; border-color: #FBBF77; }
.status-pill--ordered  { background: #E1F5FA; color: #00708A; border-color: #94DCEF; }
.status-pill--closed   { background: #DFF6DD; color: #107C10; border-color: #92DDA8; }
.status-pill--rejected { background: #FDE7E9; color: #A4262C; border-color: #F1B0B7; }
.status-pill--default  { background: #F8F8F8; color: #605E5C; border-color: #E1DFDD; }

/* ─────────────────────────────
   Card link (footer "Pogledaj sve")
   ───────────────────────────── */
.card-link {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 10px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #16294E;
  cursor: pointer;
  border-top: 1px solid #E1DFDD;
  transition: background 0.12s;
  box-sizing: border-box;
}
.card-link:hover { background: #FAFAFA; }

/* ─────────────────────────────
   Empty state
   ───────────────────────────── */
.empty {
  text-align: center;
  padding: 40px 20px;
}
.empty__icon {
  color: #92DDA8;
  margin-bottom: 8px;
}
.empty__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #201F1E;
  margin-bottom: 4px;
}
.empty__desc {
  font-size: 0.75rem;
  color: #605E5C;
  line-height: 1.5;
  max-width: 280px;
  margin: 0 auto;
}

/* ─────────────────────────────
   Sidebar — Quick actions
   ───────────────────────────── */
.quick-list {
  list-style: none;
  margin: 0;
  padding: 6px;
}

.quick {
  all: unset;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8125rem;
  color: #201F1E;
  font-weight: 500;
  transition: background 0.12s;
}
.quick:hover { background: #F3F2F1; }

.quick > .q-icon:first-child {
  color: #00AFDB;
}
.quick span { flex: 1; }
.quick__chevron {
  color: #A19F9D;
}

/* ─────────────────────────────
   Sidebar — Stats
   ───────────────────────────── */
.stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}
.stat--bordered { border-top: 1px solid #E1DFDD; }

.stat__label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #605E5C;
}

.stat__value {
  font-size: 1.375rem;
  font-weight: 600;
  color: #16294E;
  letter-spacing: -0.015em;
  font-variant-numeric: tabular-nums;
}

/* ─────────────────────────────
   Responsive
   ───────────────────────────── */
@media (max-width: 600px) {
  .page { padding: 16px 12px 48px; }
  .page-header__title { font-size: 1.25rem; }
  .page-header__actions .btn { width: 100%; }
  .focus-item { padding: 10px 14px; }
  .focus-item__meta { font-size: 0.6875rem; }
  .alert-card__body { padding-left: 20px; }
}
</style>
