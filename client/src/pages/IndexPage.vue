<template>
  <q-page class="dashboard-page">
    <div class="page-shell">

      <!-- HERO -->
      <section class="hero">
        <div class="hero__left">
          <div class="hero__eyebrow">
            <span class="hero__eyebrow-dot"></span>
            {{ todayFormatted }}
          </div>
          <h1 class="hero__title">
            Dobrodošao,<br>
            <span class="hero__name">{{ user?.first_name || 'korisnik' }}</span>
          </h1>
          <p class="hero__subtitle">
            {{ isAdmin ? 'Imate pregled nad svim zahtjevima sustava.' : 'Pratite status vaših zahtjeva za nabavu.' }}
          </p>
        </div>

        <q-btn
          unelevated no-caps
          class="hero__cta"
          icon="add"
          label="Novi zahtjev"
          @click="$router.push('/requests/new')"
        />
      </section>

      <!-- STATISTIKE -->
      <section class="stats">
        <div
          v-for="stat in stats"
          :key="stat.key"
          class="stat-card"
          :class="`stat-card--${stat.color}`"
        >
          <div class="stat-card__icon">
            <q-icon :name="stat.icon" size="22px" />
          </div>
          <div class="stat-card__body">
            <div class="stat-card__value">
              <span v-if="loadingStats" class="stat-card__skeleton"></span>
              <span v-else>{{ stat.value }}</span>
            </div>
            <div class="stat-card__label">{{ stat.label }}</div>
          </div>
        </div>
      </section>

      <!-- AKCIJE -->
      <section class="actions">
        <div class="action-card action-card--primary" @click="$router.push('/requests/new')">
          <div class="action-card__header">
            <div class="action-card__icon">
              <q-icon name="add_shopping_cart" size="24px" />
            </div>
            <q-icon name="arrow_forward" size="18px" class="action-card__arrow" />
          </div>
          <div class="action-card__title">Novi zahtjev</div>
          <div class="action-card__desc">Pokrenite novi zahtjev za nabavu kroz jednostavan wizard.</div>
        </div>

        <div class="action-card" @click="$router.push('/requests')">
          <div class="action-card__header">
            <div class="action-card__icon action-card__icon--light">
              <q-icon name="list_alt" size="24px" />
            </div>
            <q-icon name="arrow_forward" size="18px" class="action-card__arrow" />
          </div>
          <div class="action-card__title">Svi zahtjevi</div>
          <div class="action-card__desc">Pregledajte postojeće zahtjeve i pratite njihov status.</div>
        </div>

        <div v-if="pendingCount > 0 && isAdmin" class="action-card action-card--alert" @click="$router.push('/requests')">
          <div class="action-card__header">
            <div class="action-card__icon action-card__icon--alert">
              <q-icon name="pending_actions" size="24px" />
            </div>
            <q-badge class="action-card__badge">{{ pendingCount }}</q-badge>
          </div>
          <div class="action-card__title">Čeka odobrenje</div>
          <div class="action-card__desc">Zahtjevi koji su poslani i čekaju vaš pregled.</div>
        </div>

        <div v-if="returnedCount > 0 && !isAdmin" class="action-card action-card--alert" @click="$router.push('/requests')">
          <div class="action-card__header">
            <div class="action-card__icon action-card__icon--alert">
              <q-icon name="assignment_return" size="24px" />
            </div>
            <q-badge class="action-card__badge">{{ returnedCount }}</q-badge>
          </div>
          <div class="action-card__title">Vraćeno na dopunu</div>
          <div class="action-card__desc">Vaši zahtjevi koji čekaju ispravku i ponovni slanje.</div>
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
  return new Date().toLocaleDateString('hr-HR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

const pendingCount = computed(() =>
  allRequests.value.filter(r => r.status_name === 'Poslano').length
);

const returnedCount = computed(() =>
  allRequests.value.filter(r => r.status_name === 'Vraćeno na dopunu / izmjenu').length
);

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
        value: allRequests.value.filter(r => r.status_name === 'Poslano').length,
        icon: 'schedule',
        color: 'amber',
      },
      {
        key: 'approved',
        label: 'Odobreno',
        value: allRequests.value.filter(r => r.status_name === 'Odobreno').length,
        icon: 'check_circle',
        color: 'green',
      },
      {
        key: 'closed',
        label: 'Zatvoreno',
        value: allRequests.value.filter(r => r.status_name === 'Zatvoreno').length,
        icon: 'task_alt',
        color: 'grey',
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
      key: 'pending',
      label: 'Na obradi',
      value: allRequests.value.filter(r =>
        ['Poslano', 'Na odobrenju'].includes(r.status_name)
      ).length,
      icon: 'schedule',
      color: 'amber',
    },
    {
      key: 'approved',
      label: 'Odobreno',
      value: allRequests.value.filter(r => r.status_name === 'Odobreno').length,
      icon: 'check_circle',
      color: 'green',
    },
    {
      key: 'returned',
      label: 'Vraćeno na dopunu',
      value: returnedCount.value,
      icon: 'undo',
      color: 'red',
    },
  ];
});

