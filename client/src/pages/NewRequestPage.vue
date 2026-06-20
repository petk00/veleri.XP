<template>
  <q-page class="page">
    <div class="page-shell">

      <!-- ─────────────────────────────────
           Page header
           ───────────────────────────────── -->
      <header class="page-header">
        <div class="page-header__main">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <span class="breadcrumb__item">Nabava</span>
            <span class="breadcrumb__sep">›</span>
            <button class="breadcrumb__back" type="button" @click="$router.push('/requests')">Moji zahtjevi</button>
            <span class="breadcrumb__sep">›</span>
            <span class="breadcrumb__current">Novi zahtjev</span>
          </nav>
          <h1 class="page-header__title">Novi zahtjev za nabavu</h1>
          <p class="page-header__subtitle">
            Ispunite korake u nastavku. Uneseni podaci ostaju sačuvani dok prolazite kroz obrazac.
          </p>
        </div>
        <button class="btn btn--ghost" @click="$router.push('/requests')">
          <q-icon name="close" size="16px" />
          <span>Odustani</span>
        </button>
      </header>

      <!-- ─────────────────────────────────
           Loading
           ───────────────────────────────── -->
      <div v-if="loadingReferenceData" class="loading-block">
        <q-spinner color="primary" size="32px" />
      </div>

      <!-- Nema aktivne poslovne godine -->
      <div v-else-if="noActiveFiscalYear" class="no-fy-block">
        <div class="no-fy-block__icon">
          <q-icon name="lock_clock" size="32px" />
        </div>
        <div class="no-fy-block__title">Kreiranje zahtjeva nije moguće</div>
        <div class="no-fy-block__body">
          Trenutno nije otvorena nijedna poslovna godina.<br />
          Obratite se administratoru da otvori novu poslovnu godinu.
        </div>
        <button class="btn btn--secondary" @click="$router.push('/dashboard')">
          Povratak na nadzornu ploču
        </button>
      </div>

      <!-- ─────────────────────────────────
           Wizard
           ───────────────────────────────── -->
      <div v-else class="wizard">

        <!-- Sidebar steps -->
        <aside class="wizard__sidebar">
          <ol class="step-list">
            <li
              v-for="s in currentSteps"
              :key="s.key"
              class="step-list__item"
              :class="{
                'step-list__item--active': step === s.step,
                'step-list__item--done': step > s.step,
              }"
            >
              <div class="step-list__indicator">
                <q-icon v-if="step > s.step" name="check" size="14px" />
                <span v-else>{{ s.step }}</span>
              </div>
              <div class="step-list__body">
                <div class="step-list__label">{{ s.title }}</div>
                <div class="step-list__hint">{{ s.hint }}</div>
              </div>
            </li>
          </ol>
        </aside>

        <!-- Content card -->
        <div class="wizard__content">
          <div class="wizard__progress">
            <div class="wizard__progress-fill" :style="{ width: progressBarWidth }" />
          </div>

          <div class="wizard__inner">
            <transition name="step-fade" mode="out-in">

              <!-- ───── STEP 1: Department ───── -->
              <div v-if="step === 1" key="1" class="step">
                <div class="step__head">
                  <div class="step__caption">Korak 1 od {{ currentSteps.length }}</div>
                  <h2 class="step__title">Odabir odjela, službe ili projekta kojem pripadate</h2>
                </div>

                <div class="step__body">
                  <div class="field">
                    <label class="field__label">Odjel / Služba / Projekt</label>
                    <q-select
                      v-model="form.department"
                      :options="departmentOptions"
                      outlined dense
                      emit-value map-options
                      placeholder="Odaberite iz popisa..."
                      class="field__input"
                    >
                      <template #prepend>
                        <q-icon name="business" size="16px" />
                      </template>
                    </q-select>
                  </div>
                </div>
              </div>

              <!-- ───── STEP 2: Has offer? ───── -->
              <div v-else-if="step === 2" key="2" class="step">
                <div class="step__head">
                  <div class="step__caption">Korak 2 od {{ currentSteps.length }}</div>
                  <h2 class="step__title">Imate li ponudu ili račun?</h2>
                  <p class="step__desc">
                    Ovisno o odgovoru, prilagodit ćemo nastavak obrasca.
                  </p>
                </div>

                <div class="step__body">
                  <div class="choice-list">
                    <button
                      type="button"
                      class="choice"
                      :class="{ 'choice--selected': form.hasOffer === true }"
                      @click="selectHasOffer(true)"
                    >
                      <div class="choice__icon">
                        <q-icon name="receipt_long" size="20px" />
                      </div>
                      <div class="choice__body">
                        <div class="choice__title">Da, imam ponudu ili račun</div>
                        <div class="choice__desc">Priložit ću jednu ili više ponuda</div>
                      </div>
                      <div class="choice__radio">
                        <q-icon v-if="form.hasOffer === true" name="check_circle" size="18px" />
                      </div>
                    </button>

                    <button
                      type="button"
                      class="choice"
                      :class="{ 'choice--selected': form.hasOffer === false }"
                      @click="selectHasOffer(false)"
                    >
                      <div class="choice__icon">
                        <q-icon name="format_list_bulleted" size="20px" />
                      </div>
                      <div class="choice__body">
                        <div class="choice__title">Nemam ponudu</div>
                        <div class="choice__desc">Unijet ću popis stavki koje trebam nabaviti</div>
                      </div>
                      <div class="choice__radio">
                        <q-icon v-if="form.hasOffer === false" name="check_circle" size="18px" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- ───── STEP 3a: WITH offer ───── -->
              <div v-else-if="step === 3 && form.hasOffer === true" key="3a" class="step">
                <div class="step__head">
                  <div class="step__caption">Korak 3 od {{ currentSteps.length }}</div>
                  <h2 class="step__title">Detalji nabave</h2>
                  <p class="step__desc">
                    Priložite ponudu, unesite iznos i opišite svrhu nabave.
                  </p>
                </div>

                <div class="step__body">
                  <!-- Offer files -->
                  <div class="field">
                    <label class="field__label">Ponude / računi *</label>
                    <label class="upload-zone">
                      <q-icon name="upload_file" size="28px" class="upload-zone__icon" />
                      <span class="upload-zone__text">Klikni ili povuci datoteku ovdje</span>
                      <span class="upload-zone__hint">PDF, Word, Excel, slike — najviše 10 MB po datoteci</span>
                      <q-file
                        v-model="newOfferFile"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.zip"
                        style="display: none"
                        @update:model-value="onAddOffer"
                      />
                    </label>

                    <ul v-if="form.offerFiles.length > 0" class="file-list">
                      <li v-for="(file, index) in form.offerFiles" :key="index" class="file-list__item">
                        <div class="file-list__icon">
                          <q-icon name="description" size="16px" />
                        </div>
                        <div class="file-list__name">{{ file.name }}</div>
                        <div class="file-list__size">{{ formatFileSize(file.size) }}</div>
                        <button class="icon-btn" @click="removeOffer(index)">
                          <q-icon name="close" size="16px" />
                        </button>
                      </li>
                    </ul>
                  </div>

                  <!-- Amount + category -->
                  <div class="field-grid">
                    <div class="field">
                      <label class="field__label">Ukupni iznos *</label>
                      <q-input
                        v-model.number="form.estimatedAmount"
                        type="number" min="0" step="0.01"
                        outlined dense
                        placeholder="0,00"
                        class="field__input"
                        suffix="EUR"
                      />
                      <div class="field__hint">
                        <span v-if="form.offerFiles.length > 1">
                          Imate {{ form.offerFiles.length }} ponuda — upišite ukupni zbroj.
                        </span>
                        <span v-else>
                          Iznos s ponude. Administrator može korigirati naknadno.
                        </span>
                      </div>
                    </div>

                    <div class="field">
                      <label class="field__label">Kategorija nabave *</label>
                      <q-select
                        v-model="form.category"
                        :options="categoryOptions"
                        outlined dense
                        emit-value map-options
                        placeholder="Odaberite kategoriju..."
                        class="field__input"
                      >
                        <template #prepend>
                          <q-icon name="category" size="16px" />
                        </template>
                      </q-select>
                    </div>
                  </div>

                  <!-- Justification -->
                  <div class="field">
                    <label class="field__label">Svrha nabave *</label>
                    <q-input
                      v-model="form.reasonName"
                      type="textarea"
                      outlined autogrow rows="4"
                      counter maxlength="1000"
                      placeholder="Opišite zašto se ova nabava vrši i čemu služi..."
                      class="field__input field__input--textarea"
                    />
                  </div>
                </div>
              </div>

              <!-- ───── STEP 3b: WITHOUT offer ───── -->
              <div v-else-if="step === 3 && form.hasOffer === false" key="3b" class="step">
                <div class="step__head">
                  <div class="step__caption">Korak 3 od {{ currentSteps.length }}</div>
                  <h2 class="step__title">Stavke i svrha nabave</h2>
                  <p class="step__desc">
                    Navedite što trebate nabaviti i zašto.
                  </p>
                </div>

                <div class="step__body">
                  <div class="field">
                    <label class="field__label">Svrha nabave *</label>
                    <q-input
                      v-model="form.reasonName"
                      type="textarea"
                      outlined autogrow rows="3"
                      counter maxlength="1000"
                      placeholder="Opišite zašto se ova nabava vrši i čemu služi..."
                      class="field__input field__input--textarea"
                    />
                  </div>

                  <div class="field">
                    <label class="field__label">Stavke zahtjeva *</label>

                    <div class="add-item">
                      <div class="add-item__labels">
                        <span class="add-item__label add-item__label--category">Kategorija</span>
                        <span class="add-item__label add-item__label--name">Naziv artikla / usluge</span>
                        <span class="add-item__label add-item__label--qty">Količina</span>
                      </div>
                      <div class="add-item__row">
                        <q-select
                          v-model="itemForm.category"
                          :options="categoryOptions"
                          placeholder="Odaberi..."
                          outlined dense
                          emit-value map-options
                          class="add-item__category"
                        />
                        <q-input
                          v-model="itemForm.item_name"
                          placeholder="Unesite naziv..."
                          outlined dense
                          class="add-item__name"
                          @keyup.enter="addItem"
                        />
                        <q-input
                          v-model.number="itemForm.quantity"
                          placeholder="1"
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

                    <div v-if="form.items.length === 0" class="empty-block">
                      <q-icon name="inventory_2" size="24px" class="empty-block__icon" />
                      <div class="empty-block__text">Još nema dodanih stavki.</div>
                      <div class="empty-block__hint">Unesite kategoriju, naziv i količinu te kliknite Dodaj.</div>
                    </div>

                    <ul v-else class="item-list">
                      <li v-for="(item, index) in form.items" :key="index" class="item-list__row">
                        <div class="item-list__index">{{ index + 1 }}</div>
                        <div class="item-list__content">
                          <div class="item-list__name">{{ item.item_name }}</div>
                          <div class="item-list__category">{{ item.category_label }}</div>
                        </div>
                        <div class="item-list__qty">× {{ item.quantity }}</div>
                        <button class="icon-btn" @click="removeItem(index)">
                          <q-icon name="close" size="16px" />
                        </button>
                      </li>
                    </ul>

                    <div v-if="form.items.length > 0" class="item-list__footer">
                      Ukupno {{ form.items.length }} {{ form.items.length === 1 ? 'stavka' : 'stavki' }}
                    </div>

                    <div class="field__hint field__hint--info" style="margin-top: 10px;">
                      <q-icon name="info_outline" size="14px" />
                      Cijena će biti određena nakon što dobavljač dostavi ponudu.
                    </div>
                  </div>
                </div>
              </div>

              <!-- ───── STEP 4: Review ───── -->
              <div v-else-if="step === 4" key="4" class="step">
                <div class="step__head">
                  <div class="step__caption">Korak {{ currentSteps.length }} od {{ currentSteps.length }}</div>
                  <h2 class="step__title">Pregled prije slanja</h2>
                  <p class="step__desc">
                    Provjerite unesene podatke. Klikom na "Pošalji na obradu" zahtjev se šalje na obradu.
                  </p>
                </div>

                <div class="step__body">
                  <div class="review">

                    <div class="review__field">
                      <span class="review__label">Odjel / Služba / Projekt</span>
                      <span class="review__value">{{ selectedDepartmentLabel || '—' }}</span>
                      <button class="review__edit" type="button" @click="step = 1">
                        <q-icon name="edit" size="12px" /> Uredi
                      </button>
                    </div>

                    <div class="review__field">
                      <span class="review__label">Svrha nabave</span>
                      <span class="review__value review__value--prose">{{ form.reasonName || '—' }}</span>
                      <button class="review__edit" type="button" @click="step = 3">
                        <q-icon name="edit" size="12px" /> Uredi
                      </button>
                    </div>

                    <div v-if="form.hasOffer === true" class="review__field">
                      <span class="review__label">Ponude / računi</span>
                      <span class="review__value">
                        <template v-if="form.offerFiles.length > 0">
                          <span class="review__file">
                            <q-icon name="attach_file" size="14px" />
                            <span :title="form.offerFiles.map(f => f.name).join(', ')">
                              {{ form.offerFiles.length === 1 ? form.offerFiles[0].name.length > 40 ? form.offerFiles[0].name.slice(0, 38) + '…' : form.offerFiles[0].name : `${form.offerFiles.length} priložene datoteke` }}
                            </span>
                          </span>
                        </template>
                        <span v-else class="review__muted">Bez ponude</span>
                      </span>
                      <button class="review__edit" type="button" @click="step = 3">
                        <q-icon name="edit" size="12px" /> Uredi
                      </button>
                    </div>

                    <div v-if="form.hasOffer === true" class="review__field">
                      <span class="review__label">Ukupni iznos</span>
                      <span class="review__value review__value--amount">
                        {{ form.estimatedAmount ? formatCurrency(form.estimatedAmount) : '—' }}
                      </span>
                      <button class="review__edit" type="button" @click="step = 3">
                        <q-icon name="edit" size="12px" /> Uredi
                      </button>
                    </div>

                    <div v-if="form.hasOffer === false" class="review__field">
                      <span class="review__label">Iznos</span>
                      <span class="review__value review__muted">Bit će određen nakon obrade zahtjeva</span>
                    </div>

                    <div class="review__field">
                      <span class="review__label">
                        <template v-if="form.hasOffer === false">Stavke ({{ form.items.length }})</template>
                        <template v-else>Kategorija</template>
                      </span>
                      <span class="review__value">
                        <template v-if="form.hasOffer === true">
                          {{ selectedCategoryLabel || '—' }}
                        </template>
                        <ul v-else class="review__items">
                          <li v-for="(item, index) in form.items" :key="index">
                            <span class="review__item-name">{{ index + 1 }}. {{ item.item_name }}</span>
                            <span class="review__item-meta">{{ item.category_label }} · × {{ item.quantity }}</span>
                          </li>
                        </ul>
                      </span>
                      <button class="review__edit" type="button" @click="step = 3">
                        <q-icon name="edit" size="12px" /> Uredi
                      </button>
                    </div>

                  </div>
                </div>
              </div>

            </transition>

            <!-- Wizard nav -->
            <div class="wizard__nav">
              <button
                v-if="step > 1"
                class="btn btn--ghost"
                :disabled="submitting"
                @click="step--"
              >
                <q-icon name="arrow_back" size="16px" />
                <span>Natrag</span>
              </button>
              <span v-else />

              <button
                v-if="step < 4"
                class="btn btn--primary"
                @click="nextStep"
              >
                <span>Dalje</span>
                <q-icon name="arrow_forward" size="16px" />
              </button>
              <button
                v-else
                class="btn btn--primary"
                :disabled="submitting"
                @click="submitWizard"
              >
                <q-spinner v-if="submitting" size="16px" color="white" />
                <q-icon v-else name="send" size="16px" />
                <span>{{ submitting ? 'Šaljem...' : 'Pošalji na obradu' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
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
const submitted = ref(false);

const isDirty = computed(() => {
  if (submitted.value) return false;
  const f = form.value;
  return (
    step.value > 1 ||
    !!f.department ||
    f.hasOffer !== null ||
    !!f.reasonName ||
    f.items.length > 0 ||
    f.offerFiles.length > 0
  );
});

const handleBeforeUnload = (e) => {
  if (isDirty.value) { e.preventDefault(); e.returnValue = ''; }
};
onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload));
onUnmounted(() => window.removeEventListener('beforeunload', handleBeforeUnload));

