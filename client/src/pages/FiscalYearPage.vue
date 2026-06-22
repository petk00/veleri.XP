<template>
  <q-page class="page">
    <div class="page-shell">

      <header class="page-header">
        <button class="btn btn--primary" :disabled="hasOpenYear" @click="openCreateDialog">
          <q-icon name="add" size="16px" />
          <span>Nova poslovna godina</span>
        </button>
      </header>

      <div v-if="loading" class="loading-block">
        <q-spinner color="primary" size="28px" />
      </div>

      <template v-else>

        <!-- Lista poslovnih godina -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon name="calendar_month" size="16px" />
              <span>Sve poslovne godine</span>
            </h2>
            <span class="card__count">{{ fiscalYears.length }}</span>
          </div>

          <div v-if="fiscalYears.length === 0" class="empty-state">
            <div class="empty-state__icon"><q-icon name="calendar_today" size="24px" /></div>
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
                  <q-icon name="lock" size="14px" />
                  <span>Zatvori godinu</span>
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- Detail odabrane godine -->
        <div v-if="selected">

          <div class="year-detail__header">
            <h2 class="year-detail__title">{{ selected.year }}</h2>
            <span class="fy-status" :class="selected.is_closed ? 'fy-status--closed' : 'fy-status--open'">
              {{ selected.is_closed ? 'Zatvorena' : 'Otvorena' }}
            </span>
          </div>

          <div class="detail-grid">

            <!-- Odjeli -->
            <div class="card">
              <div class="card__header">
                <h3 class="card__title">
                  <q-icon name="business" size="16px" />
                  <span>Odjeli</span>
                </h3>
                <button
                  v-if="!selected.is_closed"
                  class="btn btn--primary btn--sm"
                  @click="openDeptDialog()"
                >
                  <q-icon name="add" size="14px" />
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
                    <button class="icon-btn" title="Uredi" @click="openDeptDialog(d)">
                      <q-icon name="edit" size="15px" />
                    </button>
                    <button class="icon-btn icon-btn--danger" title="Obriši" @click="deleteDept(d)">
                      <q-icon name="delete_outline" size="15px" />
                    </button>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Kategorije artikala -->
            <div class="card">
              <div class="card__header">
                <h3 class="card__title">
                  <q-icon name="category" size="16px" />
                  <span>Kategorije artikala</span>
                </h3>
                <button
                  v-if="!selected.is_closed"
                  class="btn btn--primary btn--sm"
                  @click="openCatDialog()"
                >
                  <q-icon name="add" size="14px" />
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
                    <button class="icon-btn" title="Uredi" @click="openCatDialog(c)">
                      <q-icon name="edit" size="15px" />
                    </button>
                    <button class="icon-btn icon-btn--danger" title="Obriši" @click="deleteCat(c)">
                      <q-icon name="delete_outline" size="15px" />
                    </button>
                  </div>
                </li>
              </ul>
            </div>

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
            <q-icon name="close" size="18px" />
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
  padding: 32px 40px;
  background: transparent;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.page-shell {
  max-width: 960px;
  margin: 0 auto;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 38px;
  padding: 0 18px;
  border: 1.5px solid transparent;
  border-radius: 12px;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.btn:disabled { opacity: 0.45; cursor: not-allowed; }

.btn--primary {
  background: rgba(0, 175, 219, 0.1);
  color: #0e7490;
  border-color: rgba(0, 175, 219, 0.45);
}

.btn--primary:hover:not(:disabled) {
  background: rgba(0, 175, 219, 0.18);
  border-color: #00afdb;
  box-shadow: 0 0 0 3px rgba(0, 175, 219, 0.1);
}

.btn--ghost {
  background: rgba(255, 255, 255, 0.8);
  color: #1b2d59;
  border-color: rgba(0, 175, 219, 0.3);
}

.btn--ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(0, 175, 219, 0.55);
}

.btn--sm {
  height: 30px;
  padding: 0 12px;
  font-size: 0.8125rem;
  gap: 5px;
  border-radius: 8px;
}

/* ── Icon buttons ── */
.icon-btn {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.icon-btn:hover { background: rgba(0, 175, 219, 0.08); color: #0e7490; }
.icon-btn--danger:hover { background: #fef2f2; color: #c50f1f; }

/* ── Card ── */
.card {
  margin-bottom: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1.5px solid rgba(0, 175, 219, 0.18);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 175, 219, 0.07);
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0, 175, 219, 0.1);
  background: rgba(0, 175, 219, 0.03);
}

.card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #111827;
  font-size: 0.9375rem;
  font-weight: 600;
}

.card__title .q-icon { color: #00afdb; }

.card__count {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
}

/* ── Loading ── */
.loading-block { display: flex; justify-content: center; padding: 48px 0; }
.loading-block--sm { padding: 24px 0; }

/* ── Fiscal year list ── */
.fy-list { list-style: none; margin: 0; padding: 0; }

.fy-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.12s;
}

.fy-row:last-child { border-bottom: none; }
.fy-row:hover { background: #f0fbfe; }
.fy-row--active { background: #e0f6fd; }
.fy-row--active:hover { background: #d0f0f9; }

.fy-row__year {
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.fy-row__actions { margin-left: auto; }

.fy-status {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.6875rem;
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
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: 1.5px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.action-btn:hover { background: rgba(0, 175, 219, 0.08); color: #0e7490; border-color: rgba(0, 175, 219, 0.2); }
.action-btn--danger:hover { background: #fef2f2; color: #c50f1f; border-color: #fca5a5; }

/* ── Year detail ── */
.year-detail__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 0 4px;
}

.year-detail__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* ── Ref list (odjeli / kategorije) ── */
.ref-list { list-style: none; margin: 0; padding: 0; }

.ref-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.1s;
}

.ref-row:last-child { border-bottom: none; }
.ref-row:hover { background: #f9fafb; }
.ref-row__name { flex: 1; font-size: 0.875rem; color: #111827; }
.ref-row__actions { display: flex; gap: 2px; flex-shrink: 0; }

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px;
  text-align: center;
}

.empty-state--sm { padding: 24px; }

.empty-state__icon {
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1.5px solid rgba(0, 175, 219, 0.2);
  background: rgba(0, 175, 219, 0.05);
  color: #00afdb;
}

.empty-state__title { margin: 0 0 4px; font-size: 0.9rem; font-weight: 600; color: #111827; }
.empty-state__hint { color: #6b7280; font-size: 0.8125rem; line-height: 1.5; }

/* ── Dialog ── */
.dialog-card {
  width: 420px;
  max-width: 95vw;
  background: #ffffff;
  border: 1.5px solid rgba(0, 175, 219, 0.18);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 175, 219, 0.12);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.dialog-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.dialog-close:hover { background: #f3f4f6; color: #111827; }

.dialog-body {
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field { display: flex; flex-direction: column; gap: 6px; }

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
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

.form-error {
  padding: 9px 12px;
  border-left: 3px solid #c50f1f;
  border-radius: 0 6px 6px 0;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.8125rem;
  line-height: 1.4;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

/* ── Responsive ── */
@media (max-width: 760px) {
  .page { padding: 24px 16px; }
  .page-header { flex-direction: column; align-items: stretch; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>
