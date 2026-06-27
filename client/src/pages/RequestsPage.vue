<template>
  <q-page class="page">
    <div class="page-shell">

      <section class="action-cards" :class="{ 'action-cards--admin': isAdmin }" aria-label="Brzi pregled">
        <button class="action-card action-card--pending" @click="setStatusFilter('u_obradi')">
          <div class="action-card__icon"><q-icon name="pending_actions" size="18px" /></div>
          <span class="action-card__value">{{ counts.u_obradi }}</span>
          <span class="action-card__label">U obradi</span>
          <q-icon name="chevron_right" size="14px" class="action-card__arrow" />
        </button>
        <button class="action-card action-card--ordered" @click="setStatusFilter('ceka_otpremnicu')">
          <div class="action-card__icon"><q-icon name="inbox" size="18px" /></div>
          <span class="action-card__value">{{ counts.ceka_otpremnicu }}</span>
          <span class="action-card__label">Čekaju otpremnicu</span>
          <q-icon name="chevron_right" size="14px" class="action-card__arrow" />
        </button>
        <button v-if="isAdmin" class="action-card action-card--ready" @click="setStatusFilter('spremno_za_zatvaranje')">
          <div class="action-card__icon"><q-icon name="task_alt" size="18px" /></div>
          <span class="action-card__value">{{ counts.spremno_za_zatvaranje }}</span>
          <span class="action-card__label">Spremno za zatvaranje</span>
          <q-icon name="chevron_right" size="14px" class="action-card__arrow" />
        </button>
      </section>

      <!-- Toolbar (izvan kartice, kao na /korisnici) -->
      <div class="req-toolbar">
        <q-icon name="search" size="15px" class="topbar__search-icon" />
        <input
          v-model="searchQuery"
          type="search"
          class="topbar__search"
          placeholder="Pretraži po broju, podnositelju, odjelu ili statusu..."
        />
        <button v-if="hasActiveFilters" class="toolbar__reset" @click="resetFilters">
          <q-icon name="close" size="12px" />
          <span>Poništi</span>
        </button>
      </div>

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

          <!-- Cell: date -->
          <template #body-cell-created_at="props">
            <q-td :props="props" class="cell-muted">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>

          <!-- Cell: last modified -->
          <template #body-cell-updated_at="props">
            <q-td :props="props" class="cell-muted">
              {{ props.row.updated_at ? formatDate(props.row.updated_at) : '—' }}
            </q-td>
          </template>

          <!-- Cell: created_by -->
          <template #body-cell-created_by="props">
            <q-td :props="props" class="cell-muted">{{ props.row.created_by }}</q-td>
          </template>

          <!-- Cell: total_amount -->
          <template #body-cell-total_amount="props">
            <q-td :props="props" class="cell-muted" style="text-align:right">
              {{ formatCurrency(props.row.total_amount) }}
            </q-td>
          </template>

          <!-- Cell: docs -->
          <template #body-cell-docs="props">
            <q-td :props="props" class="cell-docs">
              <q-icon
                name="description"
                size="16px"
                :class="props.row.has_ponuda ? 'doc-icon--ok' : 'doc-icon--missing'"
              >
                <q-tooltip>{{ props.row.has_ponuda ? 'Ponuda priložena' : 'Ponuda nije priložena' }}</q-tooltip>
              </q-icon>
              <q-icon
                name="local_shipping"
                size="16px"
                :class="props.row.has_otpremnica ? 'doc-icon--ok' : 'doc-icon--missing'"
              >
                <q-tooltip>{{ props.row.has_otpremnica ? 'Otpremnica priložena' : 'Otpremnica nije priložena' }}</q-tooltip>
              </q-icon>
            </q-td>
          </template>

          <!-- Cell: justification -->
          <template #body-cell-justification="props">
            <q-td :props="props" class="cell-comment">
              <span v-if="props.row.justification" class="comment-text">{{ props.row.justification }}</span>
              <span v-else class="cell-muted">—</span>
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
const counts       = ref({ total: 0, active: 0, attention: 0, closed: 0, u_obradi: 0, ceka_otpremnicu: 0, spremno_za_zatvaranje: 0 });

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
  rowsPerPage: 25,
  rowsNumber: 0,
  sortBy: 'created_at',
  descending: true,
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

const hasActiveFilters = computed(() =>
  searchQuery.value
  || statusFilter.value !== 'all'
  || departmentFilter.value !== 'all'
  || userFilter.value !== 'all'
  || fiscalYearFilter.value !== 'all'
  || categoryFilter.value !== 'all'
);

const allColumns = [
  { name: 'request_number',  label: 'Broj zahtjeva',  field: 'request_number',  align: 'left',  sortable: true,  style: 'width: 150px' },
  { name: 'status_name',     label: 'Status',          field: 'status_name',     align: 'left',  sortable: true,  style: 'width: 140px' },
  { name: 'department_name', label: 'Odjel',           field: 'department_name', align: 'left',  sortable: true,  style: 'width: 150px' },
  { name: 'total_amount',    label: 'Iznos',           field: 'total_amount',    align: 'right', sortable: true,  style: 'width: 110px' },
  { name: 'justification',   label: 'Napomena',        field: 'justification',   align: 'left',  sortable: false, style: 'min-width: 160px' },
  { name: 'docs',            label: 'Dokumenti',       field: 'docs',            align: 'center', sortable: false, style: 'width: 90px' },
  { name: 'created_by',      label: 'Podnositelj',     field: 'created_by',      align: 'left',  sortable: true,  style: 'width: 140px' },
  { name: 'created_at',      label: 'Datum',           field: 'created_at',      align: 'left',  sortable: true,  style: 'width: 100px' },
  { name: 'updated_at',      label: 'Zadnja promjena', field: 'updated_at',      align: 'left',  sortable: true,  style: 'width: 120px' },
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
      page:   pagination.value.page,
      limit:  pagination.value.rowsPerPage,
      sortBy: pagination.value.sortBy || 'created_at',
      order:  pagination.value.descending ? 'DESC' : 'ASC',
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
  pagination.value.sortBy      = props.pagination.sortBy;
  pagination.value.descending  = props.pagination.descending;
  await fetchRequests();
};

