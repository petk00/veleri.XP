<template>
  <q-page class="new-request-page q-pa-lg">
    <div class="page-shell">
      <section class="page-hero q-mb-lg">
        <div>
          <div class="text-overline text-primary text-weight-bold">
            NOVI ZAHTJEV ZA NABAVU
          </div>
          <div class="text-h4 text-weight-bold q-mt-sm page-title">
            Pokretanje novog zahtjeva
          </div>
          <div class="text-subtitle1 text-grey-7 q-mt-sm page-subtitle">
            Prođite kroz korake unosa i pripremite zahtjev za daljnju obradu.
          </div>
        </div>

        <q-btn
          flat
          no-caps
          color="primary"
          icon="arrow_back"
          label="Natrag na zahtjeve"
          @click="$router.push('/requests')"
        />
      </section>

      <q-card flat class="wizard-card">
        <q-card-section class="q-pa-lg">
          <q-stepper
            v-model="step"
            flat
            animated
            color="primary"
            alternative-labels
            class="request-stepper"
          >
            <q-step
              :name="1"
              title="Osnovni podaci"
              icon="article"
              :done="step > 1"
            >
              <div class="row q-col-gutter-lg">
                <div class="col-12 col-md-6">
                  <q-input
                    :model-value="activeFiscalYear"
                    label="Aktivna fiskalna godina"
                    outlined
                    readonly
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-select
                    v-model="form.department"
                    :options="departmentOptions"
                    label="Odjel"
                    outlined
                    emit-value
                    map-options
                  />
                </div>

                <div class="col-12">
                  <q-input
                    v-model="form.reasonName"
                    label="Razlog nabave"
                    outlined
                  />
                </div>
              </div>
            </q-step>

            <q-step
              :name="2"
              title="Stavke i dodatni podaci"
              icon="inventory_2"
              :done="step > 2"
            >
              <div class="row q-col-gutter-lg q-mb-md">
                <div class="col-12 col-md-4">
                  <q-select
                    v-model="itemForm.category"
                    :options="categoryOptions"
                    label="Kategorija"
                    outlined
                    emit-value
                    map-options
                  />
                </div>

                <div class="col-12 col-md-5">
                  <q-input
                    v-model="itemForm.item_name"
                    label="Naziv artikla"
                    outlined
                  />
                </div>

                <div class="col-12 col-md-3">
                  <q-input
                    v-model.number="itemForm.quantity"
                    label="Količina"
                    type="number"
                    min="1"
                    outlined
                  />
                </div>
              </div>

              <div class="q-mb-lg">
                <q-btn
                  unelevated
                  no-caps
                  color="primary"
                  icon="add"
                  label="Dodaj stavku"
                  @click="addItem"
                />
              </div>

              <q-card flat class="items-card q-mb-lg">
                <q-card-section class="row items-center justify-between">
                  <div class="text-subtitle1 text-weight-bold">
                    Dodane stavke
                  </div>
                  <div class="text-body2 text-grey-6">
                    Ukupno: {{ form.items.length }}
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section v-if="form.items.length === 0" class="text-grey-6">
                  Još nema dodanih stavki.
                </q-card-section>

                <q-list v-else separator>
                  <q-item v-for="(item, index) in form.items" :key="index">
                    <q-item-section>
                      <q-item-label class="text-weight-medium">
                        {{ item.item_name }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ item.category_label }} · Količina: {{ item.quantity }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-btn
                        flat
                        round
                        dense
                        icon="delete"
                        color="negative"
                        @click="removeItem(index)"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>

              <div class="row q-col-gutter-lg">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model.number="form.estimatedAmount"
                    label="Procjena iznosa nabave"
                    type="number"
                    min="0"
                    step="0.01"
                    outlined
                    suffix="EUR"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-select
                    v-model="form.hasOffer"
                    :options="offerOptions"
                    label="Imate li ponudu za upload?"
                    outlined
                    emit-value
                    map-options
                  />
                </div>

                <div v-if="form.hasOffer === true" class="col-12">
                  <q-file
                    v-model="form.offerFile"
                    label="Upload ponude"
                    outlined
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    clearable
                  >
                    <template #prepend>
                      <q-icon name="attach_file" />
                    </template>
                  </q-file>
                </div>
              </div>

              <q-banner class="bg-blue-1 text-blue-9 q-mt-lg" rounded>
                Procjena iznosa nabave i ponuda nisu obavezni za početno kreiranje zahtjeva,
                ali će ih biti potrebno dodati naknadno.
              </q-banner>
            </q-step>

            <q-step
              :name="3"
              title="Pregled zahtjeva"
              icon="fact_check"
              :done="step > 3"
            >
              <div class="row q-col-gutter-lg">
                <div class="col-12 col-md-6">
                  <q-card flat class="summary-card">
                    <q-card-section>
                      <div class="text-subtitle1 text-weight-bold q-mb-md">
                        Osnovni podaci
                      </div>

                      <div class="summary-row">
                        <span>Aktivna fiskalna godina</span>
                        <strong>{{ activeFiscalYear }}</strong>
                      </div>

                      <div class="summary-row">
                        <span>Odjel</span>
                        <strong>{{ selectedDepartmentLabel || '-' }}</strong>
                      </div>

                      <div class="summary-row summary-row--top">
                        <span>Naziv razloga nabave</span>
                        <strong class="text-right">{{ form.reasonName || '-' }}</strong>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <div class="col-12 col-md-6">
                  <q-card flat class="summary-card">
                    <q-card-section>
                      <div class="text-subtitle1 text-weight-bold q-mb-md">
                        Dodatni podaci
                      </div>

                      <div class="summary-row">
                        <span>Procjena iznosa</span>
                        <strong>{{ formatCurrency(form.estimatedAmount) }}</strong>
                      </div>

                      <div class="summary-row">
                        <span>Ponuda</span>
                        <strong>
                          {{
                            form.hasOffer === true
                              ? (form.offerFile ? 'Dodana' : 'Označeno bez datoteke')
                              : 'Nije dodana'
                          }}
                        </strong>
                      </div>

                      <div class="summary-row">
                        <span>Broj stavki</span>
                        <strong>{{ form.items.length }}</strong>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <div class="col-12">
                  <q-card flat class="summary-card">
                    <q-card-section>
                      <div class="text-subtitle1 text-weight-bold q-mb-md">
                        Stavke zahtjeva
                      </div>

                      <div
                        v-if="form.items.length === 0"
                        class="text-grey-6"
                      >
                        Nema dodanih stavki.
                      </div>

                      <div
                        v-for="(item, index) in form.items"
                        :key="index"
                        class="summary-row summary-row--top"
                      >
                        <span>{{ index + 1 }}.</span>
                        <strong class="text-right">
                          {{ item.item_name }} ({{ item.category_label }}) × {{ item.quantity }}
                        </strong>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-step>

            <q-step
              :name="4"
              title="Potvrda"
              icon="check_circle"
            >
              <q-card flat class="confirm-card">
                <q-card-section>
                  <div class="text-h6 text-weight-bold q-mb-md">
                    Potvrda kreiranja zahtjeva
                  </div>

                  <div class="text-body1 text-grey-8 q-mb-md">
                    Zahtjev će biti kreiran u sustavu i moći ćete mu naknadno pristupiti.
                  </div>

                  <q-banner
                    v-if="isMissingEstimatedAmount || isMissingOffer"
                    class="bg-orange-1 text-orange-9 q-mb-md"
                    rounded
                  >
                    Zahtjev je moguće kreirati i bez
                    <strong v-if="isMissingEstimatedAmount"> procjene iznosa</strong>
                    <span v-if="isMissingEstimatedAmount && isMissingOffer"> i</span>
                    <strong v-if="isMissingOffer"> ponude</strong>,
                    ali te podatke će biti potrebno dodati naknadno.
                  </q-banner>

                  <q-banner
                    v-else
                    class="bg-green-1 text-green-9"
                    rounded
                  >
                    Zahtjev sadrži sve trenutno unesene podatke i spreman je za kreiranje.
                  </q-banner>
                </q-card-section>
              </q-card>
            </q-step>

            <template #navigation>
              <div class="row items-center justify-between q-pt-lg">
                <q-btn
                  v-if="step > 1"
                  flat
                  no-caps
                  color="primary"
                  icon="arrow_back"
                  label="Natrag"
                  @click="step--"
                />

                <div v-else />

                <div class="row q-gutter-sm">
                  <q-btn
                    flat
                    no-caps
                    label="Odustani"
                    @click="$router.push('/requests')"
                  />

                  <q-btn
                    v-if="step < 4"
                    unelevated
                    no-caps
                    color="primary"
                    icon-right="arrow_forward"
                    label="Dalje"
                    @click="nextStep"
                  />

                  <q-btn
                    v-else
                    unelevated
                    no-caps
                    color="primary"
                    icon="check"
                    label="Kreiraj zahtjev"
                    @click="submitWizard"
                  />
                </div>
              </div>
            </template>
          </q-stepper>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const step = ref(1);

// Privremeno hardcoded; kasnije vučemo iz sustava
const activeFiscalYear = ref('2026');

const departmentOptions = [
  { label: 'IT', value: 1 },
  { label: 'Nabava', value: 2 },
  { label: 'Računovodstvo', value: 3 },
];

const categoryOptions = [
  { label: 'Računalna oprema', value: 1 },
  { label: 'Softver', value: 2 },
  { label: 'Uredski materijal', value: 3 },
  { label: 'Namještaj', value: 4 },
];

const offerOptions = [
  { label: 'Da', value: true },
  { label: 'Ne', value: false },
];

const form = ref({
  department: null,
  reasonName: '',
  items: [],
  estimatedAmount: null,
  hasOffer: null,
  offerFile: null,
});

const itemForm = ref({
  category: null,
  item_name: '',
  quantity: 1,
});

const selectedDepartmentLabel = computed(() => {
  return departmentOptions.find((x) => x.value === form.value.department)?.label || '';
});

const isMissingEstimatedAmount = computed(() => {
  return form.value.estimatedAmount === null || form.value.estimatedAmount === '' || Number(form.value.estimatedAmount) <= 0;
});

const isMissingOffer = computed(() => {
  if (form.value.hasOffer === null) return true;
  if (form.value.hasOffer === false) return true;
  return !form.value.offerFile;
});

const nextStep = () => {
  if (step.value === 1) {
    if (!form.value.department || !form.value.reasonName.trim()) {
      $q.notify({
        type: 'negative',
        message: 'Ispuni odjel i naziv razloga nabave.',
      });
      return;
    }
  }

  if (step.value === 2) {
    if (form.value.items.length === 0) {
      $q.notify({
        type: 'negative',
        message: 'Dodaj barem jednu stavku zahtjeva.',
      });
      return;
    }
  }

  if (step.value < 4) {
    step.value++;
  }
};

const addItem = () => {
  if (
    !itemForm.value.category ||
    !itemForm.value.item_name.trim() ||
    !itemForm.value.quantity ||
    itemForm.value.quantity < 1
  ) {
    $q.notify({
      type: 'negative',
      message: 'Ispuni kategoriju, naziv artikla i količinu.',
    });
    return;
  }

  const category = categoryOptions.find((x) => x.value === itemForm.value.category);

  form.value.items.push({
    category: itemForm.value.category,
    category_label: category?.label || '',
    item_name: itemForm.value.item_name.trim(),
    quantity: itemForm.value.quantity,
  });

  itemForm.value = {
    category: null,
    item_name: '',
    quantity: 1,
  };
};

const removeItem = (index) => {
  form.value.items.splice(index, 1);
};

const formatCurrency = (value) => {
  if (value == null || value === '') return '-';
  return new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value));
};

const submitWizard = () => {
  $q.notify({
    type: 'positive',
    message: 'Wizard je spreman za povezivanje sa spremanjem u bazu.',
  });
};
</script>

<style scoped>
.new-request-page {
  background:
    radial-gradient(circle at top left, rgba(25, 118, 210, 0.07), transparent 26%),
    linear-gradient(180deg, #f8fafc 0%, #f4f7fb 100%);
  min-height: 100vh;
}

.page-shell {
  max-width: 1280px;
  margin: 0 auto;
}

.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.page-title {
  letter-spacing: -0.02em;
}

.page-subtitle {
  max-width: 760px;
  line-height: 1.6;
}

.wizard-card {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.request-stepper {
  background: transparent;
}

.items-card,
.summary-card,
.confirm-card {
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  color: #475569;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row--top {
  align-items: flex-start;
}

@media (max-width: 768px) {
  .summary-row {
    flex-direction: column;
    gap: 6px;
  }
}
</style>