onBeforeRouteLeave(() => {
  if (!isDirty.value) return true;
  return new Promise((resolve) => {
    $q.dialog({
      title: 'Napuštanje stranice',
      message: 'Imate nespremljene podatke. Jeste li sigurni da želite napustiti stranicu?',
      cancel: { label: 'Ostani', flat: true, color: 'primary' },
      ok: { label: 'Napusti', color: 'negative', flat: true },
      persistent: true,
    }).onOk(() => resolve(true)).onCancel(() => resolve(false));
  });
});

const activeFiscalYearId = ref(null);
const noActiveFiscalYear = ref(false);
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

/* ───────── Wizard steps ───────── */

const currentSteps = computed(() => {
  const base = [
    { key: 'odjel', step: 1, title: 'Odjel', hint: 'Odaberite odjel' },
    { key: 'ponuda', step: 2, title: 'Ponuda', hint: 'Imate li ponudu?' },
  ];
  if (form.value.hasOffer === true) {
    return [
      ...base,
      { key: 'detalji', step: 3, title: 'Detalji', hint: 'Iznos i kategorija' },
      { key: 'pregled', step: 4, title: 'Pregled', hint: 'Potvrda i slanje' },
    ];
  }
  if (form.value.hasOffer === false) {
    return [
      ...base,
      { key: 'stavke', step: 3, title: 'Stavke', hint: 'Popis artikala' },
      { key: 'pregled', step: 4, title: 'Pregled', hint: 'Potvrda i slanje' },
    ];
  }
  return [
    ...base,
    { key: 'detalji', step: 3, title: 'Detalji', hint: 'Iznos i kategorija' },
    { key: 'pregled', step: 4, title: 'Pregled', hint: 'Potvrda i slanje' },
  ];
});

