<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">

    <q-header class="app-header">
      <q-toolbar class="toolbar">

        <!-- Brand -->
        <button class="brand" @click="$router.push('/dashboard')">
          <img
            src="/veleri-logo-horizontal.png"
            alt="Veleučilište u Rijeci"
            class="brand__logo"
          />
        </button>

        <span class="brand-divider" aria-hidden="true" />

        <button class="product-title" @click="$router.push('/dashboard')">
          XP
        </button>

        <!-- Primary nav -->
        <nav class="nav gt-sm">
          <button
            class="nav__item"
            :class="{ 'nav__item--active': isActive('/dashboard') }"
            @click="$router.push('/dashboard')"
          >
            <span>Dashboard</span>
          </button>

          <button
            class="nav__item"
            :class="{ 'nav__item--active': isActive('/requests') }"
            @click="$router.push('/requests')"
          >
            <span>Zahtjevi</span>
          </button>
        </nav>

        <q-space />

        <!-- User dropdown -->
        <button v-if="user" class="user-btn">
          <div class="avatar" :style="{ background: avatarColor }">{{ initials }}</div>
          <div class="user-meta gt-xs">
            <span class="user-name">{{ fullName }}</span>
          </div>

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

      <!-- Mobile nav (sm i manji) -->
      <div class="mobile-nav lt-md">
        <button
          class="mobile-nav__item"
          :class="{ 'mobile-nav__item--active': isActive('/dashboard') }"
          @click="$router.push('/dashboard')"
        >
          Dashboard
        </button>
        <button
          class="mobile-nav__item"
          :class="{ 'mobile-nav__item--active': isActive('/requests') }"
          @click="$router.push('/requests')"
        >
          Zahtjevi
        </button>
      </div>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
  const palette = ['#0067b8', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#9333ea', '#be185d'];
  const str = (user.value?.first_name || '') + (user.value?.last_name || '');
  const idx = [...str].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % palette.length;
  return palette[idx];
});

const isActive = (path) => {
  if (path === '/requests') return route.path.startsWith('/requests');
  return route.path === path;
};

const logout = () => {
  resetNotifier();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.replace('/login');
};

onMounted(() => {
  checkActionableRequests();
});
</script>

<style scoped>
/* ─────────────────────────────────────
   Layout & header
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
  width: 560px;
  height: 470px;
  left: -190px;
  bottom: -210px;
  transform: rotate(-42deg);
}

.app-layout::after {
  width: 620px;
  height: 360px;
  right: -180px;
  top: 92px;
  transform: rotate(-14deg);
}

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
  z-index: 10;
}

:deep(.q-page-container) {
  position: relative;
  z-index: 1;
}

.toolbar {
  min-height: 52px;
  padding: 0 32px;
  gap: 0;
}

/* ─────────────────────────────────────
   Brand
   ───────────────────────────────────── */
.brand {
  all: unset;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0;
  margin-right: 18px;
}

.brand__logo {
  display: block;
  width: 136px;
  height: auto;
  object-fit: contain;
}

.brand-divider {
  width: 1px;
  height: 24px;
  background: #1a1a1a;
  margin: 0 26px 0 0;
}

.product-title {
  all: unset;
  margin-right: 26px;
  color: #1a1a1a;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  cursor: pointer;
}

/* ─────────────────────────────────────
   Primary nav (desktop)
   ───────────────────────────────────── */
.nav {
  display: flex;
  align-items: center;
  gap: 22px;
}

.nav__item {
  all: unset;
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 52px;
  padding: 0;
  font-size: 0.8125rem;
  font-weight: 400;
  color: #242424;
  cursor: pointer;
  white-space: nowrap;
}

.nav__item:hover {
  color: #000;
  text-decoration: underline;
}

.nav__item--active {
  color: #000;
  font-weight: 500;
}

.nav__item--active::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #1a1a1a;
}

/* ─────────────────────────────────────
   User button & dropdown
   ───────────────────────────────────── */
.user-btn {
  all: unset;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 0 0 10px;
  cursor: pointer;
  position: relative;
  color: #242424;
}
.user-btn:hover .user-name { text-decoration: underline; }

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #0067b8;
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}
.avatar--lg {
  width: 40px;
  height: 40px;
  font-size: 14px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  text-align: left;
  min-width: 0;
}

.user-name {
  font-size: 0.8125rem;
  font-weight: 400;
  color: #242424;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

/* ─────────────────────────────────────
   Mobile nav (visible <md)
   ───────────────────────────────────── */
.mobile-nav {
  display: flex;
  align-items: stretch;
  background: #fff;
  border-top: 1px solid #edebe9;
}

.mobile-nav__item {
  all: unset;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 8px;
  font-size: 0.75rem;
  font-weight: 400;
  color: #242424;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.mobile-nav__item:hover { color: #000; text-decoration: underline; }

.mobile-nav__item--active {
  color: #000;
  border-bottom-color: #1a1a1a;
  font-weight: 500;
}

/* ─────────────────────────────────────
   Responsive tweaks
   ───────────────────────────────────── */
@media (max-width: 600px) {
  .toolbar { padding: 0 16px; }
  .brand { margin-right: 12px; }
  .brand__logo { width: 112px; }
  .brand-divider { height: 20px; margin-right: 14px; }
  .product-title { margin-right: 0; font-size: 0.93rem; }
  .user-name { max-width: 100px; }
  .user-btn { padding-left: 6px; }
  .user-btn .user-meta { display: none; }
}
</style>

<style>
/* ── Globalni stilovi (ne-scoped) ────────────── */

/* Dropdown menu */
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

/* Notify stilovi */
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

/* PRINT — sakrij sve UI elemente Layout-a */
@media print {
  .app-header,
  .q-header,
  .toolbar,
  .mobile-nav {
    display: none !important;
  }

  .q-page-container {
    padding-top: 0 !important;
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