const fetchStats = async () => {
  try {
    const { data } = await api.get('/requests');
    allRequests.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loadingStats.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>

<style scoped>
.dashboard-page {
  --navy:       #16294e;
  --navy-dark:  #0a1628;
  --navy-light: #2a4f96;
  --accent:     #4a7fd4;
  --surface:    #f0f4fa;
  --border:     rgba(22, 41, 78, 0.08);
  --text:       #0a1628;
  --muted:      #5a6a85;

  background: var(--surface);
  min-height: 100vh;
  padding: 40px 24px 80px;
}

.page-shell {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* ── Hero ────────────────────────────────────────────── */
.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--border);
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-bottom: 16px;
}

.hero__eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.hero__title {
  font-size: 2.8rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.035em;
  line-height: 1.1;
  margin: 0 0 12px;
}

.hero__name {
  color: var(--navy);
}

.hero__subtitle {
  font-size: 0.95rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.5;
  max-width: 420px;
}

.hero__cta {
  background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%) !important;
  color: white !important;
  border-radius: 12px !important;
  padding: 12px 24px !important;
  font-weight: 700 !important;
  font-size: 0.9rem !important;
  box-shadow: 0 8px 24px rgba(22, 41, 78, 0.28) !important;
  white-space: nowrap;
  transition: all 0.2s !important;
}

.hero__cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 32px rgba(22, 41, 78, 0.36) !important;
}

/* ── Stats ───────────────────────────────────────────── */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(22, 41, 78, 0.08);
}

.stat-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card--navy .stat-card__icon  { background: rgba(22, 41, 78, 0.08); color: var(--navy); }
.stat-card--amber .stat-card__icon { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.stat-card--green .stat-card__icon { background: rgba(16, 185, 129, 0.1); color: #059669; }
.stat-card--grey  .stat-card__icon { background: rgba(100, 116, 139, 0.1); color: #475569; }
.stat-card--red   .stat-card__icon { background: rgba(239, 68, 68, 0.1); color: #dc2626; }

.stat-card__value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-card__label {
  font-size: 0.8rem;
  color: var(--muted);
  font-weight: 500;
}

.stat-card__skeleton {
  display: inline-block;
  width: 40px;
  height: 32px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  border-radius: 6px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Actions ─────────────────────────────────────────── */
.actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.action-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 28px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(22, 41, 78, 0.1);
  border-color: rgba(22, 41, 78, 0.16);
}

.action-card--primary {
  background: linear-gradient(135deg, var(--navy-dark) 0%, var(--navy) 60%, var(--navy-light) 100%);
  border-color: transparent;
}

.action-card--primary .action-card__title { color: white; }
.action-card--primary .action-card__desc  { color: rgba(255,255,255,0.6); }
.action-card--primary .action-card__arrow { color: rgba(255,255,255,0.6); }

.action-card--alert {
  border-color: rgba(245, 158, 11, 0.2);
  background: linear-gradient(135deg, #fffbeb 0%, #fff 100%);
}

.action-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.action-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255,255,255,0.15);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-card__icon--light {
  background: rgba(22, 41, 78, 0.07);
  color: var(--navy);
}

.action-card__icon--alert {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
}

.action-card__arrow {
  color: var(--muted);
  transition: transform 0.2s;
}

.action-card:hover .action-card__arrow {
  transform: translateX(4px);
}

.action-card__badge {
  background: #f59e0b !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 0.85rem !important;
  padding: 4px 10px !important;
  border-radius: 999px !important;
}

.action-card__title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
  margin-bottom: 6px;
}

.action-card__desc {
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.5;
}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .dashboard-page { padding: 24px 16px 60px; }
  .hero__title { font-size: 2rem; }
  .stats { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .stat-card { padding: 16px; }
  .stat-card__value { font-size: 1.6rem; }
}
</style>
