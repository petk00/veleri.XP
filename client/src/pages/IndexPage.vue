<template>
  <q-page class="page">
    <div class="page-shell">

      <header class="page-header">
        <div class="page-header__main">
          <div class="page-header__eyebrow">{{ todayFormatted }}</div>
          <h1 class="page-header__title">
            Bok, <span class="page-header__name">{{ user?.first_name || 'korisniče' }}</span>
          </h1>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--cta" type="button" @click="$router.push('/requests/new')">
            <q-icon name="add" size="20px" />
            <span>Novi zahtjev</span>
          </button>
        </div>
      </header>

      <div v-if="loading" class="loading-block">
        <q-spinner color="primary" size="28px" />
      </div>

      <!-- ── Admin view ── -->
      <template v-else-if="isAdmin">

        <div class="admin-stats">
          <div class="stat-card">
            <span class="stat-card__value">{{ adminTotal }}</span>
            <span class="stat-card__label">Ukupno zahtjeva</span>
          </div>
          <div class="stat-card" :class="{ 'stat-card--action': adminActionable > 0 }">
            <span class="stat-card__value">{{ adminActionable }}</span>
            <span class="stat-card__label">Čeka akciju</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">{{ adminOrdered }}</span>
            <span class="stat-card__label">Naručeno</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">{{ adminClosed }}</span>
            <span class="stat-card__label">Zatvoreno</span>
          </div>
        </div>

        <section class="list-surface">
          <div class="surface-header">
            <h2 class="surface-title">Čeka vašu akciju</h2>
            <span v-if="displayRows.length > 0" class="surface-count">{{ displayRows.length }}</span>
          </div>
          <div v-if="displayRows.length === 0" class="empty-state">
            <div class="empty-state__icon"><q-icon name="check_circle" size="28px" /></div>
            <div class="empty-state__title">Sve je obrađeno</div>
            <div class="empty-state__hint">Trenutno nema zahtjeva koji čekaju vašu akciju.</div>
          </div>
          <ul v-else class="request-list">
            <li
              v-for="r in displayRows"
              :key="r.id_purchase_request"
              class="request-row"
              @click="$router.push(`/requests/${r.id_purchase_request}`)"
            >
              <span class="row-number">{{ r.request_number }}</span>
              <span class="row-dept">{{ r.department_name }}</span>
              <span class="row-person">{{ r.created_by }}</span>
              <span class="status" :class="statusClass(r.status_name)">{{ r.status_name }}</span>
              <span class="row-amount">{{ formatCurrency(r.total_amount) }}</span>
              <span class="row-date">{{ formatDate(r.created_at) }}</span>
              <q-icon name="chevron_right" size="16px" class="row-chevron" />
            </li>
          </ul>
        </section>
      </template>

      <!-- ── Employee view ── -->
      <template v-else>

        <!-- Vraćen alert -->
        <div
          v-if="returnedAlertItem"
          class="returned-alert"
          @click="$router.push(`/requests/${returnedAlertItem.id_purchase_request}`)"
        >
          <q-icon name="undo" size="15px" class="returned-alert__icon" />
          <span>
            <strong>{{ returnedAlertItem.request_number }}</strong>
            je vraćen na dopunu. Pregledajte komentar administratora.
          </span>
          <q-icon name="chevron_right" size="15px" class="returned-alert__chevron" />
        </div>

        <!-- Statistike -->
        <div class="emp-stats">
          <div class="stat-card">
            <span class="stat-card__value">{{ totalCount }}</span>
            <span class="stat-card__label">Ukupno zahtjeva</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value">{{ activeCount }}</span>
            <span class="stat-card__label">Aktivni</span>
          </div>
          <div class="stat-card" :class="{ 'stat-card--warn': returnedCount > 0 }">
            <span class="stat-card__value">{{ returnedCount }}</span>
            <span class="stat-card__label">Vraćeno na dopunu</span>
          </div>
        </div>

        <!-- Nedavni zahtjevi -->
        <section class="list-surface">
          <div v-if="displayRows.length === 0" class="empty-state">
            <div class="empty-state__icon"><q-icon name="inbox" size="28px" /></div>
            <div class="empty-state__title">Nemate zahtjeva</div>
            <div class="empty-state__hint">Kreirajte prvi zahtjev za nabavu klikom na "Novi zahtjev".</div>
          </div>
          <ul v-else class="request-list request-list--minimal">
            <li
              v-for="r in displayRows"
              :key="r.id_purchase_request"
              class="request-row"
              @click="$router.push(`/requests/${r.id_purchase_request}`)"
            >
              <span class="row-number">{{ r.request_number }}</span>
              <span class="status" :class="statusClass(r.status_name)">{{ r.status_name }}</span>
              <span class="row-date">{{ formatDate(r.created_at) }}</span>
              <q-icon name="chevron_right" size="16px" class="row-chevron" />
            </li>
          </ul>
        </section>

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
  const f = new Date().toLocaleDateString('hr-HR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  return f.charAt(0).toUpperCase() + f.slice(1);
});

