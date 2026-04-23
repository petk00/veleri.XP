<template>
  <q-page class="new-request-page">
    <!-- Dekorativni pozadinski akcenti -->
    <div class="bg-orbs" aria-hidden="true">
      <div class="bg-orb bg-orb--one"></div>
      <div class="bg-orb bg-orb--two"></div>
      <div class="bg-orb bg-orb--three"></div>
    </div>

    <div class="page-shell">

      <!-- HERO -->
      <section class="page-hero">
        <div class="page-hero__text">
          <div class="eyebrow">
            <span class="eyebrow__dot"></span>
            Novi zahtjev za nabavu
          </div>
          <h1 class="page-title">Pokretanje novog zahtjeva</h1>
          <p class="page-subtitle">
            Ispunite korake u nastavku. Uneseni podaci ostaju sačuvani dok prolazite kroz obrazac.
          </p>
        </div>
        <q-btn
          flat no-caps
          icon="arrow_back"
          label="Odustani"
          class="btn-ghost"
          @click="$router.push('/requests')"
        />
      </section>

      <div v-if="loadingReferenceData" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="48px" />
      </div>

      <div v-else class="wizard-layout">

        <!-- SIDEBAR -->
        <aside class="wizard-sidebar">
          <div class="sidebar-progress-line" aria-hidden="true">
            <div
              class="sidebar-progress-line__fill"
              :style="{ height: progressLineHeight }"
            ></div>
          </div>

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
              <q-icon v-if="step > s.step" name="check" size="14px" />
              <span v-else>{{ s.number }}</span>
            </div>
            <div class="sidebar-step__body">
              <div class="sidebar-step__label">{{ s.title }}</div>
              <div class="sidebar-step__hint">{{ s.hint }}</div>
            </div>
          </div>
        </aside>

        <!-- CONTENT -->
        <div class="wizard-content">

          <!-- Progress bar -->
          <div class="wizard-progress">
            <div
              class="wizard-progress__fill"
              :style="{ width: progressBarWidth }"
            ></div>
          </div>

          <div class="wizard-content__inner">
            <transition name="step-fade" mode="out-in">

              <!-- KORAK 1: Odjel -->
              <div v-if="step === 1" key="1">
                <div class="step-header">
                  <div class="step-number">01</div>
                  <div>
                    <h2 class="step-title">Odaberite odjel, službu ili projekt</h2>
                    <p class="step-description">
                      Za koji se odjel, službu ili projekt otvara zahtjev za nabavu?
                    </p>
                  </div>
                </div>

                <div class="step-body">
                  <q-select
                    v-model="form.department"
                    :options="departmentOptions"
                    outlined emit-value map-options
                    label="Odjel / Služba / Projekt"
                    class="field-lg field-modern"
                  >
                    <template #prepend><q-icon name="business" class="field-icon" /></template>
                  </q-select>
                </div>
              </div>

              <!-- KORAK 2: Imaš li ponudu? -->
              <div v-else-if="step === 2" key="2">
                <div class="step-header">
                  <div class="step-number">02</div>
                  <div>
                    <h2 class="step-title">Imaš li ponudu ili račun?</h2>
                    <p class="step-description">
                      Ovisno o odgovoru, nastavak zahtjeva će biti prilagođen.
                    </p>
                  </div>
                </div>

                <div class="step-body">
                  <div class="offer-choice">
                    <button
                      type="button"
                      class="offer-option"
                      :class="{ 'offer-option--selected': form.hasOffer === true }"
                      @click="selectHasOffer(true)"
                    >
                      <div class="offer-option__icon offer-option__icon--primary">
                        <q-icon name="receipt_long" size="24px" />
                      </div>
                      <div class="offer-option__text">
                        <div class="offer-option__title">Da, imam ponudu / račun</div>
                        <div class="offer-option__subtitle">Mogu priložiti jednu ili više ponuda</div>
                      </div>
                      <div class="offer-option__check">
                        <q-icon v-if="form.hasOffer === true" name="check" size="16px" />
                      </div>
                    </button>

                    <button
                      type="button"
                      class="offer-option"
                      :class="{ 'offer-option--selected': form.hasOffer === false }"
                      @click="selectHasOffer(false)"
                    >
                      <div class="offer-option__icon">
                        <q-icon name="format_list_bulleted" size="24px" />
                      </div>
                      <div class="offer-option__text">
                        <div class="offer-option__title">Nemam ponudu</div>
                        <div class="offer-option__subtitle">Unijet ću stavke koje trebam nabaviti</div>
                      </div>
                      <div class="offer-option__check">
                        <q-icon v-if="form.hasOffer === false" name="check" size="16px" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- KORAK 3a: IMA ponudu -->
              <div v-else-if="step === 3 && form.hasOffer === true" key="3a">
                <div class="step-header">
                  <div class="step-number">03</div>
                  <div>
                    <h2 class="step-title">Detalji nabave</h2>
                    <p class="step-description">
                      Priložite jednu ili više ponuda i unesite potrebne podatke.
                    </p>
                  </div>
                </div>

                <div class="step-body">
                  <div class="row q-col-gutter-lg">

                    <div class="col-12">
                      <div class="field-section-label">Ponude / računi</div>

                      <q-file
                        v-model="newOfferFile"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.zip"
                        outlined
                        label="Dodaj ponudu"
                        class="field-modern"
                        @update:model-value="onAddOffer"
                      >
                        <template #prepend><q-icon name="attach_file" class="field-icon" /></template>
                        <template #hint>PDF, Word, Excel, slike — max 10MB po datoteci</template>
                      </q-file>

                      <div v-if="form.offerFiles.length > 0" class="offers-list">
                        <div
                          v-for="(file, index) in form.offerFiles"
                          :key="index"
                          class="offer-file-row"
                        >
                          <div class="offer-file-row__icon">
                            <q-icon name="description" size="18px" />
                          </div>
                          <div class="offer-file-row__name">{{ file.name }}</div>
                          <div class="offer-file-row__size">{{ formatFileSize(file.size) }}</div>
                          <q-btn
                            flat round dense
                            icon="close"
                            class="offer-file-row__remove"
                            size="sm"
                            @click="removeOffer(index)"
                          />
                        </div>
                        <div class="offers-list__footer">
                          <q-icon name="check_circle" size="14px" class="q-mr-xs" />
                          {{ form.offerFiles.length }} {{ form.offerFiles.length === 1 ? 'ponuda priložena' : 'ponuda priloženo' }}
                        </div>
                      </div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="field-section-label">Ukupni iznos *</div>
                      <div class="amount-input-row">
                        <q-input
                          v-model.number="form.estimatedAmount"
                          type="number" min="0" step="0.01"
                          outlined
                          placeholder="0.00"
                          class="amount-input field-modern"
                        />
                        <div class="amount-input-currency">EUR</div>
                      </div>
                      <div class="amount-hint">
                        <q-icon name="info_outline" size="14px" class="q-mr-xs" />
                        <span v-if="form.offerFiles.length > 1">
                          Imate {{ form.offerFiles.length }} ponuda — upišite ukupni zbroj svih iznosa.
                        </span>
                        <span v-else>
                          Upišite iznos s ponude. Administrator može korigirati naknadno.
                        </span>
                      </div>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="field-section-label">Kategorija nabave</div>
                      <q-select
                        v-model="form.category"
                        :options="categoryOptions"
                        label="Odaberi kategoriju"
                        outlined emit-value map-options
                        class="field-modern"
                      >
                        <template #prepend><q-icon name="category" class="field-icon" /></template>
                      </q-select>
                    </div>

                    <div class="col-12">
                      <div class="field-section-label">Svrha nabave</div>
                      <q-input
                        v-model="form.reasonName"
                        type="textarea"
                        outlined autogrow rows="4"
                        counter maxlength="1000"
                        placeholder="Opišite zašto se ova nabava vrši i čemu služi..."
                        class="field-modern"
                      />
                    </div>

                  </div>
                </div>
              </div>

              <!-- KORAK 3b: NEMA ponudu -->
              <div v-else-if="step === 3 && form.hasOffer === false" key="3b">
                <div class="step-header">
                  <div class="step-number">03</div>
                  <div>
                    <h2 class="step-title">Stavke i svrha nabave</h2>
                    <p class="step-description">
                      Navedite što trebate nabaviti i zašto.
                    </p>
                  </div>
                </div>

                <div class="step-body">
                  <div class="field-section-label">Svrha nabave</div>
                  <q-input
                    v-model="form.reasonName"
                    type="textarea"
                    outlined autogrow rows="3"
                    counter maxlength="1000"
                    placeholder="Opišite zašto se ova nabava vrši i čemu služi..."
                    class="field-modern q-mb-lg"
                  />

                  <div class="field-section-label">Stavke zahtjeva</div>
                  <div class="add-item-form">
                    <div class="row q-col-gutter-md">
                      <div class="col-12 col-md-4">
                        <q-select
                          v-model="itemForm.category"
                          :options="categoryOptions"
                          label="Kategorija"
                          outlined dense emit-value map-options
                          class="field-modern"
                        />
                      </div>
                      <div class="col-12 col-md-5">
                        <q-input
                          v-model="itemForm.item_name"
                          label="Naziv artikla / usluge"
                          outlined dense
                          class="field-modern"
                          @keyup.enter="addItem"
                        />
                      </div>
                      <div class="col-12 col-md-2">
                        <q-input
                          v-model.number="itemForm.quantity"
                          label="Kol." type="number" min="1"
                          outlined dense
                          class="field-modern"
                        />
                      </div>
                      <div class="col-12 col-md-1 flex items-center justify-center">
                        <q-btn unelevated round color="primary" icon="add" class="btn-add" @click="addItem">
                          <q-tooltip>Dodaj stavku</q-tooltip>
                        </q-btn>
                      </div>
                    </div>
                  </div>

                  <div class="items-list">
                    <div v-if="form.items.length === 0" class="items-empty">
                      <div class="items-empty__icon">
                        <q-icon name="inventory_2" size="32px" />
                      </div>
                      <div class="items-empty__text">Još nema dodanih stavki</div>
                      <div class="items-empty__hint">Unesite naziv artikla iznad i kliknite +</div>
                    </div>

                    <transition-group name="item-list" tag="div">
                      <div v-for="(item, index) in form.items" :key="index" class="item-row">
                        <div class="item-row__index">{{ index + 1 }}</div>
                        <div class="item-row__content">
                          <div class="item-row__name">{{ item.item_name }}</div>
                          <div class="item-row__category">{{ item.category_label }}</div>
                        </div>
                        <div class="item-row__quantity">× {{ item.quantity }}</div>
                        <q-btn flat round dense icon="close" class="item-row__remove" size="sm" @click="removeItem(index)" />
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
                    <h2 class="step-title">Pregled zahtjeva</h2>
                    <p class="step-description">
                      Provjerite unesene podatke prije slanja.
                    </p>
                  </div>
                </div>

                <div class="step-body">
                  <div class="review-grid">

                    <div class="review-meta">
                      <div class="review-field">
                        <div class="review-field__label">Odjel / Služba / Projekt</div>
                        <div class="review-field__value">{{ selectedDepartmentLabel || '—' }}</div>
                      </div>
                      <div class="review-field">
                        <div class="review-field__label">Svrha nabave</div>
                        <div class="review-field__value review-field__value--multiline">{{ form.reasonName || '—' }}</div>
                      </div>
                      <div class="review-field">
                        <div class="review-field__label">Ponude / Računi</div>
                        <div class="review-field__value">
                          <div v-if="form.hasOffer === true && form.offerFiles.length > 0">
                            <div v-for="(file, index) in form.offerFiles" :key="index" class="review-file">
                              <q-icon name="check_circle" size="14px" class="review-file__check" />
                              <span>{{ file.name }}</span>
                            </div>
                          </div>
                          <span v-else class="review-field__muted">
                            <q-icon name="schedule" size="14px" class="q-mr-xs" />
                            Bez ponude — dodaje se naknadno
                          </span>
                        </div>
                      </div>
                      <div v-if="form.estimatedAmount" class="review-field">
                        <div class="review-field__label">Ukupni iznos</div>
                        <div class="review-field__value review-field__value--amount">
                          {{ formatCurrency(form.estimatedAmount) }}
                        </div>
                      </div>
                    </div>

                    <div class="review-items">
                      <div class="review-items__header">
                        <span v-if="form.hasOffer === false">Stavke zahtjeva</span>
                        <span v-else>Kategorija</span>
                        <q-badge v-if="form.hasOffer === false" class="review-items__count">{{ form.items.length }}</q-badge>
                      </div>
                      <div class="review-items__list">
                        <div v-if="form.hasOffer === true" class="review-item-row">
                          <span class="review-item-row__index">—</span>
                          <div class="review-item-row__main">
                            <span class="review-item-row__name">{{ selectedCategoryLabel || '—' }}</span>
                          </div>
                        </div>
                        <div v-else v-for="(item, index) in form.items" :key="index" class="review-item-row">
                          <span class="review-item-row__index">{{ index + 1 }}</span>
                          <div class="review-item-row__main">
                            <span class="review-item-row__name">{{ item.item_name }}</span>
                            <span class="review-item-row__category">{{ item.category_label }}</span>
                          </div>
                          <span class="review-item-row__qty">× {{ item.quantity }}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </transition>

            <!-- NAV -->
            <div class="wizard-nav">
              <q-btn
                v-if="step > 1"
                flat no-caps
                icon="arrow_back" label="Natrag"
                class="btn-ghost"
                :disable="submitting"
                @click="step--"
              />
              <div v-else />

              <div class="row q-gutter-sm">
                <q-btn
                  v-if="step < 4"
                  unelevated no-caps
                  icon-right="arrow_forward" label="Dalje"
                  class="btn-primary"
                  @click="nextStep"
                />
                <q-btn
                  v-else
                  unelevated no-caps
                  icon="send" label="Pošalji na obradu"
                  class="btn-primary btn-primary--submit"
                  :loading="submitting"
                  :disable="submitting"
                  @click="submitWizard"
                />
              </div>
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
const MAX_OFFER_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_OFFER_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/zip',
];

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
  const base = [
    { key: 'odjel',  step: 1, number: '01', title: 'Odjel',  hint: 'Jedinica zahtjeva' },
    { key: 'ponuda', step: 2, number: '02', title: 'Ponuda', hint: 'Imate li dokument?' },
  ];
  if (form.value.hasOffer === true) {
    return [
      ...base,
      { key: 'detalji', step: 3, number: '03', title: 'Detalji', hint: 'Iznos i kategorija' },
      { key: 'pregled', step: 4, number: '04', title: 'Pregled', hint: 'Potvrda i slanje' },
    ];
  }
  if (form.value.hasOffer === false) {
    return [
      ...base,
      { key: 'stavke',  step: 3, number: '03', title: 'Stavke',  hint: 'Popis artikala' },
      { key: 'pregled', step: 4, number: '04', title: 'Pregled', hint: 'Potvrda i slanje' },
    ];
  }
  return [
    ...base,
    { key: 'detalji', step: 3, number: '03', title: 'Detalji', hint: 'Podaci zahtjeva' },
    { key: 'pregled', step: 4, number: '04', title: 'Pregled', hint: 'Potvrda i slanje' },
  ];
});

