<template>
  <q-page class="page">
    <div class="page-shell">

      <!-- ─────────────────────────────────
           Page header
           ───────────────────────────────── -->
      <header class="page-header">
        <div class="page-header__main">
          <div class="page-header__eyebrow">{{ todayFormatted }}</div>
          <h1 class="page-header__title">
            Dobrodošli, <span class="page-header__name">{{ user?.first_name || 'korisniče' }}</span>
          </h1>
          <p class="page-header__subtitle">
            {{ isAdmin
              ? 'Pregled svih zahtjeva u sustavu i akcija koje čekaju vašu odluku.'
              : 'Pregled vaših zahtjeva za nabavu i statusa obrade.'
            }}
          </p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" @click="$router.push('/requests/new')">
            <q-icon name="add" size="16px" />
            <span>Novi zahtjev</span>
          </button>
        </div>
      </header>

      <!-- ─────────────────────────────────
           Statistics
           ───────────────────────────────── -->
      <section class="stats">
        <div
          v-for="stat in stats"
          :key="stat.key"
          class="stat"
          :class="`stat--${stat.color}`"
        >
          <div class="stat__icon">
            <q-icon :name="stat.icon" size="18px" />
          </div>
          <div class="stat__body">
            <div class="stat__value">
              <span v-if="loadingStats" class="stat__skeleton" />
              <span v-else>{{ stat.value }}</span>
            </div>
            <div class="stat__label">{{ stat.label }}</div>
          </div>
        </div>
      </section>

      <!-- ─────────────────────────────────
           Quick actions
           ───────────────────────────────── -->
      <section class="actions-section">
        <h2 class="section-title">Brze akcije</h2>

        <div class="actions">
          <!-- New request -->
          <button class="action" @click="$router.push('/requests/new')">
            <div class="action__icon action__icon--primary">
              <q-icon name="add_shopping_cart" size="20px" />
            </div>
            <div class="action__body">
              <div class="action__title">Novi zahtjev</div>
              <div class="action__desc">Pokrenite novi zahtjev za nabavu kroz wizard.</div>
            </div>
            <q-icon name="chevron_right" size="18px" class="action__chevron" />
          </button>

          <!-- All requests -->
          <button class="action" @click="$router.push('/requests')">
            <div class="action__icon">
              <q-icon name="list_alt" size="20px" />
            </div>
            <div class="action__body">
              <div class="action__title">Svi zahtjevi</div>
              <div class="action__desc">Pregled postojećih zahtjeva i njihovih statusa.</div>
            </div>
            <q-icon name="chevron_right" size="18px" class="action__chevron" />
          </button>

          <!-- Admin: pending review -->
          <button
            v-if="pendingCount > 0 && isAdmin"
            class="action action--alert"
            @click="$router.push('/requests')"
          >
            <div class="action__icon action__icon--alert">
              <q-icon name="pending_actions" size="20px" />
            </div>
            <div class="action__body">
              <div class="action__title">
                Čeka pregled
                <span class="action__count">{{ pendingCount }}</span>
              </div>
              <div class="action__desc">Zahtjevi su poslani i čekaju vašu obradu.</div>
            </div>
            <q-icon name="chevron_right" size="18px" class="action__chevron" />
          </button>

          <!-- Employee: returned for revision -->
          <button
            v-if="returnedCount > 0 && !isAdmin"
            class="action action--alert"
            @click="$router.push('/requests')"
          >
            <div class="action__icon action__icon--alert">
              <q-icon name="undo" size="20px" />
            </div>
            <div class="action__body">
              <div class="action__title">
                Vraćeno na dopunu
                <span class="action__count">{{ returnedCount }}</span>
              </div>
              <div class="action__desc">Vaši zahtjevi koji čekaju ispravku i ponovno slanje.</div>
            </div>
            <q-icon name="chevron_right" size="18px" class="action__chevron" />
          </button>

          <!-- Admin: in progress (Na odobrenju) -->
          <button
            v-if="inReviewCount > 0 && isAdmin"
            class="action"
            @click="$router.push('/requests')"
          >
            <div class="action__icon">
              <q-icon name="rate_review" size="20px" />
            </div>
            <div class="action__body">
              <div class="action__title">
                U obradi
                <span class="action__count">{{ inReviewCount }}</span>
              </div>
              <div class="action__desc">Zahtjevi koje ste preuzeli i čekaju vašu odluku.</div>
            </div>
            <q-icon name="chevron_right" size="18px" class="action__chevron" />
          </button>
        </div>
      </section>

    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from 'boot/axios';
import { getStoredUser } from 'src/utils/authStorage';

const user = getStoredUser();
const isAdmin = user?.role_name === 'Administrator';

const loadingStats = ref(true);
const allRequests = ref([]);