const progressBarWidth = computed(() => {
  const total = currentSteps.value.length;
  if (total <= 1) return '0%';
  return `${((step.value - 1) / (total - 1)) * 100}%`;
});

const selectedDepartmentLabel = computed(() =>
  departmentOptions.value.find((x) => x.value === form.value.department)?.label || ''
);

const selectedCategoryLabel = computed(() =>
  categoryOptions.value.find((x) => x.value === form.value.category)?.label || ''
);

/* ───────── Reference data ───────── */

const fetchReferenceData = async () => {
  loadingReferenceData.value = true;
  try {
    const fiscalYearRes = await api.get('/reference/active-fiscal-year');
    activeFiscalYearId.value = fiscalYearRes.data.id_fiscal_year;

    const [departmentsRes, categoriesRes] = await Promise.all([
      api.get('/reference/departments'),
      api.get('/reference/item-categories'),
    ]);
    departmentOptions.value = departmentsRes.data.map((d) => ({ label: d.name, value: d.id_department }));
    categoryOptions.value = categoriesRes.data.map((c) => ({ label: c.name, value: c.id_item_category }));
  } catch (error) {
    if (error?.response?.status === 404) {
      noActiveFiscalYear.value = true;
    } else {
      console.error('Greška:', error);
      $q.notify({ type: 'negative', message: 'Greška pri dohvaćanju podataka.' });
    }
  } finally {
    loadingReferenceData.value = false;
  }
};

