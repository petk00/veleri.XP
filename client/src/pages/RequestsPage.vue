<template>
  <q-page class="page">
    <div class="page-shell">

      <section class="action-cards" aria-label="Brzi pregled">
        <button class="action-card action-card--pending" @click="setStatusFilter('u_obradi')">
          <div class="action-card__icon"><q-icon name="pending_actions" size="18px" /></div>
          <span class="action-card__value">{{ counts.u_obradi }}</span>
          <span class="action-card__label">U obradi</span>
          <q-icon name="chevron_right" size="14px" class="action-card__arrow" />
        </button>
        <button class="action-card action-card--ordered" @click="setStatusFilter('Naručeno')">
          <div class="action-card__icon"><q-icon name="local_shipping" size="18px" /></div>
          <span class="action-card__value">{{ counts.naruceno }}</span>
          <span class="action-card__label">Naručeno / u tijeku</span>
          <q-icon name="chevron_right" size="14px" class="action-card__arrow" />
        </button>
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

              <!-- Status -->
              <q-select
                v-model="statusFilter"
                :options="statusOptions"
                borderless dense
                emit-value map-options
                class="toolbar__select"
              />

              <!-- Odjel -->
              <q-select
                v-if="isAdmin && departmentOptions.length > 1"
                v-model="departmentFilter"
                :options="departmentOptions"
                borderless dense
                emit-value map-options
                class="toolbar__select"
              />

              <!-- Podnositelj -->
              <q-select
                v-if="isAdmin && userOptions.length > 1"
                v-model="userFilter"
                :options="userOptions"
                borderless dense
                emit-value map-options
                class="toolbar__select"
              />

              <!-- Kategorija -->
              <q-select
                v-if="categoryOptions.length > 1"
                v-model="categoryFilter"
                :options="categoryOptions"
                borderless dense
                emit-value map-options
                class="toolbar__select"
              />

              <!-- Godina -->
              <q-select
                v-if="fiscalYearOptions.length > 1"
                v-model="fiscalYearFilter"
                :options="fiscalYearOptions"
                borderless dense
                emit-value map-options
                class="toolbar__select"
              />

              <button class="toolbar__show-all" @click="showAll">Prikaži sve</button>

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
              <span class="status-pill" :style="buildRequestStyle(props.row).badge">
                <q-icon :name="statusIcon(props.row)" size="11px" class="pill-icon" />
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
                <q-icon name="filter_list_off" size="28px" />
              </div>
              <h3 class="empty-state__title">Nema zahtjeva za odabrane filtere</h3>
              <p class="empty-state__hint">
                Pokušajte promijeniti kriterije pretrage ili prikažite sve zahtjeve.
              </p>
              <button class="btn btn--primary" @click="showAll">
                <q-icon name="list" size="16px" />
                <span>Prikaži sve zahtjeve</span>
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
const statusFilter     = ref('u_obradi');
const sortOrder        = ref('ASC');
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
  { label: 'U obradi',          value: 'u_obradi' },
  { label: 'Poslano',           value: 'Poslano' },
  { label: 'Na odobrenju',      value: 'Na odobrenju' },
  { label: 'Zahtjeva izmjene',  value: 'Zahtjeva izmjene' },
  { label: 'Naručeno',          value: 'Naručeno' },
  { label: 'Zatvoreno',         value: 'Zatvoreno' },
  { label: 'Odbijeno',          value: 'Odbijeno' },
];

const departmentOptions  = ref([{ label: 'Svi odjeli', value: 'all' }]);
const userOptions        = ref([{ label: 'Svi podnositelji', value: 'all' }]);
const fiscalYearOptions  = ref([{ label: 'Sve godine', value: 'all' }]);
const categoryOptions    = ref([{ label: 'Svi predmeti', value: 'all' }]);

const STATUS = {
  POSLANO:           1,
  NA_ODOBRENJU:      2,
  VRACENO_NA_DOPUNU: 3,
  ODOBRENO:          4,
  ODBIJENO:          5,
  NARUCENO:          6,
  ZATVORENO:         7,
};

const STATUS_STYLES = {
  [STATUS.POSLANO]:           { background: '#eff6ff', badge: '#1d4ed8', badgeBg: '#dbeafe', border: '#93c5fd' },
  [STATUS.NA_ODOBRENJU]:      { background: '#fffbeb', badge: '#b45309', badgeBg: '#fef3c7', border: '#fcd34d' },
  [STATUS.VRACENO_NA_DOPUNU]: { background: '#fff7ed', badge: '#c2410c', badgeBg: '#ffedd5', border: '#fdba74' },
  [STATUS.ODBIJENO]:          { background: '#fef2f2', badge: '#b91c1c', badgeBg: '#fee2e2', border: '#fca5a5' },
  [STATUS.ODOBRENO]:          { background: '#f0fdf4', badge: '#15803d', badgeBg: '#dcfce7', border: '#86efac' },
  [STATUS.NARUCENO]:          { background: '#faf5ff', badge: '#7c3aed', badgeBg: '#ede9fe', border: '#c4b5fd' },
  [STATUS.ZATVORENO]:         { background: '#dcfce7', badge: '#166534', badgeBg: '#bbf7d0', border: '#4ade80' },
};

