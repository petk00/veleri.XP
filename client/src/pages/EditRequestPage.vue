<template>
  <q-page class="page">
    <div class="page-shell">

      <!-- Back link -->
      <button class="back-link" @click="goBack">
        <q-icon name="arrow_back" size="14px" />
        <span>Natrag na detalje</span>
      </button>

      <!-- Page header -->
      <header class="page-header">
        <div class="page-header__main">
          <div class="page-header__eyebrow">Uređivanje zahtjeva</div>
          <h1 class="page-header__title">{{ requestNumber || '...' }}</h1>
          <p class="page-header__subtitle">
            Promjene se evidentiraju u povijesti aktivnosti.
          </p>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="loading-block">
        <q-spinner color="primary" size="32px" />
      </div>

      <div v-else-if="form">

        <!-- ───── Card: Basic data ───── -->
        <div class="card">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon name="info" size="16px" />
              <span>Osnovni podaci</span>
            </h2>
          </div>
          <div class="card__body">
            <div class="field-grid">
              <div class="field">
                <label class="field__label">Odjel / Služba / Projekt *</label>
                <q-select
                  v-model="form.fk_department"
                  :options="departmentOptions"
                  outlined dense
                  emit-value map-options
                  placeholder="Odaberite..."
                  class="field__input"
                >
                  <template #prepend>
                    <q-icon name="business" size="16px" />
                  </template>
                </q-select>
              </div>

              <div class="field">
                <label class="field__label">Fiskalna godina</label>
                <q-input
                  :model-value="fiscalYear"
                  outlined dense readonly
                  class="field__input field__input--readonly"
                >
                  <template #prepend>
                    <q-icon name="event" size="16px" />
                  </template>
                </q-input>
                <div class="field__hint">Fiskalna godina se ne može mijenjati.</div>
              </div>
            </div>

            <div class="field">
              <label class="field__label">Obrazloženje nabave *</label>
              <q-input
                v-model="form.justification"
                type="textarea"
                outlined autogrow rows="4"
                counter maxlength="1000"
                placeholder="Opišite zašto se ova nabava vrši i čemu služi..."
                class="field__input field__input--textarea"
              />
            </div>

            <div class="field-grid">
              <div class="field">
                <label class="field__label">Procijenjeni iznos</label>
                <q-input
                  v-model.number="form.estimated_amount"
                  type="number" min="0" step="0.01"
                  outlined dense
                  placeholder="0,00"
                  suffix="EUR"
                  class="field__input"
                />
                <div class="field__hint">Neobavezno. Ostavite prazno ako nije poznato.</div>
              </div>
              <div /> <!-- prazna kolona za poravnanje -->
            </div>
          </div>
        </div>

        <!-- ───── Card: Items ───── -->
        <div class="card">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon name="inventory_2" size="16px" />
              <span>Stavke zahtjeva</span>
            </h2>
            <span v-if="form.items.length > 0" class="card__count">
              {{ form.items.length }}
            </span>
          </div>

          <div class="card__body">
            <!-- Add item form -->
            <div class="add-item">
              <div class="add-item__label">Dodaj stavku</div>
              <div class="add-item__row">
                <q-select
                  v-model="itemForm.category"
                  :options="categoryOptions"
                  placeholder="Kategorija"
                  outlined dense
                  emit-value map-options
                  class="add-item__category"
                />
                <q-input
                  v-model="itemForm.item_name"
                  placeholder="Naziv artikla / usluge"
                  outlined dense
                  class="add-item__name"
                  @keyup.enter="addItem"
                />
                <q-input
                  v-model.number="itemForm.quantity"
                  placeholder="Kol."
                  type="number" min="1"
                  outlined dense
                  class="add-item__qty"
                />
                <button class="btn btn--primary add-item__btn" @click="addItem">
                  <q-icon name="add" size="16px" />
                  <span>Dodaj</span>
                </button>
              </div>
            </div>

            <!-- List -->
            <div v-if="form.items.length === 0" class="empty-block">
              <q-icon name="inventory_2" size="24px" class="empty-block__icon" />
              <div class="empty-block__text">Nema dodanih stavki.</div>
              <div class="empty-block__hint">Zahtjev mora sadržavati barem jednu stavku.</div>
            </div>

            <ul v-else class="item-list">
              <li v-for="(item, index) in form.items" :key="index" class="item-list__row">
                <div class="item-list__index">{{ index + 1 }}</div>
                <div class="item-list__content">
                  <div class="item-list__name">{{ item.item_name }}</div>
                  <div class="item-list__category">{{ item.category_label }}</div>
                </div>
                <div class="item-list__qty">× {{ item.quantity }}</div>
                <button class="icon-btn icon-btn--danger" @click="removeItem(index)">
                  <q-icon name="delete_outline" size="16px" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- ───── Action bar ───── -->
        <div class="action-bar">
          <button class="btn btn--ghost" :disabled="saving" @click="goBack">
            Odustani
          </button>
          <button class="btn btn--primary" :disabled="saving" @click="saveChanges">
            <q-spinner v-if="saving" size="16px" color="white" />
            <q-icon v-else name="save" size="16px" />
            <span>{{ saving ? 'Spremam...' : 'Spremi izmjene' }}</span>
          </button>
        </div>

      </div>

      <!-- Error -->
      <div v-else class="empty-block empty-block--page">
        <q-icon name="error_outline" size="32px" class="empty-block__icon" />
        <div class="empty-block__text">Zahtjev nije pronađen.</div>
        <div class="empty-block__hint">Provjerite poveznicu ili se vratite na popis zahtjeva.</div>
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
    fiscalYear.value = String(request.fiscal_year || '');

    departmentOptions.value = departmentsRes.data.map((d) => ({
      label: d.name,
      value: d.id_department,
    }));

    categoryOptions.value = categoriesRes.data.map((c) => ({
      label: c.name,
      value: c.id_item_category,
    }));

    form.value = {
      fk_department:
        departmentOptions.value.find((d) => d.label === request.department_name)?.value || null,
      justification: request.justification || '',
      estimated_amount: request.total_amount || null,
      items: items.map((it) => ({
        fk_item_category:
          it.id_item_category
          || categoryOptions.value.find((c) => c.label === it.category_name)?.value
          || null,
        category_label: it.category_name,
        item_name: it.item_name,
        quantity: it.quantity,
      })),
    };
  } catch (error) {
    console.error('Greška pri dohvaćanju:', error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Greška pri učitavanju zahtjeva.',
    });
    form.value = null;
  } finally {
    loading.value = false;
  }
};

