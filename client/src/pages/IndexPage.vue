<template>
  <q-page class="page">
    <div class="page-shell">

      <header class="page-header">
        <div class="page-header__main">
          <div class="page-header__eyebrow">{{ todayFormatted }}</div>
          <h1 class="page-header__title">
            Bok, <span class="page-header__name">{{ user?.first_name || 'korisniče' }}</span>
          </h1>
        </div>
      </header>

      <div v-if="loading" class="loading-block">
        <q-spinner color="primary" size="28px" />
      </div>

      <template v-else>

        <!-- Cards grid -->
        <section class="card-grid">

          <!-- Novi zahtjev: full-width CTA -->
          <button class="dash-card dash-card--offer" @click="$router.push('/novizahtjev')">
            <img src="/solarlinear_NOVIZAHTJEV.svg" alt="" class="offer-deco" />
            <div class="offer-header">
              <img src="/forward-2-svgrepo-com.svg" alt="" class="offer-title-icon" />
              <span class="card-label">Novi zahtjev</span>
            </div>
            <ol class="offer-steps">
              <li class="offer-step">
                <div class="offer-step__track">
                  <div class="offer-step__dot">
                    <img src="/solarlinear_NABAVA.svg" alt="" />
                  </div>
                  <div class="offer-step__line" />
                </div>
                <span class="offer-step__text">Recite što trebate i zašto</span>
              </li>
              <li class="offer-step">
                <div class="offer-step__track">
                  <div class="offer-step__dot">
                    <img src="/solarlinear_FINANCIRANJE.svg" alt="" />
                  </div>
                  <div class="offer-step__line" />
                </div>
                <span class="offer-step__text">Priložite ponudu ili navedite stavke</span>
              </li>
              <li class="offer-step">
                <div class="offer-step__track">
                  <div class="offer-step__dot">
                    <img src="/solarlinear_MOJIZAHTJEVI.svg" alt="" />
                  </div>
                </div>
                <span class="offer-step__text">Pošaljite i pratite status u stvarnom vremenu</span>
              </li>
            </ol>
          </button>

          <!-- Svi nalozi: info trake -->
          <div v-if="recentRows.length" class="requests-list">
            <button
              v-for="row in recentRows"
              :key="row.id_purchase_request"
              class="request-row"
              :style="{ borderLeftColor: buildRequestStyle(row).card.borderLeftColor }"
              @click="$router.push(`/zahtjevi/${row.id_purchase_request}`)"
            >
              <span class="lrb__number">{{ row.request_number }}</span>
              <span class="status-badge lrb__badge" :style="buildRequestStyle(row).badge">
                <q-icon :name="statusIcon(row)" size="11px" class="badge-icon" />
                {{ row.status_name }}
              </span>
              <span class="lrb__doc" :class="row.has_ponuda ? 'lrb__doc--on' : 'lrb__doc--off'">
                <q-icon :name="row.has_ponuda ? 'check_circle' : 'radio_button_unchecked'" size="12px" />
                Ponuda
              </span>
              <span class="lrb__doc" :class="row.has_otpremnica ? 'lrb__doc--on' : 'lrb__doc--off'">
                <q-icon :name="row.has_otpremnica ? 'check_circle' : 'radio_button_unchecked'" size="12px" />
                Otpremnica
              </span>
            </button>
          </div>

        </section>

      </template>

    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from 'boot/axios';
import { getStoredUser } from 'src/utils/authStorage';

const user = getStoredUser();

const loading = ref(true);
const allRequests = ref([]);

