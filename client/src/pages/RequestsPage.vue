<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Pregled zahtjeva</div>

    <q-card>
      <q-card-section>
        <q-table
          :rows="rows"
          :columns="columns"
          row-key="id_purchase_request"
          :loading="loading"
          flat
          bordered
        >
          <template #body-cell-request_number="props">
            <q-td :props="props">
              <q-btn
                flat
                color="primary"
                :label="props.row.request_number"
                @click="openRequest(props.row.id_purchase_request)"
              />
            </q-td>
          </template>

          <template #body-cell-total_amount="props">
            <q-td :props="props">
              {{ formatCurrency(props.row.total_amount) }}
            </q-td>
          </template>

          <template #body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
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
  { name: 'request_number', label: 'Broj zahtjeva', field: 'request_number', align: 'left' },
  { name: 'fiscal_year', label: 'Godina', field: 'fiscal_year', align: 'left' },
  { name: 'department_name', label: 'Odjel', field: 'department_name', align: 'left' },
  { name: 'status_name', label: 'Status', field: 'status_name', align: 'left' },
  { name: 'created_by', label: 'Kreirao', field: 'created_by', align: 'left' },
  { name: 'total_amount', label: 'Ukupan iznos', field: 'total_amount', align: 'right' },
  { name: 'created_at', label: 'Datum', field: 'created_at', align: 'left' },
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

onMounted(() => {
  fetchRequests();
});
</script>