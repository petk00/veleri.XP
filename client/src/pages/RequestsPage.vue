<template>
  <q-page class="page">
    <div class="page-shell">

      <header class="page-header">
        <div class="page-header__main">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <span class="breadcrumb__item">Nabava</span>
            <span class="breadcrumb__sep">›</span>
            <span class="breadcrumb__current">{{ isAdmin ? 'Zahtjevi' : 'Moji zahtjevi' }}</span>
          </nav>
          <h1 class="page-header__title">{{ isAdmin ? 'Zahtjevi' : 'Moji zahtjevi' }}</h1>
          <p class="page-header__subtitle">
            Pregled, pretraživanje i praćenje statusa zahtjeva za nabavu.
          </p>
        </div>
        <div v-if="isAdmin" class="page-header__actions">
          <button class="btn btn--cta" @click="$router.push('/requests/new')">
            <q-icon name="add" size="20px" />
            <span>Novi zahtjev</span>
          </button>
        </div>
      </header>

      <section class="summary-strip" :class="isAdmin ? 'summary-strip--4col' : 'summary-strip--2col'" aria-label="Sažetak zahtjeva">

        <template v-if="isAdmin">
          <div class="summary-item summary-item--total">
            <div class="summary-item__icon">
              <q-icon name="folder_open" size="15px" />
            </div>
            <span class="summary-item__value">{{ counts.total }}</span>
            <span class="summary-item__label">Ukupno zahtjeva</span>
          </div>
          <div class="summary-item summary-item--active">
            <div class="summary-item__icon">
              <q-icon name="autorenew" size="15px" />
            </div>
            <span class="summary-item__value">{{ counts.active }}</span>
            <span class="summary-item__label">Aktivni</span>
          </div>
          <div class="summary-item summary-item--attention">
            <div class="summary-item__icon">
              <q-icon name="inbox" size="15px" />
            </div>
            <span class="summary-item__value">{{ counts.attention }}</span>
            <span class="summary-item__label">Čeka pregled</span>
          </div>
          <div class="summary-item summary-item--closed">
            <div class="summary-item__icon">
              <q-icon name="task_alt" size="15px" />
            </div>
            <span class="summary-item__value">{{ counts.closed }}</span>
            <span class="summary-item__label">Zatvoreno</span>
          </div>
        </template>

        <template v-else>
          <button class="summary-card summary-card--new" @click="$router.push('/requests/new')">
            <img src="/solarlinear_NABAVA.svg" alt="" class="card-deco" />
            <div class="new-card__icon-wrap">
              <img src="/solarlinear_NOVIZAHTJEV.svg" alt="" class="new-card__icon" />
            </div>
            <span class="new-card__label">Novi zahtjev</span>
          </button>

          <button
            v-if="rows.length"
            class="summary-card summary-card--status"
            :style="lastRequestStyle.card"
            @click="openRequest(rows[0].id_purchase_request)"
          >
            <img src="/solarlinear_MOJIZAHTJEVI.svg" alt="" class="card-deco card-deco--status" />
            <span class="status-card__badge" :style="lastRequestStyle.badge">
              {{ rows[0].status_name }}
            </span>
            <span class="status-card__number">{{ rows[0].request_number }}</span>
            <span class="status-card__amount">{{ formatCurrency(rows[0].total_amount) }}</span>
            <span class="status-card__date">{{ formatDate(rows[0].created_at) }}</span>
            <q-icon name="chevron_right" size="16px" class="status-card__chevron" />
          </button>
          <div v-else class="summary-card summary-card--empty">
            <q-icon name="inbox" size="22px" class="empty-card__icon" />
            <span class="empty-card__label">Nema zahtjeva</span>
          </div>
        </template>

      </section>

      <section class="list-surface">

        <div v-if="errorMessage" class="error-banner">
          <q-icon name="error_outline" size="16px" />
          <span>{{ errorMessage }}</span>
        </div>

        <q-table
          :rows="rows"
          :columns="columns"
          row-key="id_purchase_request"
          :loading="loading"
          flat
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 25, 50]"
          rows-per-page-label="Redaka po stranici"
          class="data-table"
          @request="onTableRequest"
          @row-click="(_, row) => openRequest(row.id_purchase_request)"
        >
          <template #top>
            <div class="toolbar">
              <q-icon name="search" size="15px" class="toolbar__search-icon" />
              <q-input
                v-model="searchQuery"
                borderless dense clearable
                placeholder="Pretraži po broju, podnositelju ili odjelu..."
                class="toolbar__search"
              />

              <div class="toolbar__sep" />

              <q-select
                v-model="statusFilter"
                :options="statusOptions"
                borderless dense
                emit-value map-options
                class="toolbar__select"
              />

              <q-select
                v-if="fiscalYearOptions.length > 1"
                v-model="fiscalYearFilter"
                :options="fiscalYearOptions"
                borderless dense
                emit-value map-options
                class="toolbar__select"
              />

              <q-select
                v-if="isAdmin && departmentOptions.length > 1"
                v-model="departmentFilter"
                :options="departmentOptions"
                borderless dense
                emit-value map-options
                class="toolbar__select"
              />

              <q-select
                v-if="categoryOptions.length > 1"
                v-model="categoryFilter"
                :options="categoryOptions"
                borderless dense
                emit-value map-options
                class="toolbar__select"
              />

              <q-select
                v-if="isAdmin && userOptions.length > 1"
                v-model="userFilter"
                :options="userOptions"
                borderless dense
                emit-value map-options
                class="toolbar__select"
              />

              <button v-if="hasActiveFilters" class="toolbar__reset" @click="resetFilters">
                <q-icon name="close" size="12px" />
                <span>Poništi</span>
              </button>
            </div>
          </template>

          <!-- Cell: request number -->
          <template #body-cell-request_number="props">
            <q-td :props="props" class="cell-number">
              <span class="request-cell__number">{{ props.row.request_number }}</span>
            </q-td>
          </template>

          <!-- Cell: department -->
          <template #body-cell-department_name="props">
            <q-td :props="props">{{ props.row.department_name }}</q-td>
          </template>

          <!-- Cell: status -->
          <template #body-cell-status_name="props">
            <q-td :props="props">
              <span class="status" :class="statusClass(props.row.status_name)">
                {{ props.row.status_name }}
              </span>
            </q-td>
          </template>

          <!-- Cell: amount -->
          <template #body-cell-total_amount="props">
            <q-td :props="props" class="cell-num">
              <div class="cell-num__inner" :title="formatCurrency(props.row.total_amount)">
                {{ formatCurrency(props.row.total_amount) }}
              </div>
            </q-td>
          </template>

          <!-- Cell: date -->
          <template #body-cell-created_at="props">
            <q-td :props="props" class="cell-muted">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>

          <!-- Cell: created_by -->
          <template #body-cell-created_by="props">
            <q-td :props="props" class="cell-muted">{{ props.row.created_by }}</q-td>
          </template>

          <!-- Cell: chevron -->
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right cell-chevron">
              <q-icon name="chevron_right" size="18px" />
            </q-td>
          </template>

          <template #no-data>
            <div class="empty-state">
              <div class="empty-state__icon">
                <q-icon name="folder_open" size="32px" />
              </div>
              <h3 class="empty-state__title">Nema zahtjeva</h3>
              <p class="empty-state__hint">
                Kreirajte novi zahtjev kako biste započeli s radom.
              </p>
              <button class="btn btn--primary" @click="$router.push('/requests/new')">
                <q-icon name="add" size="16px" />
                <span>Novi zahtjev</span>
              </button>
            </div>
          </template>

          <template #loading>
            <q-inner-loading showing color="primary" />
          </template>
        </q-table>
      </section>

    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'boot/axios';
