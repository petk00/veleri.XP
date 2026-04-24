<template>
  <q-page class="requests-page q-pa-lg">
    <div class="page-shell">

      <!-- HERO -->
      <section class="page-hero q-mb-lg">
        <div>
          <div class="page-eyebrow">
            <span class="page-eyebrow__dot"></span>
            Zahtjevi za nabavu
          </div>
          <div class="page-title">Pregled zahtjeva</div>
          <div class="page-subtitle">
            Pregledajte postojeće zahtjeve, njihov status i otvorite detalje za nastavak rada.
          </div>
        </div>

        <q-btn
          unelevated no-caps
          class="new-request-btn"
          icon="add"
          label="Novi zahtjev"
          @click="$router.push('/requests/new')"
        />
      </section>

      <!-- TABLICA -->
      <q-card flat class="table-card">
        <div class="table-toolbar">
          <div class="table-toolbar__title">Svi zahtjevi</div>
          <div class="table-toolbar__count">{{ rows.length }} ukupno</div>
        </div>

        <q-separator />

        <q-banner
          v-if="errorMessage"
          inline-actions rounded
          class="bg-red-1 text-negative q-ma-md"
        >
          {{ errorMessage }}
        </q-banner>

        <q-table
          :rows="rows"
          :columns="columns"
          row-key="id_purchase_request"
          :loading="loading"
          flat
          :pagination="{ rowsPerPage: 15 }"
          class="requests-table"
        >
          <template #body-cell-request_number="props">
            <q-td :props="props">
              <button class="request-link" @click="openRequest(props.row.id_purchase_request)">
                {{ props.row.request_number }}
              </button>
            </q-td>
          </template>

          <template #body-cell-status_name="props">
            <q-td :props="props">
              <span class="status-chip" :class="statusClass(props.row.status_name)">
                {{ props.row.status_name }}
              </span>
            </q-td>
          </template>

          <template #body-cell-total_amount="props">
            <q-td :props="props" class="text-right amount-cell">
              {{ formatCurrency(props.row.total_amount) }}
            </q-td>
          </template>

          <template #body-cell-created_at="props">
            <q-td :props="props" class="date-cell">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <button class="row-action-btn" @click="openRequest(props.row.id_purchase_request)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12,5 19,12 12,19"/>
                </svg>
              </button>
            </q-td>
          </template>

          <template #no-data>
            <div class="empty-state">
              <div class="empty-state__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                  <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/>
                </svg>
              </div>
              <div class="empty-state__text">Nema zahtjeva za prikaz</div>
              <div class="empty-state__hint">Kreirajte novi zahtjev kako biste započeli</div>
            </div>
          </template>
        </q-table>
      </q-card>

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
  { name: 'created_by',     label: 'Kreirao',       field: 'created_by',     align: 'left' },
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

    // Notifikacije
    if (isAdmin.value) {
      const cekaju = rows.value.filter(r => r.status_name === 'Poslano');
      if (cekaju.length === 1) {
        $q.notify({
          color: 'dark',
          icon: 'inbox',
          message: `Zahtjev ${cekaju[0].request_number} čeka vaš pregled.`,
          timeout: 8000,
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
          message: `${cekaju.length} zahtjeva čeka vaš pregled.`,
          timeout: 8000,
          actions: [
            {
              label: 'Prikaži sve',
              color: 'white',
              handler: () => router.push('/requests'),
            },
          ],
        });
      }
    } else {
      const odobreni = rows.value.filter(r => r.status_name === 'Odobreno');
      odobreni.forEach(r => {
        $q.notify({
          color: 'positive',
          icon: 'local_shipping',
          message: `Zahtjev ${r.request_number} čeka otpremnicu.`,
          caption: 'Dodajte otpremnicu kako bi zahtjev mogao biti zatvoren.',
          timeout: 7000,
        });
      });
    }
  } catch (error) {
    console.error('Greška:', error);
    errorMessage.value = error.response?.data?.message || 'Zahtjevi se trenutno ne mogu dohvatiti.';
    rows.value = [];
  } finally {
    loading.value = false;
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

const statusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'poslano':                     return 'status-chip--sent';
    case 'na odobrenju':                return 'status-chip--pending';
    case 'vraćeno na dopunu / izmjenu': return 'status-chip--returned';
    case 'odobreno':                    return 'status-chip--approved';
    case 'odbijeno':                    return 'status-chip--rejected';
    case 'naručeno':                    return 'status-chip--ordered';
    case 'zatvoreno':                   return 'status-chip--closed';
    default:                            return 'status-chip--default';
  }
};

