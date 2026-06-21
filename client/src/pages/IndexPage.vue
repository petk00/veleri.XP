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

        <!-- Vraćen alert -->
        <div
          v-if="returnedAlertItem"
          class="returned-alert"
          @click="$router.push(`/requests/${returnedAlertItem.id_purchase_request}`)"
        >
          <q-icon name="undo" size="15px" class="returned-alert__icon" />
          <span>
            <strong>{{ returnedAlertItem.request_number }}</strong>
            je vraćen na dopunu. Pregledajte komentar administratora.
          </span>
          <q-icon name="chevron_right" size="15px" class="returned-alert__chevron" />
        </div>

        <!-- Cards grid -->
        <section class="card-grid">

          <!-- CTA: Sa ponudom -->
          <button class="dash-card dash-card--offer" @click="$router.push('/requests/new')">
            <img src="/solarlinear_FINANCIRANJE.svg" alt="" class="card-deco card-deco--offer" />
            <div class="card-icon-wrap">
              <img src="/solarlinear_NABAVA.svg" alt="" class="card-icon" />
            </div>
            <span class="card-label">Novi zahtjev</span>
            <span class="card-sub">Sa ponudom dobavljača</span>
          </button>

          <!-- CTA: Bez ponude -->
          <button class="dash-card dash-card--no-offer" @click="$router.push('/requests/new')">
            <img src="/solarlinear_POSLOVNEGODINE.svg" alt="" class="card-deco card-deco--no-offer" />
            <div class="card-icon-wrap">
              <img src="/solarlinear_NOVIZAHTJEV.svg" alt="" class="card-icon" />
            </div>
            <span class="card-label">Trebam određene predmete</span>
            <span class="card-sub">Bez ponude dobavljača</span>
          </button>

          <!-- Status kartice: zadnji zahtjevi -->
          <button
            v-for="row in recentRows"
            :key="row.id_purchase_request"
            class="dash-card dash-card--status"
            :style="buildRequestStyle(row).card"
            @click="$router.push(`/requests/${row.id_purchase_request}`)"
          >
            <img src="/solarlinear_MOJIZAHTJEVI.svg" alt="" class="card-deco card-deco--status" />
            <span class="status-badge" :style="buildRequestStyle(row).badge">{{ row.status_name }}</span>
            <span class="status-number">{{ row.request_number }}</span>
            <span v-if="row.last_comment" class="status-comment">{{ row.last_comment }}</span>
            <span v-else class="status-comment status-comment--empty" />
            <span class="status-amount">{{ formatCurrency(row.total_amount) }}</span>
            <span class="status-date">{{ formatDate(row.created_at) }}</span>
            <q-icon name="chevron_right" size="16px" class="status-chevron" />
          </button>

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
  6: { background: '#ecfeff', badge: '#0e7490', badgeBg: '#cffafe', border: '#67e8f9' },
  7: { background: '#dcfce7', badge: '#166534', badgeBg: '#bbf7d0', border: '#4ade80' },
};

const DEFAULT_STYLE = { background: '#f9fafb', badge: '#374151', badgeBg: '#f3f4f6', border: '#d1d5db' };

function buildRequestStyle(row) {
  const s = STATUS_STYLES[row.fk_request_status] ?? DEFAULT_STYLE;
  return {
    card:  { borderLeftColor: s.border },
    badge: { color: s.badge, background: s.badgeBg },
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

onMounted(async () => {
  try {
    const currentYear = new Date().getFullYear();
    const { data } = await api.get('/requests', { params: { limit: 500, fiscalYear: currentYear } });
    allRequests.value = Array.isArray(data.data) ? data.data : [];
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
  color: #0067b8;
  font-size: 0.75rem;
  font-weight: 600;
}

.page-header__title {
  margin: 0;
  color: #111827;
  font-size: 2.25rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.1;
}

.page-header__name { color: #0067b8; }

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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* ── Base card ── */
.dash-card {
  all: unset;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  min-height: 190px;
  padding: 24px;
  box-sizing: border-box;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

/* ── CTA: Sa ponudom (indigo) ── */
.dash-card--offer {
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(145deg, #eef2ff 0%, #e0e7ff 100%);
  border: 1.5px solid #c7d2fe;
  border-left: 1.5px solid #c7d2fe;
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.10);
}

.dash-card--offer:hover {
  background: linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 100%);
  border-color: #818cf8;
  box-shadow: 0 10px 32px rgba(99, 102, 241, 0.22);
  transform: scale(1.02);
}

.dash-card--offer .card-label { color: #3730a3; }
.dash-card--offer .card-sub   { color: #6366f1; }
.dash-card--offer:hover .card-icon-wrap { opacity: 1; }

/* ── CTA: Bez ponude (emerald) ── */
.dash-card--no-offer {
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(145deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1.5px solid #a7f3d0;
  border-left: 1.5px solid #a7f3d0;
  box-shadow: 0 4px 24px rgba(16, 185, 129, 0.10);
}

.dash-card--no-offer:hover {
  background: linear-gradient(145deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #34d399;
  box-shadow: 0 10px 32px rgba(16, 185, 129, 0.22);
  transform: scale(1.02);
}

.dash-card--no-offer .card-label { color: #065f46; }
.dash-card--no-offer .card-sub   { color: #059669; }
.dash-card--no-offer:hover .card-icon-wrap { opacity: 1; }

/* ── Status kartica ── */
.dash-card--status {
  grid-column: span 2;
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
  transform: translateX(3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.09);
}

/* ── Zajednički elementi CTA kartica ── */
.card-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.card-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
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

/* ── Dekorativni SVG ── */
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

.card-deco--no-offer {
  bottom: -16px;
  right: -20px;
  width: 130px;
  height: 130px;
  opacity: 0.13;
  transform: rotate(18deg) scale(1.05);
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
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-number {
  font-size: 0.875rem;
  font-weight: 600;
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
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
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