const STATUS_ICONS = {
  [STATUS.POSLANO]:           'send',
  [STATUS.NA_ODOBRENJU]:      'manage_accounts',
  [STATUS.VRACENO_NA_DOPUNU]: 'assignment_return',
  [STATUS.ODOBRENO]:          'verified',
  [STATUS.ODBIJENO]:          'cancel',
  [STATUS.NARUCENO]:          'local_shipping',
  [STATUS.ZATVORENO]:         'task_alt',
};

const DEFAULT_STYLE = { background: '#f9fafb', badge: '#374151', badgeBg: '#f3f4f6', border: '#d1d5db' };

const buildRequestStyle = (row) => {
  const s = STATUS_STYLES[row.fk_request_status] ?? DEFAULT_STYLE;
  return {
    card:  { background: s.background, borderLeftColor: s.border },
    badge: { color: s.badge, background: s.badgeBg },
  };
};

const statusIcon = (row) => STATUS_ICONS[row.fk_request_status] ?? 'circle';

const DEFAULT_STATUS = 'u_obradi';

const hasActiveFilters = computed(() =>
  searchQuery.value
  || statusFilter.value !== DEFAULT_STATUS
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
      order: sortOrder.value,
    };
    if (searchQuery.value)                             params.search     = searchQuery.value;
    if (statusFilter.value !== 'all')                  params.status     = statusFilter.value;
    if (departmentFilter.value !== 'all')              params.department = departmentFilter.value;
    if (isAdmin.value && userFilter.value !== 'all')   params.user       = userFilter.value;
    if (fiscalYearFilter.value !== 'all')              params.fiscalYear = fiscalYearFilter.value;
    if (categoryFilter.value !== 'all')                params.category   = categoryFilter.value;

    const { data } = await api.get('/requests', { params });
    rows.value                  = Array.isArray(data.data) ? data.data : [];
    pagination.value.rowsNumber = data.total || 0;
    counts.value                = data.counts || { total: 0, active: 0, attention: 0, closed: 0 };
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
  statusFilter.value     = DEFAULT_STATUS;
  departmentFilter.value = 'all';
  userFilter.value       = 'all';
  fiscalYearFilter.value = 'all';
  categoryFilter.value   = 'all';
  sortOrder.value        = 'ASC';
  pagination.value.page  = 1;
};

const showAll = () => {
  searchQuery.value      = '';
  statusFilter.value     = 'all';
  departmentFilter.value = 'all';
  userFilter.value       = 'all';
  fiscalYearFilter.value = 'all';
  categoryFilter.value   = 'all';
  sortOrder.value        = 'DESC';
  pagination.value.page  = 1;
};

