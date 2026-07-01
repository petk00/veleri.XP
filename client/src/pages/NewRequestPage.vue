<template>
  <q-page class="page">
    <div class="page-shell">

      <!-- Page header -->
      <header class="page-header">
        <div class="page-header__main" />
        <button class="btn btn--ghost" @click="confirmCancel">
          <q-icon name="close" size="16px" />
          <span>Odustani</span>
        </button>
      </header>

      <!-- Loading -->
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
        <button class="btn btn--ghost" @click="$router.push('/dashboard')">
          Povratak na nadzornu ploču
        </button>
      </div>

      <!-- Wizard -->
      <div v-else class="wizard">

        <!-- ── Content ── -->
        <div class="wizard__content">

          <div class="wizard__progress-row">
            <div class="wizard__progress">
              <div class="wizard__progress-fill" :style="{ width: progressBarWidth }" />
            </div>
            <span class="wizard__step-label">Korak {{ currentStepIndex + 1 }} od {{ stepSequence.length }}</span>
          </div>

          <div class="wizard__inner">
            <transition name="step-fade" mode="out-in">

              <!-- ──────────── ODJEL ──────────── -->
              <div v-if="currentStep === 'odjel'" key="odjel" class="hero-card hero-card--compact">
                <div class="hero-card__head">
                  <h2 class="hero-card__title hero-card__title--lg">Kojem odjelu, službi ili projektu pripadate?</h2>
                </div>
                <div class="hero-card__body">
                  <div class="dept-search-box" :class="{ 'dept-search-box--open': deptOpen && !form.department, 'dept-search-box--done': !!form.department }">
                    <q-icon :name="form.department ? 'check_circle' : 'search'" size="20px" class="dept-search-box__icon" :class="{ 'dept-search-box__icon--done': !!form.department }" />
                    <input
                      v-if="!form.department"
                      v-model="deptSearch"
                      type="text"
                      placeholder="Upišite naziv vašeg odjela, službe ili projekta..."
                      class="dept-search-box__input"
                      autocomplete="off"
                      @focus="deptOpen = true"
                      @blur="onDeptBlur"
                    />
                    <span v-else class="dept-search-box__chosen">{{ selectedDepartmentLabel }}</span>
                    <button v-if="form.department" class="dept-search-box__clear" @click="clearDept">
                      <q-icon name="close" size="14px" />
                    </button>
                    <template v-else>
                      <q-icon v-if="deptOpen" name="expand_less" size="18px" class="dept-search-box__arrow" />
                      <q-icon v-else name="expand_more" size="18px" class="dept-search-box__arrow" />
                    </template>
                  </div>
                  <div v-if="!form.department && deptOpen" class="dept-results">
                    <button
                      v-for="opt in filteredDepartmentOptions"
                      :key="opt.value"
                      type="button"
                      class="dept-result-item"
                      @mousedown.prevent
                      @click="selectDept(opt)"
                    >
                      {{ opt.label }}
                    </button>
                    <div v-if="filteredDepartmentOptions.length === 0" class="dept-results__empty">
                      Nema rezultata za „{{ deptSearch }}"
                    </div>
                  </div>
                </div>
              </div>

              <!-- ──────────── SVRHA ──────────── -->
              <div v-else-if="currentStep === 'svrha'" key="svrha" class="hero-card hero-card--compact">
                <div class="hero-card__head">
                  <h2 class="hero-card__title hero-card__title--lg">Zašto nabavljate?</h2>
                </div>
                <div class="hero-card__body">
                  <div class="svrha-box">
                    <textarea
                      v-model="form.reasonName"
                      rows="4"
                      maxlength="1000"
                      placeholder="Opišite svrhu nabave — npr. Nabava prijenosnog računala za novog zaposlenika u odjelu razvoja..."
                      class="svrha-box__input"
                    />
                  </div>
                </div>
              </div>

              <!-- ──────────── PONUDA ──────────── -->
              <div v-else-if="currentStep === 'ponuda'" key="ponuda" class="hero-card hero-card--compact">
                <div class="hero-card__head">
                  <h2 class="hero-card__title hero-card__title--lg">Imate li ponudu dobavljača?</h2>
                </div>
                <div class="hero-card__body">
                  <div class="offer-choice-list">
                    <button
                      type="button"
                      class="offer-choice"
                      :class="{ 'offer-choice--selected': form.hasOffer === true }"
                      @click="selectHasOffer(true)"
                    >
                      <img src="/clipboard-check-svgrepo-com.svg" alt="" class="offer-choice__svg" />
                      <span class="offer-choice__label">Da, imam ponudu ili račun</span>
                      <q-icon :name="form.hasOffer === true ? 'check_circle' : 'chevron_right'" size="18px" class="offer-choice__check" :class="{ 'offer-choice__check--pending': form.hasOffer !== true }" />
                    </button>
                    <button
                      type="button"
                      class="offer-choice"
                      :class="{ 'offer-choice--selected': form.hasOffer === false }"
                      @click="selectHasOffer(false)"
                    >
                      <img src="/clipboard-remove-svgrepo-com.svg" alt="" class="offer-choice__svg" />
                      <span class="offer-choice__label">Nemam ponudu, ali znam što mi treba</span>
                      <q-icon :name="form.hasOffer === false ? 'check_circle' : 'chevron_right'" size="18px" class="offer-choice__check" :class="{ 'offer-choice__check--pending': form.hasOffer !== false }" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- ──────────── UPLOAD ──────────── -->
              <div v-else-if="currentStep === 'upload'" key="upload" class="hero-card hero-card--compact">
                <div class="hero-card__head">
                  <h2 class="hero-card__title hero-card__title--lg">Dodajte ponudu:</h2>
                </div>
                <div class="hero-card__body">
                  <label class="upload-zone">
                    <img src="/file-send-svgrepo-com.svg" alt="" class="upload-zone__icon" />
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
                      <div class="file-list__icon"><img src="/solarlinear_MOJIZAHTJEVI.svg" alt="" class="file-list__svg" /></div>
                      <div class="file-list__name">{{ file.name }}</div>
                      <div class="file-list__size">{{ formatFileSize(file.size) }}</div>
                      <button class="icon-btn" @click="removeOffer(index)">
                        <q-icon name="close" size="16px" />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- ──────────── KATEGORIJA ──────────── -->
              <div v-else-if="currentStep === 'kategorija'" key="kategorija" class="hero-card hero-card--compact">
                <div class="hero-card__head">
                  <h2 class="hero-card__title hero-card__title--lg">Upišite iznos i odaberite kategoriju:</h2>
                </div>
                <div class="hero-card__body">
                  <div class="kat-box-group">
                    <div class="kat-amount-box">
                      <img src="/hand-money-svgrepo-com.svg" alt="" class="kat-amount-box__icon" />
                      <input
                        v-model="displayAmount"
                        type="text" inputmode="decimal"
                        placeholder="Upišite iznos s ponude, ili zbroj ako ih imate više"
                        class="kat-amount-box__input"
                        @focus="onAmountFocus"
                        @blur="onAmountBlur"
                      />
                    </div>
                    <div class="kat-select-wrap">
                      <img src="/box-svgrepo-com.svg" alt="" class="kat-select-icon" />
                      <q-select
                        v-model="form.category"
                        :options="categoryOptions"
                        emit-value map-options
                        :display-value="form.category === null ? 'Odaberite kategoriju...' : undefined"
                        :class="['kat-select', { 'kat-select--empty': form.category === null }]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- ──────────── POTVRDA (zadnji korak) ──────────── -->
              <div v-else-if="currentStep === 'potvrda'" key="potvrda" class="hero-card hero-card--compact">
                <div class="hero-card__head">
                  <h2 class="hero-card__title hero-card__title--lg">To je to?</h2>
                </div>
                <div class="hero-card__body">
                  <div class="review">
                    <div class="review__field">
                      <span class="review__label">Odjel / Projekt</span>
                      <span class="review__value">{{ selectedDepartmentLabel || '—' }}</span>
                      <button class="review__edit" type="button" @click="goToStep('odjel')">
                        <q-icon name="edit" size="12px" /> Uredi
                      </button>
                    </div>
                    <div class="review__field">
                      <span class="review__label">Svrha nabave</span>
                      <span class="review__value review__value--prose">{{ form.reasonName || '—' }}</span>
                      <button class="review__edit" type="button" @click="goToStep('svrha')">
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
                              {{ form.offerFiles.length === 1
                                ? (form.offerFiles[0].name.length > 40 ? form.offerFiles[0].name.slice(0,38)+'…' : form.offerFiles[0].name)
                                : `${form.offerFiles.length} priložene datoteke` }}
                            </span>
                          </span>
                        </template>
                        <span v-else class="review__muted">Bez ponude</span>
                      </span>
                      <button class="review__edit" type="button" @click="goToStep('upload')">
                        <q-icon name="edit" size="12px" /> Uredi
                      </button>
                    </div>
                    <div v-if="form.hasOffer === true" class="review__field">
                      <span class="review__label">Ukupni iznos</span>
                      <span class="review__value review__value--amount">
                        {{ form.estimatedAmount ? formatCurrency(form.estimatedAmount) : '—' }}
                      </span>
                      <button class="review__edit" type="button" @click="goToStep('kategorija')">
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
                        <template v-if="form.hasOffer === true">{{ selectedCategoryLabel || '—' }}</template>
                        <ul v-else class="review__items">
                          <li v-for="(item, index) in form.items" :key="index">
                            <span class="review__item-name">{{ index + 1 }}. {{ item.item_name }}</span>
                            <span class="review__item-meta">{{ item.category_label }} · × {{ item.quantity }}</span>
                          </li>
                        </ul>
                      </span>
                      <button class="review__edit" type="button" @click="goToStep(form.hasOffer === true ? 'kategorija' : 'stavke')">
                        <q-icon name="edit" size="12px" /> Uredi
                      </button>
                    </div>
                    <div class="review__field">
                      <span class="review__label">Napomena</span>
                      <span class="review__value review__value--prose">{{ form.comment || '—' }}</span>
                      <button class="review__edit" type="button" @click="goToStep('komentar')">
                        <q-icon name="edit" size="12px" /> Uredi
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ──────────── STAVKE ──────────── -->
              <div v-else-if="currentStep === 'stavke'" key="stavke" class="hero-card">
                <div class="hero-card__head">
                  <h2 class="hero-card__title hero-card__title--lg">Što trebate?</h2>
                </div>
                <div class="hero-card__body">
                  <div class="add-item">
                    <div class="add-item__grid">
                      <q-select
                        v-model="itemForm.category"
                        :options="categoryOptions"
                        :display-value="itemForm.category === null ? 'Odaberite kategoriju...' : undefined"
                        outlined dense
                        emit-value map-options
                        :class="['add-item__category', { 'add-item__category--empty': itemForm.category === null }]"
                      />
                      <q-input
                        v-model="itemForm.item_name"
                        placeholder="Npr. laptop, stolica, papir za printer..."
                        outlined dense
                        class="add-item__name"
                        @keyup.enter="addItem"
                      />
                      <div class="qty-stepper">
                        <button type="button" class="qty-stepper__btn" @click="itemForm.quantity = Math.max(1, (itemForm.quantity || 1) - 1)">
                          <q-icon name="remove" size="14px" />
                        </button>
                        <input
                          v-model.number="itemForm.quantity"
                          type="number" min="1"
                          class="qty-stepper__input"
                          @keyup.enter="addItem"
                        />
                        <button type="button" class="qty-stepper__btn" @click="itemForm.quantity = (itemForm.quantity || 0) + 1">
                          <q-icon name="add" size="14px" />
                        </button>
                      </div>
                      <button class="btn btn--primary add-item__btn" @click="addItem">
                        <q-icon name="add" size="16px" />
                        <span>Dodaj</span>
                      </button>
                    </div>
                  </div>

                  <div v-if="form.items.length === 0" class="empty-block">
                    <img src="/solarlinear_MOJIZAHTJEVI.svg" alt="" class="empty-block__icon" />
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
                      <button class="icon-btn icon-btn--danger" @click="removeItem(index)">
                        <q-icon name="close" size="16px" />
                      </button>
                    </li>
                  </ul>

                  <div v-if="form.items.length > 0" class="item-list__footer">
                    Ukupno {{ form.items.length }} {{ form.items.length === 1 ? 'stavka' : 'stavki' }}
                  </div>

                </div>
              </div>

              <!-- ──────────── KOMENTAR ──────────── -->
              <div v-else-if="currentStep === 'komentar'" key="komentar" class="hero-card hero-card--compact">
                <div class="hero-card__head">
                  <h2 class="hero-card__title hero-card__title--lg">Imate li kakvu napomenu?</h2>
                </div>
                <div class="hero-card__body">
                  <div class="svrha-box">
                    <textarea
                      v-model="form.comment"
                      rows="5"
                      maxlength="500"
                      placeholder="Opcionalna napomena za administratora — možete preskočiti."
                      class="svrha-box__input"
                    />
                  </div>
                </div>
              </div>


            </transition>

            <!-- Nav -->
            <div class="wizard__nav">
              <button
                v-if="currentStep !== 'odjel'"
                class="btn btn--ghost"
                :disabled="submitting"
                @click="goBack"
              >
                <q-icon name="arrow_back" size="16px" />
                <span>Natrag</span>
              </button>
              <span v-else />

              <button
                v-if="currentStep !== 'potvrda'"
                class="btn btn--primary"
                :class="{ 'btn--disabled': !canProceed }"
                @click="goNext"
              >
                <span>Dalje</span>
                <q-icon name="arrow_forward" size="16px" />
                <q-tooltip v-if="!canProceed">{{ proceedHint }}</q-tooltip>
              </button>
              <button
                v-else
                class="btn btn--cta"
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

    <!-- Cancel dialog -->
    <q-dialog v-model="showCancelDialog" persistent>
      <div class="cancel-dialog">
        <h3 class="cancel-dialog__title">Odustajete od zahtjeva?</h3>
        <p class="cancel-dialog__message">Uneseni podaci neće biti spremljeni.</p>
        <div class="cancel-dialog__actions">
          <button class="btn btn--primary cancel-dialog__btn-continue" @click="onDialogStay">
            <span>Nastavi unos</span>
          </button>
          <button class="btn btn--ghost cancel-dialog__btn-leave" @click="onCancelConfirmed">
            <span>Odustani</span>
          </button>
        </div>
      </div>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
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

