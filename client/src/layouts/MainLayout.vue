<template>
  <q-layout view="hHh lpR fFf" class="app-layout">

    <q-header class="app-header">
      <div class="topbar">

        <!-- Brand -->
        <button class="brand" @click="navigate('/')">
          <img src="/veleri_logo_solo.svg" alt="Veleučilište u Rijeci" class="brand__logo" />
          <span class="brand__name">
            <span style="color: #1b2d59">nabava</span><span style="color: #14bae4">.XP</span>
          </span>
        </button>

        <div class="topbar-divider" />

        <!-- Navigation -->
        <nav class="topbar-nav">

          <button
            class="nav-item"
            :class="{ 'nav-item--active': isActive('/novizahtjev') }"
            @click="navigate('/novizahtjev')"
          >
            <img src="/solarlinear_NOVIZAHTJEV.svg" width="20" height="20" class="nav-item__icon" />
            <span>Novi zahtjev</span>
          </button>
          <button
            class="nav-item"
            :class="{ 'nav-item--active': isActive('/zahtjevi') }"
            @click="navigate('/zahtjevi')"
          >
            <img src="/solarlinear_MOJIZAHTJEVI.svg" width="20" height="20" class="nav-item__icon" />
            <span>Zahtjevi</span>
          </button>
          <template v-if="isAdmin">
            <button
              class="nav-item"
              :class="{ 'nav-item--active': isActive('/financije') }"
              @click="navigate('/financije')"
            >
              <img src="/solarlinear_FINANCIRANJE.svg" width="20" height="20" class="nav-item__icon" />
              <span>Financije</span>
            </button>
          </template>

          <template v-if="isAdmin">
            <div class="nav-sep" />
            <button
              class="nav-item"
              :class="{ 'nav-item--active': isActive('/korisnici') }"
              @click="navigate('/korisnici')"
            >
              <img src="/solarlinear_KORISNICI.svg" width="20" height="20" class="nav-item__icon" />
              <span>Korisnici</span>
            </button>
          </template>

        </nav>

        <div class="topbar-spacer" />

        <!-- User avatar -->
        <button v-if="user" class="avatar-btn">
          <div class="avatar" :style="{ background: avatarColor }">{{ initials }}</div>
          <q-menu
            anchor="bottom right"
            self="top right"
            :offset="[0, 8]"
            class="user-menu"
            style="background: transparent"
            transition-show="jump-down"
            transition-hide="jump-up"
          >
            <div class="user-menu__header">
              <div class="avatar avatar--lg" :style="{ background: avatarColor }">{{ initials }}</div>
              <div>
                <div class="user-menu__name">{{ fullName }}</div>
                <div class="user-menu__email">{{ user.email || user.role_name }}</div>
              </div>
            </div>
            <q-list class="user-menu__list">
              <q-item clickable v-close-popup @click="logout" class="user-menu__item">
                <q-item-section avatar>
                  <q-icon name="logout" size="18px" />
                </q-item-section>
                <q-item-section>Odjava</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </button>

      </div>
    </q-header>

    <!-- Page content -->
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'boot/axios';
import { getStoredUser } from 'src/utils/authStorage';
import { useActionableRequestsNotifier } from 'src/composables/useActionableRequestsNotifier';

const router = useRouter();
const route = useRoute();

const { checkActionableRequests, resetNotifier } = useActionableRequestsNotifier();

const user = computed(() => getStoredUser());

const fullName = computed(() => {
  if (!user.value) return '';
  return `${user.value.first_name} ${user.value.last_name}`;
});

const initials = computed(() => {
  if (!user.value) return '?';
  const first = user.value.first_name?.[0] || '';
  const last = user.value.last_name?.[0] || '';
  return `${first}${last}`.toUpperCase();
});

const avatarColor = computed(() => {
  const palette = ['#1b2d59', '#00afdb', '#0e7490', '#1d4ed8', '#2563eb', '#0891b2', '#16294e', '#0369a1'];
  const str = (user.value?.first_name || '') + (user.value?.last_name || '');
  const idx = [...str].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % palette.length;
  return palette[idx];
});

const isAdmin = computed(() => user.value?.role_name === 'Administrator');

const isActive = (path) => {
  if (path === '/zahtjevi') return route.path.startsWith('/zahtjevi') && !route.path.startsWith('/novizahtjev');
  return route.path === path;
};

const navigate = (path) => {
  router.push(path);
};

const logout = async () => {
  resetNotifier();
  try { await api.post('/auth/logout'); } catch { /* ignore */ }
  localStorage.removeItem('user');
  router.replace('/login');
};

onMounted(() => {
  checkActionableRequests();
});
</script>

<style scoped>
.app-header {
  background: #ffffff !important;
  color: #1a1a1a;
  box-shadow: none;
  border-bottom: 1px solid #e5e7eb;
}

.topbar {
  display: flex;
  align-items: stretch;
  height: 52px;
  padding: 0 24px;
}

/* ── Brand ── */
.brand {
  all: unset;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0 4px;
  transition: opacity 0.12s;
}
.brand:hover { opacity: 0.72; }

.brand__logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
}

