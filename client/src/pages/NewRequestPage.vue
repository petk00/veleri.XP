<template>
  <q-page class="new-request-page q-pa-lg">
    <div class="page-shell">

      <section class="page-hero q-mb-xl">
        <div>
          <div class="text-overline text-primary text-weight-bold letter-spacing-wide">
            NOVI ZAHTJEV ZA NABAVU
          </div>
          <div class="text-h4 text-weight-bold q-mt-xs page-title">
            Pokretanje novog zahtjeva
          </div>
        </div>
        <q-btn
          flat no-caps color="primary" icon="arrow_back"
          label="Odustani"
          @click="$router.push('/requests')"
        />
      </section>

      <div v-if="loadingReferenceData" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="48px" />
      </div>

      <div v-else class="wizard-layout">

        <!-- SIDEBAR -->
        <div class="wizard-sidebar">
          <div
            v-for="s in currentSteps"
            :key="s.key"
            class="sidebar-step"
            :class="{
              'sidebar-step--active': step === s.step,
              'sidebar-step--done': step > s.step,
            }"
          >
            <div class="sidebar-step__indicator">
              <q-icon v-if="step > s.step" name="check" size="16px" />
              <span v-else>{{ s.number }}</span>
            </div>
            <div class="sidebar-step__label">{{ s.title }}</div>
          </div>
        </div>

        <!-- CONTENT -->
        <div class="wizard-content">
          <transition name="step-fade" mode="out-in">

            <!-- KORAK 1: Odjel -->
            <div v-if="step === 1" key="1">
              <div class="step-header">
                <div class="step-number">01</div>
                <div>
                  <div class="text-h5 text-weight-bold">Odaberite odjel, službu ili projekt</div>
                  <div class="text-body1 text-grey-6 q-mt-xs">
                    Za koji se odjel, službu ili projekt otvara zahtjev za nabavu?
                  </div>
                </div>
              </div>
              <div class="q-mt-xl">
                <q-select
                  v-model="form.department"
                  :options="departmentOptions"
                  outlined emit-value map-options
                  label="Odjel / Služba / Projekt"
                  class="field-lg"
                >
                  <template #prepend><q-icon name="business" color="primary" /></template>
                </q-select>
              </div>
            </div>

            <!-- KORAK 2: Imaš li ponudu? -->
            <div v-else-if="step === 2" key="2">
              <div class="step-header">
                <div class="step-number">02</div>
                <div>
                  <div class="text-h5 text-weight-bold">Imaš li ponudu ili račun?</div>
                  <div class="text-body1 text-grey-6 q-mt-xs">
                    Ovisno o odgovoru, nastavak zahtjeva će biti prilagođen.
                  </div>
                </div>
              </div>
              <div class="offer-choice q-mt-xl">
                <div
                  class="offer-option"
                  :class="{ 'offer-option--selected': form.hasOffer === true }"
                  @click="form.hasOffer = true"
                >
                  <q-icon name="receipt_long" size="28px" color="primary" />
                  <div>
                    <div class="text-weight-bold">Da, imam ponudu / račun</div>
                    <div class="text-caption text-grey-6">Mogu priložiti jednu ili više ponuda</div>
                  </div>
                  <q-icon v-if="form.hasOffer === true" name="check_circle" color="primary" size="22px" class="offer-option__check" />
                </div>

                <div
                  class="offer-option"
                  :class="{ 'offer-option--selected': form.hasOffer === false }"
                  @click="form.hasOffer = false; form.offerFiles = []; form.estimatedAmount = null"
                >
                  <q-icon name="format_list_bulleted" size="28px" color="grey-5" />
                  <div>
                    <div class="text-weight-bold">Nemam ponudu</div>
                    <div class="text-caption text-grey-6">Unijet ću stavke koje trebam nabaviti</div>
                  </div>
                  <q-icon v-if="form.hasOffer === false" name="check_circle" color="primary" size="22px" class="offer-option__check" />
                </div>
              </div>
            </div>

            <!-- KORAK 3a: IMA ponudu → Multiple upload + iznos + kategorija + svrha -->
            <div v-else-if="step === 3 && form.hasOffer === true" key="3a">
              <div class="step-header">
                <div class="step-number">03</div>
                <div>
                  <div class="text-h5 text-weight-bold">Detalji nabave</div>
                  <div class="text-body1 text-grey-6 q-mt-xs">
                    Priložite jednu ili više ponuda i unesite potrebne podatke.
                  </div>
                </div>
              </div>

              <div class="q-mt-xl row q-col-gutter-lg">

                <!-- Multiple upload ponuda -->
                <div class="col-12">
                  <div class="field-section-label">Ponude / računi</div>

                  <q-file
                    v-model="newOfferFile"
                    outlined
                    label="Dodaj ponudu"
                    class="field-lg"
                    @update:model-value="onAddOffer"
                  >
                    <template #prepend><q-icon name="attach_file" color="primary" /></template>
                    <template #hint>PDF, Word, Excel, slike — max 10MB po datoteci</template>
                  </q-file>

                  <!-- Lista dodanih ponuda -->
                  <div v-if="form.offerFiles.length > 0" class="offers-list q-mt-md">
                    <div
                      v-for="(file, index) in form.offerFiles"
                      :key="index"
                      class="offer-file-row"
                    >
                      <q-icon name="description" color="primary" size="20px" />
                      <div class="offer-file-row__name">{{ file.name }}</div>
                      <div class="offer-file-row__size">{{ formatFileSize(file.size) }}</div>
                      <q-btn
                        flat round dense
                        icon="close" color="grey-5" size="sm"
                        @click="removeOffer(index)"
                      />
                    </div>
                    <div class="offers-list__footer">
                      {{ form.offerFiles.length }} {{ form.offerFiles.length === 1 ? 'ponuda' : 'ponuda' }} dodano
                    </div>
                  </div>
                </div>

                <!-- Iznos (obavezan) -->
                <div class="col-12 col-md-6">
                  <div class="field-section-label">
                    Ukupni iznos *
                  </div>
                  <div class="amount-input-row">
                    <q-input
                      v-model.number="form.estimatedAmount"
                      type="number" min="0" step="0.01"
                      outlined
                      placeholder="0.00"
                      class="amount-input"
                    />
                    <div class="amount-input-currency">EUR</div>
                  </div>
                  <div class="amount-hint">
                    <q-icon name="info_outline" size="14px" class="q-mr-xs" />
                    <span v-if="form.offerFiles.length > 1">
                      Imate {{ form.offerFiles.length }} ponuda - upišite ukupni zbroj svih iznosa.
                    </span>
                    <span v-else>
                      Upišite iznos s ponude. Administrator može korigirati naknadno.
                    </span>
                  </div>
                </div>

                <!-- Kategorija -->
                <div class="col-12 col-md-6">
                  <div class="field-section-label">Kategorija nabave</div>
                  <q-select
                    v-model="form.category"
                    :options="categoryOptions"
                    label="Odaberi kategoriju"
                    outlined emit-value map-options
                  >
                    <template #prepend><q-icon name="category" color="primary" /></template>
                  </q-select>
                </div>

                <!-- Svrha -->
                <div class="col-12">
                  <div class="field-section-label">Svrha nabave</div>
                  <q-input
                    v-model="form.reasonName"
                    type="textarea"
                    outlined autogrow rows="4"
                    counter maxlength="1000"
                    placeholder="Opišite zašto se ova nabava vrši i čemu služi..."
                  />
                </div>

              </div>
            </div>

            <!-- KORAK 3b: NEMA ponudu → Stavke + svrha -->
            <div v-else-if="step === 3 && form.hasOffer === false" key="3b">
              <div class="step-header">
                <div class="step-number">03</div>
                <div>
                  <div class="text-h5 text-weight-bold">Stavke i svrha nabave</div>
                  <div class="text-body1 text-grey-6 q-mt-xs">
                    Navedite što trebate nabaviti i zašto.
                  </div>
                </div>
              </div>

              <div class="q-mt-xl">
                <div class="field-section-label">Svrha nabave</div>
                <q-input
                  v-model="form.reasonName"
                  type="textarea"
                  outlined autogrow rows="3"
                  counter maxlength="1000"
                  placeholder="Opišite zašto se ova nabava vrši i čemu služi..."
                  class="q-mb-lg"
                />

                <div class="field-section-label">Stavke zahtjeva</div>
                <div class="add-item-form q-mb-md">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-4">
                      <q-select
                        v-model="itemForm.category"
                        :options="categoryOptions"
                        label="Kategorija"
                        outlined dense emit-value map-options
                      />
                    </div>
                    <div class="col-12 col-md-5">
                      <q-input
                        v-model="itemForm.item_name"
                        label="Naziv artikla / usluge"
                        outlined dense
                        @keyup.enter="addItem"
                      />
                    </div>
                    <div class="col-12 col-md-2">
                      <q-input
                        v-model.number="itemForm.quantity"
                        label="Kol." type="number" min="1"
                        outlined dense
                      />
                    </div>
                    <div class="col-12 col-md-1 flex items-center">
                      <q-btn unelevated round color="primary" icon="add" size="md" @click="addItem">
                        <q-tooltip>Dodaj stavku</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
                </div>

                <div class="items-list">
                  <div v-if="form.items.length === 0" class="items-empty">
                    <q-icon name="inventory_2" size="36px" color="grey-4" />
                    <div class="text-grey-5 q-mt-sm">Još nema dodanih stavki</div>
                  </div>

                  <transition-group name="item-list" tag="div">
                    <div v-for="(item, index) in form.items" :key="index" class="item-row">
                      <div class="item-row__index">{{ index + 1 }}</div>
                      <div class="item-row__content">
                        <div class="text-weight-medium">{{ item.item_name }}</div>
                        <div class="text-caption text-grey-6">{{ item.category_label }}</div>
                      </div>
                      <div class="item-row__quantity">
                        <q-chip dense color="primary" text-color="white" size="sm">× {{ item.quantity }}</q-chip>
                      </div>
                      <q-btn flat round dense icon="close" color="grey-5" size="sm" @click="removeItem(index)" />
                    </div>
                  </transition-group>

                  <div v-if="form.items.length > 0" class="items-footer">
                    {{ form.items.length }} {{ form.items.length === 1 ? 'stavka' : 'stavki' }} ukupno
                  </div>
                </div>
              </div>
            </div>

            <!-- KORAK 4: Pregled -->
            <div v-else-if="step === 4" key="4">
              <div class="step-header">
                <div class="step-number">04</div>
                <div>
                  <div class="text-h5 text-weight-bold">Pregled zahtjeva</div>
                  <div class="text-body1 text-grey-6 q-mt-xs">
                    Provjerite unesene podatke prije slanja.
                  </div>
                </div>
              </div>

              <div class="review-grid q-mt-xl">

                <div class="review-meta">
                  <div class="review-field">
                    <div class="review-field__label">Odjel / Služba / Projekt</div>
                    <div class="review-field__value">{{ selectedDepartmentLabel || '-' }}</div>
                  </div>
                  <div class="review-field">
                    <div class="review-field__label">Svrha nabave</div>
                    <div class="review-field__value review-field__value--multiline">{{ form.reasonName || '-' }}</div>
                  </div>
                  <div class="review-field">
                    <div class="review-field__label">Ponude / Računi</div>
                    <div class="review-field__value">
                      <div v-if="form.hasOffer === true && form.offerFiles.length > 0">
                        <div v-for="(file, index) in form.offerFiles" :key="index" class="text-positive" style="margin-bottom: 4px;">
                          <q-icon name="check_circle" size="16px" class="q-mr-xs" />{{ file.name }}
                        </div>
                      </div>
                      <span v-else class="text-grey-6">
                        <q-icon name="schedule" size="16px" class="q-mr-xs" />Bez ponude — dodaje se naknadno
                      </span>
                    </div>
                  </div>
                  <div v-if="form.estimatedAmount" class="review-field">
                    <div class="review-field__label">Ukupni iznos</div>
                    <div class="review-field__value">{{ formatCurrency(form.estimatedAmount) }}</div>
                  </div>
                </div>

                <div class="review-items">
                  <div class="review-items__header">
                    <span v-if="form.hasOffer === false">Stavke zahtjeva</span>
                    <span v-else>Kategorija</span>
                    <q-badge v-if="form.hasOffer === false" color="primary" class="q-ml-sm">{{ form.items.length }}</q-badge>
                  </div>
                  <div class="review-items__list">
                    <div v-if="form.hasOffer === true" class="review-item-row">
                      <span class="review-item-row__index">—</span>
                      <span class="review-item-row__name">{{ selectedCategoryLabel || '-' }}</span>
                    </div>
                    <div v-else v-for="(item, index) in form.items" :key="index" class="review-item-row">
                      <span class="review-item-row__index">{{ index + 1 }}.</span>
                      <span class="review-item-row__name">{{ item.item_name }}</span>
                      <span class="review-item-row__category">{{ item.category_label }}</span>
                      <span class="review-item-row__qty">× {{ item.quantity }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </transition>

          <!-- NAV -->
          <div class="wizard-nav q-mt-xl">
            <q-btn
              v-if="step > 1"
              flat no-caps color="grey-7"
              icon="arrow_back" label="Natrag"
              :disable="submitting"
              @click="step--"
            />
            <div v-else />

            <div class="row q-gutter-sm">
              <q-btn
                v-if="step < 4"
                unelevated no-caps color="primary"
                icon-right="arrow_forward" label="Dalje"
                @click="nextStep"
              />
              <q-btn
                v-else
                unelevated no-caps color="primary"
                icon="send" label="Pošalji na obradu"
                size="lg"
                :loading="submitting"
                :disable="submitting"
                @click="submitWizard"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { api } from 'boot/axios';

const $q = useQuasar();
const router = useRouter();

const step = ref(1);
const loadingReferenceData = ref(false);
const submitting = ref(false);

const activeFiscalYear = ref('');
const activeFiscalYearId = ref(null);
const departmentOptions = ref([]);
const categoryOptions = ref([]);

const newOfferFile = ref(null);

const form = ref({
  department: null,
  hasOffer: null,
  offerFiles: [],
  estimatedAmount: null,
  category: null,
  reasonName: '',
  items: [],
});

const itemForm = ref({ category: null, item_name: '', quantity: 1 });

const currentSteps = computed(() => {
  if (form.value.hasOffer === true) {
    return [
      { key: 'odjel',   step: 1, number: '01', title: 'Odjel' },
      { key: 'ponuda',  step: 2, number: '02', title: 'Ponuda' },
      { key: 'detalji', step: 3, number: '03', title: 'Detalji' },
      { key: 'pregled', step: 4, number: '04', title: 'Pregled' },
    ];
  }
  if (form.value.hasOffer === false) {
    return [
      { key: 'odjel',   step: 1, number: '01', title: 'Odjel' },
      { key: 'ponuda',  step: 2, number: '02', title: 'Ponuda' },
      { key: 'stavke',  step: 3, number: '03', title: 'Stavke' },
      { key: 'pregled', step: 4, number: '04', title: 'Pregled' },
    ];
  }
  return [
    { key: 'odjel',   step: 1, number: '01', title: 'Odjel' },
    { key: 'ponuda',  step: 2, number: '02', title: 'Ponuda' },
    { key: 'detalji', step: 3, number: '03', title: 'Detalji' },
    { key: 'pregled', step: 4, number: '04', title: 'Pregled' },
  ];
});

const selectedDepartmentLabel = computed(() =>
  departmentOptions.value.find((x) => x.value === form.value.department)?.label || ''
);

const selectedCategoryLabel = computed(() =>
  categoryOptions.value.find((x) => x.value === form.value.category)?.label || ''
);

const fetchReferenceData = async () => {
  loadingReferenceData.value = true;
  try {
    const [fiscalYearRes, departmentsRes, categoriesRes] = await Promise.all([
      api.get('/reference/active-fiscal-year'),
      api.get('/reference/departments'),
      api.get('/reference/item-categories'),
    ]);
    activeFiscalYear.value = fiscalYearRes.data.year?.toString() || '';
    activeFiscalYearId.value = fiscalYearRes.data.id_fiscal_year;
    departmentOptions.value = departmentsRes.data.map((d) => ({ label: d.name, value: d.id_department }));
    categoryOptions.value = categoriesRes.data.map((c) => ({ label: c.name, value: c.id_item_category }));
  } catch (error) {
    console.error('Greška:', error);
    $q.notify({ type: 'negative', message: 'Greška pri dohvaćanju podataka.' });
  } finally {
    loadingReferenceData.value = false;
  }
};

// Kad user odabere novu ponudu, dodaj je u listu i resetiraj input
const onAddOffer = (file) => {
  if (!file) return;
  form.value.offerFiles.push(file);
  newOfferFile.value = null;
};

const removeOffer = (index) => form.value.offerFiles.splice(index, 1);

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const nextStep = () => {
  if (step.value === 1 && !form.value.department) {
    $q.notify({ type: 'negative', message: 'Odaberite odjel, službu ili projekt.' });
    return;
  }

  if (step.value === 2 && form.value.hasOffer === null) {
    $q.notify({ type: 'negative', message: 'Odaberite jednu od opcija.' });
    return;
  }

  // Korak 3a - IMA ponudu
  if (step.value === 3 && form.value.hasOffer === true) {
    if (form.value.offerFiles.length === 0) {
      $q.notify({ type: 'negative', message: 'Priložite barem jednu ponudu.' });
      return;
    }
    if (!form.value.estimatedAmount || form.value.estimatedAmount <= 0) {
      $q.notify({ type: 'negative', message: 'Ukupni iznos je obavezan kad imate ponudu.' });
      return;
    }
    if (!form.value.category) {
      $q.notify({ type: 'negative', message: 'Odaberite kategoriju nabave.' });
      return;
    }
    if (!form.value.reasonName.trim()) {
      $q.notify({ type: 'negative', message: 'Unesite svrhu nabave.' });
      return;
    }
  }

  // Korak 3b - NEMA ponudu
  if (step.value === 3 && form.value.hasOffer === false) {
    if (!form.value.reasonName.trim()) {
      $q.notify({ type: 'negative', message: 'Unesite svrhu nabave.' });
      return;
    }
    if (form.value.items.length === 0) {
      $q.notify({ type: 'negative', message: 'Dodajte barem jednu stavku.' });
      return;
    }
  }

  if (step.value < 4) step.value++;
};

const addItem = () => {
  if (!itemForm.value.category || !itemForm.value.item_name.trim() || !itemForm.value.quantity || itemForm.value.quantity < 1) {
    $q.notify({ type: 'negative', message: 'Ispunite kategoriju, naziv i količinu.' });
    return;
  }
  const category = categoryOptions.value.find((x) => x.value === itemForm.value.category);
  form.value.items.push({
    category: itemForm.value.category,
    category_label: category?.label || '',
    item_name: itemForm.value.item_name.trim(),
    quantity: itemForm.value.quantity,
  });
  itemForm.value = { category: null, item_name: '', quantity: 1 };
};

const removeItem = (index) => form.value.items.splice(index, 1);

const formatCurrency = (value) => {
  if (value == null || value === '') return '-';
  return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(Number(value));
};

const submitWizard = async () => {
  submitting.value = true;

  const items = form.value.hasOffer === true
    ? [{ fk_item_category: form.value.category, item_name: selectedCategoryLabel.value, quantity: 1 }]
    : form.value.items.map((it) => ({ fk_item_category: it.category, item_name: it.item_name, quantity: it.quantity }));

  const payload = {
    fk_fiscal_year: activeFiscalYearId.value,
    fk_department: form.value.department,
    justification: form.value.reasonName.trim(),
    estimated_amount: form.value.estimatedAmount || null,
    save_mode: 'submit',
    items,
  };

  try {
    const { data } = await api.post('/requests', payload);

    // Upload svih ponuda jedna po jedna
    if (form.value.hasOffer === true && form.value.offerFiles.length > 0) {
      for (const file of form.value.offerFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('document_type', 'Ponuda');
          await api.post(`/requests/${data.id_purchase_request}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (uploadError) {
          console.error('Upload failed for file:', file.name, uploadError);
          $q.notify({
            type: 'warning',
            message: `Zahtjev ${data.request_number} kreiran, ali upload "${file.name}" nije uspio.`,
            timeout: 5000,
          });
        }
      }
    }

    $q.notify({ type: 'positive', message: `Zahtjev ${data.request_number} uspješno poslan na obradu.`, timeout: 2500 });
    router.push('/requests');
  } catch (error) {
    console.error('Greška:', error);
    const message = error.response?.data?.message || 'Greška pri kreiranju zahtjeva.';
    $q.notify({ type: 'negative', message, timeout: 4000 });
  } finally {
    submitting.value = false;
  }
};

onMounted(() => { fetchReferenceData(); });
</script>

<style scoped>
.new-request-page {
  background: linear-gradient(160deg, #f0f4ff 0%, #f8fafc 50%, #f4f7fb 100%);
  min-height: 100vh;
}

.page-shell { max-width: 1100px; margin: 0 auto; }

.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.page-title { letter-spacing: -0.03em; }
.letter-spacing-wide { letter-spacing: 0.08em; }

.wizard-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 32px;
  align-items: start;
}

.wizard-sidebar {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 24px 0;
}

.sidebar-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 12px;
  transition: background 0.2s;
}

.sidebar-step__indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.sidebar-step__label {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
  transition: color 0.2s;
}

.sidebar-step--active { background: rgba(25, 118, 210, 0.06); }
.sidebar-step--active .sidebar-step__indicator { background: #1976d2; color: white; }
.sidebar-step--active .sidebar-step__label { color: #1976d2; font-weight: 700; }
.sidebar-step--done .sidebar-step__indicator { background: #dcfce7; color: #16a34a; }
.sidebar-step--done .sidebar-step__label { color: #64748b; }

.wizard-content {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.06);
  padding: 40px 48px;
  min-height: 480px;
  display: flex;
  flex-direction: column;
}

.step-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.step-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: rgba(25, 118, 210, 0.12);
  letter-spacing: -0.05em;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}

.field-lg { max-width: 480px; }

.field-section-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin-bottom: 8px;
}

/* Lista ponuda */
.offers-list {
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
}

.offer-file-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
}

.offer-file-row:last-of-type { border-bottom: none; }

.offer-file-row__name {
  flex: 1;
  font-size: 0.875rem;
  color: #0f172a;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offer-file-row__size {
  font-size: 0.75rem;
  color: #94a3b8;
  flex-shrink: 0;
}

.offers-list__footer {
  padding: 8px 14px;
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: right;
  border-top: 1px solid rgba(15, 23, 42, 0.04);
  background: white;
}

.add-item-form {
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  padding: 20px;
}

.items-list {
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  overflow: hidden;
}

.items-empty { padding: 40px; text-align: center; }

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
  transition: background 0.15s;
}
.item-row:last-child { border-bottom: none; }
.item-row:hover { background: #f8fafc; }

.item-row__index {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: #f1f5f9; color: #64748b;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.item-row__content { flex: 1; }
.item-row__quantity { flex-shrink: 0; }

.items-footer {
  padding: 10px 16px;
  background: #f8fafc;
  font-size: 0.8rem;
  color: #94a3b8;
  text-align: right;
  border-top: 1px solid rgba(15, 23, 42, 0.04);
}

.amount-input-row { display: flex; align-items: center; gap: 12px; }
.amount-input { flex: 1; max-width: 280px; }
.amount-input-currency { font-size: 1.25rem; font-weight: 700; color: #1976d2; }
.amount-hint { margin-top: 10px; font-size: 0.8rem; color: #94a3b8; line-height: 1.5; display: flex; align-items: flex-start; }

.offer-choice { display: flex; flex-direction: column; gap: 12px; max-width: 480px; }

.offer-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.offer-option:hover { border-color: #93c5fd; background: #f0f9ff; }
.offer-option--selected { border-color: #1976d2; background: rgba(25, 118, 210, 0.04); }
.offer-option__check { margin-left: auto; }

.review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

.review-meta {
  display: flex; flex-direction: column;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  overflow: hidden;
}

.review-field { padding: 14px 20px; border-bottom: 1px solid rgba(15, 23, 42, 0.05); }
.review-field:last-child { border-bottom: none; }
.review-field__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 4px; }
.review-field__value { font-size: 0.95rem; font-weight: 600; color: #0f172a; }
.review-field__value--multiline { white-space: pre-wrap; font-weight: 400; color: #334155; line-height: 1.5; }

.review-items {
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  overflow: hidden;
}

.review-items__header {
  padding: 14px 20px;
  font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
  color: #94a3b8;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  display: flex; align-items: center;
}

.review-items__list { padding: 8px 0; }

.review-item-row {
  display: grid;
  grid-template-columns: 24px 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  font-size: 0.875rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
  user-select: text;
}
.review-item-row:last-child { border-bottom: none; }
.review-item-row__index { color: #94a3b8; font-size: 0.75rem; }
.review-item-row__name { font-weight: 600; color: #0f172a; }
.review-item-row__category { color: #94a3b8; font-size: 0.75rem; }
.review-item-row__qty { font-weight: 700; color: #1976d2; white-space: nowrap; }

.wizard-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 32px; margin-top: auto;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.step-fade-enter-active, .step-fade-leave-active { transition: all 0.2s ease; }
.step-fade-enter-from { opacity: 0; transform: translateX(12px); }
.step-fade-leave-to { opacity: 0; transform: translateX(-12px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.item-list-enter-active { transition: all 0.2s ease; }
.item-list-enter-from { opacity: 0; transform: translateY(-8px); }

@media (max-width: 768px) {
  .wizard-layout { grid-template-columns: 1fr; }
  .wizard-sidebar { display: none; }
  .wizard-content { padding: 24px 20px; }
  .review-grid { grid-template-columns: 1fr; }
  .step-number { font-size: 1.8rem; }
}
</style>