/* ───────── State ───────── */

const currentStep = ref('odjel');
const loadingReferenceData = ref(false);
const submitting = ref(false);
const submitted = ref(false);

const form = ref({
  department: null,
  hasOffer: null,
  offerFiles: [],
  estimatedAmount: null,
  category: null,
  reasonName: '',
  comment: '',
  items: [],
});

const itemForm = ref({ category: null, item_name: '', quantity: 1 });
const newOfferFile = ref(null);
const deptSearch = ref('');
const deptOpen = ref(false);
const onDeptBlur = () => { setTimeout(() => { deptOpen.value = false; }, 160); };
const selectDept = (opt) => { form.value.department = opt.value; deptSearch.value = ''; deptOpen.value = false; };

const activeFiscalYearId = ref(null);
const noActiveFiscalYear = ref(false);
const departmentOptions = ref([]);
const categoryOptions = ref([]);

/* ───────── Step sequences ───────── */

const STEP_SEQUENCE_OFFER    = ['odjel','svrha','ponuda','upload','kategorija','komentar','potvrda'];
const STEP_SEQUENCE_NO_OFFER = ['odjel','svrha','ponuda','stavke','komentar','potvrda'];
const STEP_SEQUENCE_UNKNOWN  = ['odjel','svrha','ponuda','komentar','potvrda'];

