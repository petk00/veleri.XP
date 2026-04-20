<template>
  <q-page class="new-request-page q-pa-lg">
    <div class="page-shell">

      <!-- PAGE HEADER -->
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

      <!-- LOADING -->
      <div v-if="loadingReferenceData" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="48px" />
      </div>

      <div v-else class="wizard-layout">

        <!-- LIJEVO: Progress tracker -->
        <div class="wizard-sidebar">
          <div
            v-for="s in steps"
            :key="s.number"
            class="sidebar-step"
            :class="{
              'sidebar-step--active': step === s.number,
              'sidebar-step--done': step > s.number,
            }"
          >
            <div class="sidebar-step__indicator">
              <q-icon v-if="step > s.number" name="check" size="16px" />
              <span v-else>{{ s.number }}</span>
            </div>
            <div class="sidebar-step__label">{{ s.title }}</div>
          </div>
        </div>

        <!-- DESNO: Sadržaj koraka -->
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
                  outlined
                  emit-value
                  map-options
                  label="Odjel / Služba / Projekt"
                  class="field-lg"
                >
                  <template #prepend>
                    <q-icon name="business" color="primary" />
                  </template>
                </q-select>
              </div>
            </div>

            <!-- KORAK 2: Obrazloženje -->
            <div v-else-if="step === 2" key="2">
              <div class="step-header">
                <div class="step-number">02</div>
                <div>
                  <div class="text-h5 text-weight-bold">Obrazložite nabavu</div>
                  <div class="text-body1 text-grey-6 q-mt-xs">
                    Opišite što trebate nabaviti i zašto. Jasnije obrazloženje = brže odobravanje.
                  </div>
                </div>
              </div>

              <div class="q-mt-xl">
                <q-input
                  v-model="form.reasonName"
                  type="textarea"
                  outlined
                  autogrow
                  rows="6"
                  counter
                  maxlength="1000"
                  placeholder="npr. Za potrebe opremanja nove učionice potrebno je nabaviti..."
                  class="field-lg"
                />
              </div>
            </div>

            <!-- KORAK 3: Stavke -->
            <div v-else-if="step === 3" key="3">
              <div class="step-header">
                <div class="step-number">03</div>
                <div>
                  <div class="text-h5 text-weight-bold">Stavke zahtjeva</div>
                  <div class="text-body1 text-grey-6 q-mt-xs">
                    Dodajte sve artikle ili usluge koje treba nabaviti.
                  </div>
                </div>
              </div>

              <!-- Forma za dodavanje stavke -->
              <div class="add-item-form q-mt-xl">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <q-select
                      v-model="itemForm.category"
                      :options="categoryOptions"
                      label="Kategorija"
                      outlined dense
                      emit-value map-options
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
                      label="Kol."
                      type="number" min="1"
                      outlined dense
                    />
                  </div>
                  <div class="col-12 col-md-1 flex items-center">
                    <q-btn
                      unelevated round color="primary"
                      icon="add" size="md"
                      @click="addItem"
                    >
                      <q-tooltip>Dodaj stavku</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </div>

              <!-- Lista stavki -->
              <div class="items-list q-mt-lg">
                <div v-if="form.items.length === 0" class="items-empty">
                  <q-icon name="inventory_2" size="36px" color="grey-4" />
                  <div class="text-grey-5 q-mt-sm">Još nema dodanih stavki</div>
                </div>

                <transition-group name="item-list" tag="div">
                  <div
                    v-for="(item, index) in form.items"
                    :key="index"
                    class="item-row"
                  >
                    <div class="item-row__index">{{ index + 1 }}</div>
                    <div class="item-row__content">
                      <div class="text-weight-medium">{{ item.item_name }}</div>
                      <div class="text-caption text-grey-6">{{ item.category_label }}</div>
                    </div>
                    <div class="item-row__quantity">
                      <q-chip dense color="primary" text-color="white" size="sm">
                        × {{ item.quantity }}
                      </q-chip>
                    </div>
                    <q-btn
                      flat round dense
                      icon="close" color="grey-5" size="sm"
                      @click="removeItem(index)"
                    />
                  </div>
                </transition-group>

                <div v-if="form.items.length > 0" class="items-footer">
                  {{ form.items.length }} {{ form.items.length === 1 ? 'stavka' : 'stavki' }} ukupno
                </div>
              </div>
            </div>

            <!-- KORAK 4: Procjena iznosa -->
            <div v-else-if="step === 4" key="4">
              <div class="step-header">
                <div class="step-number">04</div>
                <div>
                  <div class="text-h5 text-weight-bold">Procijenite ukupni iznos</div>
                  <div class="text-body1 text-grey-6 q-mt-xs">
                    Neobavezno — unesite okvirnu vrijednost nabave ako je poznata.
                  </div>
                </div>
              </div>

              <div class="q-mt-xl">
                <div class="amount-input-wrapper">
                  <div class="amount-input-label">Procijenjeni iznos</div>
                  <div class="amount-input-row">
                    <q-input
                      v-model.number="form.estimatedAmount"
                      type="number" min="0" step="0.01"
                      outlined
                      placeholder="0.00"
                      class="amount-input"
                      input-class="amount-input__field"
                    />
                    <div class="amount-input-currency">EUR</div>
                  </div>
                  <div class="amount-hint">
                    <q-icon name="info_outline" size="14px" class="q-mr-xs" />
                    Ovo je <strong>procijenjeni</strong> iznos — nije konačan. Jednom unesen,
                    više ga nećete moći mijenjati. Administrator može ažurirati iznos naknadno.
                  </div>
                </div>

                <!-- Skip opcija -->
                <q-btn
                  flat no-caps color="grey-6"
                  label="Preskoči, iznos nije poznat"
                  class="q-mt-md"
                  @click="form.estimatedAmount = null; step++"
                />
              </div>
            </div>

            <!-- KORAK 5: Ponuda -->
            <div v-else-if="step === 5" key="5">
              <div class="step-header">
                <div class="step-number">05</div>
                <div>
                  <div class="text-h5 text-weight-bold">Imate li ponudu dobavljača?</div>
                  <div class="text-body1 text-grey-6 q-mt-xs">
                    Ponuda nije obavezna sada — može se dodati i naknadno.
                  </div>
                </div>
              </div>

              <div class="offer-choice q-mt-xl">
                <!-- Da -->
                <div
                  class="offer-option"
                  :class="{ 'offer-option--selected': form.hasOffer === true }"
                  @click="form.hasOffer = true"
                >
                  <q-icon name="description" size="28px" color="primary" />
                  <div>
                    <div class="text-weight-bold">Da, imam ponudu</div>
                    <div class="text-caption text-grey-6">Priložit ću je odmah</div>
                  </div>
                  <q-icon
                    v-if="form.hasOffer === true"
                    name="check_circle" color="primary" size="22px"
                    class="offer-option__check"
                  />
                </div>

                <!-- Ne -->
                <div
                  class="offer-option"
                  :class="{ 'offer-option--selected': form.hasOffer === false }"
                  @click="form.hasOffer = false; form.offerFile = null"
                >
                  <q-icon name="schedule" size="28px" color="grey-5" />
                  <div>
                    <div class="text-weight-bold">Nemam ponudu</div>
                    <div class="text-caption text-grey-6">Administrator će je dodati naknadno</div>
                  </div>
                  <q-icon
                    v-if="form.hasOffer === false"
                    name="check_circle" color="primary" size="22px"
                    class="offer-option__check"
                  />
                </div>
              </div>

              <!-- Upload - prikaže se kad odabere Da -->
              <transition name="fade">
                <div v-if="form.hasOffer === true" class="q-mt-lg">
                  <q-file
                    v-model="form.offerFile"
                    outlined clearable
                    label="Odaberi datoteku ponude"
                  >
                    <template #prepend><q-icon name="attach_file" color="primary" /></template>
                    <template #hint>PDF, Word, Excel, slike — max 10MB</template>
                  </q-file>
                </div>
              </transition>
            </div>

            <!-- KORAK 6: Pregled -->
            <div v-else-if="step === 6" key="6">
              <div class="step-header">
                <div class="step-number">06</div>
                <div>
                  <div class="text-h5 text-weight-bold">Pregled zahtjeva</div>
                  <div class="text-body1 text-grey-6 q-mt-xs">
                    Provjerite unesene podatke prije slanja.
                  </div>
                </div>
              </div>

              <div class="review-grid q-mt-xl">

                <!-- Lijevo: Meta podaci -->
                <div class="review-meta">
                  <div class="review-field">
                    <div class="review-field__label">Odjel / Služba / Projekt</div>
                    <div class="review-field__value">{{ selectedDepartmentLabel || '-' }}</div>
                  </div>
                  <div class="review-field">
                    <div class="review-field__label">Obrazloženje</div>
                    <div class="review-field__value review-field__value--multiline">
                      {{ form.reasonName || '-' }}
                    </div>
                  </div>
                  <div class="review-field">
                    <div class="review-field__label">Procjena iznosa</div>
                    <div class="review-field__value">{{ formatCurrency(form.estimatedAmount) }}</div>
                  </div>
                  <div class="review-field">
                    <div class="review-field__label">Ponuda</div>
                    <div class="review-field__value">
                      <span v-if="form.hasOffer === true && form.offerFile" class="text-positive">
                        <q-icon name="check_circle" size="16px" class="q-mr-xs" />
                        {{ form.offerFile.name }}
                      </span>
                      <span v-else class="text-grey-6">
                        <q-icon name="schedule" size="16px" class="q-mr-xs" />
                        Dodaje administrator naknadno
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Desno: Stavke -->
                <div class="review-items">
                  <div class="review-items__header">
                    Stavke zahtjeva
                    <q-badge color="primary" class="q-ml-sm">{{ form.items.length }}</q-badge>
                  </div>
                  <div class="review-items__list">
                    <div
                      v-for="(item, index) in form.items"
                      :key="index"
                      class="review-item-row"
                    >
                      <span class="review-item-row__index">{{ index + 1 }}.</span>
                      <span class="review-item-row__name">{{ item.item_name }}</span>
                      <span class="review-item-row__category text-grey-5">{{ item.category_label }}</span>
                      <span class="review-item-row__qty">× {{ item.quantity }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </transition>

          <!-- NAVIGACIJA -->
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
                v-if="step < 6"
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

const steps = [
  { number: 1, title: 'Odjel' },
  { number: 2, title: 'Obrazloženje' },
  { number: 3, title: 'Stavke' },
  { number: 4, title: 'Iznos' },
  { number: 5, title: 'Ponuda' },
  { number: 6, title: 'Pregled' },
];

const activeFiscalYear = ref('');
const activeFiscalYearId = ref(null);
const departmentOptions = ref([]);
const categoryOptions = ref([]);

const form = ref({
  department: null,
  reasonName: '',
  items: [],
  estimatedAmount: null,
  hasOffer: null,
  offerFile: null,
});

const itemForm = ref({ category: null, item_name: '', quantity: 1 });

const selectedDepartmentLabel = computed(() =>
  departmentOptions.value.find((x) => x.value === form.value.department)?.label || ''
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
    departmentOptions.value = departmentsRes.data.map((item) => ({
      label: item.name,
      value: item.id_department,
    }));
    categoryOptions.value = categoriesRes.data.map((item) => ({
      label: item.name,
      value: item.id_item_category,
    }));
  } catch (error) {
    console.error('Greška:', error);
    $q.notify({ type: 'negative', message: 'Greška pri dohvaćanju podataka.' });
  } finally {
    loadingReferenceData.value = false;
  }
};