import { getStoredUser } from 'src/utils/authStorage';

const router = useRouter();

const loading      = ref(false);
const rows         = ref([]);
const errorMessage = ref('');
const counts       = ref({ total: 0, active: 0, attention: 0, closed: 0 });

const currentUser = ref(null);
const isAdmin     = ref(false);

// Filteri
const searchQuery      = ref('');
const statusFilter     = ref('all');
const departmentFilter = ref('all');
const userFilter       = ref('all');
const fiscalYearFilter = ref('all');
const categoryFilter   = ref('all');

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const statusOptions = [
  { label: 'Svi statusi',       value: 'all' },
  { label: 'Poslano',           value: 'Poslano' },
  { label: 'Na odobrenju',      value: 'Na odobrenju' },
  { label: 'Vraćeno na dopunu', value: 'Vraćeno na dopunu/izmjenu' },
  { label: 'Naručeno',          value: 'Naručeno' },
  { label: 'Zatvoreno',         value: 'Zatvoreno' },
  { label: 'Odbijeno',          value: 'Odbijeno' },
];

const departmentOptions  = ref([{ label: 'Svi odjeli', value: 'all' }]);
const userOptions        = ref([{ label: 'Svi podnositelji', value: 'all' }]);
const fiscalYearOptions  = ref([{ label: 'Sve godine', value: 'all' }]);
const categoryOptions    = ref([{ label: 'Svi predmeti', value: 'all' }]);