/* ───────── Validation ───────── */

const notifyError = (message) => $q.notify({ type: 'negative', message });

const validateStep = (stepToValidate = step.value) => {
  if (loadingReferenceData.value) {
    notifyError('Pričekajte da se referentni podaci učitaju.');
    return false;
  }
  if (!activeFiscalYearId.value) {
    notifyError('Aktivna fiskalna godina nije dostupna.');
    return false;
  }
  if (stepToValidate >= 1 && !form.value.department) {
    notifyError('Odaberite odjel, službu ili projekt.');
    return false;
  }
  if (stepToValidate >= 2 && form.value.hasOffer === null) {
    notifyError('Odaberite jednu od opcija.');
    return false;
  }
  if (stepToValidate >= 3 && form.value.hasOffer === true) {
    if (form.value.offerFiles.length === 0) {
      notifyError('Priložite barem jednu ponudu.');
      return false;
    }
    if (!form.value.estimatedAmount || form.value.estimatedAmount <= 0) {
      notifyError('Ukupni iznos je obavezan.');
      return false;
    }
    if (!form.value.category) {
      notifyError('Odaberite kategoriju nabave.');
      return false;
    }
    if (!form.value.reasonName.trim()) {
      notifyError('Unesite svrhu nabave.');
      return false;
    }
  }
  if (stepToValidate >= 3 && form.value.hasOffer === false) {
    if (!form.value.reasonName.trim()) {
      notifyError('Unesite svrhu nabave.');
      return false;
    }
    if (form.value.items.length === 0) {
      notifyError('Dodajte barem jednu stavku.');
      return false;
    }
  }
  return true;
};

