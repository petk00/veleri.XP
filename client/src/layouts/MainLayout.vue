<template>
  <q-layout view="lHh LPr lFf" class="app-layout">

    <!-- ── Mobile header (logo kao toggle + avatar) ── -->
    <q-header v-if="$q.screen.lt.md" class="app-header">
      <q-toolbar class="toolbar">
        <button class="brand" @click="drawerOpen = !drawerOpen">
          <img
            src="/veleri_logo_solo.svg"
            alt="Veleučilište u Rijeci"
            class="brand__logo"
          />
        </button>
        <q-space />
        <button v-if="user" class="avatar-btn">
          <div class="avatar" :style="{ background: avatarColor }">{{ initials }}</div>
          <q-menu
            anchor="bottom right"
            self="top right"
            :offset="[0, 6]"
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
      </q-toolbar>
    </q-header>

    <!-- ── Sidebar ── -->
    <q-drawer
      v-model="drawerOpen"
      show-if-above
      side="left"
      :width="220"
      :mini="miniMode"
      :mini-width="56"
      :breakpoint="768"
      class="app-sidebar"
    >
      <div class="sidebar-inner">

        <!-- Brand -->
        <div class="sidebar-brand" :class="{ 'sidebar-brand--mini': miniMode }">
          <button class="brand brand--toggle" @click="toggleMini">
            <img
              src="/veleri_logo_solo.svg"
              alt="Veleučilište u Rijeci"
              class="brand__logo"
            />
            <span v-if="!miniMode" class="brand__name">
              <span style="color: #1b2d59">veleri</span><span style="color: #14bae4">.XP</span>
            </span>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">

          <!-- Nabava: admin ima dropdown, zaposlenik samo link -->
          <template v-if="isAdmin">
            <div class="nav-group">
              <button class="nav-group__header" @click="navigate('/nabava'); toggleGroup('nabava')">
                <img src="/solarlinear_NABAVA.svg" width="30" height="30" class="nav-group__icon" />
                <span class="nav-group__label">Nabava</span>
                <q-icon :name="openGroups.nabava ? 'expand_less' : 'expand_more'" size="15px" class="nav-group__chevron" />
              </button>
              <div v-show="miniMode || openGroups.nabava" class="nav-group__items">
                <button
                  class="sidebar-nav__item"
                  :class="{ 'sidebar-nav__item--active': isActive('/requests/new') }"
                  @click="navigate('/requests/new')"
                >
                  <img src="/solarlinear_NOVIZAHTJEV.svg" width="30" height="30" />
                  <span>Novi zahtjev</span>
                </button>
                <button
                  class="sidebar-nav__item"
                  :class="{ 'sidebar-nav__item--active': isActive('/requests') }"
                  @click="navigate('/requests')"
                >
                  <img src="/solarlinear_MOJIZAHTJEVI.svg" width="30" height="30" />
                  <span>Zahtjevi</span>
                </button>
                <button
                  class="sidebar-nav__item"
                  :class="{ 'sidebar-nav__item--active': isActive('/fiscal-years') }"
                  @click="navigate('/fiscal-years')"
                >
                  <img src="/solarlinear_POSLOVNEGODINE.svg" width="30" height="30" />
                  <span>Poslovne godine</span>
                </button>
                <div class="sidebar-nav__item sidebar-nav__item--soon">
                  <img src="/solarlinear_FINANCIRANJE.svg" width="30" height="30" />
                  <span>Financiranje</span>
                  <span class="nav-soon-badge">uskoro</span>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <button
              class="nav-group__header"
              :class="{ 'nav-group__header--active': route.path === '/nabava' }"
              @click="navigate('/nabava')"
            >
              <img src="/solarlinear_NABAVA.svg" width="30" height="30" class="nav-group__icon" />
              <span class="nav-group__label">Nabava</span>
            </button>
          </template>
          <div class="nav-group nav-group--soon">
            <div class="nav-group__header nav-group__header--soon">
              <img src="/solarlinear_PUTNINALOG.svg" width="30" height="30" class="nav-group__icon" />
              <span class="nav-group__label">Putni nalozi</span>
              <span class="nav-soon-badge">uskoro</span>
            </div>
          </div>

          <!-- Separator -->
          <div v-if="isAdmin" class="nav-separator" />

          <!-- Admin stavke -->
          <button
            v-if="isAdmin"
            class="sidebar-nav__item"
            :class="{ 'sidebar-nav__item--active': isActive('/users') }"
            @click="navigate('/users')"
          >
            <img src="/solarlinear_KORISNICI.svg" width="30" height="30" />
            <span>Korisnici</span>
          </button>

        </nav>

        <div class="sidebar-spacer" />

        <!-- User profile -->
        <div class="sidebar-footer" v-if="user">
          <button class="sidebar-user">
            <div class="avatar" :style="{ background: avatarColor }">{{ initials }}</div>
            <div class="sidebar-user__info">
              <div class="sidebar-user__name">{{ fullName }}</div>
              <div class="sidebar-user__role">{{ user.role_name }}</div>
            </div>
            <q-menu
              anchor="top left"
              self="bottom left"
              :offset="[0, 8]"
              class="user-menu"
              style="background: transparent"
              transition-show="jump-up"
              transition-hide="jump-down"
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

      </div>
    </q-drawer>

    <!-- ── Page content ── -->
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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import { getStoredUser } from 'src/utils/authStorage';
import { useActionableRequestsNotifier } from 'src/composables/useActionableRequestsNotifier';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();