.brand__name {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  white-space: nowrap;
  line-height: 1;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Divider between brand and nav ── */
.topbar-divider {
  width: 1px;
  background: #e5e7eb;
  margin: 10px 20px;
  flex-shrink: 0;
}

/* ── Navigation ── */
.topbar-nav {
  display: flex;
  align-items: stretch;
  gap: 2px;
}

.nav-item {
  all: unset;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1b2d59;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  transition: color 0.12s, background 0.12s;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.nav-item:hover {
  color: #00afdb;
  background: rgba(0, 175, 219, 0.06);
}

.nav-item__icon {
  opacity: 0.6;
  flex-shrink: 0;
}

.nav-item--active {
  color: #00afdb;
  font-weight: 600;
}

.nav-item--active .nav-item__icon {
  opacity: 1;
}

.nav-item--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 2px;
  background: #00afdb;
  border-radius: 2px 2px 0 0;
}

/* ── Vertical separator between nav groups ── */
.nav-sep {
  width: 1px;
  background: #e5e7eb;
  margin: 12px 6px;
  flex-shrink: 0;
}

.topbar-spacer {
  flex: 1;
}

/* ── Avatar button ── */
.avatar-btn {
  all: unset;
  display: flex;
  align-items: center;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 8px;
  transition: opacity 0.12s, box-shadow 0.12s;
}

.avatar-btn:hover {
  opacity: 0.85;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
}
</style>

<style>
/* ── Global (non-scoped) ── */

.app-layout {
  background: #f8f9fa;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.avatar--lg {
  width: 40px;
  height: 40px;
  font-size: 14px;
}

.user-menu,
.user-menu.q-menu {
  background: transparent !important;
  border: 1px solid #E1DFDD;
  border-radius: 6px;
  box-shadow:
    0 6.4px 14.4px rgba(0, 0, 0, 0.13),
    0 1.2px 3.6px rgba(0, 0, 0, 0.10);
  min-width: 240px;
  overflow: hidden;
}
.user-menu__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #EDEBE9;
  background: #fff !important;
}
.user-menu__name {
  font-size: 13px;
  font-weight: 600;
  color: #201F1E;
  letter-spacing: -0.005em;
}
.user-menu__email {
  font-size: 11px;
  color: #605E5C;
  margin-top: 1px;
}
.user-menu__list { padding: 4px; background: #fff; }
.user-menu__item {
  border-radius: 4px;
  min-height: 36px;
  font-size: 13px;
  font-weight: 500;
  color: #201F1E;
}
.user-menu__item:hover { background: #F3F2F1; }
.user-menu__item .q-icon { color: #605E5C; }

.page-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.page-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.page-enter-from   { opacity: 0; transform: translateY(8px); }
.page-leave-to     { opacity: 0; transform: translateY(-4px); }

/* Svjetla, brand-usklađena varijanta (bijela podloga, navy tekst) umjesto
   Quasarove tamne zadane (#323232) koja je stršala na svijetlom UI-ju.
   Lijevi border + ikona nose semantsku boju scenarija (ista paleta kao
   status-badgevi u IndexPage/RequestsPage); akcijski tip nema status pa
   nosi brand cyan. */
.actionable-request-notify {
  min-width: 320px;
  max-width: 420px;
  background: #ffffff !important;
  color: #16294e !important;
  border-left: 4px solid #00afdb;
  border-radius: 6px !important;
  padding: 12px 14px !important;
  box-shadow:
    0 6.4px 14.4px rgba(0, 0, 0, 0.13),
    0 1.2px 3.6px rgba(0, 0, 0, 0.10) !important;
}
.actionable-request-notify .q-notification__icon {
  color: #00afdb;
}
.actionable-request-notify .q-notification__message {
  color: #16294e;
  font-weight: 600;
  font-size: 0.8125rem;
  letter-spacing: -0.005em;
}
.actionable-request-notify .q-notification__caption {
  margin-top: 2px;
  color: #6b7280;
  opacity: 1;
  font-size: 0.75rem;
  line-height: 1.4;
}

/* Default (Zatvori) akcija — neutralna */
.actionable-request-notify .q-notification__actions .q-btn {
  color: #6b7280 !important;
}

/* Primarna (Pregledaj) akcija — uvijek brand cyan, bez obzira na tip */
.actionable-request-notify .q-notification__actions .notify-action--accent {
  color: #0e7490 !important;
  font-weight: 700 !important;
}
.actionable-request-notify .q-notification__actions .notify-action--accent:hover {
  background: rgba(0, 175, 219, 0.12) !important;
}

/* Semantski akcenti po scenariju — ista paleta kao status-badgevi */
.actionable-request-notify--review     { border-left-color: #1d4ed8; }
.actionable-request-notify--review     .q-notification__icon { color: #1d4ed8; }

.actionable-request-notify--underReview { border-left-color: #b45309; }
.actionable-request-notify--underReview .q-notification__icon { color: #b45309; }

.actionable-request-notify--revision   { border-left-color: #c2410c; }
.actionable-request-notify--revision   .q-notification__icon { color: #c2410c; }

.actionable-request-notify--rejected   { border-left-color: #b91c1c; }
.actionable-request-notify--rejected   .q-notification__icon { color: #b91c1c; }

.actionable-request-notify--approved   { border-left-color: #7c3aed; }
.actionable-request-notify--approved   .q-notification__icon { color: #7c3aed; }

.actionable-request-notify--closed     { border-left-color: #166534; }
.actionable-request-notify--closed     .q-notification__icon { color: #166534; }

.actionable-request-notify--action     { border-left-color: #00afdb; }
.actionable-request-notify--action     .q-notification__icon { color: #00afdb; }

@media print {
  .app-header,
  .q-header {
    display: none !important;
  }
  .q-page-container {
    padding-top: 0 !important;
    padding-left: 0 !important;
    min-height: 0 !important;
  }
  .q-layout,
  .q-page-container,
  .q-page {
    min-height: 0 !important;
    height: auto !important;
  }
  body, .app-layout, .q-layout {
    background: white !important;
  }
}
</style>