const addItem = () => {
  if (
    !itemForm.value.category
    || !itemForm.value.item_name.trim()
    || !itemForm.value.quantity
    || itemForm.value.quantity < 1
  ) {
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
  if (form.value.justification.length > 1000) {
    $q.notify({ type: 'negative', message: 'Obrazloženje ne smije biti duže od 1000 znakova.' });
    return;
  }
  if (form.value.estimated_amount != null && form.value.estimated_amount < 0) {
    $q.notify({ type: 'negative', message: 'Procijenjeni iznos mora biti pozitivan.' });
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
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Greška pri spremanju.',
    });
  } finally {
    saving.value = false;
  }
};

const goBack = () => router.push(`/requests/${route.params.id}`);

onMounted(() => fetchData());
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
  max-width: 960px;
  margin: 0 auto;
}

/* ─────────────────────────────────
   Back link
   ───────────────────────────────── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 4px 0;
  font-family: inherit;
  font-size: 0.8125rem;
  color: #605E5C;
  cursor: pointer;
  margin-bottom: 8px;
  transition: color 0.15s;
}
.back-link:hover { color: #16294E; }

/* ─────────────────────────────────
   Page header
   ───────────────────────────────── */
.page-header {
  margin-bottom: 16px;
}

.page-header__main { flex: 1; min-width: 240px; }
.page-header__eyebrow {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #00AFDB;
  margin-bottom: 4px;
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
}

/* ─────────────────────────────────
   Loading
   ───────────────────────────────── */