const drawerOpen = ref(false);
const miniMode = ref(false);
const openGroups = ref({ nabava: true });

const toggleGroup = (name) => { openGroups.value[name] = !openGroups.value[name]; };

const toggleMini = () => {
  if ($q.screen.lt.md) {
    drawerOpen.value = false;
  } else {
    miniMode.value = !miniMode.value;
  }
};

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
  if (path === '/requests') return route.path.startsWith('/requests') && !route.path.startsWith('/requests/new');
  return route.path === path;
};

const navigate = (path) => {
  router.push(path);
  if ($q.screen.lt.md) drawerOpen.value = false;
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
/* ─────────────────────────────────────
   App layout background
   ───────────────────────────────────── */
.app-layout {
  background: #f8f9fa;
}

/* ─────────────────────────────────────
   Mobile header
   ───────────────────────────────────── */
.app-header {
  background: #ffffff !important;
  color: #1a1a1a;
  box-shadow: none;
  border-bottom: 1px solid #e5e7eb;
}

.toolbar {
  min-height: 52px;
  padding: 0 16px;
  gap: 8px;
}

.brand {
  all: unset;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.brand__logo {
  display: block;
  width: 128px;
  height: auto;
  object-fit: contain;
}

.sidebar-brand .brand__logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.toolbar .brand__logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.avatar-btn {
  all: unset;
  display: flex;
  align-items: center;
  border-radius: 50%;
  cursor: pointer;
  transition: opacity 0.12s, box-shadow 0.12s;
}

.avatar-btn:hover {
  opacity: 0.88;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
}

/* ─────────────────────────────────────
   Sidebar
   ───────────────────────────────────── */

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-brand {
  padding: 14px 16px 12px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.sidebar-brand--mini {
  justify-content: center;
  padding: 14px 8px 12px;
}

.brand--toggle {
  cursor: pointer;
  transition: opacity 0.12s;
  gap: 8px;
}

.brand__name {
  font-size: 1.375rem;
  font-weight: 700;
  color: #1e1b4b;
  letter-spacing: -0.03em;
  white-space: nowrap;
  line-height: 22px;
}

.brand--toggle:hover {
  opacity: 0.7;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 8px;
  flex-shrink: 0;
}

.nav-group {
  display: flex;
  flex-direction: column;
}

.nav-group__header {
  all: unset;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  width: 100%;
  box-sizing: border-box;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #1b2d59;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.12s;
  white-space: nowrap;
}

.nav-group__header:hover {
  color: #14bae4;
}

.nav-group__header--active {
  background: #e8f8fd;
  border-left: 3px solid #00afdb;
  padding-left: 9px;
  color: #00afdb;
}

.nav-group__label {
  flex: 1;
}

.nav-group__icon {
  flex-shrink: 0;
  opacity: 0.55;
}

.nav-group__chevron {
  flex-shrink: 0;
  opacity: 0.4;
}

.nav-group__header--soon {
  cursor: default;
  opacity: 0.4;
}

.nav-group__header--soon:hover {
  color: #6b7280;
}

.sidebar-nav__item--soon {
  opacity: 0.4;
  cursor: default;
  pointer-events: none;
}

.nav-soon-badge {
  font-size: 0.6rem;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 2px 6px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.nav-separator {
  height: 1px;
  background: #e5e7eb;
  margin: 6px 12px;
}

.sidebar-nav__item {
  all: unset;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.8125rem;
  font-weight: 400;
  color: #1b2d59;
  cursor: pointer;
  white-space: nowrap;
  box-sizing: border-box;
  width: 100%;
  transition: background 0.12s, color 0.12s;
}

:deep(.q-drawer--mini) .sidebar-nav {
  padding: 10px 4px;
}

:deep(.q-drawer--mini) .sidebar-nav__item {
  justify-content: center;
  padding: 10px 0;
  width: 100%;
}

:deep(.q-drawer--mini) .sidebar-nav__item span {
  display: none;
}

:deep(.q-drawer--mini) .nav-group__header {
  justify-content: center;
  padding: 6px 0;
}

:deep(.q-drawer--mini) .nav-group__label,
:deep(.q-drawer--mini) .nav-group__chevron,
:deep(.q-drawer--mini) .nav-soon-badge {
  display: none;
}

:deep(.q-drawer--mini) .nav-separator {
  margin: 6px 4px;
}

:deep(.q-drawer--mini) .sidebar-user__info {
  display: none;
}

:deep(.q-drawer--mini) .sidebar-user {
  justify-content: center;
  padding: 8px 0;
}

.sidebar-nav__item:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #14bae4;
}

.sidebar-nav__item--active {
  background: #e8f8fd;
  border-left: 3px solid #00afdb;
  padding-left: 9px;
  color: #00afdb;
  font-weight: 600;
}

.sidebar-nav__item--active:hover {
  background: #d8f3fb;
}

.sidebar-spacer {
  flex: 1;
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.sidebar-user {
  all: unset;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  transition: background 0.12s;
}

.sidebar-user:hover {
  background: rgba(0, 0, 0, 0.06);
}

.sidebar-user__info {
  flex: 1;
  min-width: 0;
}

.sidebar-user__name {
  font-size: 12px;
  font-weight: 600;
  color: #201F1E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user__role {
  font-size: 11px;
  color: #605E5C;
  margin-top: 1px;
}
</style>

<style>
/* ── Globalni stilovi (ne-scoped) ── */

.app-sidebar {
  background: #ffffff !important;
  border-right: 1px solid #e5e7eb !important;
}

.avatar {
  width: 36px;
  height: 36px;
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
  background: transparent !important;
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
.user-menu__list { padding: 4px; }
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

.actionable-request-notify {
  min-width: 320px;
  max-width: 420px;
  border-radius: 6px !important;
  padding: 12px 14px !important;
  box-shadow:
    0 6.4px 14.4px rgba(0, 0, 0, 0.13),
    0 1.2px 3.6px rgba(0, 0, 0, 0.10) !important;
}
.actionable-request-notify .q-notification__message {
  font-weight: 600;
  font-size: 0.8125rem;
  letter-spacing: -0.005em;
}
.actionable-request-notify .q-notification__caption {
  margin-top: 2px;
  opacity: 0.85;
  font-size: 0.75rem;
  line-height: 1.4;
}

@media print {
  .app-header,
  .q-header,
  .app-sidebar,
  .q-drawer,
  .app-footer {
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
