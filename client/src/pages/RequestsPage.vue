<template>
  <q-page class="page">
    <div class="page-shell">

      <header class="page-header">
        <div class="page-header__main">
          <div class="page-header__eyebrow">Nabava</div>
          <h1 class="page-header__title">Zahtjevi</h1>
          <p class="page-header__subtitle">
            Pregled, pretraživanje i praćenje statusa zahtjeva za nabavu.
          </p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--cta" @click="$router.push('/requests/new')">
            <q-icon name="add" size="20px" />
            <span>Novi zahtjev</span>
          </button>
        </div>
      </header>

      <section class="summary-strip" aria-label="Sažetak zahtjeva">
        <div class="summary-item summary-item--total">
          <div class="summary-item__icon">
            <q-icon name="folder_open" size="15px" />
          </div>
          <span class="summary-item__value">{{ rows.length }}</span>
          <span class="summary-item__label">Ukupno zahtjeva</span>
        </div>
        <div class="summary-item summary-item--active">
          <div class="summary-item__icon">
            <q-icon name="autorenew" size="15px" />
          </div>
          <span class="summary-item__value">{{ activeCount }}</span>
          <span class="summary-item__label">Aktivni</span>
        </div>
        <div class="summary-item summary-item--attention">
          <div class="summary-item__icon">
            <q-icon :name="isAdmin ? 'inbox' : 'undo'" size="15px" />
          </div>
          <span class="summary-item__value">{{ attentionCount }}</span>
          <span class="summary-item__label">{{ isAdmin ? 'Čeka pregled' : 'Vraćeno' }}</span>
        </div>
        <div class="summary-item summary-item--closed">
          <div class="summary-item__icon">
            <q-icon name="task_alt" size="15px" />
          </div>
          <span class="summary-item__value">{{ closedCount }}</span>
          <span class="summary-item__label">Zatvoreno</span>
        </div>
      </section>

      <section class="list-surface">

        <div v-if="errorMessage" class="error-banner">
          <q-icon name="error_outline" size="16px" />
          <span>{{ errorMessage }}</span>
        </div>

        <q-table
          :rows="filteredRows"
          :columns="columns"
          row-key="id_purchase_request"
          :loading="loading"
          flat
          :pagination="{ rowsPerPage: 15, sortBy: 'created_at', descending: true }"
          :rows-per-page-options="[10, 15, 30, 50, 0]"
          rows-per-page-label="Redaka po stranici"
          class="data-table"
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
                v-if="isAdmin && departmentOptions.length > 1"
                v-model="departmentFilter"
                :options="departmentOptions"
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
              {{ formatCurrency(props.row.total_amount) }}
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
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import { getStoredUser } from 'src/utils/authStorage';

const router = useRouter();
const $q = useQuasar();

const loading = ref(false);
const rows = ref([]);
const errorMessage = ref('');

// Filteri
const searchQuery = ref('');
const statusFilter = ref('all');
const departmentFilter = ref('all');
const userFilter = ref('all');

const statusOptions = [
  { label: 'Svi statusi', value: 'all' },
  { label: 'Poslano', value: 'Poslano' },
  { label: 'Na odobrenju', value: 'Na odobrenju' },
  { label: 'Vraćeno na dopunu', value: 'Vraćeno na dopunu / izmjenu' },
  { label: 'Naručeno', value: 'Naručeno' },
  { label: 'Zatvoreno', value: 'Zatvoreno' },
  { label: 'Odbijeno', value: 'Odbijeno' },
];

// Lista jedinstvenih odjela iz podataka
const departmentOptions = computed(() => {
  const set = new Set(rows.value.map(r => r.department_name).filter(Boolean));
  return [
    { label: 'Svi odjeli', value: 'all' },
    ...[...set].sort().map(name => ({ label: name, value: name })),
  ];
});

// Lista jedinstvenih podnositelja iz podataka (samo admin)
const userOptions = computed(() => {
  const set = new Set(rows.value.map(r => r.created_by).filter(Boolean));
  return [
    { label: 'Svi podnositelji', value: 'all' },
    ...[...set].sort().map(name => ({ label: name, value: name })),
  ];
});

const hasActiveFilters = computed(() =>
  searchQuery.value
  || statusFilter.value !== 'all'
  || departmentFilter.value !== 'all'
  || userFilter.value !== 'all'
);

const filteredRows = computed(() => {
  let result = rows.value;

  // Status
  if (statusFilter.value !== 'all') {
    result = result.filter(r => normalizeStatus(r.status_name) === normalizeStatus(statusFilter.value));
  }

  // Odjel
  if (departmentFilter.value !== 'all') {
    result = result.filter(r => r.department_name === departmentFilter.value);
  }

  // Podnositelj (samo admin)
  if (userFilter.value !== 'all') {
    result = result.filter(r => r.created_by === userFilter.value);
  }

  // Search (case-insensitive, više polja)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(r =>
      (r.request_number || '').toLowerCase().includes(q)
      || (r.created_by || '').toLowerCase().includes(q)
      || (r.department_name || '').toLowerCase().includes(q)
    );
  }

  return result;
});

const activeStatuses = ['Poslano', 'Na odobrenju', 'Vraćeno na dopunu/izmjenu', 'Naručeno'];

const activeCount = computed(() =>
  rows.value.filter((r) => activeStatuses.includes(normalizeStatus(r.status_name))).length
);

const closedCount = computed(() =>
  rows.value.filter((r) => normalizeStatus(r.status_name) === 'Zatvoreno').length
);

