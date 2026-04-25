<template>
  <q-page class="requests-page q-pa-lg">
    <div class="page-shell">
      <section class="page-hero q-mb-lg">
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
          color="primary"
          icon="add"
          label="Novi zahtjev"
          class="new-request-btn"
          @click="$router.push('/requests/new')"
        />
      </section>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="table-toolbar__title">Svi zahtjevi</div>
          <div class="table-toolbar__count">Ukupno: {{ rows.length }}</div>
        </div>

        <q-separator color="grey-2" />

        <q-banner
          v-if="errorMessage"
          inline-actions
          rounded
          class="error-banner q-ma-md"
        >
          {{ errorMessage }}
        </q-banner>

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
                icon="arrow_forward"
                color="primary"
                @click="openRequest(props.row.id_purchase_request)"
              >
                <q-tooltip>Otvori detalje</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template #no-data>
            <div class="full-width row flex-center q-gutter-sm q-pa-xl text-grey-5">
              <q-icon name="inbox" size="24px" />
              <span style="font-size: 0.875rem;">Nema zahtjeva za prikaz.</span>
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
  {
    name: 'request_number',
    label: 'Broj zahtjeva',
    field: 'request_number',
    align: 'left',
  },
  {
    name: 'fiscal_year',
    label: 'Godina',
    field: 'fiscal_year',
    align: 'left',
  },
  {
    name: 'department_name',
    label: 'Odjel',
    field: 'department_name',
    align: 'left',
  },
  {
    name: 'status_name',
    label: 'Status',
    field: 'status_name',
    align: 'left',
  },
  {
    name: 'created_by',
    label: 'Kreirao',
    field: 'created_by',
    align: 'left',
  },
  {
    name: 'total_amount',
    label: 'Ukupan iznos',
    field: 'total_amount',
    align: 'right',
  },
  {
    name: 'created_at',
    label: 'Datum',
    field: 'created_at',
    align: 'left',
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'right',
  },
];

const fetchRequests = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.get('/requests');
    rows.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Greška kod dohvaćanja zahtjeva:', error);
    errorMessage.value =
      error.response?.data?.message || 'Zahtjevi se trenutno ne mogu dohvatiti.';
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

const openRequest = (id) => {
  router.push(`/requests/${id}`);
};

const formatCurrency = (value) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('hr-HR');
};

const statusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'poslano':
      return 'status-chip--sent';
    case 'na odobrenju':
      return 'status-chip--pending';
    case 'vraćeno na dopunu / izmjenu':
      return 'status-chip--returned';
    case 'odobreno':
      return 'status-chip--approved';
    case 'odbijeno':
      return 'status-chip--rejected';
    case 'naručeno':
      return 'status-chip--ordered';
    case 'zatvoreno':
      return 'status-chip--closed';
    default:
      return 'status-chip--default';
  }
};

onMounted(() => {
  fetchRequests();
});
</script>

<style scoped>
.requests-page {
  background: #F9FAFB;
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
  padding-top: 8px;
}

.page-eyebrow {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #9CA3AF;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
  margin-bottom: 6px;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6B7280;
  max-width: 600px;
  line-height: 1.55;
}

.new-request-btn {
  border-radius: 8px;
  padding: 10px 18px;
  font-weight: 600;
  background: #1E40AF !important;
}

.table-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
}

.table-toolbar__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
}

.table-toolbar__count {
  font-size: 0.8rem;
  color: #9CA3AF;
}

.error-banner {
  background: #FEF2F2;
  color: #991B1B;
  border: 1px solid #FECACA;
}

.requests-table :deep(.q-table thead tr) {
  background: #F9FAFB;
}

.requests-table :deep(.q-table thead th) {
  color: #9CA3AF;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid #E5E7EB !important;
}

.requests-table :deep(.q-table tbody tr:hover td) {
  background: #F9FAFB;
}

.requests-table :deep(.q-table tbody td) {
  height: 56px;
  border-bottom: 1px solid #F3F4F6;
  color: #374151;
  font-size: 0.875rem;
}

.request-link {
  color: #1E40AF;
  font-weight: 600;
  font-size: 0.875rem;
  padding-left: 0;
}

.status-chip {
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
  padding: 4px 8px;
  height: auto;
}

.status-chip--sent {
  background: #EEF2FF;
  color: #4338CA;
}

.status-chip--pending {
  background: #EFF6FF;
  color: #1D4ED8;
}

.status-chip--returned {
  background: #FFF7ED;
  color: #C2410C;
}

.status-chip--approved {
  background: #ECFDF5;
  color: #065F46;
}

.status-chip--rejected {
  background: #FEF2F2;
  color: #991B1B;
}

.status-chip--ordered {
  background: #F5F3FF;
  color: #5B21B6;
}

.status-chip--closed {
  background: #F0FDF4;
  color: #14532D;
}

.status-chip--default {
  background: #F3F4F6;
  color: #6B7280;
}

@media (max-width: 768px) {
  .table-toolbar {
    padding: 14px 16px;
  }
}
</style>