const progressLineHeight = computed(() => {
  const totalSteps = currentSteps.value.length;
  if (totalSteps <= 1) return '0%';
  return `${((step.value - 1) / (totalSteps - 1)) * 100}%`;
});

const progressBarWidth = computed(() => {
  const totalSteps = currentSteps.value.length;
  if (totalSteps <= 1) return '0%';
  return `${((step.value - 1) / (totalSteps - 1)) * 100}%`;
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

const notifyValidationError = (message) => {
  $q.notify({ type: 'negative', message });
};

const validateStep = (stepToValidate = step.value) => {
  if (loadingReferenceData.value) {
    notifyValidationError('Pričekajte da se referentni podaci učitaju.');
    return false;
  }

  if (!activeFiscalYearId.value) {
    notifyValidationError('Aktivna fiskalna godina nije dostupna. Osvježite stranicu i pokušajte ponovno.');
    return false;
  }

  if (stepToValidate >= 1 && !form.value.department) {
    notifyValidationError('Odaberite odjel, službu ili projekt.');
    return false;
  }

  if (stepToValidate >= 2 && form.value.hasOffer === null) {
    notifyValidationError('Odaberite jednu od opcija.');
    return false;
  }

  if (stepToValidate >= 3 && form.value.hasOffer === true) {
    if (form.value.offerFiles.length === 0) {
      notifyValidationError('Priložite barem jednu ponudu.');
      return false;
    }
    if (!form.value.estimatedAmount || form.value.estimatedAmount <= 0) {
      notifyValidationError('Ukupni iznos je obavezan kad imate ponudu.');
      return false;
    }
    if (!form.value.category) {
      notifyValidationError('Odaberite kategoriju nabave.');
      return false;
    }
    if (!form.value.reasonName.trim()) {
      notifyValidationError('Unesite svrhu nabave.');
      return false;
    }
  }

  if (stepToValidate >= 3 && form.value.hasOffer === false) {
    if (!form.value.reasonName.trim()) {
      notifyValidationError('Unesite svrhu nabave.');
      return false;
    }
    if (form.value.items.length === 0) {
      notifyValidationError('Dodajte barem jednu stavku.');
      return false;
    }
  }

  return true;
};

const onAddOffer = (file) => {
  if (!file) return;

  if (!ALLOWED_OFFER_MIME_TYPES.includes(file.type)) {
    notifyValidationError('Odabrana datoteka nije podržanog tipa.');
    newOfferFile.value = null;
    return;
  }

  if (file.size > MAX_OFFER_FILE_SIZE) {
    notifyValidationError('Datoteka je veća od 10 MB.');
    newOfferFile.value = null;
    return;
  }

  const alreadyExists = form.value.offerFiles.some((existingFile) =>
    existingFile.name === file.name
    && existingFile.size === file.size
    && existingFile.lastModified === file.lastModified
  );

  if (alreadyExists) {
    notifyValidationError('Ta je datoteka već dodana.');
    newOfferFile.value = null;
    return;
  }

  form.value.offerFiles.push(file);
  newOfferFile.value = null;
};

const removeOffer = (index) => form.value.offerFiles.splice(index, 1);

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const selectHasOffer = (hasOffer) => {
  form.value.hasOffer = hasOffer;

  if (hasOffer) {
    return;
  }

  form.value.offerFiles = [];
  form.value.estimatedAmount = null;
  form.value.category = null;
  newOfferFile.value = null;
};

const nextStep = () => {
  if (!validateStep()) return;

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
  if (value == null || value === '') return '—';
  return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(Number(value));
};

const submitWizard = async () => {
  if (!validateStep(4)) return;

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
/* =========================================================
   DESIGN TOKENS
   ========================================================= */
.new-request-page {
  --brand-50:  #e3f2fd;
  --brand-100: #bbdefb;
  --brand-500: #42a5f5;
  --brand-600: #1976d2;
  --brand-700: #1565c0;
  --brand-800: #0d47a1;

  --ink-900: #0b1020;
  --ink-800: #1e293b;
  --ink-700: #334155;
  --ink-500: #64748b;
  --ink-400: #94a3b8;
  --ink-300: #cbd5e1;
  --ink-200: #e2e8f0;
  --ink-100: #f1f5f9;
  --ink-50:  #f8fafc;

  --success: #10b981;
  --success-bg: #ecfdf5;

  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;

  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 20px 48px -12px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.06);
  --shadow-brand: 0 10px 24px -6px rgba(25, 118, 210, 0.32);

  position: relative;
  min-height: 100vh;
  padding: 48px 24px 80px;
  background: linear-gradient(160deg, #f0f4ff 0%, #f8fafc 50%, #f4f7fb 100%);
  overflow: hidden;
}

/* Dekorativni blur orb-ovi u pozadini */
.bg-orbs {
  display: none;
}

.page-shell {
  position: relative;
  z-index: 1;
  max-width: 1160px;
  margin: 0 auto;
}

/* =========================================================
   HERO
   ========================================================= */
.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 40px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--brand-700);
  background: var(--brand-50);
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--brand-100);
}
.eyebrow__dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--brand-600);
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.18);
}

