<template>
  <q-page padding>
    <q-btn
      flat
      icon="arrow_back"
      label="Natrag"
      class="q-mb-md"
      @click="goBack"
    />

    <q-card v-if="request" class="q-mb-md">
      <q-card-section>
        <div class="text-h5 q-mb-sm">{{ request.request_number }}</div>
        <div><strong>Fiskalna godina:</strong> {{ request.fiscal_year }}</div>
        <div><strong>Odjel:</strong> {{ request.department_name }}</div>
        <div><strong>Status:</strong> {{ request.status_name }}</div>
        <div><strong>Kreirao:</strong> {{ request.created_by }}</div>
        <div><strong>Ukupan iznos:</strong> {{ formatCurrency(request.total_amount) }}</div>
        <div><strong>Datum kreiranja:</strong> {{ formatDate(request.created_at) }}</div>
        <div class="q-mt-md">
          <strong>Obrazloženje:</strong><br>
          {{ request.justification || '-' }}
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section>
        <div class="text-h6 q-mb-md">Stavke zahtjeva</div>

        <q-table
          :rows="items"
          :columns="columns"
          row-key="id_purchase_request_item"
          flat
          bordered
          :loading="loading"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'boot/axios';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const request = ref(null);
const items = ref([]);

const columns = [
  {
    name: 'item_name',
    label: 'Naziv artikla',
    field: 'item_name',
    align: 'left',
  },
  {
    name: 'category_name',
    label: 'Kategorija',
    field: 'category_name',
    align: 'left',
  },
  {
    name: 'quantity',
    label: 'Količina',
    field: 'quantity',
    align: 'right',
  },
];

const fetchRequestDetails = async () => {
  loading.value = true;

  try {
    const response = await api.get(`/requests/${route.params.id}`);
    request.value = response.data.request;
    items.value = response.data.items;
  } catch (error) {
    console.error('Greška kod dohvaćanja detalja:', error);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/requests');
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
  fetchRequestDetails();
});
</script>