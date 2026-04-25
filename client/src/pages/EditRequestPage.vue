<template>
  <q-page class="edit-page q-pa-lg">
    <div class="page-shell">

      <section class="page-hero q-mb-lg">
        <div>
          <div class="page-eyebrow">UREĐIVANJE ZAHTJEVA</div>
          <div class="page-title">{{ requestNumber }}</div>
          <div class="page-meta">Samo administrator može mijenjati podatke zahtjeva.</div>
        </div>
        <q-btn flat no-caps class="back-btn"
          icon="arrow_back" label="Natrag na detalje" @click="goBack" />
      </section>

      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="36px" />
      </div>

      <div v-else-if="form">

        <!-- OSNOVNI PODACI -->
        <div class="glass-card q-mb-lg">
          <div class="card-title">Osnovni podaci</div>

          <div class="row q-col-gutter-lg">
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.fk_department"
                :options="departmentOptions"
                label="Odjel / Služba / Projekt"
                outlined emit-value map-options
              >
                <template #prepend>
                  <q-icon name="business" style="color:#00AFDB" />
                </template>
              </q-select>
            </div>

            <div class="col-12 col-md-6">
              <q-input
                :model-value="fiscalYear"
                label="Fiskalna godina"
                outlined readonly
                hint="Fiskalna godina se ne može mijenjati"
              >
                <template #prepend>
                  <q-icon name="calendar_today" style="color:#AEAEB2" />
                </template>
              </q-input>
            </div>

            <div class="col-12">
              <q-input
                v-model="form.justification"
                type="textarea"
                label="Obrazloženje nabave"
                outlined autogrow rows="4"
                counter maxlength="1000"
              />
            </div>

            <div class="col-12 col-md-4">
              <q-input
                v-model.number="form.estimated_amount"
                label="Procijenjeni iznos"
                type="number" min="0" step="0.01"
                outlined suffix="EUR"
                hint="Admin može ažurirati iznos"
              />
            </div>
          </div>
        </div>

        <!-- STAVKE -->
        <div class="glass-card q-mb-lg">
          <div class="card-title">Stavke zahtjeva</div>

          <div class="add-item-form q-mb-lg">
            <div class="add-item-label">DODAJ STAVKU</div>
            <div class="row q-col-gutter-md items-end">
              <div class="col-12 col-md-4">
                <q-select v-model="itemForm.category" :options="categoryOptions"
                  label="Kategorija" outlined dense emit-value map-options />
              </div>
              <div class="col-12 col-md-5">
                <q-input v-model="itemForm.item_name" label="Naziv artikla / usluge"
                  outlined dense @keyup.enter="addItem" />
              </div>
              <div class="col-12 col-md-2">
                <q-input v-model.number="itemForm.quantity" label="Količina"
                  type="number" min="1" outlined dense />
              </div>
              <div class="col-12 col-md-1">
                <q-btn unelevated round icon="add"
                  style="background:#16294E!important;color:white;" @click="addItem">
                  <q-tooltip>Dodaj stavku</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>

          <div v-if="form.items.length === 0" class="items-empty">
            <q-icon name="inventory_2" size="26px" style="color:#AEAEB2" />
            <div class="items-empty__text">Nema stavki</div>
          </div>

          <div v-else class="items-list">
            <q-list separator>
              <q-item v-for="(item, index) in form.items" :key="index">
                <q-item-section avatar>
                  <div class="item-idx">{{ index + 1 }}</div>
                </q-item-section>
                <q-item-section>
                  <q-item-label style="font-size:0.875rem;font-weight:500;color:#1D1D1F;">
                    {{ item.item_name }}
                  </q-item-label>
                  <q-item-label caption style="color:#86868B;">{{ item.category_label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-sm">
                    <q-chip dense text-color="white" size="sm"
                      style="background:#16294E;">× {{ item.quantity }}</q-chip>
                    <q-btn flat round dense icon="delete" color="negative" size="sm"
                      @click="removeItem(index)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div v-if="form.items.length > 0" class="items-count">
            {{ form.items.length }} {{ form.items.length === 1 ? 'stavka' : 'stavki' }} ukupno
          </div>
        </div>

        <!-- AKCIJE -->
        <div class="row justify-between items-center">
          <q-btn flat no-caps style="color:#6E6E73" icon="close" label="Odustani"
            :disable="saving" @click="goBack" />
          <q-btn unelevated no-caps icon="save" label="Spremi izmjene"
            class="save-btn" :loading="saving" @click="saveChanges" />
        </div>

      </div>

      <div v-else class="empty-note text-center q-pa-xl">
        Zahtjev nije pronađen.
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const loading = ref(false);
const saving = ref(false);
const requestNumber = ref('');
const fiscalYear = ref('');

const departmentOptions = ref([]);
const categoryOptions = ref([]);

const form = ref(null);
const itemForm = ref({ category: null, item_name: '', quantity: 1 });

const fetchData = async () => {
  loading.value = true;
  try {
    const [detailsRes, departmentsRes, categoriesRes] = await Promise.all([
      api.get(`/requests/${route.params.id}`),
      api.get('/reference/departments'),
      api.get('/reference/item-categories'),
    ]);

    const request = detailsRes.data.request;
    const items = detailsRes.data.items;

    requestNumber.value = request.request_number;
    fiscalYear.value = request.fiscal_year;

    departmentOptions.value = departmentsRes.data.map((d) => ({
      label: d.name,
      value: d.id_department,
    }));

    categoryOptions.value = categoriesRes.data.map((c) => ({
      label: c.name,
      value: c.id_item_category,
    }));

    form.value = {
      fk_department: departmentOptions.value.find(
        (d) => d.label === request.department_name
      )?.value || null,
      justification: request.justification || '',
      estimated_amount: request.total_amount || null,
      items: items.map((it) => ({
        fk_item_category: it.id_item_category || categoryOptions.value.find(
          (c) => c.label === it.category_name
        )?.value || null,
        category_label: it.category_name,
        item_name: it.item_name,
        quantity: it.quantity,
      })),
    };
  } catch (error) {
    console.error('Greška pri dohvaćanju:', error);
    $q.notify({ type: 'negative', message: 'Greška pri učitavanju zahtjeva.' });
    form.value = null;
  } finally {
    loading.value = false;
  }
};

const addItem = () => {
  if (!itemForm.value.category || !itemForm.value.item_name.trim() || !itemForm.value.quantity || itemForm.value.quantity < 1) {
    $q.notify({ type: 'negative', message: 'Ispunite kategoriju, naziv i količinu.' });
    return;
  }
  const category = categoryOptions.value.find((x) => x.value === itemForm.value.category);
  form.value.items.push({
    fk_item_category: itemForm.value.category,
    category_label: category?.label || '',
    item_name: itemForm.value.item_name.trim(),
    quantity: itemForm.value.quantity,
  });
  itemForm.value = { category: null, item_name: '', quantity: 1 };
};

const removeItem = (index) => form.value.items.splice(index, 1);

const saveChanges = async () => {
  if (!form.value.fk_department) {
    $q.notify({ type: 'negative', message: 'Odjel je obavezan.' });
    return;
  }
  if (!form.value.justification.trim()) {
    $q.notify({ type: 'negative', message: 'Obrazloženje je obavezno.' });
    return;
  }
  if (form.value.items.length === 0) {
    $q.notify({ type: 'negative', message: 'Zahtjev mora imati barem jednu stavku.' });
    return;
  }

  saving.value = true;

  const payload = {
    fk_department: form.value.fk_department,
    justification: form.value.justification.trim(),
    estimated_amount: form.value.estimated_amount || null,
    items: form.value.items.map((it) => ({
      fk_item_category: it.fk_item_category,
      item_name: it.item_name,
      quantity: it.quantity,
    })),
  };

  try {
    await api.put(`/requests/${route.params.id}`, payload);
    $q.notify({ type: 'positive', message: 'Zahtjev uspješno ažuriran.' });
    router.push(`/requests/${route.params.id}`);
  } catch (error) {
    console.error('Greška pri spremanju:', error);
    $q.notify({ type: 'negative', message: error.response?.data?.message || 'Greška pri spremanju.' });
  } finally {
    saving.value = false;
  }
};

const goBack = () => router.push(`/requests/${route.params.id}`);

onMounted(() => { fetchData(); });
</script>

<style scoped>
.edit-page {
  background: #F5F5F7;
  min-height: 100vh;
}

.page-shell {
  max-width: 1000px;
  margin: 0 auto;
}

.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding-top: 20px;
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
  margin-bottom: 4px;
}

.page-meta {
  font-size: 0.85rem;
  color: #86868B;
}

.back-btn { color: #6E6E73 !important; font-size: 0.875rem; }

.glass-card {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 18px;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 4px rgba(0,0,0,0.03), 0 8px 28px rgba(0,0,0,0.06);
  padding: 24px;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1D1D1F;
  letter-spacing: -0.01em;
  margin-bottom: 20px;
}

.add-item-form {
  background: rgba(245,245,247,0.7);
  border: 0.5px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 16px;
}

.add-item-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  color: #86868B;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.items-list {
  border: 0.5px solid rgba(0,0,0,0.08);
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.items-empty { padding: 32px; text-align: center; }
.items-empty__text { font-size: 0.875rem; color: #86868B; margin-top: 8px; }

.item-idx {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0,0,0,0.05);
  color: #86868B;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.items-count {
  text-align: right;
  font-size: 0.75rem;
  color: #86868B;
  padding: 8px 2px 0;
}

.save-btn {
  border-radius: 980px;
  padding: 10px 24px;
  font-weight: 600;
  font-size: 0.875rem;
  background: #16294E !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(22,41,78,0.22);
  transition: opacity 0.2s;
}
.save-btn:hover { opacity: 0.85; }

.empty-note { font-size: 0.875rem; color: #86868B; }
</style>