const SECTION3_STEPS = new Set(['ponuda','upload','kategorija','stavke']);

const STEP_PROGRESS = {
  odjel: 0, svrha: 0.17, ponuda: 0.34,
  upload: 0.45, kategorija: 0.57,
  stavke: 0.57,
  komentar: 0.75, potvrda: 1.0,
};

const stepSequence = computed(() => {
  if (form.value.hasOffer === true)  return STEP_SEQUENCE_OFFER;
  if (form.value.hasOffer === false) return STEP_SEQUENCE_NO_OFFER;
  return STEP_SEQUENCE_UNKNOWN;
});

const currentStepIndex = computed(() => stepSequence.value.indexOf(currentStep.value));

const currentSection = computed(() => {
  if (currentStep.value === 'odjel')    return 1;
  if (currentStep.value === 'svrha')    return 2;
  if (SECTION3_STEPS.has(currentStep.value)) return 3;
  if (currentStep.value === 'komentar') return 4;
  if (currentStep.value === 'pregled')  return 5;
  return 1;
});

const progressBarWidth = computed(() => `${(STEP_PROGRESS[currentStep.value] ?? 0) * 100}%`);

const isPastStep = (key) => {
  const idx = stepSequence.value.indexOf(key);
  return idx !== -1 && idx < currentStepIndex.value;
};

/* ───────── canProceed ───────── */

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 'odjel':      return !!form.value.department;
    case 'svrha':      return !!form.value.reasonName.trim();
    case 'ponuda':     return form.value.hasOffer !== null;
    case 'upload':     return form.value.offerFiles.length > 0;
    case 'kategorija': return !!form.value.category && !!form.value.estimatedAmount && form.value.estimatedAmount > 0;
    case 'potvrda':    return true;
    case 'stavke':     return form.value.items.length > 0;
    case 'komentar':   return true;
    case 'pregled':    return true;
    default:           return true;
  }
});

const proceedHint = computed(() => {
  if (canProceed.value) return '';
  switch (currentStep.value) {
    case 'odjel':      return 'Odaberite odjel ili projekt za nastavak';
    case 'svrha':      return 'Upišite svrhu nabave za nastavak';
    case 'ponuda':     return 'Odaberite jednu od opcija za nastavak';
    case 'upload':     return 'Priložite barem jednu ponudu za nastavak';
    case 'kategorija': return 'Upišite iznos i odaberite kategoriju za nastavak';
    case 'stavke':     return 'Dodajte barem jednu stavku za nastavak';
    default:           return '';
  }
});

/* ───────── isDirty ───────── */

const isDirty = computed(() => {
  if (submitted.value) return false;
  const f = form.value;
  return (
    currentStep.value !== 'odjel' ||
    !!f.department ||
    f.hasOffer !== null ||
    !!f.reasonName ||
    !!f.comment ||
    f.items.length > 0 ||
    f.offerFiles.length > 0
  );
});

const handleBeforeUnload = (e) => {
  if (isDirty.value) { e.preventDefault(); e.returnValue = ''; }
};
onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload));
onUnmounted(() => window.removeEventListener('beforeunload', handleBeforeUnload));

const showCancelDialog = ref(false);
const routeLeaveResolve = ref(null);

const confirmCancel = () => { showCancelDialog.value = true; };

const onDialogStay = () => {
  showCancelDialog.value = false;
  if (routeLeaveResolve.value) {
    routeLeaveResolve.value(false);
    routeLeaveResolve.value = null;
  }
};

const onCancelConfirmed = () => {
  showCancelDialog.value = false;
  if (routeLeaveResolve.value) {
    routeLeaveResolve.value(true);
    routeLeaveResolve.value = null;
  } else {
    submitted.value = true;
    router.push('/dashboard');
  }
};

