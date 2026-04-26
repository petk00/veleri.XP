<template>
  <q-page class="page">
    <div class="page-shell">

      <!-- ─────────────────────────────────
           Page header
           ───────────────────────────────── -->
      <header class="page-header">
        <div class="page-header__main">
          <h1 class="page-header__title">Zahtjevi za nabavu</h1>
          <p class="page-header__subtitle">
            Pregled svih zahtjeva i njihovih statusa.
          </p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" @click="$router.push('/requests/new')">
            <q-icon name="add" size="18px" />
            <span>Novi zahtjev</span>
          </button>
        </div>
      </header>

      <!-- ─────────────────────────────────
           Table card
           ───────────────────────────────── -->
      <div class="card">

        <div class="card__header">
          <h2 class="card__title">
            <q-icon name="list_alt" size="16px" />
            <span>Svi zahtjevi</span>
          </h2>
          <span class="card__count" v-if="!loading">{{ rows.length }}</span>
        </div>

        <!-- Error banner -->
        <div v-if="errorMessage" class="error-banner">
          <q-icon name="error_outline" size="16px" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Table -->
        <q-table
          :rows="rows"
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
              {{ props.row.request_number }}
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
              {{ props.row.created_by }}
            </q-td>
          </template>

          <!-- Cell: chevron -->
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right cell-chevron">
              <q-icon name="chevron_right" size="18px" />
            </q-td>
          </template>

          <!-- Empty state -->
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

          <!-- Loading -->
          <template #loading>
            <q-inner-loading showing color="primary" />
          </template>
        </q-table>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import { getStoredUser } from 'src/utils/authStorage';

const router = useRouter();
const $q = useQuasar();

const loading = ref(false);
const rows = ref([]);
const errorMessage = ref('');

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
    const vraceni = rows.value.filter(r => r.status_name === 'Vraćeno na dopunu / izmjenu');
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
const statusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'poslano':                     return 'status--sent';
    case 'na odobrenju':                return 'status--review';
    case 'vraćeno na dopunu / izmjenu': return 'status--returned';
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
  fetchRequests();
});
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
  max-width: 1280px;
  margin: 0 auto;
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
  margin-bottom: 16px;
}

.page-header__main {
  flex: 1;
  min-width: 240px;
}

.page-header__title {
  font-size: 1.375rem;
  font-weight: 600;
  color: #16294E;
  letter-spacing: -0.015em;
  line-height: 1.2;
  margin: 0;
}

.page-header__subtitle {
  font-size: 0.8125rem;
  color: #605E5C;
  margin: 4px 0 0;
  line-height: 1.5;
}

.page-header__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
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
  color: #201F1E;
  background: white;
}

.btn--primary {
  background: #16294E;
  color: white;
  border-color: #16294E;
}
.btn--primary:hover { background: #0F1F3D; border-color: #0F1F3D; }
.btn--primary:active { background: #091538; }

/* ─────────────────────────────────
   Card
   ───────────────────────────────── */
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

.card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #201F1E;
  margin: 0;
}
.card__title .q-icon { color: #00AFDB; }

.card__count {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #605E5C;
  background: #F8F8F8;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid #E1DFDD;
}

/* ─────────────────────────────────
   Error banner
   ───────────────────────────────── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px;
  padding: 10px 12px;
  background: #FDE7E9;
  border: 1px solid #F1B0B7;
  border-radius: 4px;
  color: #A4262C;
  font-size: 0.8125rem;
  font-weight: 500;
}

/* ─────────────────────────────────
   Table — Quasar deep overrides
   ───────────────────────────────── */
.data-table :deep(thead tr) {
  background: #F8F8F8;
}

.data-table :deep(thead th) {
  text-align: left;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8A8886;
  padding: 8px 16px;
  border-bottom: 1px solid #E1DFDD;
  height: auto;
}

.data-table :deep(thead th.sortable:hover) {
  color: #16294E;
}

.data-table :deep(tbody tr) {
  cursor: pointer;
  transition: background 0.12s;
}
.data-table :deep(tbody tr:hover) {
  background: #FAFAFA;
}

.data-table :deep(tbody td) {
  padding: 10px 16px;
  font-size: 0.8125rem;
  color: #201F1E;
  border-bottom: 1px solid #E1DFDD;
  height: auto;
}

.data-table :deep(tbody tr:last-child td) {
  border-bottom: none;
}

/* Specific cells */
.cell-number {
  font-weight: 600;
  color: #16294E !important;
  letter-spacing: -0.005em;
}
.cell-num {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.cell-muted {
  color: #605E5C !important;
}
.cell-chevron {
  color: #A19F9D;
  width: 40px;
}
.data-table :deep(tbody tr:hover) .cell-chevron {
  color: #16294E;
}

/* Bottom pagination styling */
.data-table :deep(.q-table__bottom) {
  padding: 6px 16px;
  font-size: 0.75rem;
  color: #605E5C;
  border-top: 1px solid #E1DFDD;
  min-height: 40px;
}

/* ─────────────────────────────────
   Status pills
   ───────────────────────────────── */
.status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border-radius: 11px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  border: 1px solid transparent;
  white-space: nowrap;
}
.status::before {
  content: '';
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status--sent     { background: #EEF2FF; color: #3730A3; border-color: #C7D2FE; }
.status--review   { background: #FFF4CE; color: #B7791F; border-color: #F2D17C; }
.status--returned { background: #FFF4ED; color: #C2410C; border-color: #FBBF77; }
.status--rejected { background: #FDE7E9; color: #A4262C; border-color: #F1B0B7; }
.status--ordered  { background: #E1F5FA; color: #00708A; border-color: #94DCEF; }
.status--closed   { background: #DFF6DD; color: #107C10; border-color: #92DDA8; }
.status--default  { background: #F8F8F8; color: #605E5C; border-color: #E1DFDD; }

/* ─────────────────────────────────
   Empty state
   ───────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px;
  text-align: center;
}

.empty-state__icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #F8F8F8;
  border: 1px solid #E1DFDD;
  color: #A19F9D;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-state__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #201F1E;
  margin: 0 0 4px;
}

.empty-state__hint {
  font-size: 0.8125rem;
  color: #605E5C;
  margin: 0 0 16px;
  max-width: 320px;
  line-height: 1.5;
}

/* ─────────────────────────────────
   Responsive
   ───────────────────────────────── */
@media (max-width: 600px) {
  .page { padding: 16px 12px 48px; }
  .page-header__actions .btn { width: 100%; }
  .data-table :deep(thead th),
  .data-table :deep(tbody td) {
    padding: 8px 12px;
  }
}
</style>
