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

          <!-- Gornji red: kvadratne kartice -->
          <div class="square-row">
            <button class="dash-card dash-card--offer" @click="$router.push('/zahtjevi/novi')">
              <!-- Dekorativni SVG pozadina (dolje desno, iza svega) -->
              <img src="/solarlinear_NOVIZAHTJEV.svg" alt="" class="offer-deco" />

              <img src="/forward-2-svgrepo-com.svg" alt="" class="offer-title-icon" />
              <span class="card-label">Novi zahtjev</span>
              <!-- Koraci s vertikalnom linijom -->
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

            <button
              v-if="recentRows[0]"
              class="dash-card dash-card--featured"
              :style="buildRequestStyle(recentRows[0]).featuredCard"
              @click="$router.push(`/zahtjevi/${recentRows[0].id_purchase_request}`)"
            >
              <!-- Dekorativni SVG -->
              <img
                :src="recentRows[0].fk_request_status === 7 ? '/bag-check-svgrepo-com.svg'
                    : recentRows[0].fk_request_status === 1 ? '/rocket-2-svgrepo-com.svg'
                    : recentRows[0].fk_request_status === 6 ? '/bus-svgrepo-com.svg'
                    : '/solarlinear_MOJIZAHTJEVI.svg'"
                alt=""
                class="featured-deco"
              />

              <!-- Header -->
              <div class="featured-header">
                <span class="status-badge featured-badge" :style="buildRequestStyle(recentRows[0]).badge">
                  <q-icon :name="statusIcon(recentRows[0])" size="12px" class="badge-icon" />
                  {{ recentRows[0].status_name }}
                </span>
                <div class="featured-header__row">
                  <span class="featured-amount">{{ formatCurrency(recentRows[0].total_amount) }}</span>
                </div>
              </div>

              <!-- Timeline -->
              <ol v-if="featuredHistory.length" class="featured-timeline">
                <template v-for="(entry, i) in featuredHistory" :key="entry.id_request_status_history">
                  <li class="ftl-item">
                    <div class="ftl-dot">
                      <q-icon :name="tlIcon(entry)" size="11px" />
                    </div>
                    <div class="ftl-body">
                      <span class="ftl-title">{{ tlTitle(entry) }}</span>
                      <span v-if="entry.comment && !entry.comment.startsWith('Dokument') && !entry.comment.startsWith('Zahtjev') && !entry.comment.startsWith('Dodan')" class="ftl-comment">{{ entry.comment }}</span>
                    </div>
                  </li>
                  <li v-if="i < featuredHistory.length - 1" class="ftl-arrow" aria-hidden="true">↓</li>
                </template>
              </ol>

              <!-- Footer -->
              <div class="featured-footer">
                <div class="featured-footer__meta">
                  <span class="fmeta-item fmeta-item--id">
                    <q-icon name="tag" size="12px" />
                    {{ recentRows[0].request_number }}
                  </span>
                  <span class="fmeta-sep">·</span>
                  <span class="fmeta-item">
                    <q-icon name="calendar_today" size="12px" />
                    {{ formatDate(featuredCreatedAt) }}
                  </span>
                  <span class="fmeta-sep">·</span>
                  <span class="fmeta-item" :class="featuredHasPonuda ? 'fmeta--ok' : 'fmeta--missing'">
                    <q-icon :name="featuredHasPonuda ? 'check_circle' : 'radio_button_unchecked'" size="13px" />
                    Ponuda
                  </span>
                  <span class="fmeta-sep">·</span>
                  <span class="fmeta-item" :class="featuredHasOtpremnica ? 'fmeta--ok' : 'fmeta--missing'">
                    <q-icon :name="featuredHasOtpremnica ? 'check_circle' : 'radio_button_unchecked'" size="13px" />
                    Otpremnica
                  </span>
                </div>
              </div>
            </button>
          </div>

          <!-- Ostali nalozi -->
          <div v-if="recentRows.slice(1).length" class="requests-box">
            <button
              v-for="row in recentRows.slice(1)"
              :key="row.id_purchase_request"
              class="dash-card dash-card--status"
              :style="buildRequestStyle(row).card"
              @click="$router.push(`/zahtjevi/${row.id_purchase_request}`)"
            >
              <span class="status-badge" :style="buildRequestStyle(row).badge">
                <q-icon :name="statusIcon(row)" size="12px" class="badge-icon" />
                {{ row.status_name }}
              </span>
              <span class="status-number">{{ row.request_number }}</span>
              <span v-if="row.last_comment" class="status-comment">{{ row.last_comment }}</span>
              <span v-else class="status-comment status-comment--empty" />
              <span class="status-amount">{{ formatCurrency(row.total_amount) }}</span>
              <q-icon name="chevron_right" size="16px" class="status-chevron" />
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
  if (value == null) return '—';
  return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(value);
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
    'Vraćeno': 'Vraćeno na dopunu',
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
  padding: 38px 40px 32px;
  background: transparent;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.page-shell {
  max-width: 1400px;
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
  align-items: center;
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

/* ── Square row ── */
.square-row {
  display: flex;
  gap: 16px;
}


.square-row .dash-card {
  width: 480px;
  height: 480px;
  min-height: unset;
  flex-shrink: 0;
}

/* ── CTA: Novi zahtjev (navy/cyan) ── */

.dash-card--offer {
  align-items: flex-start;
  justify-content: flex-start;
  gap: 6px;
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

.offer-title-icon {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 60px;
  height: 60px;
  z-index: 1;
  pointer-events: none;
}

.offer-deco {
  position: absolute;
  bottom: -94px;
  right: -65px;
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
  font-size: 2.375rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  position: relative;
  z-index: 1;
  width: 100%;
  text-align: center;
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


/* ── Featured (zadnji nalog) ── */
.dash-card--featured {
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 12px;
  border: 1.5px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  position: relative;
}

.dash-card--featured:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.10);
  transform: translateY(-1px);
}

.dash-card--featured .status-badge {
  width: 100%;
  padding: 10px 16px;
  font-size: 0.875rem;
  letter-spacing: 0.08em;
  border-radius: 12px;
}

.featured-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.featured-amount {
  font-size: 1.625rem;
  font-weight: 700;
  color: #111827;
}

.featured-deco {
  position: absolute;
  top: 50%;
  right: 20px;
  width: 270px;
  height: 270px;
  top: 56%;
  opacity: 0.07;
  transform: translateY(-50%) rotate(-18deg);
  pointer-events: none;
}

.featured-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.featured-header__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.featured-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  min-width: 0;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.featured-timeline::-webkit-scrollbar {
  display: none;
}

.ftl-item {
  display: flex;
  gap: 10px;
  padding: 8px 0;
}

.ftl-arrow {
  display: flex;
  justify-content: flex-start;
  padding: 0 0 0 8px;
  color: #d1d5db;
  font-size: 0.75rem;
  line-height: 1;
}

.ftl-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #6b7280;
  margin-top: 1px;
}

