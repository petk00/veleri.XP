<template>
  <q-page class="page">
    <div class="page-shell">

      <header class="page-header">
        <div class="page-header__main">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <span class="breadcrumb__item">Administracija</span>
            <span class="breadcrumb__sep">›</span>
            <span class="breadcrumb__current">Poslovne godine</span>
          </nav>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--cta" :disabled="hasOpenYear" @click="openCreateDialog">
            <q-icon name="add" size="18px" />
            <span>Nova poslovna godina</span>
          </button>
        </div>
      </header>

      <div v-if="loading" class="loading-block">
        <q-spinner color="primary" size="28px" />
      </div>

      <template v-else>

        <!-- Lista poslovnih godina -->
        <section class="list-surface" style="margin-bottom: 24px;">
          <div class="surface-header">
            <h2 class="surface-title">Sve poslovne godine</h2>
          </div>

          <div v-if="fiscalYears.length === 0" class="empty-state">
            <div class="empty-state__icon"><q-icon name="calendar_today" size="28px" /></div>
            <div class="empty-state__title">Nema poslovnih godina</div>
            <div class="empty-state__hint">Kreirajte prvu poslovnu godinu.</div>
          </div>

          <ul v-else class="fy-list">
            <li
              v-for="fy in fiscalYears"
              :key="fy.id_fiscal_year"
              class="fy-row"
              :class="{ 'fy-row--active': selectedId === fy.id_fiscal_year }"
              @click="selectYear(fy)"
            >
              <div class="fy-row__year">{{ fy.year }}</div>
              <span class="fy-status" :class="fy.is_closed ? 'fy-status--closed' : 'fy-status--open'">
                {{ fy.is_closed ? 'Zatvorena' : 'Otvorena' }}
              </span>
              <div v-if="!fy.is_closed" class="fy-row__actions" @click.stop>
                <button class="action-btn action-btn--danger" title="Zatvori godinu" @click="closeYear(fy)">
                  <q-icon name="lock" size="15px" />
                  <span>Zatvori godinu</span>
                </button>
              </div>
            </li>
          </ul>
        </section>

        <!-- Detail odabrane godine -->
        <div v-if="selected" class="year-detail">

          <div class="year-detail__header">
            <h2 class="year-detail__title">{{ selected.year }}</h2>
            <span class="fy-status" :class="selected.is_closed ? 'fy-status--closed' : 'fy-status--open'">
              {{ selected.is_closed ? 'Zatvorena' : 'Otvorena' }}
            </span>
          </div>

          <div class="detail-grid">

            <!-- Odjeli -->
            <section class="list-surface">
              <div class="surface-header">
                <h3 class="surface-title">Odjeli</h3>
                <button
                  v-if="!selected.is_closed"
                  class="btn btn--sm btn--cta"
                  @click="openDeptDialog()"
                >
                  <q-icon name="add" size="15px" />
                  Dodaj
                </button>
              </div>

              <div v-if="loadingDetail" class="loading-block loading-block--sm">
                <q-spinner color="primary" size="20px" />
              </div>

              <div v-else-if="departments.length === 0" class="empty-state empty-state--sm">
                <div class="empty-state__title">Nema odjela</div>
                <div v-if="!selected.is_closed" class="empty-state__hint">Dodajte prvi odjel.</div>
              </div>

              <ul v-else class="ref-list">
                <li v-for="d in departments" :key="d.id_department" class="ref-row">
                  <span class="ref-row__name">{{ d.name }}</span>
                  <div v-if="!selected.is_closed" class="ref-row__actions">
                    <button class="action-btn" title="Uredi" @click="openDeptDialog(d)">
                      <q-icon name="edit" size="15px" />
                    </button>
                    <button class="action-btn action-btn--danger" title="Obriši" @click="deleteDept(d)">
                      <q-icon name="delete_outline" size="15px" />
                    </button>
                  </div>
                </li>
              </ul>
            </section>

            <!-- Kategorije artikala -->
            <section class="list-surface">
              <div class="surface-header">
                <h3 class="surface-title">Kategorije artikala</h3>
                <button
                  v-if="!selected.is_closed"
                  class="btn btn--sm btn--cta"
                  @click="openCatDialog()"
                >
                  <q-icon name="add" size="15px" />
                  Dodaj
                </button>
              </div>

              <div v-if="loadingDetail" class="loading-block loading-block--sm">
                <q-spinner color="primary" size="20px" />
              </div>

              <div v-else-if="categories.length === 0" class="empty-state empty-state--sm">
                <div class="empty-state__title">Nema kategorija</div>
                <div v-if="!selected.is_closed" class="empty-state__hint">Dodajte prvu kategoriju.</div>
              </div>

              <ul v-else class="ref-list">
                <li v-for="c in categories" :key="c.id_item_category" class="ref-row">
                  <span class="ref-row__name">{{ c.name }}</span>
                  <div v-if="!selected.is_closed" class="ref-row__actions">
                    <button class="action-btn" title="Uredi" @click="openCatDialog(c)">
                      <q-icon name="edit" size="15px" />
                    </button>
                    <button class="action-btn action-btn--danger" title="Obriši" @click="deleteCat(c)">
                      <q-icon name="delete_outline" size="15px" />
                    </button>
                  </div>
                </li>
              </ul>
            </section>

          </div>
        </div>

      </template>
    </div>

    <!-- Dialog: nova poslovna godina -->
    <q-dialog v-model="createDialog.open" persistent>
      <div class="dialog-card">
        <div class="dialog-header">
          <h2 class="dialog-title">Nova poslovna godina</h2>
          <button class="dialog-close" @click="createDialog.open = false">
            <q-icon name="close" size="20px" />
          </button>
        </div>
        <form class="dialog-body" @submit.prevent="submitCreateYear">
          <div class="field">
            <label class="field-label">Godina</label>
            <input v-model.number="createDialog.year" type="number" class="text-input"
              :placeholder="new Date().getFullYear() + 1" min="2000" max="2100" required />
          </div>
          <p class="dialog-hint">
            Odjeli i kategorije artikala bit će kopirani iz prethodne poslovne godine.
          </p>
          <div v-if="createDialog.error" class="form-error">{{ createDialog.error }}</div>
          <div class="dialog-actions">
            <button type="button" class="btn btn--secondary" @click="createDialog.open = false">Odustani</button>
            <button type="submit" class="btn btn--cta" :disabled="createDialog.saving">
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
            <q-icon name="close" size="20px" />
          </button>
        </div>
        <form class="dialog-body" @submit.prevent="submitDept">
          <div class="field">
            <label class="field-label">Naziv odjela</label>
            <input v-model="deptDialog.name" type="text" class="text-input" placeholder="Naziv" required />
          </div>
          <div v-if="deptDialog.error" class="form-error">{{ deptDialog.error }}</div>
          <div class="dialog-actions">
            <button type="button" class="btn btn--secondary" @click="deptDialog.open = false">Odustani</button>
            <button type="submit" class="btn btn--cta" :disabled="deptDialog.saving">
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
            <q-icon name="close" size="20px" />
          </button>
        </div>
        <form class="dialog-body" @submit.prevent="submitCat">
          <div class="field">
            <label class="field-label">Naziv kategorije</label>
            <input v-model="catDialog.name" type="text" class="text-input" placeholder="Naziv" required />
          </div>
          <div v-if="catDialog.error" class="form-error">{{ catDialog.error }}</div>
          <div class="dialog-actions">
            <button type="button" class="btn btn--secondary" @click="catDialog.open = false">Odustani</button>
            <button type="submit" class="btn btn--cta" :disabled="catDialog.saving">
              <q-spinner v-if="catDialog.saving" size="14px" color="white" />
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

