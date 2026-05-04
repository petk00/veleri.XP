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
          <button class="btn btn--primary" @click="$router.push('/requests/new')">
            <q-icon name="add" size="18px" />
            <span>Novi zahtjev</span>
          </button>
        </div>
      </header>

      <section class="summary-strip" aria-label="Sažetak zahtjeva">
        <div class="summary-item">
          <span class="summary-item__label">Ukupno</span>
          <span class="summary-item__value">{{ rows.length }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">Aktivni</span>
          <span class="summary-item__value">{{ activeCount }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">{{ isAdmin ? 'Čeka pregled' : 'Vraćeno' }}</span>
          <span class="summary-item__value">{{ attentionCount }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">Zatvoreno</span>
          <span class="summary-item__value">{{ closedCount }}</span>
        </div>
      </section>

      <section class="list-surface">

        <div class="surface-header">
          <h2 class="surface-title">
            <q-icon name="list_alt" size="16px" />
            <span>Pregled zahtjeva</span>
          </h2>
          <span class="surface-count" v-if="!loading">{{ filteredRows.length }} prikazano</span>
        </div>

        <div class="filter-bar">
          <q-input
            v-model="searchQuery"
            outlined dense clearable
            placeholder="Pretraži po broju, podnositelju ili odjelu..."
            class="filter-bar__search"
          >
            <template #prepend><q-icon name="search" size="16px" /></template>
          </q-input>

          <q-select
            v-model="statusFilter"
            :options="statusOptions"
            outlined dense
            emit-value map-options
            class="filter-bar__select"
          >
            <template #prepend><q-icon name="filter_list" size="16px" /></template>
          </q-select>

          <q-select
            v-if="isAdmin && departmentOptions.length > 1"
            v-model="departmentFilter"
            :options="departmentOptions"
            outlined dense
            emit-value map-options
            class="filter-bar__select"
          >
            <template #prepend><q-icon name="business" size="16px" /></template>
          </q-select>

          <button
            v-if="hasActiveFilters"
            class="btn btn--ghost"
            @click="resetFilters"
          >
            <q-icon name="close" size="14px" />
            <span>Poništi</span>
          </button>

          <span class="filter-bar__count">
            {{ filteredRows.length }} / {{ rows.length }}
          </span>
        </div>

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
          :pagination="{ rowsPerPage: 15 }"
          :rows-per-page-options="[10, 15, 30, 50, 0]"
          rows-per-page-label="Redaka po stranici"
          class="data-table"
          @row-click="(_, row) => openRequest(row.id_purchase_request)"
        >
          <!-- Cell: request number -->
          <template #body-cell-request_number="props">
            <q-td :props="props" class="cell-number">
              <div class="request-cell">
                <div class="request-cell__number">{{ props.row.request_number }}</div>
                <div class="request-cell__meta">Zahtjev za nabavu</div>
              </div>
            </q-td>
          </template>

          <!-- Cell: fiscal year -->
          <template #body-cell-fiscal_year="props">
            <q-td :props="props">
              <span class="year-chip">{{ props.row.fiscal_year }}</span>
            </q-td>
          </template>

          <!-- Cell: department -->
          <template #body-cell-department_name="props">
            <q-td :props="props">
              <div class="department-cell">
                <span class="department-cell__icon">
                  <q-icon name="business" size="14px" />
                </span>
                <span>{{ props.row.department_name }}</span>
              </div>
            </q-td>
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
            <q-td :props="props" class="text-right cell-num">
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
            <q-td :props="props" class="cell-muted">
              <div class="person-cell">
                <span class="person-cell__avatar">{{ initialsFor(props.row.created_by) }}</span>
                <span>{{ props.row.created_by }}</span>
              </div>
            </q-td>
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

const hasActiveFilters = computed(() =>
  searchQuery.value
  || statusFilter.value !== 'all'
  || departmentFilter.value !== 'all'
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
};

const currentUser = ref(null);
const isAdmin = ref(false);

const columns = [
  { name: 'request_number', label: 'Broj zahtjeva', field: 'request_number', align: 'left', sortable: true },
  { name: 'fiscal_year',    label: 'Godina',        field: 'fiscal_year',    align: 'left' },
  { name: 'department_name',label: 'Odjel',         field: 'department_name',align: 'left', sortable: true },
  { name: 'status_name',    label: 'Status',        field: 'status_name',    align: 'left', sortable: true },
  { name: 'created_by',     label: 'Podnositelj',   field: 'created_by',     align: 'left' },
  { name: 'total_amount',   label: 'Iznos',         field: 'total_amount',   align: 'right', sortable: true },
  { name: 'created_at',     label: 'Datum',         field: 'created_at',     align: 'left', sortable: true },
  { name: 'actions',        label: '',              field: 'actions',        align: 'right' },
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

const initialsFor = (value) => {
  if (!value) return '?';
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
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
  gap: 0;
  margin-bottom: 28px;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.summary-item {
  display: flex;
  min-height: 76px;
  flex-direction: column;
  justify-content: center;
  padding: 14px 22px;
  border-right: 1px solid #e5e7eb;
}

.summary-item:first-child {
  padding-left: 0;
}

.summary-item:last-child {
  border-right: 0;
}

.summary-item__label {
  color: #6b7280;
  font-size: 0.75rem;
}

.summary-item__value {
  margin-top: 2px;
  color: #111827;
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.list-surface {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.surface-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid #e5e7eb;
}

.surface-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #111827;
  font-size: 0.9375rem;
  font-weight: 600;
}

.surface-title .q-icon {
  color: #0067b8;
}

.surface-count {
  color: #6b7280;
  font-size: 0.75rem;
  white-space: nowrap;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  flex-wrap: wrap;
}

.filter-bar__search {
  flex: 1;
  min-width: 260px;
  max-width: 460px;
}

.filter-bar__select {
  flex: 0 0 210px;
  min-width: 170px;
}

.filter-bar :deep(.q-field__control) {
  height: 34px;
  border-radius: 0;
  background: #fff;
}

.filter-bar :deep(.q-field--outlined .q-field__control::before) {
  border-color: #d1d5db;
}

.filter-bar :deep(.q-field--outlined.q-field--focused .q-field__control::after) {
  border-color: #0067b8;
  border-width: 1px;
}

.filter-bar :deep(.q-field__native),
.filter-bar :deep(.q-field__input) {
  min-height: 34px;
  color: #111827;
  font-size: 0.8125rem;
}

.filter-bar :deep(.q-field__prepend),
.filter-bar :deep(.q-field__append) {
  height: 34px;
  color: #6b7280;
}

.filter-bar__count {
  margin-left: auto;
  color: #6b7280;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
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
  height: 58px;
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
  min-width: 178px;
}

.request-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.request-cell__number {
  color: #0067b8;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.005em;
}

.request-cell__meta {
  color: #6b7280;
  font-size: 0.6875rem;
}

.year-chip {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  background: #fafafa;
  color: #374151;
  font-size: 0.75rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.department-cell {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: #111827;
}

.department-cell__icon {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #0067b8;
}

.cell-num {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.cell-muted {
  color: #4b5563 !important;
}

.person-cell {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.person-cell__avatar {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid #d1d5db;
  border-radius: 50%;
  color: #4b5563;
  font-size: 0.625rem;
  font-weight: 600;
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
  gap: 6px;
  min-height: 22px;
  padding: 0;
  color: #4b5563;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
}

.status::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.status--sent     { color: #2563eb; }
.status--review   { color: #b7791f; }
.status--returned { color: #c2410c; }
.status--rejected { color: #c50f1f; }
.status--ordered  { color: #0078d4; }
.status--closed   { color: #107c10; }
.status--default  { color: #6b7280; }

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

  .summary-item {
    border-bottom: 1px solid #e5e7eb;
  }

  .summary-item:nth-child(2n) {
    border-right: 0;
  }

  .summary-item:nth-last-child(-n + 2) {
    border-bottom: 0;
  }

  .summary-item:first-child {
    padding-left: 22px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar__search,
  .filter-bar__select {
    width: 100%;
    max-width: none;
    flex: none;
  }

  .filter-bar__count {
    margin-left: 0;
    text-align: center;
  }

  .data-table :deep(thead th),
  .data-table :deep(tbody td) {
    padding-right: 12px;
    padding-left: 12px;
  }
}
</style>