/* ───────── File handling ───────── */

const onAddOffer = (file) => {
  if (!file) return;

  if (!ALLOWED_OFFER_MIME_TYPES.includes(file.type)) {
    notifyError('Odabrana datoteka nije podržanog tipa.');
    newOfferFile.value = null;
    return;
  }
  if (file.size > MAX_OFFER_FILE_SIZE) {
    notifyError('Datoteka je veća od 10 MB.');
    newOfferFile.value = null;
    return;
  }
  const exists = form.value.offerFiles.some(
    (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
  );
  if (exists) {
    notifyError('Ta je datoteka već dodana.');
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

/* ───────── Step / form actions ───────── */

const selectHasOffer = (hasOffer) => {
  form.value.hasOffer = hasOffer;
  if (!hasOffer) {
    form.value.offerFiles = [];
    form.value.estimatedAmount = null;
    form.value.category = null;
    newOfferFile.value = null;
  }
};

const nextStep = () => {
  if (!validateStep()) return;
  if (step.value < 4) step.value++;
};

const addItem = () => {
  if (
    !itemForm.value.category
    || !itemForm.value.item_name.trim()
    || !itemForm.value.quantity
    || itemForm.value.quantity < 1
  ) {
    notifyError('Ispunite kategoriju, naziv i količinu.');
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

/* ───────── Submit ───────── */

const submitWizard = async () => {
  if (!validateStep(4)) return;

  submitting.value = true;

  // Ako ima ponudu — backend traži minimum 1 stavku, šaljemo kategoriju kao item
  const items = form.value.hasOffer === true
    ? [{ fk_item_category: form.value.category, item_name: selectedCategoryLabel.value, quantity: 1 }]
    : form.value.items.map((it) => ({
        fk_item_category: it.category,
        item_name: it.item_name,
        quantity: it.quantity,
      }));

  const payload = {
    fk_fiscal_year: activeFiscalYearId.value,
    fk_department: form.value.department,
    justification: form.value.reasonName.trim(),
    estimated_amount: form.value.estimatedAmount || null,
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
          console.error('Upload failed:', file.name, uploadError);
          $q.notify({
            type: 'warning',
            message: `Zahtjev ${data.request_number} kreiran, ali upload "${file.name}" nije uspio.`,
            timeout: 5000,
          });
        }
      }
    }

    $q.notify({
      type: 'positive',
      message: `Zahtjev ${data.request_number} uspješno poslan na obradu.`,
      timeout: 2500,
    });
    submitted.value = true;
    router.push('/requests');
  } catch (error) {
    console.error('Greška:', error);
    const message = error.response?.data?.message || 'Greška pri kreiranju zahtjeva.';
    $q.notify({ type: 'negative', message, timeout: 4000 });
  } finally {
    submitting.value = false;
  }
};

onMounted(() => fetchReferenceData());
</script>

<style scoped>
/* ─────────────────────────────────
   Page
   ───────────────────────────────── */
.page {
  background: transparent;
  padding: 38px 40px 32px;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111827;
}

.page-shell {
  max-width: 1100px;
  margin: 0 auto;
}

/* ─────────────────────────────────
   Page header
   ───────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.page-header__main { flex: 1; min-width: 240px; }

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.breadcrumb__item {
  color: #6b7280;
  font-size: 0.8125rem;
  font-weight: 500;
}

.breadcrumb__back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 0.8125rem;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.15s;
}

.breadcrumb__back:hover { color: #00afdb; }

.breadcrumb__sep {
  color: #d1d5db;
  font-size: 0.875rem;
  user-select: none;
}

.breadcrumb__current {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}

.page-header__title {
  font-size: 2.25rem;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.015em;
  line-height: 1.1;
  margin: 0;
}
.page-header__subtitle {
  font-size: 0.9375rem;
  color: #4b5563;
  margin: 10px 0 0;
  line-height: 1.5;
  max-width: 560px;
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
  border-radius: 3px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  color: #111827;
  background: white;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn--primary {
  background: #111827;
  color: white;
  border-color: #111827;
}
.btn--primary:hover:not(:disabled) { background: #000; border-color: #000; }

.btn--ghost {
  background: transparent;
  color: #424242;
  border-color: #d1d5db;
}
.btn--ghost:hover:not(:disabled) { background: #F8F8F8; border-color: #4b5563; }

.icon-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.icon-btn:hover { background: #f3f4f6; color: #A4262C; }

/* ─────────────────────────────────
   Wizard layout
   ───────────────────────────────── */
.wizard {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 16px;
  align-items: start;
}

/* ─────────────────────────────────
   Sidebar — step list
   ───────────────────────────────── */
.wizard__sidebar {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  padding: 12px;
  position: sticky;
  top: 72px;
}

.step-list {
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
}

.step-list__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 4px;
  position: relative;
  transition: background 0.12s;
}

.step-list__item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 19px;
  top: 36px;
  bottom: -10px;
  width: 1px;
  background: #e5e7eb;
}