const STATUS = {
  POSLANO:          1,
  NA_ODOBRENJU:     2,
  VRACENO_NA_DOPUNU: 3,
  ODOBRENO:         4,
  ODBIJENO:         5,
  NARUCENO:         6,
  ZATVORENO:        7,
};

const STATUS_STYLES = {
  [STATUS.POSLANO]:           { background: '#eff6ff', badge: '#1d4ed8', badgeBg: '#dbeafe', border: '#93c5fd' },
  [STATUS.NA_ODOBRENJU]:      { background: '#fffbeb', badge: '#b45309', badgeBg: '#fef3c7', border: '#fcd34d' },
  [STATUS.VRACENO_NA_DOPUNU]: { background: '#fff7ed', badge: '#c2410c', badgeBg: '#ffedd5', border: '#fdba74' },
  [STATUS.ODBIJENO]:          { background: '#fef2f2', badge: '#b91c1c', badgeBg: '#fee2e2', border: '#fca5a5' },
  [STATUS.ODOBRENO]:          { background: '#f0fdf4', badge: '#15803d', badgeBg: '#dcfce7', border: '#86efac' },
  [STATUS.NARUCENO]:          { background: '#ecfeff', badge: '#0e7490', badgeBg: '#cffafe', border: '#67e8f9' },
  [STATUS.ZATVORENO]:         { background: '#dcfce7', badge: '#166534', badgeBg: '#bbf7d0', border: '#4ade80' },
};

const DEFAULT_STYLE = { background: '#f9fafb', badge: '#374151', badgeBg: '#f3f4f6', border: '#d1d5db' };

const lastRequestStyle = computed(() => {
  if (!rows.value.length) return { card: {}, badge: {} };
  const s = STATUS_STYLES[rows.value[0].fk_request_status] ?? DEFAULT_STYLE;
  return {
    card:  { background: s.background, borderLeftColor: s.border },
    badge: { color: s.badge, background: s.badgeBg },
  };
});

const hasActiveFilters = computed(() =>
  searchQuery.value
  || statusFilter.value !== 'all'
  || departmentFilter.value !== 'all'
  || userFilter.value !== 'all'
  || fiscalYearFilter.value !== 'all'
  || categoryFilter.value !== 'all'
);

const allColumns = [
  { name: 'request_number', label: 'Broj zahtjeva', field: 'request_number', align: 'left', sortable: false, style: 'min-width: 160px' },
  { name: 'department_name', label: 'Odjel',        field: 'department_name', align: 'left', sortable: false, style: 'min-width: 160px' },
  { name: 'status_name',    label: 'Status',        field: 'status_name',    align: 'left', sortable: false, style: 'min-width: 140px' },
  { name: 'created_by',     label: 'Podnositelj',   field: 'created_by',     align: 'left', sortable: false, style: 'min-width: 140px' },
  { name: 'total_amount',   label: 'Iznos',         field: 'total_amount',   align: 'left', sortable: false, style: 'min-width: 100px' },
  { name: 'created_at',     label: 'Datum',         field: 'created_at',     align: 'left', sortable: false, style: 'min-width: 110px' },
  { name: 'actions',        label: '',              field: 'actions',        align: 'right', style: 'width: 38px' },
];

const columns = computed(() =>
  isAdmin.value
    ? allColumns
    : allColumns.filter(c => c.name !== 'created_by')
);