const createDialog = ref({ open: false, year: new Date().getFullYear() + 1, error: '', saving: false });
const deptDialog = ref({ open: false, editId: null, name: '', error: '', saving: false });
const catDialog = ref({ open: false, editId: null, name: '', error: '', saving: false });

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
  createDialog.value = { open: true, year: nextYear, error: '', saving: false };
};

const submitCreateYear = async () => {
  createDialog.value.error = '';
  createDialog.value.saving = true;
  try {
    const { data } = await api.post('/fiscal-years', { year: createDialog.value.year });
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
  deptDialog.value = { open: true, editId: dept?.id_department || null, name: dept?.name || '', error: '', saving: false };
};

const submitDept = async () => {
  deptDialog.value.error = '';
  deptDialog.value.saving = true;
  try {
    const fyId = selectedId.value;
    if (deptDialog.value.editId) {
      await api.put(`/fiscal-years/${fyId}/departments/${deptDialog.value.editId}`, { name: deptDialog.value.name });
      $q.notify({ type: 'positive', message: 'Odjel ažuriran.' });
    } else {
      await api.post(`/fiscal-years/${fyId}/departments`, { name: deptDialog.value.name });
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
    if (catDialog.value.editId) {
      await api.put(`/fiscal-years/${fyId}/categories/${catDialog.value.editId}`, { name: catDialog.value.name });
      $q.notify({ type: 'positive', message: 'Kategorija ažurirana.' });
    } else {
      await api.post(`/fiscal-years/${fyId}/categories`, { name: catDialog.value.name });
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
.page {
  padding: 38px 40px 32px;
  background: transparent;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}
.page-shell { max-width: 960px; margin: 0 auto; }

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 24px; margin-bottom: 28px;
}

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
.page-header__title { margin: 0; color: #111827; font-size: 2.25rem; font-weight: 600; letter-spacing: -0.015em; line-height: 1.1; }
.page-header__actions { flex-shrink: 0; }

/* Buttons */
.btn--cta {
  display: inline-flex; align-items: center; gap: 8px;
  min-height: 38px; padding: 0 20px; border: none; border-radius: 3px;
  background: #0067b8; color: #fff; font: inherit; font-size: 0.9375rem;
  font-weight: 600; cursor: pointer; transition: background 0.15s;
}
.btn--cta:hover:not(:disabled) { background: #005a9e; }
.btn--cta:disabled { opacity: 0.45; cursor: not-allowed; }

.btn--sm { min-height: 28px; padding: 0 12px; font-size: 0.8125rem; gap: 5px; }

.btn--secondary {
  display: inline-flex; align-items: center; gap: 8px;
  min-height: 38px; padding: 0 20px; border: 1px solid #d1d5db;
  border-radius: 3px; background: #fff; color: #374151;
  font: inherit; font-size: 0.9375rem; font-weight: 500;
  cursor: pointer; transition: background 0.15s;
}
.btn--secondary:hover { background: #f9fafb; }

.loading-block { display: flex; justify-content: center; padding: 48px 0; }
.loading-block--sm { padding: 24px 0; }

/* List surface */
.list-surface { border: 1px solid #e5e7eb; background: #fff; overflow: hidden; }
.surface-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; padding: 12px 20px; border-bottom: 1px solid #e5e7eb;
}
.surface-title { margin: 0; font-size: 0.8125rem; font-weight: 600; color: #111827; }

/* Fiscal year list */
.fy-list { list-style: none; margin: 0; padding: 0; }
.fy-row {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 20px; border-bottom: 1px solid #f3f4f6;
  cursor: pointer; transition: background 0.1s;
}
.fy-row:last-child { border-bottom: none; }
.fy-row:hover { background: #f9fafb; }
.fy-row--active { background: #f0f7ff; }
.fy-row__year { font-size: 1rem; font-weight: 600; color: #111827; flex: 1; }
.fy-row__actions { margin-left: auto; }

.fy-status {
  font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04em;
  text-transform: uppercase; padding: 2px 8px; border-radius: 3px; flex-shrink: 0;
}
.fy-status--open { color: #065f46; background: #d1fae5; }
.fy-status--closed { color: #6b7280; background: #f3f4f6; }

/* Year detail */
.year-detail { }
.year-detail__header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
}
.year-detail__title { margin: 0; font-size: 1.25rem; font-weight: 600; color: #111827; }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Ref list (odjeli / kategorije) */
.ref-list { list-style: none; margin: 0; padding: 0; }
.ref-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 20px; border-bottom: 1px solid #f3f4f6;
}
.ref-row:last-child { border-bottom: none; }
.ref-row__name { flex: 1; font-size: 0.875rem; color: #111827; }
.ref-row__actions { display: flex; gap: 2px; flex-shrink: 0; }

/* Action buttons */
.action-btn {
  all: unset; display: inline-flex; align-items: center; gap: 5px;
  height: 30px; padding: 0 8px; border-radius: 3px;
  color: #6b7280; cursor: pointer; font-size: 0.8125rem;
  transition: background 0.12s, color 0.12s;
}
.action-btn:hover { background: #f3f4f6; color: #111827; }
.action-btn--danger:hover { background: #fef2f2; color: #dc2626; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px 24px; text-align: center; }
.empty-state--sm { padding: 24px; }
.empty-state__icon {
  display: flex; width: 44px; height: 44px; align-items: center; justify-content: center;
  margin-bottom: 12px; border: 1px solid #e5e7eb; color: #9ca3af;
}
.empty-state__title { margin: 0 0 4px; font-size: 0.9rem; font-weight: 600; color: #111827; }
.empty-state__hint { color: #6b7280; font-size: 0.8125rem; line-height: 1.5; }

/* Dialog */
.dialog-card {
  width: 400px; max-width: 95vw;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
.dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.dialog-title { margin: 0; font-size: 1rem; font-weight: 600; color: #111827; }
.dialog-close {
  all: unset; display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 3px; color: #6b7280; cursor: pointer;
}
.dialog-close:hover { background: #f3f4f6; color: #111827; }
.dialog-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.8125rem; font-weight: 500; color: #374151; }
.text-input {
  width: 100%; height: 38px; padding: 0 10px;
  border: 1px solid #d1d5db; border-radius: 3px; outline: none;
  background: #fff; color: #111827; font: inherit; font-size: 0.9375rem;
  box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s;
}
.text-input:focus { border-color: #00afdb; box-shadow: 0 0 0 3px rgba(0, 175, 219, 0.3); }

.dialog-hint { margin: 0; font-size: 0.8125rem; color: #6b7280; line-height: 1.5; }

.form-error {
  padding: 9px 12px; border-left: 3px solid #c50f1f;
  background: #fef2f2; color: #991b1b; font-size: 0.8125rem; line-height: 1.4;
}
.dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }

@media (max-width: 760px) {
  .page { padding: 24px 16px 24px; }
  .page-header { flex-direction: column; align-items: stretch; gap: 16px; }
  .page-header__title { font-size: 1.75rem; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>
