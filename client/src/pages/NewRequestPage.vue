<template>
  <q-page class="new-request-page q-pa-lg">
    <div class="page-shell">

      <section class="page-hero">
        <div>
          <div class="page-eyebrow">NOVI ZAHTJEV ZA NABAVU</div>
          <div class="page-title">Pokretanje novog zahtjeva</div>
        </div>
        <q-btn flat no-caps class="back-btn" icon="arrow_back" label="Odustani"
          @click="$router.push('/requests')" />
      </section>

      <div v-if="loadingReferenceData" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="36px" />
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
            <div class="sidebar-step__dot">
              <q-icon v-if="step > s.step" name="check" size="12px" />
              <span v-else>{{ s.number }}</span>
            </div>
            <div class="sidebar-step__label">{{ s.title }}</div>
          </div>
        </div>

        <!-- CONTENT -->
        <div class="wizard-content">
          <transition name="step-fade" mode="out-in">

            <!-- KORAK 1 -->
            <div v-if="step === 1" key="1">
              <div class="step-header">
                <div class="step-number">01</div>
                <div>
                  <div class="step-title">Odaberite odjel, službu ili projekt</div>
                  <div class="step-desc">Za koji se odjel, službu ili projekt otvara zahtjev za nabavu?</div>
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
                  <template #prepend><q-icon name="business" style="color:#00AFDB" /></template>
                </q-select>
              </div>
            </div>

            <!-- KORAK 2 -->
            <div v-else-if="step === 2" key="2">
              <div class="step-header">
                <div class="step-number">02</div>
                <div>
                  <div class="step-title">Imaš li ponudu ili račun?</div>
                  <div class="step-desc">Ovisno o odgovoru, nastavak zahtjeva će biti prilagođen.</div>
                </div>
              </div>
              <div class="offer-choice q-mt-xl">
                <div
                  class="offer-option"
                  :class="{ 'offer-option--selected': form.hasOffer === true }"
                  @click="form.hasOffer = true"
                >
                  <q-icon name="receipt_long" size="22px" style="color:#00AFDB;flex-shrink:0;" />
                  <div class="offer-option__text">
                    <div class="offer-option__title">Da, imam ponudu / račun</div>
                    <div class="offer-option__desc">Mogu priložiti jednu ili više ponuda</div>
                  </div>
                  <q-icon v-if="form.hasOffer === true" name="check_circle" size="18px" style="color:#00AFDB;margin-left:auto;flex-shrink:0;" />
                </div>

                <div
                  class="offer-option"
                  :class="{ 'offer-option--selected': form.hasOffer === false }"
                  @click="form.hasOffer = false; form.offerFiles = []; form.estimatedAmount = null"
                >
                  <q-icon name="format_list_bulleted" size="22px" style="color:#86868B;flex-shrink:0;" />
                  <div class="offer-option__text">
                    <div class="offer-option__title">Nemam ponudu</div>
                    <div class="offer-option__desc">Unijet ću stavke koje trebam nabaviti</div>
                  </div>
                  <q-icon v-if="form.hasOffer === false" name="check_circle" size="18px" style="color:#00AFDB;margin-left:auto;flex-shrink:0;" />
                </div>
              </div>
            </div>

            <!-- KORAK 3a: IMA ponudu -->
            <div v-else-if="step === 3 && form.hasOffer === true" key="3a">
              <div class="step-header">
                <div class="step-number">03</div>
                <div>
                  <div class="step-title">Detalji nabave</div>
                  <div class="step-desc">Priložite jednu ili više ponuda i unesite potrebne podatke.</div>
                </div>
              </div>

              <div class="q-mt-xl row q-col-gutter-lg">
                <div class="col-12">
                  <div class="field-label">Ponude / računi</div>
                  <q-file v-model="newOfferFile" outlined label="Dodaj ponudu" class="field-lg"
                    @update:model-value="onAddOffer">
                    <template #prepend><q-icon name="attach_file" style="color:#00AFDB" /></template>
                    <template #hint>PDF, Word, Excel, slike — max 10MB po datoteci</template>
                  </q-file>

                  <div v-if="form.offerFiles.length > 0" class="offers-list q-mt-md">
                    <div v-for="(file, index) in form.offerFiles" :key="index" class="offer-file-row">
                      <q-icon name="description" style="color:#00AFDB" size="17px" />
                      <div class="offer-file-row__name">{{ file.name }}</div>
                      <div class="offer-file-row__size">{{ formatFileSize(file.size) }}</div>
                      <q-btn flat round dense icon="close" size="sm" style="color:#AEAEB2"
                        @click="removeOffer(index)" />
                    </div>
                    <div class="offers-list__footer">
                      {{ form.offerFiles.length }} ponuda dodano
                    </div>
                  </div>
                </div>

                <div class="col-12 col-md-6">
                  <div class="field-label">Ukupni iznos *</div>
                  <div class="amount-row">
                    <q-input v-model.number="form.estimatedAmount" type="number" min="0" step="0.01"
                      outlined placeholder="0.00" class="amount-input" />
                    <div class="amount-currency">EUR</div>
                  </div>
                  <div class="field-hint">
                    <q-icon name="info_outline" size="13px" />
                    <span v-if="form.offerFiles.length > 1">Imate {{ form.offerFiles.length }} ponuda — upišite ukupni zbroj.</span>
                    <span v-else>Upišite iznos s ponude. Administrator može korigirati naknadno.</span>
                  </div>
                </div>

                <div class="col-12 col-md-6">
                  <div class="field-label">Kategorija nabave</div>
                  <q-select v-model="form.category" :options="categoryOptions" label="Odaberi kategoriju"
                    outlined emit-value map-options>
                    <template #prepend><q-icon name="category" style="color:#00AFDB" /></template>
                  </q-select>
                </div>

                <div class="col-12">
                  <div class="field-label">Svrha nabave</div>
                  <q-input v-model="form.reasonName" type="textarea" outlined autogrow rows="4"
                    counter maxlength="1000" placeholder="Opišite zašto se ova nabava vrši i čemu služi..." />
                </div>
              </div>
            </div>

            <!-- KORAK 3b: NEMA ponudu -->
            <div v-else-if="step === 3 && form.hasOffer === false" key="3b">
              <div class="step-header">
                <div class="step-number">03</div>
                <div>
                  <div class="step-title">Stavke i svrha nabave</div>
                  <div class="step-desc">Navedite što trebate nabaviti i zašto.</div>
                </div>
              </div>

              <div class="q-mt-xl">
                <div class="field-label">Svrha nabave</div>
                <q-input v-model="form.reasonName" type="textarea" outlined autogrow rows="3"
                  counter maxlength="1000" placeholder="Opišite zašto se ova nabava vrši i čemu služi..."
                  class="q-mb-lg" />

                <div class="field-label">Stavke zahtjeva</div>
                <div class="add-item-form q-mb-md">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-4">
                      <q-select v-model="itemForm.category" :options="categoryOptions" label="Kategorija"
                        outlined dense emit-value map-options />
                    </div>
                    <div class="col-12 col-md-5">
                      <q-input v-model="itemForm.item_name" label="Naziv artikla / usluge"
                        outlined dense @keyup.enter="addItem" />
                    </div>
                    <div class="col-12 col-md-2">
                      <q-input v-model.number="itemForm.quantity" label="Kol." type="number" min="1"
                        outlined dense />
                    </div>
                    <div class="col-12 col-md-1 flex items-center">
                      <q-btn unelevated round color="primary" icon="add" size="md" style="background:#16294E!important"
                        @click="addItem">
                        <q-tooltip>Dodaj stavku</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
                </div>

                <div class="items-list">
                  <div v-if="form.items.length === 0" class="items-empty">
                    <q-icon name="inventory_2" size="26px" style="color:#AEAEB2" />
                    <div class="items-empty__text">Još nema dodanih stavki</div>
                  </div>

                  <transition-group name="item-list" tag="div">
                    <div v-for="(item, index) in form.items" :key="index" class="item-row">
                      <div class="item-row__index">{{ index + 1 }}</div>
                      <div class="item-row__content">
                        <div class="item-row__name">{{ item.item_name }}</div>
                        <div class="item-row__cat">{{ item.category_label }}</div>
                      </div>
                      <q-chip dense color="primary" text-color="white" size="sm"
                        style="background:#16294E!important">× {{ item.quantity }}</q-chip>
                      <q-btn flat round dense icon="close" size="sm" style="color:#AEAEB2"
                        @click="removeItem(index)" />
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
                  <div class="step-title">Pregled zahtjeva</div>
                  <div class="step-desc">Provjerite unesene podatke prije slanja.</div>
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
                    <div class="review-field__value review-field__value--multi">{{ form.reasonName || '-' }}</div>
                  </div>
                  <div class="review-field">
                    <div class="review-field__label">Ponude / Računi</div>
                    <div class="review-field__value">
                      <div v-if="form.hasOffer === true && form.offerFiles.length > 0">
                        <div v-for="(file, index) in form.offerFiles" :key="index" class="review-file">
                          <q-icon name="check_circle" size="14px" style="color:#065F46" />{{ file.name }}
                        </div>
                      </div>
                      <span v-else class="review-no-offer">
                        <q-icon name="schedule" size="14px" /> Bez ponude — dodaje se naknadno
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
                    <q-badge v-if="form.hasOffer === false" style="background:#00AFDB" class="q-ml-sm">{{ form.items.length }}</q-badge>
                  </div>
                  <div class="review-items__list">
                    <div v-if="form.hasOffer === true" class="review-item-row">
                      <span class="review-item-row__i">—</span>
                      <span class="review-item-row__name">{{ selectedCategoryLabel || '-' }}</span>
                    </div>
                    <div v-else v-for="(item, index) in form.items" :key="index" class="review-item-row">
                      <span class="review-item-row__i">{{ index + 1 }}.</span>
                      <span class="review-item-row__name">{{ item.item_name }}</span>
                      <span class="review-item-row__cat">{{ item.category_label }}</span>
                      <span class="review-item-row__qty">× {{ item.quantity }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </transition>

          <!-- NAV -->
          <div class="wizard-nav">
            <q-btn v-if="step > 1" flat no-caps class="nav-back-btn"
              icon="arrow_back" label="Natrag" :disable="submitting" @click="step--" />
            <div v-else />

            <q-btn v-if="step < 4" unelevated no-caps icon-right="arrow_forward" label="Dalje"
              class="nav-next-btn" @click="nextStep" />
            <q-btn v-else unelevated no-caps icon="send" label="Pošalji na obradu"
              class="nav-submit-btn" :loading="submitting" :disable="submitting"
              @click="submitWizard" />
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
    { key: 'koraci',  step: 3, number: '03', title: 'Detalji' },
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
  if (step.value === 3 && form.value.hasOffer === true) {
    if (form.value.offerFiles.length === 0) { $q.notify({ type: 'negative', message: 'Priložite barem jednu ponudu.' }); return; }
    if (!form.value.estimatedAmount || form.value.estimatedAmount <= 0) { $q.notify({ type: 'negative', message: 'Ukupni iznos je obavezan kad imate ponudu.' }); return; }
    if (!form.value.category) { $q.notify({ type: 'negative', message: 'Odaberite kategoriju nabave.' }); return; }
    if (!form.value.reasonName.trim()) { $q.notify({ type: 'negative', message: 'Unesite svrhu nabave.' }); return; }
  }
  if (step.value === 3 && form.value.hasOffer === false) {
    if (!form.value.reasonName.trim()) { $q.notify({ type: 'negative', message: 'Unesite svrhu nabave.' }); return; }
    if (form.value.items.length === 0) { $q.notify({ type: 'negative', message: 'Dodajte barem jednu stavku.' }); return; }
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
          $q.notify({ type: 'warning', message: `Zahtjev ${data.request_number} kreiran, ali upload "${file.name}" nije uspio.`, timeout: 5000 });
        }
      }
    }
    $q.notify({ type: 'positive', message: `Zahtjev ${data.request_number} uspješno poslan na obradu.`, timeout: 2500 });
    router.push('/requests');
  } catch (error) {
    console.error('Greška:', error);
    $q.notify({ type: 'negative', message: error.response?.data?.message || 'Greška pri kreiranju zahtjeva.', timeout: 4000 });
  } finally {
    submitting.value = false;
  }
};