.step-list__item--done:not(:last-child)::after,
.step-list__item--active:not(:last-child)::after {
  background: #0067b8;
}

.step-list__indicator {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  border: 1.5px solid #d1d5db;
  color: #4b5563;
  font-size: 0.6875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.18s;
  position: relative;
  z-index: 1;
}

.step-list__body { padding-top: 1px; flex: 1; min-width: 0; }

.step-list__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #4b5563;
  letter-spacing: -0.005em;
}

.step-list__hint {
  font-size: 0.6875rem;
  color: #9ca3af;
  margin-top: 1px;
}

/* Active step */
.step-list__item--active .step-list__indicator {
  background: #111827;
  border-color: #111827;
  color: white;
}
.step-list__item--active .step-list__label {
  color: #111827;
  font-weight: 600;
}

/* Done step */
.step-list__item--done .step-list__indicator {
  background: #0067b8;
  border-color: #0067b8;
  color: white;
}
.step-list__item--done .step-list__label { color: #424242; }

/* ─────────────────────────────────
   Content card
   ───────────────────────────────── */
.wizard__content {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 480px;
}

.wizard__progress {
  height: 2px;
  background: #f3f4f6;
  position: relative;
}
.wizard__progress-fill {
  height: 100%;
  background: #0067b8;
  transition: width 0.3s ease;
}

.wizard__inner {
  padding: 24px 28px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ─────────────────────────────────
   Step
   ───────────────────────────────── */
.step__head {
  margin-bottom: 24px;
}

.step__caption {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #0067b8;
  margin-bottom: 6px;
}

.step__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.step__desc {
  font-size: 0.8125rem;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
}

.step__body { flex: 1; }

/* ─────────────────────────────────
   Fields
   ───────────────────────────────── */
.field {
  margin-bottom: 18px;
}

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
  color: #4b5563;
  margin-top: 6px;
  line-height: 1.4;
}

.field__hint--info {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #0e7490;
  background: #e0f6fd;
  border-radius: 4px;
  padding: 5px 8px;
  margin-top: 10px;
  font-size: 0.75rem;
}

/* ─────────────────────────────────
   Upload zone
   ───────────────────────────────── */
.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px 16px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  text-align: center;
}