onBeforeRouteLeave(() => {
  if (!isDirty.value) return true;
  showCancelDialog.value = true;
  return new Promise((resolve) => {
    routeLeaveResolve.value = resolve;
  });
});

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
    categoryOptions.value   = categoriesRes.data.map((c) => ({ label: c.name, value: c.id_item_category }));
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

/* ───────── Navigation ───────── */

const notifyError = (message) => $q.notify({ type: 'negative', message });

const goNext = () => {
  if (!canProceed.value) {
    notifyError('Ispunite obavezno polje prije nastavka.');
    return;
  }
  const seq = stepSequence.value;
  const next = seq[currentStepIndex.value + 1];
  if (next) currentStep.value = next;
};

const goBack = () => {
  const seq = stepSequence.value;
  const prev = seq[currentStepIndex.value - 1];
  if (prev) currentStep.value = prev;
};

const goToStep = (key) => {
  currentStep.value = key;
};

/* ───────── Form actions ───────── */

const selectHasOffer = (hasOffer) => {
  form.value.hasOffer = hasOffer;
  if (!hasOffer) {
    form.value.offerFiles = [];
    form.value.estimatedAmount = null;
    form.value.category = null;
    newOfferFile.value = null;
  } else {
    form.value.items = [];
  }
  // Auto-advance — kratak delay da korisnik vidi selected state
  setTimeout(() => goNext(), 180);
};

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

const addItem = () => {
  if (!itemForm.value.category || !itemForm.value.item_name.trim() || !itemForm.value.quantity || itemForm.value.quantity < 1) {
    notifyError('Ispunite kategoriju, naziv i količinu.');
    return;
  }
  const trimmedName = itemForm.value.item_name.trim();
  const duplicateIdx = form.value.items.findIndex(
    (it) => it.category === itemForm.value.category && it.item_name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicateIdx !== -1) {
    form.value.items[duplicateIdx].quantity += itemForm.value.quantity;
  } else {
    const category = categoryOptions.value.find((x) => x.value === itemForm.value.category);
    form.value.items.push({
      category: itemForm.value.category,
      category_label: category?.label || '',
      item_name: trimmedName,
      quantity: itemForm.value.quantity,
    });
  }
  itemForm.value = { category: null, item_name: '', quantity: 1 };
};

const removeItem = (index) => form.value.items.splice(index, 1);

/* ───────── Computed labels ───────── */

const selectedDepartmentLabel = computed(() =>
  departmentOptions.value.find((x) => x.value === form.value.department)?.label || ''
);

const selectedCategoryLabel = computed(() =>
  categoryOptions.value.find((x) => x.value === form.value.category)?.label || ''
);

const filteredDepartmentOptions = computed(() => {
  const q = deptSearch.value.trim().toLowerCase();
  if (!q) return departmentOptions.value;
  return departmentOptions.value.filter((x) => x.label.toLowerCase().includes(q));
});

const clearDept = () => { form.value.department = null; deptSearch.value = ''; };

watch(deptSearch, (val) => {
  const q = val.trim().toLowerCase();
  if (!q) { form.value.department = null; return; }
  const matches = departmentOptions.value.filter(x => x.label.toLowerCase().includes(q));
  if (matches.length === 1) form.value.department = matches[0].value;
  else form.value.department = null;
});

/* ───────── Formatters ───────── */

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatCurrency = (value) => {
  if (value == null || value === '') return '—';
  return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(Number(value));
};