onMounted(() => {
  currentUser.value = getStoredUser();
  isAdmin.value = currentUser.value?.role_name === 'Administrator';
  fetchRequests();
});
</script>

<style scoped>
.requests-page {
  --navy:      #16294e;
  --navy-dark: #0a1628;
  --accent:    #4a7fd4;
  --surface:   #f0f4fa;
  --border:    rgba(22, 41, 78, 0.08);
  --text:      #0a1628;
  --muted:     #5a6a85;

  background: var(--surface);
  min-height: 100vh;
}

.page-shell {
  max-width: 1280px;
  margin: 0 auto;
}

/* ── Hero ────────────────────────────────────────────── */
.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 28px !important;
}

.page-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-bottom: 10px;
}

.page-eyebrow__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 6px;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--muted);
  max-width: 560px;
  line-height: 1.5;
}

.new-request-btn {
  background: linear-gradient(135deg, var(--navy) 0%, #2a4f96 100%) !important;
  color: white !important;
  border-radius: 10px !important;
  padding: 10px 20px !important;
  font-weight: 700 !important;
  font-size: 0.875rem !important;
  box-shadow: 0 8px 20px rgba(22, 41, 78, 0.24) !important;
  transition: all 0.2s !important;
  white-space: nowrap;
}

.new-request-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(22, 41, 78, 0.32) !important;
}

/* ── Table card ──────────────────────────────────────── */
.table-card {
  border-radius: 16px !important;
  background: white !important;
  border: 1px solid var(--border) !important;
  box-shadow: 0 4px 16px rgba(22, 41, 78, 0.06) !important;
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
}

.table-toolbar__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}

.table-toolbar__count {
  font-size: 0.82rem;
  color: var(--muted);
  font-weight: 500;
  background: var(--surface);
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
}

/* ── Table styles ────────────────────────────────────── */
.requests-table :deep(.q-table thead tr) {
  background: #f8fafc;
}

.requests-table :deep(.q-table thead th) {
  color: var(--muted);
  font-weight: 700;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.requests-table :deep(.q-table tbody tr) {
  transition: background 0.15s;
}

.requests-table :deep(.q-table tbody tr:hover) {
  background: #f8fafc;
}

.requests-table :deep(.q-table tbody td) {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-size: 0.875rem;
}

.requests-table :deep(.q-table tbody tr:last-child td) {
  border-bottom: none;
}

.request-link {
  all: unset;
  font-weight: 700;
  color: var(--navy);
  cursor: pointer;
  letter-spacing: -0.01em;
  transition: color 0.15s;
}

.request-link:hover {
  color: var(--accent);
}

.amount-cell {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text) !important;
}

.date-cell {
  color: var(--muted) !important;
  font-size: 0.82rem !important;
}

.row-action-btn {
  all: unset;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
}

.row-action-btn:hover {
  background: var(--surface);
  color: var(--navy);
}

/* ── Status chips ────────────────────────────────────── */
.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.status-chip--sent     { background: #eef2ff; color: #4338ca; }
.status-chip--pending  { background: #fef9c3; color: #a16207; }
.status-chip--returned { background: #fdf2f8; color: #be185d; }
.status-chip--approved { background: #ecfdf5; color: #047857; }
.status-chip--rejected { background: #fef2f2; color: #b91c1c; }
.status-chip--ordered  { background: #f5f3ff; color: #6d28d9; }
.status-chip--closed   { background: #f0fdf4; color: #166534; }
.status-chip--default  { background: #f1f5f9; color: #475569; }

/* ── Empty state ─────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-state__icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--surface);
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-state__text {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.empty-state__hint {
  font-size: 0.82rem;
  color: var(--muted);
}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 768px) {
  .page-hero { flex-direction: column; align-items: flex-start; }
  .new-request-btn { width: 100%; justify-content: center; }
}
</style>