const resetFilters = () => {
  searchQuery.value           = '';
  statusFilter.value          = 'all';
  departmentFilter.value      = 'all';
  userFilter.value            = 'all';
  fiscalYearFilter.value      = 'all';
  categoryFilter.value        = 'all';
  pagination.value.page       = 1;
  pagination.value.sortBy     = 'created_at';
  pagination.value.descending = true;
};

const showAll = () => {
  searchQuery.value           = '';
  statusFilter.value          = 'all';
  departmentFilter.value      = 'all';
  userFilter.value            = 'all';
  fiscalYearFilter.value      = 'all';
  categoryFilter.value        = 'all';
  pagination.value.page       = 1;
  pagination.value.sortBy     = 'created_at';
  pagination.value.descending = true;
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
  width: 100%;
}

/* ── Action cards ── */
.action-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}
.action-cards--admin {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.action-card {
  all: unset;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px 18px 16px;
  border-radius: 14px;
  border-top: 1.5px solid #e5e7eb;
  border-right: 1.5px solid #e5e7eb;
  border-bottom: 1.5px solid #e5e7eb;
  border-left: 4px solid transparent;
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
  border-left-color: #fbbf24;
}
.action-card--pending .action-card__icon { background: #fef3c7; color: #b45309; }
.action-card--pending .action-card__value { color: #b45309; }
.action-card--pending:hover { background: #fef3c7; border-left-color: #f59e0b; }
.action-card--pending:hover .action-card__arrow { color: #b45309; transform: translateX(3px); }

.action-card--ordered {
  background: #f0f9ff;
  border-left-color: #00afdb;
}
.action-card--ordered .action-card__icon { background: #e0f2fe; color: #0284c7; }
.action-card--ordered .action-card__value { color: #0284c7; }
.action-card--ordered:hover { background: #e0f2fe; border-left-color: #0ea5e9; }
.action-card--ordered:hover .action-card__arrow { color: #0284c7; transform: translateX(3px); }

.action-card--ready {
  background: #f0fdf4;
  border-left-color: #4ade80;
}
.action-card--ready .action-card__icon { background: #dcfce7; color: #16a34a; }
.action-card--ready .action-card__value { color: #16a34a; }
.action-card--ready:hover { background: #dcfce7; border-left-color: #22c55e; }
.action-card--ready:hover .action-card__arrow { color: #16a34a; transform: translateX(3px); }

/* ── List surface (card) ── */
.list-surface {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
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

/* ── Toolbar (izvan kartice, kao /korisnici) ── */
.req-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  margin-bottom: 20px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.topbar__search-icon { color: #9ca3af; flex-shrink: 0; }

.topbar__search {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 0.8125rem;
  color: #111827;
  min-width: 0;
}
.topbar__search::placeholder { color: #9ca3af; }
.topbar__search::-webkit-search-cancel-button { cursor: pointer; }

.req-toolbar__sep {
  width: 1px;
  height: 18px;
  background: #e5e7eb;
  margin: 0 4px;
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


/* ── Table ── */
.data-table { border-radius: 0; }

.data-table :deep(.q-table__middle) { overflow: hidden; }

.data-table :deep(.q-table) {
  border-collapse: separate;
  border-spacing: 0;
}

.data-table :deep(thead tr) { background: #f9fafb; }

.data-table :deep(thead th) {
  height: 40px;
  padding: 0 20px;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  color: #9ca3af;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-align: left;
  text-transform: uppercase;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: color 0.1s;
}
.data-table :deep(thead th:hover) { color: #6b7280; }
.data-table :deep(thead th.sorted) { color: #111827; }
.data-table :deep(.q-table__sort-icon) { opacity: 0.4; font-size: 11px; }
.data-table :deep(thead th.sorted .q-table__sort-icon) { opacity: 1; }

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
  border-top: 1px solid #e5e7eb;
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

.cell-docs { display: flex; align-items: center; gap: 6px; }
.doc-icon--ok      { color: #107C10; }
.doc-icon--missing { color: #d1d5db; }

.cell-comment { max-width: 300px; }
.comment-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #4b5563;
  font-size: 0.8125rem;
  line-height: 1.4;
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

/* ── Responsive ── */
@media (max-width: 760px) {
  .page { padding: 20px 16px; }

  .action-cards { grid-template-columns: 1fr; }

  .req-toolbar {
    flex-wrap: wrap;
    padding: 8px 0;
    gap: 8px;
  }

  .topbar__search { width: 100%; flex: none; }
  .req-toolbar__sep { display: none; }
  .toolbar__select { flex: 1; min-width: 130px; }

  .data-table :deep(thead th),
  .data-table :deep(tbody td) {
    padding-right: 12px;
    padding-left: 12px;
  }
}
</style>