const fetchRequests = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const params = {
      page:  pagination.value.page,
      limit: pagination.value.rowsPerPage,
    };
    if (searchQuery.value)                        params.search     = searchQuery.value;
    if (statusFilter.value !== 'all')             params.status     = statusFilter.value;
    if (departmentFilter.value !== 'all')         params.department = departmentFilter.value;
    if (isAdmin.value && userFilter.value !== 'all') params.user    = userFilter.value;
    if (fiscalYearFilter.value !== 'all')         params.fiscalYear = fiscalYearFilter.value;
    if (categoryFilter.value !== 'all')           params.category   = categoryFilter.value;

    const { data } = await api.get('/requests', { params });
    rows.value                 = Array.isArray(data.data) ? data.data : [];
    pagination.value.rowsNumber = data.total || 0;
    counts.value               = data.counts || { total: 0, active: 0, attention: 0, closed: 0 };
  } catch (error) {
    console.error('Greška:', error);
    errorMessage.value = error.response?.data?.message || 'Zahtjevi se trenutno ne mogu dohvatiti.';
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchMeta = async () => {
  try {
    const { data } = await api.get('/requests/meta');
    departmentOptions.value = [
      { label: 'Svi odjeli', value: 'all' },
      ...(data.departments || []).map((name) => ({ label: name, value: name })),
    ];
    if (isAdmin.value && data.users) {
      userOptions.value = [
        { label: 'Svi podnositelji', value: 'all' },
        ...data.users.map((name) => ({ label: name, value: name })),
      ];
    }
    if (data.fiscalYears?.length) {
      fiscalYearOptions.value = [
        { label: 'Sve godine', value: 'all' },
        ...data.fiscalYears.map((yr) => ({ label: String(yr), value: String(yr) })),
      ];
    }
    if (data.categories?.length) {
      categoryOptions.value = [
        { label: 'Svi predmeti', value: 'all' },
        ...data.categories.map((name) => ({ label: name, value: name })),
      ];
    }
  } catch {
    // ignore
  }
};

const onTableRequest = async (props) => {
  pagination.value.page        = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  await fetchRequests();
};

const resetFilters = () => {
  searchQuery.value      = '';
  statusFilter.value     = 'all';
  departmentFilter.value = 'all';
  userFilter.value       = 'all';
  fiscalYearFilter.value = 'all';
  categoryFilter.value   = 'all';
  pagination.value.page  = 1;
};

let searchTimer = null;
watch(searchQuery, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    pagination.value.page = 1;
    fetchRequests();
  }, 300);
});

watch([statusFilter, departmentFilter, userFilter, fiscalYearFilter, categoryFilter], () => {
  pagination.value.page = 1;
  fetchRequests();
});

const openRequest = (id) => router.push(`/requests/${id}`);

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

const normalizeStatus = (status) =>
  (status || '').replace(/\s*\/\s*/g, '/').trim();

const statusClass = (status) => {
  switch (normalizeStatus(status).toLowerCase()) {
    case 'poslano':                   return 'status--sent';
    case 'na odobrenju':              return 'status--review';
    case 'vraćeno na dopunu/izmjenu': return 'status--returned';
    case 'odbijeno':                  return 'status--rejected';
    case 'odobreno':                  return 'status--approved';
    case 'naručeno':                  return 'status--ordered';
    case 'zatvoreno':                 return 'status--closed';
    default:                          return 'status--default';
  }
};

onMounted(async () => {
  currentUser.value = getStoredUser();
  isAdmin.value     = currentUser.value?.role_name === 'Administrator';
  await Promise.all([fetchRequests(), fetchMeta()]);
});
</script>