const todayFormatted = computed(() => {
  const f = new Date().toLocaleDateString('hr-HR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  return f.charAt(0).toUpperCase() + f.slice(1);
});

const returnedAlertItem = computed(() =>
  allRequests.value.find(r => r.fk_request_status === 3) || null
);

const recentRows = computed(() =>
  [...allRequests.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
);

const STATUS_STYLES = {
  1: { background: '#eff6ff', badge: '#1d4ed8', badgeBg: '#dbeafe', border: '#93c5fd' },
  2: { background: '#fffbeb', badge: '#b45309', badgeBg: '#fef3c7', border: '#fcd34d' },
  3: { background: '#fff7ed', badge: '#c2410c', badgeBg: '#ffedd5', border: '#fdba74' },
  4: { background: '#f0fdf4', badge: '#15803d', badgeBg: '#dcfce7', border: '#86efac' },
  5: { background: '#fef2f2', badge: '#b91c1c', badgeBg: '#fee2e2', border: '#fca5a5' },
  6: { background: '#faf5ff', badge: '#7c3aed', badgeBg: '#ede9fe', border: '#c4b5fd' },
  7: { background: '#dcfce7', badge: '#166534', badgeBg: '#bbf7d0', border: '#4ade80' },
};

const DEFAULT_STYLE = { background: '#f9fafb', badge: '#374151', badgeBg: '#f3f4f6', border: '#d1d5db' };

const STATUS_ICONS = {
  1: 'outbox',
  2: 'pending',
  3: 'undo',
  4: 'verified',
  5: 'close',
  6: 'local_shipping',
  7: 'task_alt',
};

const statusIcon = (row) => STATUS_ICONS[row.fk_request_status] ?? 'circle';

function buildRequestStyle(row) {
  const s = STATUS_STYLES[row.fk_request_status] ?? DEFAULT_STYLE;
  return {
    card:         { borderLeftColor: s.border },
    featuredCard: { borderColor: s.border, background: s.background },
    badge:        { color: s.badge, background: s.badgeBg },
  };
}

const formatCurrency = (value) => {
  if (value == null || value === 0) return '??? €';
  return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(value);
};

const truncate = (text, max) => {
  if (!text) return '—';
  return text.length > max ? text.slice(0, max) + '…' : text;
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('hr-HR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const featuredHistory = ref([]);
const featuredAttachments = ref([]);
const featuredCreatedAt = ref(null);

const featuredHasPonuda = computed(() => featuredAttachments.value.some(a => a.document_type === 'Ponuda'));
const featuredHasOtpremnica = computed(() => featuredAttachments.value.some(a => a.document_type === 'Otpremnica'));

const tlIcon = (entry) => {
  if (entry.comment?.startsWith('Dokument dodan')) return 'attach_file';
  if (entry.comment?.startsWith('Dokument obrisan')) return 'delete';
  if (entry.comment?.startsWith('Zahtjev izmijenjen')) return 'edit';
  if (entry.comment?.startsWith('Dodan procijenjeni iznos')) return 'payments';
  const map = { 1: 'outbox', 2: 'pending', 3: 'undo', 5: 'close', 6: 'local_shipping', 7: 'task_alt' };
  return map[entry.fk_request_status] ?? 'circle';
};

const tlTitle = (entry) => {
  if (entry.comment?.startsWith('Dokument dodan: Ponuda')) return 'Priložena ponuda';
  if (entry.comment?.startsWith('Dokument dodan: Otpremnica')) return 'Priložena otpremnica';
  if (entry.comment?.startsWith('Dokument dodan')) return 'Priložen dokument';
  if (entry.comment?.startsWith('Dokument obrisan')) return 'Uklonjen dokument';
  if (entry.comment?.startsWith('Zahtjev izmijenjen')) return 'Izmjena zahtjeva';
  if (entry.comment?.startsWith('Dodan procijenjeni iznos')) return 'Upisan iznos';
  const labels = {
    'Poslano': 'Zahtjev poslan',
    'Na odobrenju': 'Preuzeto na obradu',
    'Zahtjeva izmjene': 'Zahtjeva izmjene',
    'Naručeno': 'Odobreno i naručeno',
    'Zatvoreno': 'Zahtjev zatvoren',
  };
  return labels[entry.status_name] ?? entry.status_name;
};

onMounted(async () => {
  try {
    const currentYear = new Date().getFullYear();
    const { data } = await api.get('/requests', { params: { limit: 500, fiscalYear: currentYear, onlyMine: 1 } });
    allRequests.value = Array.isArray(data.data) ? data.data : [];

    const sorted = [...allRequests.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sorted[0]) {
      const id = sorted[0].id_purchase_request;
      const [{ data: detail }, { data: atts }] = await Promise.all([
        api.get(`/requests/${id}`),
        api.get(`/requests/${id}/attachments`),
      ]);
      featuredHistory.value = detail.history || [];
      featuredAttachments.value = Array.isArray(atts) ? atts : [];
      featuredCreatedAt.value = detail.created_at || sorted[0].created_at;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page {
  padding: 32px 40px;
  background: transparent;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.page-shell {
  max-width: 784px;
  margin: 0 auto;
}


/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.page-header__eyebrow {
  margin-bottom: 8px;
  color: #1b2d59;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.page-header__title {
  margin: 0;
  color: #111827;
  font-size: 2.25rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.1;
}

.page-header__name { color: #14bae4; }

/* ── Loading ── */
.loading-block {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

/* ── Vraćen alert ── */
.returned-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 11px 16px;
  border-left: 3px solid #c2410c;
  background: #fff7ed;
  color: #7c2d12;
  font-size: 0.8125rem;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.12s;
}

.returned-alert:hover { background: #ffedd5; }
.returned-alert__icon { flex-shrink: 0; color: #c2410c; }
.returned-alert__chevron { margin-left: auto; flex-shrink: 0; color: #c2410c; }


/* ── Card grid ── */
.card-grid {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}

/* ── Base card ── */
.dash-card {
  all: unset;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  min-height: 130px;
  padding: 20px 24px;
  box-sizing: border-box;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

/* ── CTA: Novi zahtjev (navy/cyan) ── */

.dash-card--offer {
  align-items: flex-start;
  justify-content: flex-start;
  gap: 6px;
  height: 288px;
  background: linear-gradient(145deg, #e8f6fd 0%, #cceef9 100%);
  border: 1.5px solid #00afdb;
  border-left: 1.5px solid #00afdb;
  box-shadow: 0 4px 24px rgba(0, 175, 219, 0.12);
}

.dash-card--offer:hover {
  background: linear-gradient(145deg, #d0edf9 0%, #b3e4f5 100%);
  border-color: #14bae4;
  box-shadow: 0 10px 32px rgba(0, 175, 219, 0.25);
  transform: scale(1.02);
}

.offer-header {
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  z-index: 1;
}

.offer-title-icon {
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  pointer-events: none;
  margin-left: 0;
}

.offer-deco {
  position: absolute;
  bottom: -94px;
  right: -45px;
  width: 380px;
  height: 380px;
  opacity: 0.08;
  transform: rotate(-18deg);
  pointer-events: none;
  z-index: 0;
}

.offer-steps {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  z-index: 1;
}

.offer-step {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

/* Track = stupac s krugom i linijom */
.offer-step__track {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.offer-step__dot {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  border: 1.5px solid rgba(0, 175, 219, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0, 175, 219, 0.1);
}

.offer-step__dot img {
  width: 24px;
  height: 24px;
  opacity: 0.75;
}

.offer-step__line {
  width: 2px;
  flex: 1;
  min-height: 20px;
  background: rgba(0, 175, 219, 0.2);
  margin: 3px 0;
}

.offer-step__text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1b2d59;
  line-height: 1.35;
  padding-top: 8px;
}

.offer-step__text em {
  font-style: normal;
  opacity: 0.55;
  font-size: 0.8125rem;
}

.dash-card--offer .card-label {
  color: #1b2d59;
  font-size: 2.25rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  position: relative;
  z-index: 1;
}

.dash-card--offer .card-sub {
  color: #00afdb;
  font-size: 0.8125rem;
  font-weight: 400;
  opacity: 1;
  letter-spacing: 0.01em;
  margin-top: 4px;
  position: relative;
  z-index: 1;
}


.card-label {
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: color 0.2s ease;
}

.card-sub {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.8;
  letter-spacing: 0.01em;
}


/* ── Requests list ── */
.requests-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.request-row {
  all: unset;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  background: #ffffff;
  border: 1.5px solid rgba(0, 175, 219, 0.18);
  border-left: 4px solid transparent;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 175, 219, 0.06);
  box-sizing: border-box;
  width: 100%;
  cursor: pointer;
  transition: background 0.12s;
}

.request-row:hover { background: #f0fbfe; }
.request-row:hover .lrb__chevron { color: #00afdb; transform: translateX(2px); }

/* ── Row sadržaj ── */
.lrb__number {
  font-size: 0.875rem;
  font-weight: 700;
  color: #00afdb;
  flex-shrink: 0;
}

.lrb__badge {
  justify-self: center;
}


.lrb__doc {
  justify-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 148px;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.lrb__doc--on {
  background: #dcfce7;
  color: #15803d;
}

.lrb__doc--off {
  background: #f3f4f6;
  color: #d1d5db;
}



/* ── Status badge ── */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 148px;
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.badge-icon {
  margin-right: 4px;
  opacity: 0.85;
  vertical-align: middle;
}

@media (max-width: 760px) {
  .page { padding: 20px 16px; }
  .page-header__title { font-size: 1.75rem; }
  .status-badge { min-width: unset; }
}
</style>