.page-title {
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  color: var(--ink-900);
  margin: 14px 0 6px;
  line-height: 1.1;
}

.page-subtitle {
  color: var(--ink-500);
  font-size: 0.975rem;
  margin: 0;
  max-width: 520px;
}

.btn-ghost {
  color: var(--ink-500) !important;
  font-weight: 600;
  border-radius: var(--radius-md);
  padding: 6px 14px;
}
.btn-ghost:hover { color: var(--ink-800) !important; background: var(--ink-100); }

/* =========================================================
   LAYOUT
   ========================================================= */
.wizard-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 40px;
  align-items: start;
}

/* =========================================================
   SIDEBAR
   ========================================================= */
.wizard-sidebar {
  position: sticky;
  top: 32px;
  padding: 8px 0;
}

.sidebar-progress-line {
  position: absolute;
  left: 22px;
  top: 40px;
  bottom: 40px;
  width: 2px;
  background: var(--ink-200);
  border-radius: 1px;
  z-index: 0;
}
.sidebar-progress-line__fill {
  width: 100%;
  background: linear-gradient(to bottom, var(--brand-500), var(--brand-700));
  border-radius: 1px;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-step {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  transition: background 0.2s;
  margin-bottom: 4px;
}

.sidebar-step__indicator {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: white;
  border: 2px solid var(--ink-200);
  color: var(--ink-400);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.sidebar-step__body { padding-top: 3px; }

.sidebar-step__label {
  font-size: 0.875rem;
  color: var(--ink-400);
  font-weight: 600;
  transition: color 0.2s;
  letter-spacing: -0.01em;
}

.sidebar-step__hint {
  font-size: 0.72rem;
  color: var(--ink-400);
  margin-top: 2px;
  opacity: 0.8;
}

.sidebar-step--active .sidebar-step__indicator {
  background: var(--brand-600);
  border-color: var(--brand-600);
  color: white;
  box-shadow: var(--shadow-brand);
  transform: scale(1.08);
}
.sidebar-step--active .sidebar-step__label { color: var(--ink-900); }
.sidebar-step--active .sidebar-step__hint { color: var(--brand-600); opacity: 1; }

.sidebar-step--done .sidebar-step__indicator {
  background: var(--brand-600);
  border-color: var(--brand-600);
  color: white;
}
.sidebar-step--done .sidebar-step__label { color: var(--ink-700); }

/* =========================================================
   CONTENT CARD
   ========================================================= */
.wizard-content {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  min-height: 560px;
  display: flex;
  flex-direction: column;
}

.wizard-progress {
  height: 3px;
  background: var(--ink-100);
  position: relative;
}
.wizard-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-500), var(--brand-700));
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 12px rgba(25, 118, 210, 0.4);
}