<style scoped>
.page {
  padding: 38px 40px 32px;
  background: transparent;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.page-shell {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.page-header__main {
  min-width: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.breadcrumb__item {
  color: #6b7280;
  font-size: 0.8125rem;
  font-weight: 500;
}

.breadcrumb__sep {
  color: #d1d5db;
  font-size: 0.875rem;
  user-select: none;
}

.breadcrumb__current {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}

.page-header__title {
  margin: 0;
  color: #111827;
  font-size: 2.25rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.1;
}

.page-header__subtitle {
  max-width: 640px;
  margin: 10px 0 0;
  color: #4b5563;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.page-header__actions {
  display: flex;
  flex-shrink: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 16px;
  border: 1px solid #1f2937;
  border-radius: 3px;
  background: #fff;
  color: #111827;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.btn--primary {
  background: #111827;
  color: #fff;
  border-color: #111827;
}

.btn--primary:hover {
  background: #000;
  border-color: #000;
}

.btn--cta {
  min-height: 44px;
  padding: 0 24px;
  font-size: 0.9375rem;
  gap: 10px;
  background: #0067b8;
  color: #fff;
  border-color: #0067b8;
  border-radius: 3px;
}

.btn--cta:hover {
  background: #005a9e;
  border-color: #005a9e;
}

.btn--ghost {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}

.btn--ghost:hover {
  background: #f9fafb;
  border-color: #6b7280;
}

.summary-strip {
  display: grid;
  gap: 12px;
  margin-bottom: 28px;
}

.summary-strip--4col { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.summary-strip--2col { grid-template-columns: repeat(2, minmax(0, 1fr)); }

/* ── Shared card base ── */
.summary-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 190px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.2s ease;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
}

/* ── Dekorativni SVG ── */
.card-deco {
  position: absolute;
  bottom: -18px;
  right: -18px;
  width: 115px;
  height: 115px;
  opacity: 0.07;
  transform: rotate(-20deg);
  pointer-events: none;
  user-select: none;
}

.card-deco--status {
  bottom: -14px;
  right: -14px;
  width: 130px;
  height: 130px;
  opacity: 0.09;
  transform: rotate(15deg);
}

/* ── Novi zahtjev (lijeva) ── */
.summary-card--new {
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: linear-gradient(160deg, #ffffff 0%, #f3f4f6 100%);
  border: 1.5px dashed #d1d5db;
  box-shadow: none;
}

.summary-card--new:hover {
  border-color: #00afdb;
  box-shadow: 0 8px 28px rgba(0, 175, 219, 0.18);
  transform: scale(1.02);
  background: linear-gradient(160deg, #f0fbff 0%, #e0f6fd 100%);
}

.new-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30%;
  aspect-ratio: 1;
  max-width: 72px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.summary-card--new:hover .new-card__icon-wrap { opacity: 1; }

.new-card__icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.new-card__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  letter-spacing: 0.01em;
  transition: color 0.2s ease;
}

.summary-card--new:hover .new-card__label { color: #00afdb; }

/* ── Status kartica (desna) ── */
.summary-card--status {
  align-items: flex-start;
  justify-content: center;
  gap: 5px;
  padding: 22px 24px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-left: 4px solid transparent;
}

.summary-card--status:hover {
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.14);
  transform: translateY(-2px);
}

.status-card__badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.status-card__number {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #111827;
  line-height: 1.15;
}

.status-card__amount {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  font-variant-numeric: tabular-nums;
}

.status-card__date {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-top: 2px;
}

.status-card__chevron {
  position: absolute;
  bottom: 18px;
  right: 18px;
  color: rgba(0, 0, 0, 0.2);
  transition: color 0.2s ease, transform 0.2s ease;
}

.summary-card--status:hover .status-card__chevron {
  color: rgba(0, 0, 0, 0.5);
  transform: translateX(3px);
}

/* ── Prazna kartica ── */
.summary-card--empty {
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.4);
  border-style: dashed;
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: none;
  cursor: default;
}

.empty-card__icon { color: #d1d5db; }

.empty-card__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.summary-item {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 18px 20px 16px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.summary-item__icon {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.summary-item--total    .summary-item__icon { background: #f0f2f8; color: #1b2d59; }
.summary-item--active   .summary-item__icon { background: #e0f6fd; color: #00afdb; }
.summary-item--attention .summary-item__icon { background: #fff7ed; color: #d97706; }
.summary-item--closed   .summary-item__icon { background: #f0fdf4; color: #16a34a; }

.summary-item--combined {
  flex-direction: row;
  align-items: stretch;
  padding: 0;
  gap: 0;
}

.combined-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 18px 20px 16px;
}

.summary-item__icon--total     { background: #f0f2f8; color: #1b2d59; }
.summary-item__icon--active    { background: #e0f6fd; color: #00afdb; }
.summary-item__icon--attention { background: #fff7ed; color: #d97706; }
.summary-item__icon--closed    { background: #f0fdf4; color: #16a34a; }

.summary-item__value--active    { color: #00afdb; }
.summary-item__value--attention { color: #d97706; }
.summary-item__value--closed    { color: #16a34a; }

.combined-divider {
  width: 1px;
  background: rgba(0, 0, 0, 0.07);
  margin: 18px 0;
  flex-shrink: 0;
}

.summary-item__value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
  color: #111827;
}

.summary-item--active   .summary-item__value { color: #00afdb; }
.summary-item--attention .summary-item__value { color: #d97706; }
.summary-item--closed   .summary-item__value { color: #16a34a; }

.summary-item__label {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
}

.list-surface {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-top: 2px solid #00afdb;
  background: #fff;
}

.data-table :deep(.q-table__top) {
  padding: 0 20px;
  border-bottom: 1px solid #e5e7eb;
  min-height: 46px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: 46px;
}

.toolbar__search-icon {
  color: #9ca3af;
  flex-shrink: 0;
}

.toolbar__search {
  flex: 1;
  min-width: 180px;
}

.toolbar__sep {
  width: 1px;
  height: 18px;
  background: #e5e7eb;
  margin: 0 8px;
  flex-shrink: 0;
}

.toolbar__select {
  min-width: 150px;
}

.toolbar__reset {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
  padding: 3px 8px;
  border: none;
  border-radius: 3px;
  background: none;
  color: #9ca3af;
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
}

.toolbar__reset:hover {
  background: #f3f4f6;
  color: #374151;
}

.toolbar :deep(.q-field__control) {
  background: transparent;
}

.toolbar :deep(.q-field__native),
.toolbar :deep(.q-field__input) {
  color: #111827;
  font-size: 0.8125rem;
}

.toolbar :deep(.q-field__append) {
  color: #9ca3af;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 18px;
  padding: 10px 12px;
  border-left: 3px solid #c50f1f;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.8125rem;
}

.data-table {
  border-radius: 0;
}

.data-table :deep(.q-table__middle) {
  overflow: hidden;
}

.data-table :deep(.q-table) {
  border-collapse: separate;
  border-spacing: 0;
}

.data-table :deep(thead tr) {
  background: #fff;
}

.data-table :deep(thead th) {
  height: 44px;
  padding: 0 20px;
  border-bottom: 1px solid #d1d5db;
  color: #4b5563;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
}

.data-table :deep(thead th.sortable:hover) {
  color: #111827;
}

.data-table :deep(tbody tr) {
  cursor: pointer;
  transition: background 0.12s;
}

.data-table :deep(tbody tr:hover) {
  background: #f9fafb;
}

.data-table :deep(tbody tr:hover td:first-child) {
  box-shadow: inset 3px 0 0 #00afdb;
}

.data-table :deep(tbody td) {
  height: 52px;
  padding: 8px 20px;
  border-bottom: 1px solid #f3f4f6;
  color: #111827;
  font-size: 0.8125rem;
  vertical-align: middle;
}

.data-table :deep(tbody tr:last-child td) {
  border-bottom: none;
}

.data-table :deep(.q-table__bottom) {
  min-height: 46px;
  padding: 8px 20px;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.75rem;
}

.cell-number {
  min-width: 160px;
}

.request-cell__number {
  color: #00afdb;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.005em;
}

.cell-num {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.cell-num__inner {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-muted {
  color: #4b5563 !important;
}

.cell-chevron {
  width: 38px;
  color: transparent;
  transition: color 0.12s, transform 0.12s;
}

.data-table :deep(tbody tr:hover) .cell-chevron {
  color: #00afdb;
  transform: translateX(2px);
}

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
}

.status--sent     { color: #1d4ed8; background: #dbeafe; }
.status--review   { color: #92400e; background: #fef3c7; }
.status--returned { color: #9a3412; background: #ffedd5; }
.status--rejected { color: #991b1b; background: #fee2e2; }
.status--approved { color: #1b2d59; background: #e0e7f5; }
.status--ordered  { color: #0e7490; background: #cffafe; }
.status--closed   { color: #166534; background: #dcfce7; }
.status--default  { color: #374151; background: #f3f4f6; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 72px 24px;
  text-align: center;
}

.empty-state__icon {
  display: flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  color: #9ca3af;
}

.empty-state__title {
  margin: 0 0 6px;
  color: #111827;
  font-size: 1rem;
  font-weight: 600;
}

.empty-state__hint {
  max-width: 340px;
  margin: 0 0 18px;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

@media (max-width: 760px) {
  .page {
    padding: 24px 16px 24px;
  }

  .page-header {
    gap: 16px;
  }

  .page-header,
  .page-header__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header__title {
    font-size: 1.8rem;
  }

  .summary-strip--4col {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-strip--2col {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar {
    flex-wrap: wrap;
    padding: 8px 0;
    min-height: unset;
    gap: 8px;
  }

  .toolbar__search {
    width: 100%;
    flex: none;
  }

  .toolbar__sep {
    display: none;
  }

  .toolbar__select {
    flex: 1;
    min-width: 130px;
  }

  .data-table :deep(thead th),
  .data-table :deep(tbody td) {
    padding-right: 12px;
    padding-left: 12px;
  }
}
</style>
