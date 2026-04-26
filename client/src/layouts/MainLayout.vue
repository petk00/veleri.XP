<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">

    <q-header class="app-header">
      <q-toolbar class="toolbar">

        <!-- Brand -->
        <button class="brand" @click="$router.push('/dashboard')">
          <div class="brand__mark">XP</div>
          <div class="brand__text">
            <span class="brand__name">veleri.XP</span>
            <span class="brand__sub">Sustav nabave</span>
          </div>
        </button>

        <span class="brand-divider gt-xs" aria-hidden="true" />

        <!-- Primary nav -->
        <nav class="nav gt-sm">
          <button
            class="nav__item"
            :class="{ 'nav__item--active': isActive('/dashboard') }"
            @click="$router.push('/dashboard')"
          >
            <q-icon name="space_dashboard" size="18px" />
            <span>Dashboard</span>
          </button>

          <button
            class="nav__item"
            :class="{ 'nav__item--active': isActive('/requests') }"
            @click="$router.push('/requests')"
          >
            <q-icon name="description" size="18px" />
            <span>Zahtjevi</span>
          </button>
        </nav>

        <q-space />

        <!-- User dropdown -->
        <button v-if="user" class="user-btn">
          <div class="avatar">{{ initials }}</div>
          <div class="user-meta gt-xs">
            <span class="user-name">{{ fullName }}</span>
            <span class="user-role">{{ user.role_name }}</span>
          </div>
          <q-icon name="expand_more" size="18px" class="user-chevron" />

          <q-menu
            anchor="bottom right"
            self="top right"
            :offset="[0, 6]"
            class="user-menu"
            transition-show="jump-down"
            transition-hide="jump-up"
          >
            <div class="user-menu__header">
              <div class="avatar avatar--lg">{{ initials }}</div>
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
          <q-icon name="space_dashboard" size="18px" />
          Dashboard
        </button>
        <button
          class="mobile-nav__item"
          :class="{ 'mobile-nav__item--active': isActive('/requests') }"
          @click="$router.push('/requests')"
        >
          <q-icon name="description" size="18px" />
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
  background: #F5F5F5;
}

.app-header {
  background: #16294E !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.toolbar {
  min-height: 56px;
  padding: 0 16px;
  gap: 0;
}

/* ─────────────────────────────────────
   Brand
   ───────────────────────────────────── */
.brand {
  all: unset;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  margin-right: 4px;
  transition: background 0.15s;
}
.brand:hover { background: rgba(255, 255, 255, 0.06); }

.brand__mark {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  background: #00AFDB;
  color: #16294E;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.brand__name {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  letter-spacing: -0.005em;
}
.brand__sub {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 1px;
}

.brand-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.18);
  margin: 0 12px 0 8px;
}

/* ─────────────────────────────────────
   Primary nav (desktop) — tab style
   ───────────────────────────────────── */
.nav {
  display: flex;
  align-items: stretch;
  height: 56px;
}

.nav__item {
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  height: 100%;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
  white-space: nowrap;
}
.nav__item:hover {
  color: white;
  background: rgba(255, 255, 255, 0.06);
}
.nav__item--active {
  color: white;
  border-bottom-color: #00AFDB;
}

/* ─────────────────────────────────────
   User button & dropdown
   ───────────────────────────────────── */
.user-btn {
  all: unset;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 6px 0 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.user-btn:hover { background: rgba(255, 255, 255, 0.08); }

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00AFDB 0%, #0078A0 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
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
  font-size: 0.78rem;
  font-weight: 500;
  color: white;
  letter-spacing: -0.005em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}
.user-role {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 1px;
}

.user-chevron {
  color: rgba(255, 255, 255, 0.7);
  margin-left: 2px;
}

/* ─────────────────────────────────────
   Mobile nav (visible <md)
   ───────────────────────────────────── */
.mobile-nav {
  display: flex;
  align-items: stretch;
  background: rgba(0, 0, 0, 0.18);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.mobile-nav__item {
  all: unset;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.mobile-nav__item:hover { color: white; }
.mobile-nav__item--active {
  color: white;
  border-bottom-color: #00AFDB;
}

/* ─────────────────────────────────────
   Responsive tweaks
   ───────────────────────────────────── */
@media (max-width: 600px) {
  .toolbar {
    padding: 0 10px;
  }
  .brand__sub { display: none; }
  .user-name { max-width: 100px; }
}
</style>

<style>
/* ── Globalni stilovi (ne-scoped) ────────────── */

/* Dropdown menu — Fluent UI feel */
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

/* Notify stilovi za actionable requests */
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
</style>