.upload-zone:hover {
  border-color: #00afdb;
  background: #f0fbfe;
}

.upload-zone__icon { color: #9ca3af; transition: color 0.15s; }
.upload-zone:hover .upload-zone__icon { color: #00afdb; }

.upload-zone__text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.upload-zone__hint {
  font-size: 0.75rem;
  color: #9ca3af;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 700px) {
  .field-grid { grid-template-columns: 1fr; }
}

/* Quasar input styling */
.field__input :deep(.q-field__control) {
  height: 36px;
  border-radius: 0;
  background: white;
}
.field__input.q-field--filled :deep(.q-field__control),
.field__input :deep(.q-field__control:before) {
  border: 1px solid #d1d5db;
  border-radius: 0;
}
.field__input :deep(.q-field__native) {
  font-size: 0.8125rem;
  color: #111827;
}
.field__input :deep(.q-field__prepend) { color: #4b5563; }
.field__input :deep(.q-field__suffix) {
  font-size: 0.75rem;
  color: #4b5563;
}

.field__input--textarea :deep(.q-field__control) {
  height: auto;
  min-height: 80px;
  padding-top: 6px;
  padding-bottom: 6px;
}
.field__input--textarea :deep(textarea) {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #111827;
}

/* ─────────────────────────────────
   Choice cards (step 2)
   ───────────────────────────────── */
.choice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 540px;
}

.choice {
  all: unset;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
}

.choice:hover {
  border-color: #111827;
  background: #FAFAFA;
}

.choice--selected {
  border-color: #00afdb;
  background: #e0f6fd;
  box-shadow: 0 0 0 1px #00afdb;
}

.choice__icon {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: #F5F5F5;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.choice--selected .choice__icon {
  background: #b3edf7;
  color: #0e7490;
}

.choice--selected .choice__radio {
  color: #00afdb;
}

.choice__body { flex: 1; }
.choice__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.005em;
}
.choice__desc {
  font-size: 0.75rem;
  color: #4b5563;
  margin-top: 2px;
}

.choice__radio {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  flex-shrink: 0;
}

.choice:not(.choice--selected) .choice__radio {
  border: 1.5px solid #d1d5db;
  border-radius: 50%;
}

/* ─────────────────────────────────
   File list
   ───────────────────────────────── */
.file-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.file-list__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
}
.file-list__item:last-child { border-bottom: none; }