const todayFormatted = computed(() => {
  const formatted = new Date().toLocaleDateString('hr-HR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  // Capitalize first letter
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
});

/* ─────── Helper counters by status ─────── */

const countByStatus = (...names) =>
  allRequests.value.filter(r => names.includes(r.status_name)).length;

const pendingCount = computed(() => countByStatus('Poslano'));
const inReviewCount = computed(() => countByStatus('Na odobrenju'));
const returnedCount = computed(() => countByStatus('Vraćeno na dopunu / izmjenu'));

/* ─────── Stat cards ─────── */

const stats = computed(() => {
  if (isAdmin) {
    return [
      {
        key: 'total',
        label: 'Ukupno zahtjeva',
        value: allRequests.value.length,
        icon: 'inbox',
        color: 'navy',
      },
      {
        key: 'pending',
        label: 'Čeka pregled',
        value: pendingCount.value,
        icon: 'schedule',
        color: 'amber',
      },
      {
        key: 'ordered',
        label: 'Naručeno',
        value: countByStatus('Naručeno'),
        icon: 'check_circle',
        color: 'cyan',
      },
      {
        key: 'closed',
        label: 'Završeno',
        value: countByStatus('Zatvoreno'),
        icon: 'task_alt',
        color: 'green',
      },
    ];
  }

  return [
    {
      key: 'total',
      label: 'Moji zahtjevi',
      value: allRequests.value.length,
      icon: 'inbox',
      color: 'navy',
    },
    {
      key: 'in-progress',
      label: 'U obradi',
      // Naručeno = odobren ali još nije završen, i dalje "u procesu" za podnositelja
      value: countByStatus('Poslano', 'Na odobrenju', 'Naručeno'),
      icon: 'schedule',
      color: 'amber',
    },
    {
      key: 'returned',
      label: 'Vraćeno na dopunu',
      value: returnedCount.value,
      icon: 'undo',
      color: 'orange',
    },
    {
      key: 'closed',
      label: 'Završeno',
      value: countByStatus('Zatvoreno'),
      icon: 'task_alt',
      color: 'green',
    },
  ];
});

const fetchStats = async () => {
  try {
    const { data } = await api.get('/requests');
    allRequests.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
    allRequests.value = [];
  } finally {
    loadingStats.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>

<style scoped>
/* ─────────────────────────────────
   Page
   ───────────────────────────────── */
.page {
  background: #F5F5F5;
  min-height: 100vh;
  padding: 24px 24px 64px;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: #201F1E;
}

.page-shell {
  max-width: 1200px;
  margin: 0 auto;
}

/* ─────────────────────────────────
   Page header
   ───────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.page-header__main { flex: 1; min-width: 240px; }

.page-header__eyebrow {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #00AFDB;
  margin-bottom: 4px;
}

.page-header__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #201F1E;
  letter-spacing: -0.015em;
  line-height: 1.2;
  margin: 0;
}

.page-header__name { color: #16294E; font-weight: 600; }

.page-header__subtitle {
  font-size: 0.8125rem;
  color: #605E5C;
  margin: 6px 0 0;
  line-height: 1.5;
  max-width: 580px;
}

.page-header__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* ─────────────────────────────────
   Buttons
   ───────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  color: #201F1E;
  background: white;
}

.btn--primary {
  background: #16294E;
  color: white;
  border-color: #16294E;
}
.btn--primary:hover { background: #0F1F3D; border-color: #0F1F3D; }

/* ─────────────────────────────────
   Stats grid
   ───────────────────────────────── */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.stat {
  background: white;
  border: 1px solid #E1DFDD;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.stat:hover {
  border-color: #C8C6C4;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.stat__icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Icon color variants */
.stat--navy   .stat__icon { background: #E8EBF1; color: #16294E; }
.stat--cyan   .stat__icon { background: #E1F5FA; color: #00708A; }
.stat--amber  .stat__icon { background: #FFF4CE; color: #B7791F; }
.stat--orange .stat__icon { background: #FFF4ED; color: #C2410C; }
.stat--green  .stat__icon { background: #DFF6DD; color: #107C10; }
.stat--grey   .stat__icon { background: #F8F8F8; color: #605E5C; }

.stat__body { flex: 1; min-width: 0; }

.stat__value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #201F1E;
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  margin-bottom: 2px;
}

.stat__label {
  font-size: 0.75rem;
  color: #605E5C;
  font-weight: 500;
  letter-spacing: 0.005em;
}

.stat__skeleton {
  display: inline-block;
  width: 32px;
  height: 24px;
  background: linear-gradient(90deg, #EDEBE9 25%, #F8F8F8 50%, #EDEBE9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  border-radius: 3px;
  vertical-align: middle;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─────────────────────────────────
   Section title
   ───────────────────────────────── */
.section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8A8886;
  margin: 0 0 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E1DFDD;
}

/* ─────────────────────────────────
   Actions grid
   ───────────────────────────────── */
.actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.action {
  all: unset;
  background: white;
  border: 1px solid #E1DFDD;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
}

.action:hover {
  border-color: #16294E;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.action:hover .action__chevron {
  color: #16294E;
  transform: translateX(2px);
}

.action--alert {
  border-color: #F2D17C;
  background: #FFFCF5;
}
.action--alert:hover {
  border-color: #B7791F;
}

.action__icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #F8F8F8;
  color: #605E5C;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action__icon--primary {
  background: #E8EBF1;
  color: #16294E;
}

.action__icon--alert {
  background: #FFF4CE;
  color: #B7791F;
}

.action__body { flex: 1; min-width: 0; }

.action__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #201F1E;
  letter-spacing: -0.005em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 9px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: white;
  background: #B7791F;
  font-variant-numeric: tabular-nums;
}

.action--alert .action__count { background: #B7791F; }
.action:not(.action--alert) .action__count { background: #16294E; }

.action__desc {
  font-size: 0.75rem;
  color: #605E5C;
  margin-top: 3px;
  line-height: 1.5;
}

.action__chevron {
  color: #A19F9D;
  flex-shrink: 0;
  margin-top: 8px;
  transition: all 0.15s;
}

/* ─────────────────────────────────
   Responsive
   ───────────────────────────────── */
@media (max-width: 900px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .page { padding: 16px 12px 48px; }
  .page-header__title { font-size: 1.25rem; }
  .stats { gap: 8px; }
  .stat { padding: 12px; }
  .stat__value { font-size: 1.25rem; }
  .actions { grid-template-columns: 1fr; }
  .page-header__actions .btn { width: 100%; }
}
</style>