.wizard-content__inner {
  padding: 48px 56px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* =========================================================
   STEP
   ========================================================= */
.step-header {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.step-number {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--brand-500), var(--brand-800));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0.22;
  letter-spacing: -0.06em;
  line-height: 0.85;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.step-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink-900);
  margin: 0 0 6px;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.step-description {
  color: var(--ink-500);
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.step-body {
  margin-top: 36px;
}

/* =========================================================
   FORMS
   ========================================================= */
.field-lg { max-width: 520px; }

.field-section-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-500);
  margin-bottom: 10px;
}

.field-icon { color: var(--brand-600); }

/* Refinement Quasar outlined inputs */
:deep(.field-modern .q-field__control) {
  border-radius: var(--radius-md);
  background: white;
  transition: all 0.2s;
}
:deep(.field-modern .q-field__control:before) {
  border-color: var(--ink-200);
  transition: border-color 0.2s;
}
:deep(.field-modern .q-field__control:hover:before) {
  border-color: var(--brand-500);
}
:deep(.field-modern.q-field--focused .q-field__control:after) {
  border-width: 2px;
  border-color: var(--brand-600);
}
:deep(.field-modern.q-field--focused .q-field__label) {
  color: var(--brand-600);
}

/* =========================================================
   STEP 2 — Offer choice cards
   ========================================================= */
