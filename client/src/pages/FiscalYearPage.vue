<template>
  <q-page class="page">

    <div v-if="loading" class="loading-full">
      <q-spinner color="primary" size="32px" />
    </div>

    <div v-else class="fy-layout">

      <!-- ── Top bar ─────────────────────────────────────── -->
      <div class="fy-topbar">
        <div v-if="fiscalYears.length === 0" class="fy-topbar__empty">
          Nema poslovnih godina — kreirajte prvu.
        </div>

        <ul v-else class="fy-tabs">
          <li
            v-for="fy in fiscalYears"
            :key="fy.id_fiscal_year"
            class="fy-tab"
            :class="{ 'fy-tab--active': selectedId === fy.id_fiscal_year }"
            @click="selectYear(fy)"
          >
            <span class="fy-tab__year">{{ fy.year }}</span>
            <span class="fy-status" :class="fy.is_closed ? 'fy-status--closed' : 'fy-status--open'">
              {{ fy.is_closed ? 'Zatvorena' : 'Otvorena' }}
            </span>
            <span class="fy-tab__budget">
              {{ fy.total_budget > 0 ? Math.round((fy.total_budget - fy.total_allocated) / fy.total_budget * 100) : 0 }}% slobodno za alokaciju
            </span>
            <button
              v-if="!fy.is_closed"
              class="fy-tab__action fy-tab__action--budget"
              title="Uredi godišnji budžet"
              @click.stop="openBudgetDialog(fy)"
            >
              <q-icon name="edit" size="13px" />
            </button>
            <button
              v-if="!fy.is_closed"
              class="fy-tab__action fy-tab__action--close"
              title="Zatvori godinu"
              @click.stop="closeYear(fy)"
            >
              <q-icon name="lock_open" size="13px" />
            </button>
            <q-icon v-else name="lock" size="13px" class="fy-tab__lock-icon" />
          </li>
        </ul>

        <button class="btn btn--primary fy-topbar__new" :disabled="hasOpenYear" @click="openCreateDialog">
          <q-icon name="add" size="16px" />
          <span>Nova poslovna godina</span>
        </button>
      </div>

      <!-- ── Upozorenje: rok za zatvaranje istekao ── -->
      <div v-if="lateCloseWarning" class="late-warning">
        <q-icon name="warning" size="18px" />
        <span>{{ lateCloseWarning }}</span>
      </div>

      <!-- ── Main ───────────────────────────────────────── -->
      <main class="fy-main">

        <div v-if="!selected" class="main-empty">
          <q-icon name="calendar_month" size="36px" color="grey-4" />
          <p>Odaberite poslovnu godinu</p>
        </div>

        <template v-else>

          <!-- Budget summary -->
          <div v-if="!loadingDetail" class="budget-summary">
            <div class="budget-summary__item">
              <div class="budget-summary__label">
                <q-icon name="account_balance_wallet" size="13px" /> Godišnji budžet
              </div>
              <div class="budget-summary__value budget-summary__value--total">{{ formatEUR(fyBudget) }}</div>
            </div>
            <div class="budget-summary__item">
              <div class="budget-summary__label">
                <q-icon name="pie_chart" size="13px" /> Alocirano
              </div>
              <div class="budget-summary__value" :class="totalAllocated > fyBudget ? 'budget-summary__value--over' : 'budget-summary__value--allocated'">
                {{ formatEUR(totalAllocated) }}
              </div>
            </div>
            <div class="budget-summary__item">
              <div class="budget-summary__label">
                <q-icon name="savings" size="13px" /> Slobodno
              </div>
              <div class="budget-summary__value" :class="totalFree < 0 ? 'budget-summary__value--over' : 'budget-summary__value--available'">
                {{ formatEUR(totalFree) }}
              </div>
            </div>
            <div class="budget-summary__item">
              <div class="budget-summary__label">
                <q-icon name="shopping_cart" size="13px" /> Potrošeno
              </div>
              <div class="budget-summary__value budget-summary__value--spent">{{ formatEUR(totalSpent) }}</div>
            </div>
            <div class="budget-summary__item budget-summary__item--full">
              <div class="budget-bar budget-bar--stacked">
                <div class="budget-bar__fill budget-bar__fill--allocated" :style="{ width: Math.min(allocationPercent, 100) + '%' }" />
                <div class="budget-bar__fill budget-bar__fill--spent" :style="{ width: Math.min(spentPercent, 100) + '%' }" />
              </div>
              <div class="budget-summary__progress-row">
                <span class="budget-summary__label">
                  <span class="bar-dot" style="background:#3b82f6" /> Potrošeno {{ spentPercent }}%
                </span>
                <span class="budget-summary__label">
                  <span class="bar-dot" style="background:#bfdbfe" /> Alocirano {{ Math.max(0, allocationPercent - spentPercent) }}%
                </span>
                <span class="budget-summary__label">
                  <span class="bar-dot" style="background:#86efac;" /> Slobodno {{ Math.max(0, 100 - allocationPercent) }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Odjeli + Kategorije -->
          <div class="cards-row">
            <div class="card cards-row__main">
            <div class="card__header">
              <h3 class="card__title">
                <q-icon name="business" size="16px" />
                <span>Odjeli</span>
              </h3>
              <button v-if="!selected.is_closed" class="btn btn--primary btn--sm" @click="openDeptDialog()">
                <q-icon name="add" size="14px" /> Dodaj
              </button>
            </div>

            <div v-if="loadingDetail" class="loading-block loading-block--sm">
              <q-spinner color="primary" size="20px" />
            </div>
            <div v-else-if="departments.length === 0" class="empty-state empty-state--sm">
              <div class="empty-state__title">Nema odjela</div>
              <div v-if="!selected.is_closed" class="empty-state__hint">Dodajte prvi odjel.</div>
            </div>
            <div v-else class="dept-table">
              <div class="dept-table__header">
                <span class="dept-col dept-col--name">Odjel</span>
                <span class="dept-col dept-col--bar">Iskorištenost</span>
                <span class="dept-col dept-col--pct">%</span>
                <span class="dept-col dept-col--amounts">Potrošeno / Limit</span>
                <span class="dept-col dept-col--actions" v-if="!selected.is_closed"></span>
              </div>
              <div
                v-for="d in sortedDepartments"
                :key="d.id_department"
                class="dept-table__row"
              >
                <span class="dept-col dept-col--name">{{ d.name }}</span>
                <span class="dept-col dept-col--bar">
                  <div class="budget-bar">
                    <div
                      class="budget-bar__fill"
                      :class="[deptBarClass(d), (!isFinite(deptPct(d)) || deptPct(d) > 100) ? 'budget-bar__fill--striped' : '']"
                      :style="{ width: isFinite(deptPct(d)) ? Math.min(deptPct(d), 100) + '%' : '100%' }"
                    />
                  </div>
                </span>
                <span class="dept-col dept-col--pct">
                  <template v-if="!isFinite(deptPct(d))">
                    <q-icon name="warning" size="14px" color="negative" />
                    <span class="dept-no-limit">Nema limita</span>
                  </template>
                  <template v-else-if="deptPct(d) > 100">
                    <q-icon name="warning" size="14px" color="negative" />
                    {{ deptPct(d) }}%
                  </template>
                  <template v-else>{{ deptPct(d) }}%</template>
                </span>
                <span class="dept-col dept-col--amounts">
                  <span class="budget-spent">{{ formatEUR(d.spent_amount) }}</span>
                  <span class="budget-sep">/</span>
                  <span class="budget-limit">{{ formatEUR(d.department_limit) }}</span>
                </span>
                <span class="dept-col dept-col--actions" v-if="!selected.is_closed">
                  <button class="icon-btn" title="Uredi" @click="openDeptDialog(d)">
                    <q-icon name="edit" size="15px" />
                  </button>
                  <button class="icon-btn icon-btn--danger" title="Obriši" @click="deleteDept(d)">
                    <q-icon name="delete_outline" size="15px" />
                  </button>
                </span>
              </div>
            </div>
          </div>

            <!-- Kategorije artikala -->
            <div class="card cards-row__side">
            <div class="card__header">
              <h3 class="card__title">
                <q-icon name="category" size="16px" />
                <span>Kategorije artikala</span>
              </h3>
              <button v-if="!selected.is_closed" class="btn btn--primary btn--sm" @click="openCatDialog()">
                <q-icon name="add" size="14px" /> Dodaj
              </button>
            </div>

            <div v-if="loadingDetail" class="loading-block loading-block--sm">
              <q-spinner color="primary" size="20px" />
            </div>
            <div v-else-if="categories.length === 0" class="empty-state empty-state--sm">
              <div class="empty-state__title">Nema kategorija</div>
              <div v-if="!selected.is_closed" class="empty-state__hint">Dodajte prvu kategoriju.</div>
            </div>
            <ul v-else class="cat-grid">
              <li
                v-for="c in categories"
                :key="c.id_item_category"
                class="cat-chip"
              >
                <span class="cat-chip__name">{{ c.name }}</span>
                <div v-if="!selected.is_closed" class="cat-chip__actions">
                  <button class="icon-btn" title="Uredi" @click="openCatDialog(c)">
                    <q-icon name="edit" size="14px" />
                  </button>
                  <button class="icon-btn icon-btn--danger" title="Obriši" @click="deleteCat(c)">
                    <q-icon name="delete_outline" size="14px" />
                  </button>
                </div>
              </li>
            </ul>
          </div>

          </div><!-- /.cards-row -->


        </template>
      </main>

    </div>

    <!-- Dialog: nova poslovna godina -->
    <q-dialog v-model="createDialog.open" persistent>
      <div class="dialog-card">
        <div class="dialog-header">
          <h2 class="dialog-title">Nova poslovna godina</h2>
          <button class="dialog-close" @click="createDialog.open = false">
            <q-icon name="close" size="18px" />
          </button>
        </div>
        <form class="dialog-body" @submit.prevent="submitCreateYear">
          <div class="field">
            <label class="field-label">Godina</label>
            <input v-model.number="createDialog.year" type="number" class="text-input"
              :placeholder="new Date().getFullYear() + 1" min="2000" max="2100" required />
          </div>
          <div class="field">
            <label class="field-label">Godišnji budžet (€)</label>
            <input v-model.number="createDialog.budget" type="number" class="text-input"
              placeholder="0.00" min="0" step="0.01" required />
          </div>
          <p class="dialog-hint">
            Odjeli i kategorije artikala bit će kopirani iz prethodne poslovne godine. Budžeti odjela mogu se prilagoditi unutar godišnjeg budžeta.
          </p>
          <div v-if="createDialog.error" class="form-error">{{ createDialog.error }}</div>
          <div class="dialog-actions">
            <button type="button" class="btn btn--ghost" @click="createDialog.open = false">Odustani</button>
            <button type="submit" class="btn btn--primary" :disabled="createDialog.saving">
              <q-spinner v-if="createDialog.saving" size="14px" color="white" />
              <span v-else>Kreiraj</span>
            </button>
          </div>
        </form>
      </div>
    </q-dialog>

    <!-- Dialog: odjel -->
    <q-dialog v-model="deptDialog.open" persistent>
      <div class="dialog-card">
        <div class="dialog-header">
          <h2 class="dialog-title">{{ deptDialog.editId ? 'Uredi odjel' : 'Novi odjel' }}</h2>
          <button class="dialog-close" @click="deptDialog.open = false">
            <q-icon name="close" size="18px" />
          </button>
        </div>
        <form class="dialog-body" @submit.prevent="submitDept">
          <div class="field">
            <label class="field-label">Naziv odjela</label>
            <input v-model="deptDialog.name" type="text" class="text-input" placeholder="Naziv" required />
          </div>
          <div class="field">
            <label class="field-label">
              Budžetski limit (€)
              <span class="field-hint">Slobodno za alokaciju: {{ formatEUR(availableForDept) }}</span>
            </label>
            <input v-model.number="deptDialog.limit" type="number" class="text-input" placeholder="0.00" min="0" step="0.01" :max="availableForDept" />
          </div>
          <div v-if="deptDialog.error" class="form-error">{{ deptDialog.error }}</div>
          <div class="dialog-actions">
            <button type="button" class="btn btn--ghost" @click="deptDialog.open = false">Odustani</button>
            <button type="submit" class="btn btn--primary" :disabled="deptDialog.saving">
              <q-spinner v-if="deptDialog.saving" size="14px" color="white" />
              <span v-else>Spremi</span>
            </button>
          </div>
        </form>
      </div>
    </q-dialog>

    <!-- Dialog: kategorija -->
    <q-dialog v-model="catDialog.open" persistent>
      <div class="dialog-card">
        <div class="dialog-header">
          <h2 class="dialog-title">{{ catDialog.editId ? 'Uredi kategoriju' : 'Nova kategorija' }}</h2>
          <button class="dialog-close" @click="catDialog.open = false">
            <q-icon name="close" size="18px" />
          </button>
        </div>
        <form class="dialog-body" @submit.prevent="submitCat">
          <div class="field">
            <label class="field-label">Naziv kategorije</label>
            <input v-model="catDialog.name" type="text" class="text-input" placeholder="Naziv" required />
          </div>
          <div v-if="catDialog.error" class="form-error">{{ catDialog.error }}</div>
          <div class="dialog-actions">
            <button type="button" class="btn btn--ghost" @click="catDialog.open = false">Odustani</button>
            <button type="submit" class="btn btn--primary" :disabled="catDialog.saving">
              <q-spinner v-if="catDialog.saving" size="14px" color="white" />
              <span v-else>Spremi</span>
            </button>
          </div>
        </form>
      </div>
    </q-dialog>

    <!-- Dialog: uredi godišnji budžet -->
    <q-dialog v-model="budgetDialog.open" persistent>
      <div class="dialog-card">
        <div class="dialog-header">
          <h2 class="dialog-title">Godišnji budžet</h2>
          <button class="dialog-close" @click="budgetDialog.open = false">
            <q-icon name="close" size="18px" />
          </button>
        </div>
        <form class="dialog-body" @submit.prevent="submitBudgetEdit">
          <div class="field">
            <label class="field-label">
              <span>Ukupni godišnji budžet (€)</span>
              <span class="field-hint">min. {{ formatEUR(budgetDialog.allocated) }} (alocirano)</span>
            </label>
            <input
              v-model.number="budgetDialog.budget"
              type="number"
              class="text-input"
              :min="budgetDialog.allocated"
              step="0.01"
              required
            />
          </div>
          <div v-if="budgetDialog.error" class="form-error">{{ budgetDialog.error }}</div>
          <div class="dialog-actions">
            <button type="button" class="btn btn--ghost" @click="budgetDialog.open = false">Odustani</button>
            <button type="submit" class="btn btn--primary" :disabled="budgetDialog.saving">
              <q-spinner v-if="budgetDialog.saving" size="14px" color="white" />
              <span v-else>Spremi</span>
            </button>
          </div>
        </form>
      </div>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

const $q = useQuasar();

const loading = ref(true);
const loadingDetail = ref(false);
const fiscalYears = ref([]);
const selectedId = ref(null);
const departments = ref([]);
const categories = ref([]);

const selected = computed(() => fiscalYears.value.find(f => f.id_fiscal_year === selectedId.value) || null);
const hasOpenYear = computed(() => fiscalYears.value.some(f => !f.is_closed));

const lateCloseWarning = computed(() => {
  const openYear = fiscalYears.value.find(f => !f.is_closed);
  if (!openYear) return null;
  const deadline = new Date(openYear.year + 1, 1, 1); // 1. veljače iduće godine
  if (new Date() < deadline) return null;
  return `Rok za zatvaranje poslovne godine ${openYear.year} je istekao (31. siječnja ${openYear.year + 1}). Zatvorite godinu što prije kako bi zaposlenici mogli raditi u novoj godini.`;
});

const fyBudget = computed(() => Number(selected.value?.total_budget || 0));
const totalAllocated = computed(() => departments.value.reduce((s, d) => s + Number(d.department_limit || 0), 0));
const totalSpent = computed(() => departments.value.reduce((s, d) => s + Number(d.spent_amount || 0), 0));
const totalFree = computed(() => fyBudget.value - totalAllocated.value);
const allocationPercent = computed(() => fyBudget.value > 0 ? Math.round(totalAllocated.value / fyBudget.value * 100) : 0);
const spentPercent = computed(() => fyBudget.value > 0 ? Math.round(totalSpent.value / fyBudget.value * 100) : 0);

const deptPct = (d) => {
  const limit = Number(d.department_limit);
  const spent = Number(d.spent_amount || 0);
  if (limit === 0) return spent > 0 ? Infinity : 0;
  return Math.round(spent / limit * 100);
};

const deptBarClass = (d) => {
  const pct = deptPct(d);
  if (!isFinite(pct) || pct >= 100) return 'budget-bar__fill--critical';
  if (pct >= 80) return 'budget-bar__fill--warn';
  return 'budget-bar__fill--ok';
};

const sortedDepartments = computed(() =>
  [...departments.value].sort((a, b) => {
    const pa = deptPct(a);
    const pb = deptPct(b);
    if (!isFinite(pb)) return 1;
    if (!isFinite(pa)) return -1;
    return pb - pa;
  })
);

const pieSpentPct  = computed(() => fyBudget.value > 0 ? Math.min(totalSpent.value / fyBudget.value * 100, 100) : 0);
const pieAllocPct  = computed(() => fyBudget.value > 0 ? Math.min(totalAllocated.value / fyBudget.value * 100, 100) : 0);
const pieFreePct   = computed(() => Math.max(0, 100 - pieAllocPct.value));

const pieStyle = computed(() => {
  if (fyBudget.value === 0) return { background: '#e5e7eb' };
  return { background: `conic-gradient(#3b82f6 0% ${pieSpentPct.value}%, #bfdbfe ${pieSpentPct.value}% ${pieAllocPct.value}%, #e5e7eb ${pieAllocPct.value}% 100%)` };
});

const availableForDept = computed(() => {
  const currentLimit = deptDialog.value.editId
    ? Number(departments.value.find(d => d.id_department === deptDialog.value.editId)?.department_limit || 0)
    : 0;
  return Math.max(0, fyBudget.value - totalAllocated.value + currentLimit);
});

const formatEUR = (val) => new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(val || 0);

const createDialog = ref({ open: false, year: new Date().getFullYear() + 1, budget: 0, error: '', saving: false });
const deptDialog = ref({ open: false, editId: null, name: '', limit: 0, error: '', saving: false });
const catDialog = ref({ open: false, editId: null, name: '', error: '', saving: false });
const budgetDialog = ref({ open: false, fyId: null, budget: 0, allocated: 0, error: '', saving: false });

const openBudgetDialog = (fy) => {
  budgetDialog.value = {
    open: true,
    fyId: fy.id_fiscal_year,
    budget: Number(fy.total_budget),
    allocated: Number(fy.total_allocated),
    error: '',
    saving: false,
  };
};

const submitBudgetEdit = async () => {
  budgetDialog.value.error = '';
  budgetDialog.value.saving = true;
  try {
    const fyId = budgetDialog.value.fyId;
    const newBudget = budgetDialog.value.budget;
    await api.patch(`/fiscal-years/${fyId}/budget`, { total_budget: newBudget });
    // direktna mutacija → svi computeds (fyBudget, pieStyle...) se odmah osvježavaju
    const fy = fiscalYears.value.find(f => f.id_fiscal_year === fyId);
    if (fy) fy.total_budget = newBudget;
    budgetDialog.value.open = false;
    await loadYears();
    $q.notify({ type: 'positive', message: 'Godišnji budžet ažuriran.' });
  } catch (err) {
    budgetDialog.value.error = err.response?.data?.message || 'Greška pri ažuriranju budžeta.';
  } finally {
    budgetDialog.value.saving = false;
  }
};

const loadYears = async () => {
  try {
    const { data } = await api.get('/fiscal-years');
    fiscalYears.value = data;
    if (!selectedId.value && data.length > 0) {
      const open = data.find(f => !f.is_closed);
      selectedId.value = (open || data[0]).id_fiscal_year;
      await loadDetail();
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Greška pri dohvatu poslovnih godina.' });
  } finally {
    loading.value = false;
  }
};

const loadDetail = async () => {
  if (!selectedId.value) return;
  loadingDetail.value = true;
  try {
    const [d, c] = await Promise.all([
      api.get(`/fiscal-years/${selectedId.value}/departments`),
      api.get(`/fiscal-years/${selectedId.value}/categories`),
    ]);
    departments.value = d.data;
    categories.value = c.data;
  } catch {
    $q.notify({ type: 'negative', message: 'Greška pri dohvatu podataka.' });
  } finally {
    loadingDetail.value = false;
  }
};

const selectYear = async (fy) => {
  selectedId.value = fy.id_fiscal_year;
  await loadDetail();
};

// ── Kreiranje godine ──────────────────────────────────────────────────────────
const openCreateDialog = () => {
  const nextYear = fiscalYears.value.length > 0
    ? Math.max(...fiscalYears.value.map(f => f.year)) + 1
    : new Date().getFullYear();
  createDialog.value = { open: true, year: nextYear, budget: 0, error: '', saving: false };
};

const submitCreateYear = async () => {
  createDialog.value.error = '';
  createDialog.value.saving = true;
  try {
    const { data } = await api.post('/fiscal-years', { year: createDialog.value.year, total_budget: createDialog.value.budget || 0 });
    $q.notify({ type: 'positive', message: data.message });
    createDialog.value.open = false;
    loading.value = true;
    selectedId.value = null;
    await loadYears();
  } catch (err) {
    createDialog.value.error = err?.response?.data?.message || 'Greška pri kreiranju.';
  } finally {
    createDialog.value.saving = false;
  }
};

// ── Zatvaranje godine ─────────────────────────────────────────────────────────
const closeYear = (fy) => {
  $q.dialog({
    title: 'Zatvaranje poslovne godine',
    message: `Jeste li sigurni da želite zatvoriti poslovnu godinu <strong>${fy.year}</strong>? Ova radnja je nepovratna.`,
    html: true,
    cancel: { label: 'Odustani', flat: true },
    ok: { label: 'Zatvori godinu', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    try {
      const { data } = await api.patch(`/fiscal-years/${fy.id_fiscal_year}/close`);
      $q.notify({ type: 'positive', message: data.message });
      await loadYears();
    } catch (err) {
      $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Greška pri zatvaranju.' });
    }
  });
};

// ── Odjeli ────────────────────────────────────────────────────────────────────
const openDeptDialog = (dept = null) => {
  deptDialog.value = { open: true, editId: dept?.id_department || null, name: dept?.name || '', limit: Number(dept?.department_limit || 0), error: '', saving: false };
};

const submitDept = async () => {
  deptDialog.value.error = '';
  deptDialog.value.saving = true;
  try {
    const fyId = selectedId.value;
    const deptPayload = { name: deptDialog.value.name, department_limit: deptDialog.value.limit || 0 };
    if (deptDialog.value.editId) {
      await api.put(`/fiscal-years/${fyId}/departments/${deptDialog.value.editId}`, deptPayload);
      $q.notify({ type: 'positive', message: 'Odjel ažuriran.' });
    } else {
      await api.post(`/fiscal-years/${fyId}/departments`, deptPayload);
      $q.notify({ type: 'positive', message: 'Odjel dodan.' });
    }
    deptDialog.value.open = false;
    await loadDetail();
  } catch (err) {
    deptDialog.value.error = err?.response?.data?.message || 'Greška pri spremanju.';
  } finally {
    deptDialog.value.saving = false;
  }
};

const deleteDept = (dept) => {
  $q.dialog({
    title: 'Brisanje odjela',
    message: `Obrisati odjel <strong>${dept.name}</strong>?`,
    html: true,
    cancel: { label: 'Odustani', flat: true },
    ok: { label: 'Obriši', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/fiscal-years/${selectedId.value}/departments/${dept.id_department}`);
      $q.notify({ type: 'positive', message: 'Odjel obrisan.' });
      await loadDetail();
    } catch (err) {
      $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Greška pri brisanju.', timeout: 4000 });
    }
  });
};

// ── Kategorije ────────────────────────────────────────────────────────────────
const openCatDialog = (cat = null) => {
  catDialog.value = { open: true, editId: cat?.id_item_category || null, name: cat?.name || '', error: '', saving: false };
};

const submitCat = async () => {
  catDialog.value.error = '';
  catDialog.value.saving = true;
  try {
    const fyId = selectedId.value;
    const catPayload = { name: catDialog.value.name };
    if (catDialog.value.editId) {
      await api.put(`/fiscal-years/${fyId}/categories/${catDialog.value.editId}`, catPayload);
      $q.notify({ type: 'positive', message: 'Kategorija ažurirana.' });
    } else {
      await api.post(`/fiscal-years/${fyId}/categories`, catPayload);
      $q.notify({ type: 'positive', message: 'Kategorija dodana.' });
    }
    catDialog.value.open = false;
    await loadDetail();
  } catch (err) {
    catDialog.value.error = err?.response?.data?.message || 'Greška pri spremanju.';
  } finally {
    catDialog.value.saving = false;
  }
};

const deleteCat = (cat) => {
  $q.dialog({
    title: 'Brisanje kategorije',
    message: `Obrisati kategoriju <strong>${cat.name}</strong>?`,
    html: true,
    cancel: { label: 'Odustani', flat: true },
    ok: { label: 'Obriši', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/fiscal-years/${selectedId.value}/categories/${cat.id_item_category}`);
      $q.notify({ type: 'positive', message: 'Kategorija obrisana.' });
      await loadDetail();
    } catch (err) {
      $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Greška pri brisanju.', timeout: 4000 });
    }
  });
};

onMounted(loadYears);
</script>

<style scoped>
/* ── Base ── */
.page {
  padding: 0;
  background: transparent;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  height: 100%;
}

/* ── Full-page loading ── */
.loading-full {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 80px;
}

/* ── Layout ── */
.fy-layout {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

/* ── Top bar ── */
.fy-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 40px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
  overflow-x: auto;
}

.fy-topbar__new { margin-left: auto; flex-shrink: 0; }

.fy-topbar__empty {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* ── FY tabs ── */
.fy-tabs {
  display: flex;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
  flex-shrink: 0;
}

.fy-tab {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.1s, border-color 0.1s;
}
.fy-tab:hover { background: #f0fbfe; border-color: #e0f2fe; }
.fy-tab--active { background: #e0f6fd; border-color: #7dd3f0; }
.fy-tab--active:hover { background: #d0f0f9; }

.fy-tab__year {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #111827;
}

.fy-tab__budget {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}

.fy-tab__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: background 0.1s;
}

.fy-tab__action--budget {
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #6b7280;
}
.fy-tab__action--budget:hover { background: #e0f2fe; border-color: #7dd3f0; color: #0369a1; }

.fy-tab__action--close {
  border: 1px solid #fca5a5;
  background: #fef2f2;
  color: #c50f1f;
}
.fy-tab__action--close:hover { background: #fee2e2; }

.fy-tab__lock-icon { color: #d1d5db; flex-shrink: 0; }

/* ── Status badge ── */
.fy-status {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  flex-shrink: 0;
}
.fy-status--open   { color: #065f46; background: #d1fae5; }
.fy-status--closed { color: #6b7280; background: #f3f4f6; }

/* ── Action button (zatvori godinu) ── */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border: 1.5px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.action-btn--danger:hover { background: #fef2f2; color: #c50f1f; border-color: #fca5a5; }

/* ── Late close warning banner ── */
.late-warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 40px;
  background: #fef2f2;
  border-bottom: 1px solid #fca5a5;
  color: #991b1b;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
}
.late-warning .q-icon { color: #dc2626; flex-shrink: 0; margin-top: 1px; }

/* ── Main content ── */
.fy-main {
  padding: 32px 40px;
  min-height: 100%;
}

.main-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 80px;
  color: #9ca3af;
  font-size: 0.9375rem;
}
.main-empty p { margin: 0; }

/* ── Year header ── */
.year-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.year-header__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

/* ── Budget summary ── */
.budget-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  margin-bottom: 20px;
  overflow: hidden;
}

.budget-summary__item {
  padding: 18px 24px;
  border-right: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
}
.budget-summary__item:nth-child(4) { border-right: none; }
.budget-summary__item--full {
  grid-column: 1 / -1;
  border-right: none;
  border-bottom: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 24px;
}

/* ── Pie chart ── */
.budget-summary__pie {
  grid-column: 5;
  grid-row: 1 / 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 20px 16px;
  border-left: 1px solid #f3f4f6;
}

.pie-donut {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.pie-donut__hole {
  position: absolute;
  inset: 26px;
  border-radius: 50%;
  background: #fff;
}

.pie-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
}

.pie-legend__item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #4b5563;
  white-space: nowrap;
}

.pie-legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.budget-summary__progress-row {
  display: flex;
  gap: 24px;
}

.bar-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  vertical-align: middle;
  margin-right: 4px;
}

.budget-summary__label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  margin-bottom: 6px;
}

.budget-summary__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}
.budget-summary__value--total     { color: #111827; }
.budget-summary__value--allocated { color: #111827; }
.budget-summary__value--available { color: #065f46; }
.budget-summary__value--spent     { color: #f87171; }
.budget-summary__value--over      { color: #c50f1f; }

/* ── Budget bars ── */
.budget-bar {
  width: 100%;
  height: 6px;
  background: #86efac;
  border-radius: 99px;
  overflow: hidden;
  position: relative;
}

.budget-bar--stacked { height: 10px; }
.budget-bar--stacked .budget-bar__fill { position: absolute; top: 0; left: 0; }

.budget-bar__fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.35s ease;
}
.budget-bar__fill--ok        { background: #10b981; }
.budget-bar__fill--warn      { background: #f59e0b; }
.budget-bar__fill--over      { background: #ef4444; }
.budget-bar__fill--critical  { background: #dc2626; }
.budget-bar__fill--allocated { background: #bfdbfe; }
.budget-bar__fill--spent     { background: #3b82f6; }

.budget-bar__fill--striped {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(0,0,0,0.15) 4px,
    rgba(0,0,0,0.15) 8px
  );
  animation: bar-pulse 1.2s ease-in-out infinite;
}

@keyframes bar-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

.dept-no-limit {
  font-size: 0.75rem;
  font-weight: 600;
  color: #dc2626;
}

/* ── Department table ── */
.dept-table { padding: 4px 0; }

.dept-table__header {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1fr 68px;
  padding: 6px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.dept-table__row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1fr 68px;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.1s;
}
.dept-table__row:last-child { border-bottom: none; }
.dept-table__row:hover { background: #f9fafb; }

.dept-col { font-size: 0.875rem; }
.dept-col--name { color: #111827; font-weight: 500; padding-right: 16px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dept-col--amounts {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  justify-content: flex-start;
  padding-right: 20px;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  white-space: nowrap;
}
.dept-col--bar { padding-right: 12px; }
.dept-col--pct { font-size: 0.8125rem; color: #6b7280; font-weight: 600; text-align: left; padding-right: 0; display: flex; align-items: center; gap: 4px; white-space: nowrap; }
.dept-col--actions { display: flex; gap: 2px; justify-content: flex-end; }

.dept-table__header .dept-col {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
}
.dept-table__header .dept-col--amounts { justify-content: flex-start; }

.budget-spent { color: #f87171; font-weight: 600; }
.budget-sep   { color: #d1d5db; }
.budget-limit { color: #6b7280; }

/* ── Cards row (odjeli 3/4 + kategorije 1/4) ── */
.cards-row {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 16px;
  align-items: start;
}

.cards-row__main,
.cards-row__side { margin: 0; }

/* ── Category list ── */
.cat-grid {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}

.cat-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 16px;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.1s;
}
.cat-chip:last-child { border-bottom: none; }
.cat-chip:hover { background: #f9fafb; }
.cat-chip__name { font-size: 0.875rem; color: #111827; font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cat-chip__actions { display: flex; gap: 2px; flex-shrink: 0; }

/* ── Empty state ── */
.empty-state--sm { padding: 28px 20px; }

/* ── Loading ── */
.loading-block--sm { padding: 28px 0; }

/* ── Dialog ── */
.field { display: flex; flex-direction: column; gap: 6px; }

.field-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

.field-hint {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #065f46;
  text-transform: none;
  letter-spacing: 0;
}

.text-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1.5px solid rgba(0, 175, 219, 0.3);
  border-radius: 12px;
  outline: none;
  background: rgba(255, 255, 255, 0.85);
  color: #1b2d59;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.text-input:focus {
  border-color: #00afdb;
  box-shadow: 0 0 0 3px rgba(0, 175, 219, 0.1);
}

.dialog-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.5;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .budget-summary { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 760px) {
  .fy-main { padding: 20px 16px; }
  .cards-row { grid-template-columns: 1fr; }
  .dept-table__header { display: none; }
  .dept-table__row { grid-template-columns: 1fr auto; grid-template-rows: auto auto; gap: 6px; }
  .dept-col--bar { grid-column: 1 / -1; padding-right: 0; }
  .dept-col--pct { display: none; }
  .budget-summary { grid-template-columns: 1fr 1fr; }
  .budget-summary__item:nth-child(2) { border-right: none; }
  .budget-summary__item:nth-child(3),
  .budget-summary__item:nth-child(4) { border-bottom: none; }
}
</style>
