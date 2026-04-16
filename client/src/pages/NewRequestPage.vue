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
                  <q-select
                    v-model="form.fiscalYear"
                    :options="fiscalYearOptions"
                    label="Fiskalna godina"
                    outlined
                    emit-value
                    map-options
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
                    v-model="form.justification"
                    label="Obrazloženje"
                    type="textarea"
                    autogrow
                    outlined
                  />
                </div>
              </div>
            </q-step>

            <q-step
              :name="2"
              title="Stavke zahtjeva"
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

              <q-card flat class="items-card">
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
            </q-step>

            <q-step
              :name="3"
              title="Pregled i potvrda"
              icon="fact_check"
            >
              <div class="row q-col-gutter-lg">
                <div class="col-12 col-md-6">
                  <q-card flat class="summary-card">
                    <q-card-section>
                      <div class="text-subtitle1 text-weight-bold q-mb-md">
                        Osnovni podaci
                      </div>

                      <div class="summary-row">
                        <span>Fiskalna godina</span>
                        <strong>{{ selectedFiscalYearLabel || '-' }}</strong>
                      </div>

                      <div class="summary-row">
                        <span>Odjel</span>
                        <strong>{{ selectedDepartmentLabel || '-' }}</strong>
                      </div>

                      <div class="summary-row summary-row--top">
                        <span>Obrazloženje</span>
                        <strong class="text-right">{{ form.justification || '-' }}</strong>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <div class="col-12 col-md-6">
                  <q-card flat class="summary-card">
                    <q-card-section>
                      <div class="text-subtitle1 text-weight-bold q-mb-md">
                        Sažetak stavki
                      </div>

                      <div class="summary-row">
                        <span>Broj stavki</span>
                        <strong>{{ form.items.length }}</strong>
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

              <q-banner class="bg-blue-1 text-blue-9 q-mt-lg" rounded>
                Ovo je za sada početni wizard prikaz. U sljedećem koraku povezat ćemo spremanje zahtjeva u bazu.
              </q-banner>
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
                    v-if="step < 3"
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
                    label="Potvrdi zahtjev"
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

const fiscalYearOptions = [
  { label: '2025', value: 1 },
  { label: '2026', value: 2 },
];

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

const form = ref({
  fiscalYear: null,
  department: null,
  justification: '',
  items: [],
});

const itemForm = ref({
  category: null,
  item_name: '',
  quantity: 1,
});

const selectedFiscalYearLabel = computed(() => {
  return fiscalYearOptions.find((x) => x.value === form.value.fiscalYear)?.label || '';
});

const selectedDepartmentLabel = computed(() => {
  return departmentOptions.find((x) => x.value === form.value.department)?.label || '';
});

const nextStep = () => {
  if (step.value === 1) {
    if (!form.value.fiscalYear || !form.value.department || !form.value.justification.trim()) {
      $q.notify({
        type: 'negative',
        message: 'Ispuni sva obavezna polja u prvom koraku.',
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

  step.value++;
};

const addItem = () => {
  if (!itemForm.value.category || !itemForm.value.item_name.trim() || !itemForm.value.quantity || itemForm.value.quantity < 1) {
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
.summary-card {
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