const returnedAlertItem = computed(() =>
  allRequests.value.find(r => r.status_name === 'Vraćeno na dopunu / izmjenu') || null
);

// Admin stats
const adminTotal = computed(() => allRequests.value.length);
const adminActionable = computed(() =>
  allRequests.value.filter(r => ['Poslano', 'Na odobrenju'].includes(r.status_name)).length
);
const adminOrdered = computed(() =>
  allRequests.value.filter(r => r.status_name === 'Naručeno').length
);
const adminClosed = computed(() =>
  allRequests.value.filter(r => r.status_name === 'Zatvoreno').length
);

const totalCount = computed(() => allRequests.value.length);

const activeCount = computed(() =>
  allRequests.value.filter(r => !['Zatvoreno', 'Odbijeno'].includes(r.status_name)).length
);

const returnedCount = computed(() =>
  allRequests.value.filter(r => r.status_name === 'Vraćeno na dopunu / izmjenu').length
);

const displayRows = computed(() => {
  if (isAdmin) {
    const priority = { 'Poslano': 1, 'Na odobrenju': 2, 'Naručeno': 3 };
    return allRequests.value
      .filter(r => priority[r.status_name] !== undefined)
      .sort((a, b) => {
        const d = priority[a.status_name] - priority[b.status_name];
        return d !== 0 ? d : new Date(b.created_at) - new Date(a.created_at);
      });
  }
  return [...allRequests.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);
});

const formatCurrency = (value) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('hr-HR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const statusClass = (status) => {
  switch ((status || '').toLowerCase().replace(/\s*\/\s*/g, '/')) {
    case 'poslano':                   return 'status--sent';
    case 'na odobrenju':              return 'status--review';
    case 'vraćeno na dopunu/izmjenu': return 'status--returned';
    case 'odbijeno':                  return 'status--rejected';
    case 'naručeno':
    case 'odobreno':                  return 'status--ordered';
    case 'zatvoreno':                 return 'status--closed';
    default:                          return 'status--default';
  }
};