const attentionCount = computed(() => {
  const status = isAdmin.value ? 'Poslano' : 'Vraćeno na dopunu/izmjenu';
  return rows.value.filter((r) => normalizeStatus(r.status_name) === status).length;
});

const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = 'all';
  departmentFilter.value = 'all';
  userFilter.value = 'all';
};

const currentUser = ref(null);
const isAdmin = ref(false);

const columns = [
  { name: 'request_number', label: 'Broj zahtjeva', field: 'request_number', align: 'left', sortable: true, style: 'min-width: 160px' },
  { name: 'department_name',label: 'Odjel',         field: 'department_name',align: 'left', sortable: true, style: 'min-width: 160px' },
  { name: 'status_name',    label: 'Status',        field: 'status_name',    align: 'left', sortable: true, style: 'min-width: 140px' },
  { name: 'created_by',     label: 'Podnositelj',   field: 'created_by',     align: 'left', style: 'min-width: 140px' },
  { name: 'total_amount',   label: 'Iznos',         field: 'total_amount',   align: 'left',  sortable: true, style: 'min-width: 100px', sort: (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0) },
  { name: 'created_at',     label: 'Datum',         field: 'created_at',     align: 'left', sortable: true, style: 'min-width: 110px' },
  { name: 'actions',        label: '',              field: 'actions',        align: 'right', style: 'width: 38px' },
];

const fetchRequests = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.get('/requests');
    rows.value = Array.isArray(response.data) ? response.data : [];

    notifyActionable();
  } catch (error) {
    console.error('Greška:', error);
    errorMessage.value = error.response?.data?.message || 'Zahtjevi se trenutno ne mogu dohvatiti.';
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * Notifikacije ovisno o roli i statusu zahtjeva.
 * Statusi sada usklađeni s novim workflow-om (Poslano, Naručeno).
 */
const notifyActionable = () => {
  if (isAdmin.value) {
    // Admin: Poslano = treba ga preuzeti na obradu
    const cekaju = rows.value.filter(r => r.status_name === 'Poslano');

    if (cekaju.length === 1) {
      $q.notify({
        color: 'dark',
        icon: 'inbox',
        message: `Zahtjev ${cekaju[0].request_number} čeka pregled.`,
        timeout: 7000,
        actions: [
          {
            label: 'Otvori',
            color: 'white',
            handler: () => router.push(`/requests/${cekaju[0].id_purchase_request}`),
          },
        ],
      });
    } else if (cekaju.length > 1) {
      $q.notify({
        color: 'dark',
        icon: 'inbox',
        message: `${cekaju.length} zahtjeva čeka pregled.`,
        timeout: 7000,
      });
    }
  } else {
    // Zaposlenik: Vraćeno = treba ispraviti i ponovno poslati
    const vraceni = rows.value.filter(
      r => normalizeStatus(r.status_name) === 'Vraćeno na dopunu/izmjenu'
    );
    vraceni.forEach(r => {
      $q.notify({
        color: 'orange-9',
        icon: 'undo',
        message: `Zahtjev ${r.request_number} je vraćen na izmjenu.`,
        caption: 'Provjerite komentar administratora i pošaljite ispravku.',
        timeout: 7000,
        actions: [
          {
            label: 'Otvori',
            color: 'white',
            handler: () => router.push(`/requests/${r.id_purchase_request}`),
          },
        ],
      });
    });
  }
};

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


/**
 * Mapiranje status name → CSS klasa.
 * Status nazivi moraju odgovarati onome što backend vraća iz STATUS_LABELS.
 */
const normalizeStatus = (status) =>
  (status || '').replace(/\s*\/\s*/g, '/').trim();

const statusClass = (status) => {
  switch (normalizeStatus(status).toLowerCase()) {
    case 'poslano':                     return 'status--sent';
    case 'na odobrenju':                return 'status--review';
    case 'vraćeno na dopunu/izmjenu':   return 'status--returned';
    case 'odbijeno':                    return 'status--rejected';
    case 'naručeno':                    return 'status--ordered';
    case 'odobreno':                    return 'status--ordered';
    case 'zatvoreno':                   return 'status--closed';
    default:                            return 'status--default';
  }
};

onMounted(() => {
  currentUser.value = getStoredUser();
  isAdmin.value = currentUser.value?.role_name === 'Administrator';
  // Default: prvi item u listi je 'all', ostavi tako
  statusFilter.value = 'all';
  fetchRequests();
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}

.summary-item {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 18px 20px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.summary-item::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
}

.summary-item--total::before    { background: #0067b8; }
.summary-item--active::before   { background: #059669; }
.summary-item--attention::before { background: #d97706; }
.summary-item--closed::before   { background: #9ca3af; }

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

.summary-item--total    .summary-item__icon { background: #eff6ff; color: #0067b8; }
.summary-item--active   .summary-item__icon { background: #f0fdf4; color: #059669; }
.summary-item--attention .summary-item__icon { background: #fff7ed; color: #d97706; }
.summary-item--closed   .summary-item__icon { background: #f9fafb; color: #9ca3af; }

.summary-item__value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
  color: #111827;
}

.summary-item--active   .summary-item__value { color: #059669; }
.summary-item--attention .summary-item__value { color: #d97706; }
.summary-item--closed   .summary-item__value { color: #9ca3af; }

.summary-item__label {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
}

.list-surface {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-top: 2px solid #0067b8;
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
  box-shadow: inset 3px 0 0 #0067b8;
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
  color: #0067b8;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.005em;
}

.cell-num {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
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
  color: #0067b8;
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
.status--ordered  { color: #065f46; background: #d1fae5; }
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
    padding: 24px 16px 56px;
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

  .summary-strip {
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
