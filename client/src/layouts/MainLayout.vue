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
      :breakpoint="768"
      class="app-sidebar"
    >
      <div class="sidebar-inner">

        <!-- Brand -->
        <div class="sidebar-brand">
          <button class="brand" @click="navigate('/home')">
            <img
              src="/veleri_logo_solo.svg"
              alt="Veleučilište u Rijeci"
              class="brand__logo"
            />
          </button>
        </div>

        <!-- Navigation -->
        <nav v-if="!isHome" class="sidebar-nav">
          <button
            class="sidebar-nav__item"
            :class="{ 'sidebar-nav__item--active': isActive('/dashboard') }"
            @click="navigate('/dashboard')"
          >
            <q-icon name="space_dashboard" size="18px" />
            <span>Nadzorna ploča</span>
          </button>
          <button
            class="sidebar-nav__item"
            :class="{ 'sidebar-nav__item--active': isActive('/requests') }"
            @click="navigate('/requests')"
          >
            <q-icon name="description" size="18px" />
            <span>Zahtjevi</span>
          </button>
          <button
            v-if="isAdmin"
            class="sidebar-nav__item"
            :class="{ 'sidebar-nav__item--active': isActive('/users') }"
            @click="navigate('/users')"
          >
            <q-icon name="group" size="18px" />
            <span>Korisnici</span>
          </button>
          <button
            v-if="isAdmin"
            class="sidebar-nav__item"
            :class="{ 'sidebar-nav__item--active': isActive('/fiscal-years') }"
            @click="navigate('/fiscal-years')"
          >
            <q-icon name="calendar_month" size="18px" />
            <span>Poslovne godine</span>
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

    <footer class="app-footer no-print">
      <span>© 2026 Veleučilište u Rijeci. Sva prava pridržana.</span>
    </footer>

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
  const palette = ['#0067b8', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#9333ea', '#be185d'];
  const str = (user.value?.first_name || '') + (user.value?.last_name || '');
  const idx = [...str].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % palette.length;
  return palette[idx];
});

const isAdmin = computed(() => user.value?.role_name === 'Administrator');
const isHome = computed(() => route.path === '/home');

const isActive = (path) => {
  if (path === '/requests') return route.path.startsWith('/requests');
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
  background:
    radial-gradient(circle at 10% 12%, rgba(219, 243, 255, 0.58), transparent 28%),
    radial-gradient(circle at 88% 34%, rgba(255, 244, 249, 0.72), transparent 30%),
    linear-gradient(135deg, #fbfdff 0%, #f7f5fb 52%, #fffdfb 100%);
}

.app-layout::before,
.app-layout::after {
  content: '';
  position: fixed;
  pointer-events: none;
  z-index: 0;
  border: 1px solid rgba(188, 222, 255, 0.42);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 0 70px rgba(217, 239, 255, 0.24);
}

.app-layout::before {
  width: 560px; height: 470px;
  left: -190px; bottom: -210px;
  transform: rotate(-42deg);
}

.app-layout::after {
  width: 620px; height: 360px;
  right: -180px; top: 92px;
  transform: rotate(-14deg);
}

:deep(.q-page-container) {
  position: relative;
  z-index: 1;
}

/* ─────────────────────────────────────
   Mobile header
   ───────────────────────────────────── */
.app-header {
  background: linear-gradient(90deg,
    rgba(180, 218, 255, 0.85) 0%,
    rgba(235, 247, 255, 0.98) 28%,
    rgba(245, 245, 252, 0.98) 72%,
    rgba(255, 210, 232, 0.75) 100%
  ) !important;
  color: #1a1a1a;
  box-shadow: none;
  border-bottom: 1px solid rgba(155, 200, 240, 0.75);
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
.app-sidebar {
  border-right: 1px solid rgba(155, 200, 240, 0.75) !important;
}

.app-sidebar :deep(.q-drawer__content) {
  background: white;
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-brand {
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(155, 200, 240, 0.4);
  flex-shrink: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 8px;
  flex-shrink: 0;
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
  color: #424242;
  cursor: pointer;
  white-space: nowrap;
  box-sizing: border-box;
  width: 100%;
  transition: background 0.12s, color 0.12s;
}

.sidebar-nav__item:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
}

.sidebar-nav__item--active {
  background: #111827;
  color: #fff;
  font-weight: 500;
}

.sidebar-nav__item--active:hover {
  background: #000;
  color: #fff;
}

.sidebar-spacer {
  flex: 1;
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid rgba(155, 200, 240, 0.4);
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

.user-menu {
  background: white;
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
  background: #FAFAFA;
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

.app-footer {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 14px 32px;
  border-top: 1px solid rgba(155, 200, 240, 0.5);
  color: rgba(17, 24, 39, 0.38);
  font-size: 0.75rem;
}

@media (max-width: 600px) {
  .app-footer { padding: 12px 16px; }
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