.offer-choice {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 560px;
}

.offer-option {
  all: unset;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 24px;
  border: 2px solid var(--ink-200);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  position: relative;
  box-sizing: border-box;
}
.offer-option:hover {
  border-color: var(--brand-500);
  background: var(--brand-50);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.offer-option__icon {
  width: 48px; height: 48px;
  border-radius: var(--radius-md);
  background: var(--ink-100);
  color: var(--ink-500);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s;
}
.offer-option__icon--primary {
  background: linear-gradient(135deg, var(--brand-50), var(--brand-100));
  color: var(--brand-600);
}

.offer-option__text { flex: 1; }
.offer-option__title {
  font-weight: 700;
  color: var(--ink-900);
  font-size: 0.975rem;
  letter-spacing: -0.01em;
}
.offer-option__subtitle {
  font-size: 0.825rem;
  color: var(--ink-500);
  margin-top: 2px;
}

.offer-option__check {
  width: 26px; height: 26px;
  border-radius: 50%;
  border: 2px solid var(--ink-200);
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: all 0.2s;
  flex-shrink: 0;
}

.offer-option--selected {
  border-color: var(--brand-600);
  background: rgba(25, 118, 210, 0.04);
  box-shadow: var(--shadow-brand);
}
.offer-option--selected .offer-option__icon--primary {
  background: var(--brand-600);
  color: white;
}
.offer-option--selected .offer-option__icon:not(.offer-option__icon--primary) {
  background: var(--brand-100);
  color: var(--brand-600);
}
.offer-option--selected .offer-option__check {
  background: var(--brand-600);
  border-color: var(--brand-600);
  color: white;
}

/* =========================================================
   STEP 3a — File list
   ========================================================= */
.offers-list {
  margin-top: 14px;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: white;
}

.offer-file-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ink-100);
  transition: background 0.15s;
}
.offer-file-row:hover { background: var(--ink-50); }
.offer-file-row:last-of-type { border-bottom: none; }