const nextStep = () => {
  if (step.value === 1 && !form.value.department) {
    $q.notify({ type: 'negative', message: 'Odaberite odjel, službu ili projekt.' });
    return;
  }
  if (step.value === 2 && !form.value.reasonName.trim()) {
    $q.notify({ type: 'negative', message: 'Unesite obrazloženje nabave.' });
    return;
  }
  if (step.value === 3 && form.value.items.length === 0) {
    $q.notify({ type: 'negative', message: 'Dodajte barem jednu stavku.' });
    return;
  }
  if (step.value === 5 && form.value.hasOffer === true && !form.value.offerFile) {
    $q.dialog({
      title: 'Upozorenje',
      message: 'Odabrali ste "Da" ali niste priložili datoteku. Nastaviti bez ponude?',
      cancel: { flat: true, label: 'Natrag' },
      ok: { color: 'primary', label: 'Nastavi bez ponude', unelevated: true },
    }).onOk(() => {
      form.value.hasOffer = false;
      form.value.offerFile = null;
      step.value++;
    });
    return;
  }
  if (step.value < 6) step.value++;
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
  if (!activeFiscalYearId.value || !form.value.department || !form.value.reasonName.trim() || form.value.items.length === 0) {
    $q.notify({ type: 'negative', message: 'Nedostaju obavezni podaci.' });
    return;
  }

  submitting.value = true;

  const payload = {
    fk_fiscal_year: activeFiscalYearId.value,
    fk_department: form.value.department,
    justification: form.value.reasonName.trim(),
    estimated_amount: form.value.estimatedAmount || null,
    save_mode: 'submit',
    items: form.value.items.map((it) => ({
      fk_item_category: it.category,
      item_name: it.item_name,
      quantity: it.quantity,
    })),
  };

  try {
    const { data } = await api.post('/requests', payload);

    // Upload ponude ako postoji
    if (form.value.hasOffer === true && form.value.offerFile) {
      try {
        const formData = new FormData();
        formData.append('file', form.value.offerFile);
        formData.append('document_type', 'Ponuda');
        await api.post(`/requests/${data.id_purchase_request}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch {
        $q.notify({
          type: 'warning',
          message: `Zahtjev ${data.request_number} kreiran, ali upload ponude nije uspio. Možete je dodati na stranici detalja.`,
          timeout: 5000,
        });
        router.push(`/requests/${data.id_purchase_request}`);
        return;
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

/* Layout */
.wizard-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 32px;
  align-items: start;
}

/* Sidebar */
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
  cursor: default;
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

.sidebar-step--active {
  background: rgba(25, 118, 210, 0.06);
}
.sidebar-step--active .sidebar-step__indicator {
  background: #1976d2;
  color: white;
}
.sidebar-step--active .sidebar-step__label {
  color: #1976d2;
  font-weight: 700;
}

.sidebar-step--done .sidebar-step__indicator {
  background: #dcfce7;
  color: #16a34a;
}
.sidebar-step--done .sidebar-step__label {
  color: #64748b;
}

/* Content card */
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

/* Step header */
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

/* Large field */
.field-lg { max-width: 480px; }

/* Items */
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

.items-empty {
  padding: 40px;
  text-align: center;
}

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
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* Amount */
.amount-input-wrapper { max-width: 360px; }

.amount-input-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.amount-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.amount-input { flex: 1; }

.amount-input-currency {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1976d2;
  flex-shrink: 0;
}

.amount-hint {
  margin-top: 10px;
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
}

/* Offer choice */
.offer-choice {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 480px;
}

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

.offer-option--selected {
  border-color: #1976d2;
  background: rgba(25, 118, 210, 0.04);
}

.offer-option__check { margin-left: auto; }

/* Review */
.review-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.review-meta {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  overflow: hidden;
}

.review-field {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
}
.review-field:last-child { border-bottom: none; }

.review-field__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin-bottom: 4px;
}

.review-field__value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.review-field__value--multiline {
  white-space: pre-wrap;
  font-weight: 400;
  color: #334155;
  line-height: 1.5;
}

.review-items {
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  overflow: hidden;
}

.review-items__header {
  padding: 14px 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  display: flex;
  align-items: center;
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

/* Nav */
.wizard-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 32px;
  margin-top: auto;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

/* Transitions */
.step-fade-enter-active,
.step-fade-leave-active { transition: all 0.2s ease; }
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
