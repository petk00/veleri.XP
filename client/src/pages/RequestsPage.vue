<template>
  <q-page class="requests-page q-pa-lg">
    <div class="page-shell">
      <section class="page-hero">
        <div>
          <div class="page-eyebrow">ZAHTJEVI ZA NABAVU</div>
          <div class="page-title">Pregled zahtjeva</div>
          <div class="page-subtitle">
            Pregledajte postojeće zahtjeve, njihov status i otvorite detalje za nastavak rada.
          </div>
        </div>

        <q-btn
          unelevated
          no-caps
          icon="add"
          label="Novi zahtjev"
          class="new-request-btn"
          @click="$router.push('/requests/new')"
        />
      </section>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="table-toolbar__title">Svi zahtjevi</div>
          <div class="table-toolbar__count">{{ rows.length }} zapisa</div>
        </div>

        <div class="table-divider" />

        <div v-if="errorMessage" class="error-banner q-ma-md">
          <q-icon name="error_outline" size="15px" style="flex-shrink:0;" />
          <span>{{ errorMessage }}</span>
        </div>

        <q-table
          :rows="rows"
          :columns="columns"
          row-key="id_purchase_request"
          :loading="loading"
          flat
          :pagination="{ rowsPerPage: 10 }"
          class="requests-table"
        >
          <template #body-cell-request_number="props">
            <q-td :props="props">
              <q-btn
                flat
                no-caps
                class="request-link"
                :label="props.row.request_number"
                @click="openRequest(props.row.id_purchase_request)"
              />
            </q-td>
          </template>

          <template #body-cell-status_name="props">
            <q-td :props="props">
              <q-chip
                dense
                class="status-chip"
                :class="statusClass(props.row.status_name)"
              >
                {{ props.row.status_name }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-total_amount="props">
            <q-td :props="props" class="text-right">
              {{ formatCurrency(props.row.total_amount) }}
            </q-td>
          </template>

          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                round
                dense
                icon="chevron_right"
                class="row-arrow"
                @click="openRequest(props.row.id_purchase_request)"
              >
                <q-tooltip>Otvori detalje</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template #no-data>
            <div class="full-width row flex-center q-gutter-sm q-pa-xl no-data">
              <q-icon name="inbox" size="22px" />
              <span>Nema zahtjeva za prikaz.</span>
            </div>
          </template>
        </q-table>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'boot/axios';

const router = useRouter();
const loading = ref(false);
const rows = ref([]);
const errorMessage = ref('');

const columns = [
  { name: 'request_number', label: 'Broj zahtjeva', field: 'request_number', align: 'left' },
  { name: 'fiscal_year', label: 'Godina', field: 'fiscal_year', align: 'left' },
  { name: 'department_name', label: 'Odjel', field: 'department_name', align: 'left' },
  { name: 'status_name', label: 'Status', field: 'status_name', align: 'left' },
  { name: 'created_by', label: 'Kreirao', field: 'created_by', align: 'left' },
  { name: 'total_amount', label: 'Ukupan iznos', field: 'total_amount', align: 'right' },
  { name: 'created_at', label: 'Datum', field: 'created_at', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

const fetchRequests = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await api.get('/requests');
    rows.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Greška kod dohvaćanja zahtjeva:', error);
    errorMessage.value = error.response?.data?.message || 'Zahtjevi se trenutno ne mogu dohvatiti.';
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

const openRequest = (id) => { router.push(`/requests/${id}`); };

const formatCurrency = (value) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('hr-HR');
};

const statusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'poslano': return 'status--sent';
    case 'na odobrenju': return 'status--pending';
    case 'vraćeno na dopunu / izmjenu': return 'status--returned';
    case 'odobreno': return 'status--approved';
    case 'odbijeno': return 'status--rejected';
    case 'naručeno': return 'status--ordered';
    case 'zatvoreno': return 'status--closed';
    default: return 'status--default';
  }
};

onMounted(() => { fetchRequests(); });
</script>

<style scoped>
.requests-page {
  background: #F5F5F7;
  min-height: 100vh;
}

.page-shell {
  max-width: 1280px;
  margin: 0 auto;
}

.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding-top: 20px;
  margin-bottom: 24px;
}

.page-eyebrow {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #86868B;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.page-title {
  font-size: 1.9rem;
  font-weight: 700;
  color: #1D1D1F;
  letter-spacing: -0.03em;
  margin-bottom: 6px;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6E6E73;
  max-width: 560px;
  line-height: 1.5;
}

.new-request-btn {
  border-radius: 980px;
  padding: 10px 22px;
  font-weight: 600;
  font-size: 0.875rem;
  background: #16294E !important;
  color: white !important;
  letter-spacing: -0.01em;
  box-shadow: 0 2px 8px rgba(22, 41, 78, 0.22);
  transition: opacity 0.2s;
}

.new-request-btn:hover { opacity: 0.85; }

.table-card {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 18px;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.03),
    0 8px 32px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 16px;
}

.table-toolbar__title {
  font-size: 1rem;
  font-weight: 600;
  color: #1D1D1F;
  letter-spacing: -0.01em;
}

.table-toolbar__count {
  font-size: 0.8rem;
  color: #86868B;
}

.table-divider {
  height: 0.5px;
  background: rgba(0, 0, 0, 0.08);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(255, 59, 48, 0.07);
  border-radius: 10px;
  color: #C00;
  font-size: 0.83rem;
  border: 0.5px solid rgba(255,59,48,0.2);
}

.requests-table :deep(.q-table thead tr) {
  background: rgba(245, 245, 247, 0.7);
}

.requests-table :deep(.q-table thead th) {
  color: #86868B;
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  border-bottom: 0.5px solid rgba(0,0,0,0.07) !important;
}

.requests-table :deep(.q-table tbody tr) {
  transition: background 0.12s;
}

.requests-table :deep(.q-table tbody tr:hover td) {
  background: rgba(0, 175, 219, 0.04);
}

.requests-table :deep(.q-table tbody td) {
  height: 54px;
  border-bottom: 0.5px solid rgba(0,0,0,0.05);
  color: #1D1D1F;
  font-size: 0.875rem;
}

.request-link {
  color: #00AFDB;
  font-weight: 600;
  font-size: 0.875rem;
  padding-left: 0;
  letter-spacing: -0.01em;
}

.row-arrow {
  color: #AEAEB2;
}

.status-chip {
  border-radius: 980px;
  font-weight: 600;
  font-size: 0.72rem;
  padding: 3px 10px;
  height: auto;
  letter-spacing: 0;
}

.status--sent     { background: #EEF2FF; color: #4338CA; }
.status--pending  { background: rgba(0,175,219,0.1); color: #007BA0; }
.status--returned { background: #FFF7ED; color: #C2410C; }
.status--approved { background: #ECFDF5; color: #065F46; }
.status--rejected { background: #FEF2F2; color: #991B1B; }
.status--ordered  { background: #F5F3FF; color: #5B21B6; }
.status--closed   { background: #F0FDF4; color: #14532D; }
.status--default  { background: rgba(0,0,0,0.05); color: #6E6E73; }

.no-data {
  color: #86868B;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .table-toolbar { padding: 14px 18px; }
}
</style>