.offer-file-row__icon {
  width: 34px; height: 34px;
  border-radius: 8px;
  background: var(--brand-50);
  color: var(--brand-600);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.offer-file-row__name {
  flex: 1;
  font-size: 0.88rem;
  color: var(--ink-900);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.offer-file-row__size {
  font-size: 0.72rem;
  color: var(--ink-400);
  font-weight: 500;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.offer-file-row__remove {
  color: var(--ink-400) !important;
  transition: color 0.15s;
}
.offer-file-row__remove:hover { color: #ef4444 !important; }

.offers-list__footer {
  padding: 10px 16px;
  font-size: 0.75rem;
  color: var(--success);
  font-weight: 600;
  text-align: right;
  background: var(--success-bg);
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* =========================================================
   AMOUNT
   ========================================================= */
.amount-input-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.amount-input { flex: 1; max-width: 300px; }
.amount-input-currency {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--brand-700);
  letter-spacing: 0.02em;
}
.amount-hint {
  margin-top: 10px;
  font-size: 0.8rem;
  color: var(--ink-500);
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
}

/* =========================================================
   STEP 3b — Items
   ========================================================= */
.add-item-form {
  background: #f8fafc;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-lg);
  padding: 22px;
  margin-bottom: 20px;
}

.btn-add {
  background: var(--brand-600) !important;
  color: white !important;
  box-shadow: var(--shadow-brand);
}

.items-list {
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: white;
}

.items-empty {
  padding: 56px 20px;
  text-align: center;
}
.items-empty__icon {
  width: 64px; height: 64px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: var(--ink-100);
  color: var(--ink-400);
  display: flex;
  align-items: center;
  justify-content: center;
}
.items-empty__text {
  color: var(--ink-700);
  font-weight: 600;
  font-size: 0.95rem;
}
.items-empty__hint {
  color: var(--ink-400);
  font-size: 0.82rem;
  margin-top: 4px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--ink-100);
  transition: background 0.15s;
}
.item-row:last-child { border-bottom: none; }
.item-row:hover { background: var(--ink-50); }

.item-row__index {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--brand-50);
  color: var(--brand-700);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.item-row__content { flex: 1; min-width: 0; }
.item-row__name {
  font-weight: 600;
  color: var(--ink-900);
  font-size: 0.9rem;
  letter-spacing: -0.01em;
}
.item-row__category {
  font-size: 0.76rem;
  color: var(--ink-400);
  margin-top: 2px;
}

.item-row__quantity {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--brand-700);
  padding: 4px 10px;
  background: var(--brand-50);
  border-radius: 999px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.item-row__remove { color: var(--ink-400) !important; }
.item-row__remove:hover { color: #ef4444 !important; }

.items-footer {
  padding: 12px 18px;
  background: var(--ink-50);
  font-size: 0.76rem;
  color: var(--ink-500);
  font-weight: 600;
  text-align: right;
  border-top: 1px solid var(--ink-100);
}

/* =========================================================
   REVIEW
   ========================================================= */
.review-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.review-meta,
.review-items {
  background: white;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.review-field {
  padding: 16px 20px;
  border-bottom: 1px solid var(--ink-100);
}
.review-field:last-child { border-bottom: none; }

.review-field__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-400);
  margin-bottom: 6px;
}
.review-field__value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ink-900);
  letter-spacing: -0.01em;
}
.review-field__value--multiline {
  white-space: pre-wrap;
  font-weight: 400;
  color: var(--ink-700);
  line-height: 1.55;
}
.review-field__value--amount {
  font-size: 1.15rem;
  color: var(--brand-700);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.review-field__muted {
  color: var(--ink-500);
  font-weight: 500;
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
}

.review-file {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--success);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 4px;
}
.review-file:last-child { margin-bottom: 0; }

.review-items__header {
  padding: 16px 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-400);
  border-bottom: 1px solid var(--ink-100);
  background: var(--ink-50);
  display: flex;
  align-items: center;
}
.review-items__count {
  background: var(--brand-600) !important;
  color: white !important;
  margin-left: 8px;
  font-weight: 700;
}