.loading-block {
  display: flex;
  justify-content: center;
  padding: 48px 0;
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
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn--primary {
  background: #16294E;
  color: white;
  border-color: #16294E;
}
.btn--primary:hover:not(:disabled) { background: #0F1F3D; border-color: #0F1F3D; }

.btn--ghost {
  background: transparent;
  color: #424242;
  border-color: #C8C6C4;
}
.btn--ghost:hover:not(:disabled) { background: #F8F8F8; border-color: #605E5C; }

.icon-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #605E5C;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.icon-btn:hover { background: #F3F2F1; color: #201F1E; }
.icon-btn--danger:hover { background: #FDE7E9; color: #A4262C; }

/* ─────────────────────────────────
   Card
   ───────────────────────────────── */
.card {
  background: white;
  border: 1px solid #E1DFDD;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
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

.card__body { padding: 16px; }

/* ─────────────────────────────────
   Fields
   ───────────────────────────────── */
.field {
  margin-bottom: 14px;
}
.field:last-child { margin-bottom: 0; }

.field__label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #424242;
  margin-bottom: 6px;
  letter-spacing: 0.01em;
}

.field__hint {
  font-size: 0.75rem;
  color: #605E5C;
  margin-top: 6px;
  line-height: 1.4;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 700px) {
  .field-grid { grid-template-columns: 1fr; }
}

/* Quasar input M365 styling */
.field__input :deep(.q-field__control) {
  height: 36px;
  border-radius: 4px;
  background: white;
}
.field__input :deep(.q-field__native) {
  font-size: 0.8125rem;
  color: #201F1E;
}
.field__input :deep(.q-field__prepend) { color: #605E5C; }
.field__input :deep(.q-field__suffix) {
  font-size: 0.75rem;
  color: #605E5C;
}

.field__input--readonly :deep(.q-field__control) {
  background: #FAFAFA;
}
.field__input--readonly :deep(.q-field__native) { color: #605E5C; }

.field__input--textarea :deep(.q-field__control) {
  height: auto;
  min-height: 80px;
  padding-top: 6px;
  padding-bottom: 6px;
}
.field__input--textarea :deep(textarea) {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #201F1E;
}

/* ─────────────────────────────────
   Add item form
   ───────────────────────────────── */
.add-item {
  background: #F8F8F8;
  border: 1px solid #E1DFDD;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
}

.add-item__label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8A8886;
  margin-bottom: 8px;
}

.add-item__row {
  display: grid;
  grid-template-columns: 1fr 1.4fr 80px auto;
  gap: 8px;
  align-items: stretch;
}

@media (max-width: 700px) {
  .add-item__row {
    grid-template-columns: 1fr 1fr;
  }
  .add-item__btn {
    grid-column: 1 / -1;
  }
}

.add-item__category :deep(.q-field__control),
.add-item__name :deep(.q-field__control),
.add-item__qty :deep(.q-field__control) {
  height: 32px;
  border-radius: 4px;
  background: white;
}

.add-item__category :deep(.q-field__native),
.add-item__name :deep(.q-field__native),
.add-item__qty :deep(.q-field__native) {
  font-size: 0.8125rem;
}

.add-item__btn { height: 32px; }

/* ─────────────────────────────────
   Item list
   ───────────────────────────────── */
.item-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid #E1DFDD;
  border-radius: 4px;
  overflow: hidden;
  background: white;
}

.item-list__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #E1DFDD;
}
.item-list__row:last-child { border-bottom: none; }

.item-list__index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #E8EBF1;
  color: #16294E;
  font-size: 0.6875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.item-list__content { flex: 1; min-width: 0; }
.item-list__name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #201F1E;
  letter-spacing: -0.005em;
}
.item-list__category {
  font-size: 0.6875rem;
  color: #8A8886;
  margin-top: 1px;
}

.item-list__qty {
  font-size: 0.75rem;
  font-weight: 600;
  color: #00708A;
  background: #E1F5FA;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

/* ─────────────────────────────────
   Empty state
   ───────────────────────────────── */
.empty-block {
  text-align: center;
  padding: 32px 16px;
  border: 1px dashed #E1DFDD;
  border-radius: 4px;
  background: #FAFAFA;
}

.empty-block--page {
  padding: 56px 24px;
  background: white;
  border-radius: 6px;
  border: 1px solid #E1DFDD;
}

.empty-block__icon {
  color: #A19F9D;
  margin-bottom: 8px;
}

.empty-block__text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #424242;
}

.empty-block__hint {
  font-size: 0.75rem;
  color: #8A8886;
  margin-top: 4px;
}

/* ─────────────────────────────────
   Action bar
   ───────────────────────────────── */
.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #E1DFDD;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

@media (max-width: 600px) {
  .page { padding: 16px 12px 48px; }
  .action-bar { flex-direction: column-reverse; }
  .action-bar .btn { width: 100%; }
}
</style>