const displayAmount = ref('');
const onAmountFocus = () => {
  displayAmount.value = form.value.estimatedAmount != null ? String(form.value.estimatedAmount) : '';
};
const onAmountBlur = () => {
  const raw = displayAmount.value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const num = parseFloat(raw);
  if (!isNaN(num) && num > 0) {
    form.value.estimatedAmount = num;
    displayAmount.value = new Intl.NumberFormat('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num) + ' €';
  } else {
    form.value.estimatedAmount = null;
    displayAmount.value = '';
  }
};
watch(currentStep, (step) => {
  if (step === 'kategorija' && form.value.estimatedAmount) {
    displayAmount.value = new Intl.NumberFormat('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(form.value.estimatedAmount) + ' €';
  }
});

/* ───────── Submit ───────── */

const validateAll = () => {
  if (!activeFiscalYearId.value) { notifyError('Aktivna fiskalna godina nije dostupna.'); return false; }
  if (!form.value.department)    { notifyError('Odaberite odjel, službu ili projekt.'); return false; }
  if (!form.value.reasonName.trim()) { notifyError('Unesite svrhu nabave.'); return false; }
  if (form.value.hasOffer === null)  { notifyError('Odaberite jednu od opcija.'); return false; }
  if (form.value.hasOffer === true) {
    if (form.value.offerFiles.length === 0) { notifyError('Priložite barem jednu ponudu.'); return false; }
    if (!form.value.estimatedAmount || form.value.estimatedAmount <= 0) { notifyError('Ukupni iznos je obavezan.'); return false; }
    if (!form.value.category) { notifyError('Odaberite kategoriju nabave.'); return false; }
  }
  if (form.value.hasOffer === false && form.value.items.length === 0) {
    notifyError('Dodajte barem jednu stavku.');
    return false;
  }
  return true;
};

const submitWizard = async () => {
  if (!validateAll()) return;
  submitting.value = true;

  const items = form.value.hasOffer === true
    ? [{ fk_item_category: form.value.category, item_name: selectedCategoryLabel.value, quantity: 1 }]
    : form.value.items.map((it) => ({
        fk_item_category: it.category,
        item_name: it.item_name,
        quantity: it.quantity,
      }));

  const payload = {
    fk_fiscal_year:   activeFiscalYearId.value,
    fk_department:    form.value.department,
    justification:    form.value.reasonName.trim(),
    estimated_amount: form.value.estimatedAmount || null,
    comment:          form.value.comment.trim() || null,
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

    $q.notify({ type: 'positive', message: `Zahtjev ${data.request_number} uspješno poslan na obradu.`, timeout: 2500 });
    submitted.value = true;
    router.push('/dashboard');
  } catch (error) {
    console.error('Greška:', error);
    $q.notify({ type: 'negative', message: error.response?.data?.message || 'Greška pri kreiranju zahtjeva.', timeout: 4000 });
  } finally {
    submitting.value = false;
  }
};

onMounted(() => fetchReferenceData());
</script>

<style scoped>
/* ─── Page ─── */
.page {
  background: transparent;
  padding: 32px 40px;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111827;
}
.page-shell { max-width: 1400px; margin: 0 auto; }

/* ─── Page header ─── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  max-width: 976px;
  margin-left: auto;
  margin-right: auto;
}
.page-header__main { flex: 1; }

/* ─── Loading / no-fy ─── */
.loading-block { display: flex; justify-content: center; padding: 48px 0; }

.no-fy-block {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; max-width: 420px; margin: 64px auto 0; text-align: center;
}
.no-fy-block__icon {
  display: flex; align-items: center; justify-content: center;
  width: 56px; height: 56px; border: 1px solid #e5e7eb;
  border-radius: 50%; color: #4b5563;
}
.no-fy-block__title { font-size: 1rem; font-weight: 600; color: #111827; }
.no-fy-block__body  { font-size: 0.875rem; color: #4b5563; line-height: 1.5; }

/* ─── Wizard layout ─── */
.wizard { display: block; }

/* ─── Wizard content ─── */
.wizard__content {
  display: flex; flex-direction: column;
  max-width: 976px; margin: 0 auto; width: 100%;
}

.wizard__progress-row {
  display: flex; align-items: center; gap: 14px; margin-bottom: 28px;
}
.wizard__progress { flex: 1; height: 2px; background: #e5e7eb; border-radius: 2px; }
.wizard__progress-fill { height: 100%; background: linear-gradient(90deg, #00afdb, #1b2d59); border-radius: 2px; transition: width 0.4s ease; }
.wizard__step-label {
  flex-shrink: 0; font-size: 0.6875rem; font-weight: 600;
  color: #9ca3af; letter-spacing: 0.02em; white-space: nowrap;
}

.wizard__inner {
  display: flex; flex-direction: column; align-items: stretch; gap: 24px;
}

/* ─── Hero card ─── */
.hero-card {
  width: 100%;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(145deg, #e8f6fd 0%, #cceef9 100%);
  border: 1.5px solid #00afdb;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 175, 219, 0.12);
  padding: 40px 44px;
  position: relative;
  overflow: hidden;
}

.hero-card--compact { min-height: 312px; }


.hero-card__head { margin-bottom: 28px; }

.hero-card__title {
  font-size: 1.75rem; font-weight: 800;
  color: #1b2d59; margin: 0 0 8px;
  letter-spacing: -0.02em; line-height: 1.15;
}
.hero-card__title--lg { font-size: 2.25rem; }

.hero-card__sub {
  font-size: 0.9375rem; color: #374151;
  margin: 0; line-height: 1.5; opacity: 0.8;
}

.hero-card__body { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; }

/* ─── Hero inputs ─── */
.hero-input :deep(.q-field__control) {
  height: 52px; border-radius: 12px; background: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1.5px solid rgba(0,175,219,0.2) !important;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.hero-input :deep(.q-field__control:hover) { border-color: rgba(0,175,219,0.5) !important; }
.hero-input :deep(.q-field--focused .q-field__control) {
  border-color: #00afdb !important;
  box-shadow: 0 0 0 3px rgba(0,175,219,0.12) !important;
}
.hero-input :deep(.q-field__native) { font-size: 1rem; color: #111827; font-weight: 500; }
.hero-input :deep(.q-field__prepend) { color: #0e7490; }
.hero-input :deep(.q-field__suffix)  { font-size: 0.875rem; color: #6b7280; }

.hero-input--textarea :deep(.q-field__control) { height: auto; min-height: 120px; padding: 10px 12px; border-radius: 12px; }
.hero-input--textarea :deep(textarea)          { font-size: 1rem; line-height: 1.55; color: #111827; }

/* ─── Kategorija ─── */
.kat-box-group { display: flex; flex-direction: column; gap: 12px; }

.kat-amount-box {
  display: flex; align-items: center; gap: 14px;
  background: rgba(255,255,255,0.75); border: 1.5px solid rgba(0,175,219,0.3);
  border-radius: 16px; padding: 0 24px; height: 68px;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.kat-amount-box:focus-within {
  border-color: #00afdb; background: rgba(255,255,255,0.95);
  box-shadow: 0 0 0 3px rgba(0,175,219,0.12);
}
.kat-amount-box__icon  { width: 30px; height: 30px; opacity: 0.7; flex-shrink: 0; display: block; }
.kat-amount-box__input {
  flex: 1; border: none; background: transparent; outline: none;
  font-family: inherit; font-size: 1.25rem; color: #1b2d59; font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.kat-amount-box__input::placeholder { color: #94a3b8; font-weight: 400; font-size: 1rem; }
.kat-amount-box__input::-webkit-outer-spin-button,
.kat-amount-box__input::-webkit-inner-spin-button { -webkit-appearance: none; appearance: none; margin: 0; }
.kat-amount-box__input[type=number] { -moz-appearance: textfield; }
.kat-amount-box__currency {
  font-size: 0.875rem; font-weight: 600; color: #0e7490;
  background: rgba(0,175,219,0.1); padding: 4px 12px; border-radius: 8px; flex-shrink: 0;
}

.kat-select :deep(.q-field__control) {
  height: 68px; border-radius: 16px;
  background: rgba(255,255,255,0.75);
  border: 1.5px solid rgba(0,175,219,0.3) !important;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  padding: 0 !important;
}
.kat-select :deep(.q-field__control:hover) {
  border-color: #00afdb !important; background: rgba(255,255,255,0.92);
}
.kat-select :deep(.q-field--focused .q-field__control) {
  border-color: #00afdb !important; background: rgba(255,255,255,0.95);
  box-shadow: 0 0 0 3px rgba(0,175,219,0.12) !important;
}
.kat-select :deep(.q-field__native),
.kat-select :deep(.q-field__input) { font-size: 1rem !important; color: #1b2d59; font-weight: 600; }
.kat-select-wrap { position: relative; }
.kat-select-icon {
  position: absolute; left: 24px; top: 50%; transform: translateY(-50%);
  width: 30px; height: 30px; opacity: 0.7;
  pointer-events: none; z-index: 1;
}
.kat-select :deep(.q-field__native),
.kat-select :deep(.q-field__input) { padding-left: 68px !important; }
.kat-select :deep(.q-field__append) { padding-right: 16px; color: #94a3b8; }
.kat-select--empty :deep(.q-field__native span) { color: #94a3b8; font-weight: 400; }

/* ─── Fields (inside hero card) ─── */
.field { margin-bottom: 20px; }
.field:last-child { margin-bottom: 0; }
.field__label { display: block; font-size: 0.8125rem; font-weight: 700; color: #1b2d59; margin-bottom: 8px; letter-spacing: 0.02em; text-transform: uppercase; opacity: 0.75; }
.field__hint  { font-size: 0.75rem; color: #4b5563; margin-top: 6px; line-height: 1.4; }
.field__hint--info {
  display: inline-flex; align-items: center; gap: 5px;
  color: #0e7490; background: rgba(255,255,255,0.7);
  border-radius: 6px; padding: 5px 10px; font-size: 0.75rem;
}

/* ─── Choice cards ─── */
.choice-list { display: flex; flex-direction: column; gap: 12px; }

.choice {
  all: unset; display: flex; align-items: center; gap: 16px;
  padding: 16px 20px; border: 1.5px solid rgba(0,175,219,0.25);
  border-radius: 12px; background: rgba(255,255,255,0.75);
  cursor: pointer; transition: all 0.15s;
}
.choice:hover { background: rgba(255,255,255,0.95); border-color: #00afdb; }
.choice--selected { background: white; border-color: #00afdb; box-shadow: 0 0 0 1px #00afdb; }

.choice__icon {
  width: 44px; height: 44px; border-radius: 10px;
  background: rgba(0,175,219,0.1); color: #0e7490;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.choice--selected .choice__icon { background: #b3edf7; color: #0e7490; }

.choice__body { flex: 1; }
.choice__title { font-size: 0.9375rem; font-weight: 600; color: #111827; }
.choice__desc  { font-size: 0.8125rem; color: #4b5563; margin-top: 3px; }

.choice__check { color: #00afdb; flex-shrink: 0; }
.choice__radio {
  width: 20px; height: 20px; border-radius: 50%;
  border: 1.5px solid rgba(0,175,219,0.4); flex-shrink: 0;
}

/* ─── Upload zone ─── */
.upload-zone {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px; padding: 17px 16px;
  flex: 1;
  border: 2px dashed rgba(0,175,219,0.4); border-radius: 12px;
  background: rgba(255,255,255,0.6); cursor: pointer;
  transition: border-color 0.15s, background 0.15s; text-align: center;
}
.upload-zone:hover { border-color: #00afdb; background: rgba(255,255,255,0.9); }
.upload-zone__icon { width: 48px; height: 48px; opacity: 0.35; transition: opacity 0.15s; }
.upload-zone:hover .upload-zone__icon { opacity: 0.6; }
.upload-zone__text { font-size: 1.125rem; font-weight: 600; color: #1b2d59; }
.upload-zone__hint { font-size: 0.875rem; color: #6b7280; }

/* ─── File list ─── */
.file-list {
  list-style: none; margin: 12px 0 0; padding: 0;
  border: 1px solid rgba(0,175,219,0.2); border-radius: 10px; overflow: hidden;
  background: rgba(255,255,255,0.8);
}
.file-list__item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-bottom: 1px solid rgba(0,175,219,0.1);
}
.file-list__item:last-child { border-bottom: none; }
.file-list__svg { width: 18px; height: 18px; opacity: 0.6; }
.file-list__icon {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.file-list__name { flex: 1; font-size: 0.8125rem; font-weight: 500; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-list__size { font-size: 0.6875rem; color: #9ca3af; flex-shrink: 0; }

/* ─── Confirm card ─── */
.confirm-card {
  background: rgba(255,255,255,0.8); border: 1px solid rgba(0,175,219,0.2);
  border-radius: 12px; overflow: hidden; margin-bottom: 20px;
}
.confirm-card__row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; border-bottom: 1px solid rgba(0,175,219,0.1);
}
.confirm-card__row:last-child { border-bottom: none; }
.confirm-card__label { font-size: 0.8125rem; color: #6b7280; }
.confirm-card__value { font-size: 0.9375rem; font-weight: 600; color: #1b2d59; }
.confirm-card__value--amount { color: #059669; }

.confirm-msg {
  font-size: 0.875rem; color: #374151; line-height: 1.55;
  background: rgba(255,255,255,0.6); border-radius: 10px;
  padding: 14px 18px; margin: 0;
}
.confirm-msg strong { color: #1b2d59; }

/* ─── Add item form ─── */
.add-item {
  background: rgba(255,255,255,0.8); border: 1.5px solid rgba(0,175,219,0.25);
  border-radius: 16px; padding: 20px 22px; margin-bottom: 16px;
  box-shadow: 0 1px 6px rgba(0,175,219,0.07);
}
.add-item__grid {
  display: grid; grid-template-columns: 1fr 1.4fr auto auto;
  gap: 8px; align-items: stretch;
}
.add-item__category :deep(.q-field__control),
.add-item__name     :deep(.q-field__control),
.add-item__qty      :deep(.q-field__control) {
  height: 56px; border-radius: 14px !important;
  background: rgba(255,255,255,0.75) !important;
  border: 1.5px solid rgba(0,175,219,0.3) !important;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  padding: 0 16px !important;
}
.add-item__category :deep(.q-field__control:hover),
.add-item__name     :deep(.q-field__control:hover),
.add-item__qty      :deep(.q-field__control:hover) {
  border-color: #00afdb !important; background: rgba(255,255,255,0.9) !important;
}
.add-item__category :deep(.q-field--focused .q-field__control),
.add-item__name     :deep(.q-field--focused .q-field__control),
.add-item__qty      :deep(.q-field--focused .q-field__control) {
  border-color: #00afdb !important; background: rgba(255,255,255,0.95) !important;
  box-shadow: 0 0 0 3px rgba(0,175,219,0.12) !important;
}
.add-item__category :deep(.q-field__native),
.add-item__name     :deep(.q-field__native),
.add-item__qty      :deep(.q-field__native) {
  font-size: 1rem !important; color: #1b2d59; font-weight: 500;
}
.add-item__qty :deep(.q-field__native) { text-align: center; }
.add-item__btn {
  height: 56px; border-radius: 14px !important;
  background: rgba(0,175,219,0.08) !important;
  border-color: rgba(0,175,219,0.4) !important;
  color: #0e7490 !important;
}
.add-item__btn:hover:not(:disabled) {
  background: rgba(0,175,219,0.16) !important;
  border-color: #00afdb !important;
  box-shadow: 0 0 0 3px rgba(0,175,219,0.1);
}
.add-item__category--empty :deep(.q-field__native span) { color: #94a3b8; font-weight: 400; }

/* ─── Item list ─── */
.item-list {
  list-style: none; margin: 0; padding: 0;
  border: 1.5px solid rgba(0,175,219,0.2); border-radius: 14px;
  overflow: hidden; background: rgba(255,255,255,0.85);
  box-shadow: 0 1px 4px rgba(0,175,219,0.06);
}
.item-list__row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; border-bottom: 1px solid rgba(0,175,219,0.08);
}
.item-list__row:last-child { border-bottom: none; }
.item-list__index {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(0,175,219,0.12); color: #0e7490;
  font-size: 0.6875rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-variant-numeric: tabular-nums;
}
.item-list__content { flex: 1; min-width: 0; }
.item-list__name     { font-size: 0.875rem; font-weight: 500; color: #111827; }
.item-list__category { font-size: 0.6875rem; color: #9ca3af; margin-top: 1px; }
.item-list__qty {
  font-size: 0.75rem; font-weight: 600; color: #0e7490;
  background: rgba(0,175,219,0.1); padding: 3px 10px; border-radius: 20px;
  flex-shrink: 0; font-variant-numeric: tabular-nums;
}
.item-list__footer { font-size: 0.6875rem; color: #4b5563; text-align: right; margin-top: 8px; }

/* ─── Empty state ─── */
.empty-block {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; padding: 24px 16px;
  border: 1.5px dashed rgba(0,175,219,0.3); border-radius: 16px;
  background: rgba(255,255,255,0.55);
  margin-top: 12px;
}
.empty-block__icon  { width: 40px; height: 40px; opacity: 0.4; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto; }
.empty-block__text  { font-size: 0.875rem; font-weight: 500; color: #1b2d59; }
.empty-block__hint  { font-size: 0.75rem; color: #9ca3af; margin-top: 2px; }

/* ─── Review ─── */
/* ─── Step head (review wrapper) ─── */
.step__head { margin-bottom: 24px; }
.step__title { font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 4px; letter-spacing: -0.01em; line-height: 1.3; }
.step__desc  { font-size: 0.8125rem; color: #4b5563; margin: 0; line-height: 1.5; }
.step__body  { flex: 1; }

/* ─── Review ─── */
.review {
  background: rgba(255,255,255,0.65);
  border: 1.5px solid rgba(0,175,219,0.2);
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,175,219,0.06);
}
.review__field {
  display: grid; grid-template-columns: 160px 1fr auto;
  gap: 16px; padding: 11px 16px;
  border-bottom: 1px solid rgba(0,175,219,0.1); align-items: flex-start;
}
.review__field:last-child { border-bottom: none; }
.review__label  { font-size: 0.75rem; font-weight: 600; color: #1b2d59; letter-spacing: 0.005em; opacity: 0.7; }
.review__value  { font-size: 0.8125rem; color: #111827; font-weight: 500; word-break: break-word; }
.review__value--prose  { font-weight: 400; color: #374151; white-space: pre-wrap; line-height: 1.5; }
.review__value--amount { font-weight: 600; color: #111827; font-variant-numeric: tabular-nums; }
.review__muted  { color: #9ca3af; font-weight: 400; font-style: italic; }
.review__file   { display: inline-flex; align-items: center; gap: 4px; color: #059669; font-size: 0.75rem; font-weight: 500; margin-right: 8px; margin-bottom: 4px; cursor: default; }
.review__file span { text-decoration: underline; text-decoration-color: transparent; text-underline-offset: 2px; transition: text-decoration-color 0.15s; }
.review__file:hover span { text-decoration-color: #059669; }
.review__edit   {
  all: unset; display: inline-flex; align-items: center; gap: 3px;
  font-size: 0.6875rem; font-weight: 500; color: #00afdb;
  cursor: pointer; white-space: nowrap; opacity: 0.7; transition: opacity 0.15s;
}
.review__edit:hover { opacity: 1; }
.review__items  { list-style: none; margin: 0; padding: 0; }
.review__items li { display: flex; flex-direction: column; gap: 2px; padding: 6px 0; border-bottom: 1px solid rgba(0,175,219,0.08); }
.review__items li:last-child { border-bottom: none; padding-bottom: 0; }
.review__item-name { font-size: 0.8125rem; font-weight: 500; color: #111827; }
.review__item-meta { font-size: 0.6875rem; color: #6b7280; }
.review__notice {
  display: flex; align-items: center; gap: 5px;
  margin-top: auto; padding-top: 16px;
  font-size: 0.75rem; color: #94a3b8; line-height: 1;
  align-self: flex-end;
}
.review__notice-icon { color: rgba(0,175,219,0.45); flex-shrink: 0; }

/* ─── Hero card deco SVG ─── */
.hero-card__deco {
  position: absolute; top: -40px; left: -40px;
  width: 140px; height: 140px;
  opacity: 0.07; transform: none;
  pointer-events: none; z-index: 0;
}

/* ─── Department search box ─── */
.dept-search-box {
  display: flex; align-items: center; gap: 14px;
  background: rgba(255,255,255,0.75); border: 1.5px solid rgba(0,175,219,0.3);
  border-radius: 16px; padding: 0 24px; height: 68px;
  position: relative; z-index: 1;
  transition: border-color 0.15s, background 0.15s;
}
.dept-search-box:focus-within {
  border-color: #00afdb; background: rgba(255,255,255,0.95);
  box-shadow: 0 0 0 3px rgba(0,175,219,0.12);
}
.dept-search-box--open { border-color: #00afdb; background: rgba(255,255,255,0.95); border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
.dept-search-box--done { border-color: rgba(0,175,219,0.45); background: rgba(255,255,255,0.88); }
.dept-search-box__icon { color: rgba(0,175,219,0.6); flex-shrink: 0; }
.dept-search-box__icon--done { color: #00afdb; }
.dept-search-box__arrow { color: #94a3b8; flex-shrink: 0; }
.dept-search-box__input {
  flex: 1; border: none; background: transparent; outline: none;
  font-family: inherit; font-size: 1rem; color: #1b2d59; font-weight: 500;
}
.dept-search-box__input::placeholder { color: #94a3b8; font-weight: 400; }
.dept-search-box__chosen { flex: 1; font-size: 1rem; font-weight: 600; color: #1b2d59; }
.dept-search-box__clear {
  all: unset; cursor: pointer; color: #94a3b8; display: flex; align-items: center;
  border-radius: 4px; padding: 2px; transition: color 0.12s;
}
.dept-search-box__clear:hover { color: #4b5563; }

.dept-results {
  display: flex; flex-direction: column;
  background: rgba(255,255,255,0.95);
  border: 1.5px solid #00afdb; border-top: none;
  border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;
  overflow: hidden; position: relative; z-index: 2;
}
.dept-result-item {
  all: unset; padding: 12px 20px; cursor: pointer; font-size: 0.9375rem;
  font-weight: 500; color: #1b2d59;
  border-bottom: 1px solid rgba(0,175,219,0.08); transition: background 0.12s;
}
.dept-result-item:last-child { border-bottom: none; }
.dept-result-item:hover { background: #e8f6fd; }
.dept-results__empty { padding: 14px 20px; font-size: 0.875rem; color: #9ca3af; }

/* ─── Offer choice ─── */
.offer-choice-list { display: flex; flex-direction: column; gap: 12px; }
.offer-choice {
  all: unset; display: flex; align-items: center; gap: 16px;
  background: rgba(255,255,255,0.75); border: 1.5px solid rgba(0,175,219,0.3);
  border-radius: 16px; padding: 16px 22px; cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.offer-choice:hover {
  border-color: #00afdb; background: rgba(255,255,255,0.92);
}
.offer-choice--selected {
  border-color: #00afdb; background: rgba(255,255,255,0.95);
  box-shadow: 0 0 0 3px rgba(0,175,219,0.12);
}
.offer-choice__svg { width: 36px; height: 36px; opacity: 0.65; flex-shrink: 0; }
.offer-choice__label { flex: 1; font-size: 1rem; font-weight: 600; color: #1b2d59; }
.offer-choice__check { color: #00afdb; flex-shrink: 0; }
.offer-choice__check--pending { color: #d1d5db; }

/* ─── Svrha box ─── */
.svrha-box {
  display: flex;
  background: rgba(255,255,255,0.75); border: 1.5px solid rgba(0,175,219,0.3);
  border-radius: 16px; padding: 20px 24px;
  transition: border-color 0.15s, background 0.15s;
}
.svrha-box:focus-within {
  border-color: #00afdb; background: rgba(255,255,255,0.95);
  box-shadow: 0 0 0 3px rgba(0,175,219,0.12);
}
.svrha-box__input {
  flex: 1; border: none; background: transparent; outline: none; resize: none;
  font-family: inherit; font-size: 1rem; color: #1b2d59; font-weight: 500;
  line-height: 1.6;
}
.svrha-box__input::placeholder { color: #94a3b8; font-weight: 400; }

/* ─── Qty stepper ─── */
.qty-stepper {
  display: flex; align-items: center;
  height: 56px; border-radius: 14px;
  background: rgba(255,255,255,0.75);
  border: 1.5px solid rgba(0,175,219,0.3);
  overflow: hidden;
  transition: border-color 0.15s, background 0.15s;
}
.qty-stepper:focus-within {
  border-color: #00afdb; background: rgba(255,255,255,0.95);
  box-shadow: 0 0 0 3px rgba(0,175,219,0.12);
}
.qty-stepper__btn {
  all: unset; display: flex; align-items: center; justify-content: center;
  width: 36px; height: 100%; flex-shrink: 0;
  color: #0e7490; cursor: pointer;
  transition: background 0.12s;
}
.qty-stepper__btn:hover { background: rgba(0,175,219,0.1); }
.qty-stepper__input {
  flex: 1; border: none; background: transparent; outline: none;
  font-family: inherit; font-size: 1rem; color: #1b2d59; font-weight: 600;
  text-align: center; min-width: 0; width: 40px;
}
.qty-stepper__input::-webkit-outer-spin-button,
.qty-stepper__input::-webkit-inner-spin-button { -webkit-appearance: none; }
.qty-stepper__input[type=number] { -moz-appearance: textfield; }

/* ─── Wizard nav ─── */
.wizard__nav {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%;
}
.wizard__nav .btn { min-width: 140px; }
.wizard__nav .btn--primary {
  background: rgba(0,175,219,0.08) !important;
  border-color: rgba(0,175,219,0.4) !important;
  color: #0e7490 !important;
  box-shadow: none !important;
}
.wizard__nav .btn--primary:hover:not(:disabled) {
  background: rgba(0,175,219,0.16) !important;
  border-color: #00afdb !important;
  box-shadow: 0 0 0 3px rgba(0,175,219,0.1) !important;
  transform: none !important;
}
.page-header .btn { min-width: 140px; }

/* ─── Transitions ─── */
.step-fade-enter-active, .step-fade-leave-active { transition: all 0.2s ease; }
.step-fade-enter-from { opacity: 0; transform: translateY(8px); }
.step-fade-leave-to   { opacity: 0; transform: translateY(-8px); }

/* ─── Responsive ─── */
@media (max-width: 600px) {
  .page { padding: 20px 16px; }
  .hero-card { padding: 28px 24px; }
  .hero-card__title { font-size: 1.375rem; }
  .add-item__row { grid-template-columns: 1fr 1fr; }
  .add-item__btn { grid-column: 1 / -1; }
  .review__field { grid-template-columns: 1fr; gap: 4px; }
}

/* ─── Cancel dialog ─── */
.cancel-dialog {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.1);
  padding: 36px 36px 28px;
  min-width: 340px; max-width: 420px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.cancel-dialog__title {
  font-size: 2.25rem; font-weight: 700; color: #1b2d59;
  margin: 0 0 10px; letter-spacing: -0.01em; line-height: 1.2;
}
.cancel-dialog__message {
  font-size: 0.9375rem; color: #4b5563; margin: 0 0 32px; line-height: 1.5;
}
.cancel-dialog__actions {
  display: flex; gap: 12px; width: 100%; justify-content: center;
}
.cancel-dialog__actions .btn { min-width: 130px; }
.cancel-dialog__btn-continue {
  background: rgba(0,175,219,0.08) !important;
  border-color: rgba(0,175,219,0.4) !important;
  color: #0e7490 !important;
}
.cancel-dialog__btn-continue:hover {
  background: rgba(0,175,219,0.16) !important;
  border-color: #00afdb !important;
  box-shadow: 0 0 0 3px rgba(0,175,219,0.1) !important;
}
.cancel-dialog__btn-leave {
  background: rgba(185,28,28,0.06) !important;
  border-color: rgba(185,28,28,0.3) !important;
  color: #b91c1c !important;
}
.cancel-dialog__btn-leave:hover {
  background: rgba(185,28,28,0.06) !important;
  border-color: rgba(185,28,28,0.5) !important;
  box-shadow: 0 0 0 3px rgba(185,28,28,0.08) !important;
}
</style>
