<template>
  <q-page class="requests-page q-pa-lg">
    <div class="page-shell">
      <section class="page-hero q-mb-lg">
        <div>
          <div class="text-overline text-primary text-weight-bold">
            ZAHTJEVI ZA NABAVU
          </div>
          <div class="text-h4 text-weight-bold q-mt-sm page-title">
            Pregled zahtjeva
          </div>
          <div class="text-subtitle1 text-grey-7 q-mt-sm page-subtitle">
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

      <q-card flat class="table-card">
        <q-card-section class="table-toolbar">
          <div class="text-h6 text-weight-bold">Svi zahtjevi</div>
          <div class="text-body2 text-grey-6">
            Ukupno: {{ rows.length }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-none">
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
              <div class="full-width row flex-center q-gutter-sm q-pa-xl text-grey-6">
                <q-icon name="inbox" size="28px" />
                <span>Nema zahtjeva za prikaz.</span>
              </div>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
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

  try {
    const response = await api.get('/requests');
    rows.value = response.data;
  } catch (error) {
    console.error('Greška kod dohvaćanja zahtjeva:', error);
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
    case 'draft':
      return 'status-chip--draft';
    case 'submitted':
      return 'status-chip--submitted';
    case 'approved':
      return 'status-chip--approved';
    case 'rejected':
      return 'status-chip--rejected';
    case 'completed':
      return 'status-chip--completed';
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
  background:
    radial-gradient(circle at top right, rgba(25, 118, 210, 0.06), transparent 24%),
    linear-gradient(180deg, #f8fafc 0%, #f4f7fb 100%);
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
}

.page-title {
  letter-spacing: -0.02em;
}

.page-subtitle {
  max-width: 760px;
  line-height: 1.6;
}

.new-request-btn {
  border-radius: 16px;
  padding: 10px 16px;
  box-shadow: 0 12px 24px rgba(25, 118, 210, 0.22);
}

.table-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
}

.requests-table :deep(.q-table thead tr) {
  background: #f8fafc;
}

.requests-table :deep(.q-table thead th) {
  color: #64748b;
  font-weight: 700;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.requests-table :deep(.q-table tbody td) {
  height: 68px;
}

.request-link {
  color: #1976d2;
  font-weight: 700;
  padding-left: 0;
}

.status-chip {
  border-radius: 999px;
  font-weight: 700;
  padding: 6px 10px;
}

.status-chip--draft {
  background: #eef2ff;
  color: #4f46e5;
}

.status-chip--submitted {
  background: #eff6ff;
  color: #2563eb;
}

.status-chip--approved {
  background: #ecfdf3;
  color: #15803d;
}

.status-chip--rejected {
  background: #fef2f2;
  color: #dc2626;
}

.status-chip--completed {
  background: #f0fdf4;
  color: #166534;
}

.status-chip--default {
  background: #f1f5f9;
  color: #475569;
}

@media (max-width: 768px) {
  .table-toolbar {
    padding: 18px;
  }
}
</style>