const setStatusFilter = (status) => {
  statusFilter.value    = status;
  pagination.value.page = 1;
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

const openRequest = (id) => router.push(`/zahtjevi/${id}`);

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

onMounted(async () => {
  currentUser.value = getStoredUser();
  isAdmin.value     = currentUser.value?.role_name === 'Administrator';
  await Promise.all([fetchRequests(), fetchMeta()]);
});
</script>

<style scoped>
.page {
  padding: 32px 40px;
  background: transparent;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.page-shell {
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Action cards ── */
.action-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.action-card {
  all: unset;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 16px;
  border: 1.5px solid transparent;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.15s;
}

.action-card__icon {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.action-card__value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.action-card__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #6b7280;
  flex: 1;
}

.action-card__arrow {
  color: #d1d5db;
  flex-shrink: 0;
  transition: transform 0.15s, color 0.15s;
}

.action-card--pending {
  background: #fffbeb;
  border-color: #fcd34d;
}
.action-card--pending .action-card__icon { background: #fef3c7; color: #b45309; }
.action-card--pending .action-card__value { color: #b45309; }
.action-card--pending:hover { background: #fef3c7; border-color: #f59e0b; }
.action-card--pending:hover .action-card__arrow { color: #b45309; transform: translateX(3px); }

.action-card--ordered {
  background: #faf5ff;
  border-color: #c4b5fd;
}
.action-card--ordered .action-card__icon { background: #ede9fe; color: #7c3aed; }
.action-card--ordered .action-card__value { color: #7c3aed; }
.action-card--ordered:hover { background: #ede9fe; border-color: #a78bfa; }
.action-card--ordered:hover .action-card__arrow { color: #7c3aed; transform: translateX(3px); }

/* ── List surface (card) ── */
.list-surface {
  overflow: hidden;
  background: #ffffff;
  border: 1.5px solid rgba(0, 175, 219, 0.18);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 175, 219, 0.07);
}

/* ── Error banner ── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 18px;
  padding: 10px 12px;
  border-left: 3px solid #c50f1f;
  border-radius: 6px;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.8125rem;
}

/* ── Toolbar ── */
.data-table :deep(.q-table__top) {
  padding: 0 20px;
  border-bottom: 1px solid rgba(0, 175, 219, 0.12);
  min-height: 52px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: 52px;
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

.toolbar__show-all {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  padding: 3px 10px;
  border: 1px solid rgba(0, 175, 219, 0.3);
  border-radius: 20px;
  background: transparent;
  color: #0e7490;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
}

.toolbar__show-all:hover {
  background: rgba(0, 175, 219, 0.08);
  border-color: #00afdb;
}

.toolbar__reset {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
  padding: 3px 10px;
  border: none;
  border-radius: 20px;
  background: #f3f4f6;
  color: #6b7280;
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.toolbar__reset:hover {
  background: #e5e7eb;
  color: #374151;
}

.toolbar :deep(.q-field__control) { background: transparent; }
.toolbar :deep(.q-field__native),
.toolbar :deep(.q-field__input) { color: #111827; font-size: 0.8125rem; }
.toolbar :deep(.q-field__append) { color: #9ca3af; }

/* ── Table ── */
.data-table { border-radius: 0; }

.data-table :deep(.q-table__middle) { overflow: hidden; }

.data-table :deep(.q-table) {
  border-collapse: separate;
  border-spacing: 0;
}

.data-table :deep(thead tr) { background: #fafeff; }

.data-table :deep(thead th) {
  height: 44px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(0, 175, 219, 0.12);
  color: #6b7280;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
}

.data-table :deep(tbody tr) {
  cursor: pointer;
  transition: background 0.12s;
}

.data-table :deep(tbody tr:hover) { background: #f0fbfe; }

.data-table :deep(tbody tr:hover td:first-child) {
  box-shadow: inset 3px 0 0 #00afdb;
}

.data-table :deep(tbody td) {
  height: 56px;
  padding: 8px 20px;
  border-bottom: 1px solid #f3f4f6;
  color: #111827;
  font-size: 0.8125rem;
  vertical-align: middle;
}

.data-table :deep(tbody tr:last-child td) { border-bottom: none; }

.data-table :deep(.q-table__bottom) {
  min-height: 46px;
  padding: 8px 20px;
  border-top: 1px solid rgba(0, 175, 219, 0.1);
  color: #6b7280;
  font-size: 0.75rem;
}

/* ── Cells ── */
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

.cell-muted { color: #4b5563 !important; }

.cell-chevron {
  width: 38px;
  color: transparent;
  transition: color 0.12s, transform 0.12s;
}

.data-table :deep(tbody tr:hover) .cell-chevron {
  color: #00afdb;
  transform: translateX(2px);
}

/* ── Status pill ── */
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 160px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.pill-icon {
  opacity: 0.85;
  flex-shrink: 0;
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-state__icon {
  display: flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border-radius: 12px;
  border: 1.5px solid rgba(0, 175, 219, 0.2);
  background: rgba(0, 175, 219, 0.05);
  color: #00afdb;
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

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 38px;
  padding: 0 18px;
  border: 1.5px solid transparent;
  border-radius: 12px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.btn--primary {
  background: rgba(0, 175, 219, 0.1);
  color: #0e7490;
  border-color: rgba(0, 175, 219, 0.45);
}

.btn--primary:hover {
  background: rgba(0, 175, 219, 0.18);
  border-color: #00afdb;
  box-shadow: 0 0 0 3px rgba(0, 175, 219, 0.1);
}

/* ── Responsive ── */
@media (max-width: 760px) {
  .page { padding: 24px 16px; }

  .action-cards { grid-template-columns: 1fr; }

  .toolbar {
    flex-wrap: wrap;
    padding: 8px 0;
    min-height: unset;
    gap: 8px;
  }

  .toolbar__search { width: 100%; flex: none; }
  .toolbar__sep { display: none; }
  .toolbar__select { flex: 1; min-width: 130px; }

  .data-table :deep(thead th),
  .data-table :deep(tbody td) {
    padding-right: 12px;
    padding-left: 12px;
  }
}
</style>