.review-items__list { padding: 6px 0; }

.review-item-row {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--ink-100);
}
.review-item-row:last-child { border-bottom: none; }

.review-item-row__index {
  color: var(--ink-400);
  font-size: 0.72rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.review-item-row__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.review-item-row__name {
  font-weight: 600;
  color: var(--ink-900);
  letter-spacing: -0.01em;
}
.review-item-row__category {
  color: var(--ink-400);
  font-size: 0.72rem;
}
.review-item-row__qty {
  font-weight: 700;
  color: var(--brand-700);
  font-size: 0.82rem;
  padding: 3px 9px;
  background: var(--brand-50);
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}

/* =========================================================
   NAV
   ========================================================= */
.wizard-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 36px;
  margin-top: auto;
  border-top: 1px solid var(--ink-100);
}

.btn-primary {
  background: linear-gradient(135deg, var(--brand-600), var(--brand-700)) !important;
  color: white !important;
  border-radius: var(--radius-md);
  padding: 10px 22px;
  font-weight: 600;
  box-shadow: var(--shadow-brand);
  transition: all 0.2s;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 32px -8px rgba(25, 118, 210, 0.45);
}
.btn-primary--submit {
  padding: 12px 28px;
  font-size: 0.95rem;
}

/* =========================================================
   TRANSITIONS
   ========================================================= */
.step-fade-enter-active, .step-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.step-fade-enter-from { opacity: 0; transform: translateX(16px); }
.step-fade-leave-to { opacity: 0; transform: translateX(-16px); }

.item-list-enter-active { transition: all 0.25s ease; }
.item-list-enter-from { opacity: 0; transform: translateY(-8px); }
.item-list-leave-active { transition: all 0.2s ease; position: absolute; }
.item-list-leave-to { opacity: 0; transform: translateX(20px); }

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media (max-width: 900px) {
  .new-request-page { padding: 24px 16px 60px; }
  .wizard-layout { grid-template-columns: 1fr; gap: 20px; }
  .wizard-sidebar {
    position: static;
    display: flex;
    overflow-x: auto;
    padding: 8px 4px;
    gap: 6px;
  }
  .sidebar-progress-line { display: none; }
  .sidebar-step { flex: 0 0 auto; padding: 8px 12px; }
  .sidebar-step__hint { display: none; }
  .wizard-content__inner { padding: 28px 22px; }
  .step-number { font-size: 2rem; }
  .page-title { font-size: 1.8rem; }
  .step-title { font-size: 1.25rem; }
  .review-grid { grid-template-columns: 1fr; }
}
</style>