.ftl-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ftl-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111827;
}

.ftl-comment {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.featured-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(0,0,0,0.07);
  position: relative;
  z-index: 1;
  margin-top: auto;
}

.featured-footer__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fmeta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #9ca3af;
}

.fmeta-sep { color: #d1d5db; font-size: 0.75rem; }
.fmeta--ok { color: #16a34a; }
.fmeta--missing { color: #9ca3af; }

.featured-chevron {
  position: absolute;
  bottom: 20px;
  right: 20px;
  color: #d1d5db;
  transition: color 0.12s, transform 0.12s;
}

.dash-card--featured:hover .featured-chevron {
  color: #9ca3af;
  transform: translateX(2px);
}

/* ── Requests box ── */
.requests-box {
  width: 976px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
}

.requests-box .dash-card--status {
  width: 100%;
  border-radius: 0;
  box-shadow: none;
  border-bottom: 1px solid #f3f4f6;
}

.requests-box .dash-card--status:last-child {
  border-bottom: none;
}


/* ── Status kartica ── */
.dash-card--status {
  flex-direction: row;
  align-items: center;
  gap: 16px;
  min-height: 80px;
  padding: 16px 20px;
  border-radius: 12px;
  border-left-width: 4px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
}

.dash-card--status:hover {
  background: #f9fafb;
}

.dash-card--status:hover .status-chevron {
  transform: translateX(2px);
}

/* ── Dekorativni SVG (status kartice) ── */
.card-deco {
  position: absolute;
  pointer-events: none;
  user-select: none;
}

.card-deco--offer {
  bottom: -22px;
  right: -22px;
  width: 140px;
  height: 140px;
  opacity: 0.13;
  transform: rotate(-25deg) scale(1.1);
}

.card-deco--status {
  right: 60px;
  top: 50%;
  transform: translateY(-50%) rotate(15deg);
  width: 56px;
  height: 56px;
  opacity: 0.07;
}

/* ── Status kartica sadržaj ── */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 148px;
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-icon {
  margin-right: 4px;
  opacity: 0.85;
  vertical-align: middle;
}

.status-number {
  font-size: 0.875rem;
  font-weight: 600;
  margin-left: 44px;
  color: #111827;
  letter-spacing: -0.01em;
  flex-shrink: 0;
  min-width: 160px;
}

.status-comment {
  flex: 1;
  font-size: 0.8125rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 12px;
}

.status-comment--empty {
  flex: 1;
}

.status-amount {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.status-date {
  font-size: 0.8125rem;
  color: #6b7280;
  flex-shrink: 0;
  min-width: 90px;
  text-align: right;
}

.status-chevron {
  color: #d1d5db;
  flex-shrink: 0;
  transition: color 0.12s, transform 0.12s;
}

.dash-card--status:hover .status-chevron {
  color: #6b7280;
  transform: translateX(2px);
}

@media (max-width: 760px) {
  .page { padding: 24px 16px; }
  .card-grid { grid-template-columns: 1fr; }
  .dash-card--status { grid-column: span 1; }
  .page-header__title { font-size: 1.75rem; }
}
</style>