.file-list__icon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: #dbeafe;
  color: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-list__name {
  flex: 1;
  font-size: 0.8125rem;
  color: #111827;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-list__size {
  font-size: 0.6875rem;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* ─────────────────────────────────
   Add item form (step 3b)
   ───────────────────────────────── */
.add-item {
  background: #F8F8F8;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
}

.add-item__labels {
  display: grid;
  grid-template-columns: 1fr 1.4fr 80px;
  gap: 8px;
  margin-bottom: 4px;
}

.add-item__label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.02em;
  text-transform: uppercase;
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
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  background: white;
}

.item-list__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
}
.item-list__row:last-child { border-bottom: none; }

.item-list__index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #dbeafe;
  color: #111827;
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
  color: #111827;
  letter-spacing: -0.005em;
}
.item-list__category {
  font-size: 0.6875rem;
  color: #9ca3af;
  margin-top: 1px;
}

.item-list__qty {
  font-size: 0.75rem;
  font-weight: 600;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.item-list__footer {
  font-size: 0.6875rem;
  color: #4b5563;
  text-align: right;
  margin-top: 6px;
}

/* ─────────────────────────────────
   Empty state (in items)
   ───────────────────────────────── */
.empty-block {
  text-align: center;
  padding: 32px 16px;
  border: 1px dashed #e5e7eb;
  border-radius: 4px;
  background: #FAFAFA;
}

.empty-block__icon {
  color: #9ca3af;
  margin-bottom: 8px;
}

.empty-block__text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #424242;
}

.empty-block__hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 2px;
}

/* ─────────────────────────────────
   Review (step 4)
   ───────────────────────────────── */
.review {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #FAFAFA;
  overflow: hidden;
}

.review__field {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  align-items: flex-start;
}
.review__field:last-child { border-bottom: none; }

.review__edit {
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #00afdb;
  cursor: pointer;
  white-space: nowrap;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.review__edit:hover { opacity: 1; }

@media (max-width: 700px) {
  .review__field {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}

.review__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4b5563;
  letter-spacing: 0.005em;
}

.review__value {
  font-size: 0.8125rem;
  color: #111827;
  font-weight: 500;
  word-break: break-word;
}

.review__value--prose {
  font-weight: 400;
  color: #424242;
  white-space: pre-wrap;
  line-height: 1.5;
}

.review__value--amount {
  font-weight: 600;
  color: #111827;
  font-variant-numeric: tabular-nums;
}

.review__muted {
  color: #9ca3af;
  font-weight: 400;
  font-style: italic;
}

.review__file {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #059669;
  font-size: 0.75rem;
  font-weight: 500;
  margin-right: 8px;
  margin-bottom: 4px;
}

.review__items {
  list-style: none;
  margin: 0;
  padding: 0;
}
.review__items li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 0;
  border-bottom: 1px solid #f3f4f6;
}
.review__items li:last-child { border-bottom: none; padding-bottom: 0; }

.review__item-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #111827;
}

.review__item-meta {
  font-size: 0.6875rem;
  color: #9ca3af;
}

/* ─────────────────────────────────
   Wizard nav
   ───────────────────────────────── */
.wizard__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  margin-top: 24px;
  border-top: 1px solid #e5e7eb;
}

/* ─────────────────────────────────
   Transitions
   ───────────────────────────────── */
.step-fade-enter-active,
.step-fade-leave-active {
  transition: all 0.18s ease;
}
.step-fade-enter-from { opacity: 0; transform: translateX(8px); }
.step-fade-leave-to { opacity: 0; transform: translateX(-8px); }

/* ─────────────────────────────────
   Responsive
   ───────────────────────────────── */
@media (max-width: 900px) {
  .wizard {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .wizard__sidebar {
    position: static;
    padding: 8px;
  }
  .step-list {
    display: flex;
    overflow-x: auto;
    gap: 4px;
  }
  .step-list__item {
    flex: 0 0 auto;
    padding: 6px 10px;
  }
  .step-list__item:not(:last-child)::after { display: none; }
  .step-list__hint { display: none; }
}

@media (max-width: 600px) {
  .page { padding: 24px 16px 24px; }
  .wizard__inner { padding: 20px 16px 16px; }
}

.no-fy-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 420px;
  margin: 64px auto 0;
  text-align: center;
}

.no-fy-block__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border: 1px solid #e5e7eb;
  color: #9ca3af;
  margin-bottom: 4px;
}

.no-fy-block__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.no-fy-block__body {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 4px;
}
</style>