onMounted(() => { fetchReferenceData(); });
</script>

<style scoped>
.new-request-page {
  background: #F5F5F7;
  min-height: 100vh;
}

.page-shell {
  max-width: 1100px;
  margin: 0 auto;
}

.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding-top: 20px;
  margin-bottom: 28px;
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
}

.back-btn {
  color: #6E6E73 !important;
  font-size: 0.875rem;
}

.wizard-layout {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 28px;
  align-items: start;
}

.wizard-sidebar {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 20px 0;
}

.sidebar-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  transition: background 0.15s;
}

.sidebar-step__dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0,0,0,0.07);
  color: #86868B;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.sidebar-step__label {
  font-size: 0.8rem;
  color: #86868B;
  font-weight: 500;
}

.sidebar-step--active { background: rgba(0, 175, 219, 0.08); }
.sidebar-step--active .sidebar-step__dot { background: #00AFDB; color: white; }
.sidebar-step--active .sidebar-step__label { color: #00AFDB; font-weight: 600; }
.sidebar-step--done .sidebar-step__dot { background: rgba(0,175,219,0.15); color: #00AFDB; }
.sidebar-step--done .sidebar-step__label { color: #AEAEB2; }

.wizard-content {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 18px;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 4px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.06);
  padding: 36px 40px;
  min-height: 460px;
  display: flex;
  flex-direction: column;
}

.step-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.step-number {
  font-size: 2rem;
  font-weight: 800;
  color: rgba(0, 175, 219, 0.15);
  letter-spacing: -0.05em;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1D1D1F;
  letter-spacing: -0.02em;
  margin-bottom: 5px;
}

.step-desc {
  font-size: 0.875rem;
  color: #6E6E73;
  line-height: 1.5;
}

.field-lg { max-width: 480px; }

.field-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #86868B;
  margin-bottom: 8px;
}

.field-hint {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin-top: 8px;
  font-size: 0.78rem;
  color: #86868B;
  line-height: 1.4;
}

.offers-list {
  background: rgba(245,245,247,0.7);
  border-radius: 10px;
  border: 0.5px solid rgba(0,0,0,0.07);
  overflow: hidden;
}

.offer-file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 13px;
  border-bottom: 0.5px solid rgba(0,0,0,0.05);
}
.offer-file-row:last-of-type { border-bottom: none; }
.offer-file-row__name { flex:1; font-size:0.875rem; color:#1D1D1F; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.offer-file-row__size { font-size:0.75rem; color:#86868B; flex-shrink:0; }
.offers-list__footer { padding:7px 13px; font-size:0.75rem; color:#86868B; text-align:right; border-top:0.5px solid rgba(0,0,0,0.05); background:white; }

.add-item-form {
  background: rgba(245,245,247,0.7);
  border: 0.5px solid rgba(0,0,0,0.07);
  border-radius: 10px;
  padding: 16px;
}

.items-list {
  border: 0.5px solid rgba(0,0,0,0.08);
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.items-empty { padding: 32px; text-align: center; }
.items-empty__text { font-size: 0.875rem; color: #86868B; margin-top: 8px; }

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 0.5px solid rgba(0,0,0,0.05);
  transition: background 0.1s;
}
.item-row:last-child { border-bottom: none; }
.item-row:hover { background: rgba(0,175,219,0.03); }

.item-row__index {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: rgba(0,0,0,0.05);
  color: #86868B;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.item-row__content { flex: 1; }
.item-row__name { font-size: 0.875rem; font-weight: 500; color: #1D1D1F; }
.item-row__cat { font-size: 0.75rem; color: #86868B; }

.items-footer {
  padding: 8px 14px;
  font-size: 0.75rem;
  color: #86868B;
  text-align: right;
  border-top: 0.5px solid rgba(0,0,0,0.05);
  background: rgba(245,245,247,0.5);
}

.amount-row { display: flex; align-items: center; gap: 10px; }
.amount-input { flex: 1; max-width: 260px; }
.amount-currency { font-size: 1rem; font-weight: 700; color: #16294E; }

.offer-choice { display: flex; flex-direction: column; gap: 10px; max-width: 480px; }

.offer-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border: 0.5px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  background: white;
}
.offer-option:hover { border-color: rgba(0,175,219,0.4); background: rgba(0,175,219,0.03); }
.offer-option--selected { border-color: #00AFDB; background: rgba(0,175,219,0.05); }
.offer-option__text { flex: 1; }
.offer-option__title { font-size: 0.9rem; font-weight: 600; color: #1D1D1F; margin-bottom: 2px; letter-spacing: -0.01em; }
.offer-option__desc { font-size: 0.8rem; color: #6E6E73; }

.review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.review-meta {
  background: rgba(245,245,247,0.7);
  border: 0.5px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  overflow: hidden;
}

.review-field { padding: 12px 16px; border-bottom: 0.5px solid rgba(0,0,0,0.05); }
.review-field:last-child { border-bottom: none; }
.review-field__label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.09em; color: #86868B; margin-bottom: 4px; }
.review-field__value { font-size: 0.875rem; font-weight: 600; color: #1D1D1F; }
.review-field__value--multi { white-space: pre-wrap; font-weight: 400; color: #424245; line-height: 1.5; }
.review-file { font-size: 0.875rem; color: #065F46; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
.review-no-offer { font-size: 0.875rem; color: #86868B; display: flex; align-items: center; gap: 5px; }

.review-items {
  background: rgba(245,245,247,0.7);
  border: 0.5px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  overflow: hidden;
}

.review-items__header {
  padding: 12px 16px;
  font-size: 0.7rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.09em;
  color: #86868B;
  border-bottom: 0.5px solid rgba(0,0,0,0.05);
  display: flex; align-items: center;
}

.review-items__list { padding: 6px 0; }

.review-item-row {
  display: grid;
  grid-template-columns: 22px 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 0.875rem;
  border-bottom: 0.5px solid rgba(0,0,0,0.04);
}
.review-item-row:last-child { border-bottom: none; }
.review-item-row__i { color: #86868B; font-size: 0.75rem; }
.review-item-row__name { font-weight: 600; color: #1D1D1F; }
.review-item-row__cat { color: #86868B; font-size: 0.75rem; }
.review-item-row__qty { font-weight: 700; color: #00AFDB; white-space: nowrap; }

.wizard-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 28px; margin-top: auto;
  border-top: 0.5px solid rgba(0,0,0,0.07);
}

.nav-back-btn { color: #6E6E73 !important; font-size: 0.875rem; }

.nav-next-btn, .nav-submit-btn {
  border-radius: 980px;
  padding: 10px 22px;
  font-weight: 600;
  font-size: 0.875rem;
  background: #16294E !important;
  color: white !important;
  letter-spacing: -0.01em;
  box-shadow: 0 2px 8px rgba(22,41,78,0.22);
  transition: opacity 0.2s;
}
.nav-next-btn:hover, .nav-submit-btn:hover { opacity: 0.85; }

.step-fade-enter-active, .step-fade-leave-active { transition: all 0.18s ease; }
.step-fade-enter-from { opacity: 0; transform: translateX(10px); }
.step-fade-leave-to { opacity: 0; transform: translateX(-10px); }

.item-list-enter-active { transition: all 0.2s ease; }
.item-list-enter-from { opacity: 0; transform: translateY(-6px); }

@media (max-width: 768px) {
  .wizard-layout { grid-template-columns: 1fr; }
  .wizard-sidebar { display: none; }
  .wizard-content { padding: 22px 18px; }
  .review-grid { grid-template-columns: 1fr; }
  .step-number { font-size: 1.5rem; }
}
</style>