onMounted(async () => {
  try {
    const { data } = await api.get('/requests');
    allRequests.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 38px 40px 72px;
  background: transparent;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.page-shell {
  max-width: 900px;
  margin: 0 auto;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.page-header__eyebrow {
  margin-bottom: 8px;
  color: #0067b8;
  font-size: 0.75rem;
  font-weight: 600;
}

.page-header__title {
  margin: 0;
  color: #111827;
  font-size: 2.25rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.1;
}

.page-header__name { color: #0067b8; }

.page-header__actions { flex-shrink: 0; }

.btn--cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 24px;
  border: none;
  border-radius: 3px;
  background: #0067b8;
  color: #fff;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.btn--cta:hover { background: #005a9e; }

/* ── Loading ── */
.loading-block {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

/* ── Returned alert ── */
.returned-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 11px 16px;
  border-left: 3px solid #c2410c;
  background: #fff7ed;
  color: #7c2d12;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: background 0.12s;
}

.returned-alert:hover { background: #ffedd5; }
.returned-alert__icon { flex-shrink: 0; color: #c2410c; }
.returned-alert__chevron { margin-left: auto; flex-shrink: 0; color: #c2410c; }

/* ── List surface ── */
.list-surface {
  border: 1px solid #e5e7eb;
  background: #fff;
  overflow: hidden;
}

.surface-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.surface-title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111827;
}

.surface-count {
  color: #6b7280;
  font-size: 0.75rem;
}

/* ── Request list ── */
.request-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.request-row {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 20px;
  height: 52px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.12s;
}

.request-row:last-child { border-bottom: none; }

.request-row:hover { background: #f9fafb; }

.request-row:hover .row-chevron { color: #0067b8; transform: translateX(2px); }
.request-row:hover { box-shadow: inset 3px 0 0 #0067b8; }

.row-number {
  min-width: 155px;
  color: #0067b8;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.005em;
  flex-shrink: 0;
}

.row-dept {
  flex: 1;
  min-width: 0;
  color: #111827;
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 16px;
}

.row-person {
  flex: 1;
  min-width: 0;
  color: #4b5563;
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 16px;
}

.row-amount {
  min-width: 100px;
  color: #111827;
  font-size: 0.8125rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  padding-right: 16px;
}

.row-date {
  min-width: 90px;
  color: #4b5563;
  font-size: 0.8125rem;
  flex-shrink: 0;
  padding-right: 16px;
}

.row-chevron {
  color: transparent;
  flex-shrink: 0;
  transition: color 0.12s, transform 0.12s;
}

/* ── Status badges ── */
.status {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 2px 8px;
  border-radius: 3px;
  background: #f3f4f6;
  color: #374151;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
  margin-right: 16px;
}

.status--sent     { color: #1d4ed8; background: #dbeafe; }
.status--review   { color: #92400e; background: #fef3c7; }
.status--returned { color: #9a3412; background: #ffedd5; }
.status--rejected { color: #991b1b; background: #fee2e2; }
.status--ordered  { color: #065f46; background: #d1fae5; }
.status--closed   { color: #166534; background: #dcfce7; }
.status--default  { color: #374151; background: #f3f4f6; }

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px;
  text-align: center;
}

.empty-state__icon {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  border: 1px solid #e5e7eb;
  color: #9ca3af;
}

.empty-state__title {
  margin: 0 0 6px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
}

.empty-state__hint {
  max-width: 300px;
  color: #6b7280;
  font-size: 0.8125rem;
  line-height: 1.5;
}

/* ── Minimal list (employee dashboard) ── */
.request-list--minimal .request-row {
  height: auto;
  padding: 12px 20px;
  align-items: center;
}

.request-list--minimal .row-number {
  flex: 1;
  min-width: 0;
}

.request-list--minimal .status {
  flex: 1;
  justify-content: center;
  margin-right: 0;
  font-size: 0.75rem;
  padding: 4px 12px;
  min-height: 24px;
}

.request-list--minimal .row-date {
  flex: 1;
  text-align: right;
  padding-right: 12px;
  color: #6b7280;
  font-size: 0.8125rem;
  flex-shrink: 0;
}

/* ── Admin stats ── */
.admin-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card--action {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.stat-card--action .stat-card__value { color: #1d4ed8; }
.stat-card--action .stat-card__label { color: #1e40af; }

/* ── Employee stats ── */
.emp-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.stat-card--warn {
  border-color: #fed7aa;
  background: #fff7ed;
}

.stat-card__value {
  font-size: 1.75rem;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.02em;
  line-height: 1;
}

.stat-card--warn .stat-card__value { color: #c2410c; }

.stat-card__label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-card--warn .stat-card__label { color: #9a3412; }

/* ── Surface footer ── */
.surface-footer {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  color: #0067b8;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.12s;
}

.surface-footer:hover { background: #f9fafb; }

/* ── Responsive ── */
@media (max-width: 760px) {
  .page { padding: 24px 16px 56px; }
  .page-header { flex-direction: column; align-items: stretch; gap: 16px; }
  .page-header__title { font-size: 1.75rem; }
  .admin-stats { grid-template-columns: repeat(2, 1fr); }
  .emp-stats { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stat-card { padding: 12px 14px; }
  .stat-card__value { font-size: 1.375rem; }
  .row-dept, .row-person, .row-amount, .row-date { display: none; }
  .row-number { flex: 1; }
}
</style>
