<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">

    <q-header class="app-header">
      <q-toolbar class="toolbar-shell">

        <!-- Brand -->
        <div class="brand" @click="$router.push('/dashboard')">
          <div class="brand__icon">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="11" height="11" rx="3" fill="white" fill-opacity="0.95"/>
              <rect x="15" y="2" width="11" height="11" rx="3" fill="white" fill-opacity="0.5"/>
              <rect x="2" y="15" width="11" height="11" rx="3" fill="white" fill-opacity="0.5"/>
              <rect x="15" y="15" width="11" height="11" rx="3" fill="white" fill-opacity="0.95"/>
            </svg>
          </div>
          <div class="brand__text">
            <span class="brand__name">XP</span>
            <span class="brand__sub">Sustav nabave</span>
          </div>
        </div>

        <!-- Nav -->
        <nav class="nav gt-sm">
          <button
            class="nav__item"
            :class="{ 'nav__item--active': isActive('/dashboard') }"
            @click="$router.push('/dashboard')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Dashboard
          </button>

          <button
            class="nav__item"
            :class="{ 'nav__item--active': isActive('/requests') }"
            @click="$router.push('/requests')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            Zahtjevi
          </button>
        </nav>

        <div class="toolbar-spacer" />

        <!-- User panel -->
        <div v-if="user" class="user-panel">
          <div class="user-avatar">{{ initials }}</div>

          <div class="user-meta gt-xs">
            <span class="user-name">{{ fullName }}</span>
            <span class="user-role">{{ user.role_name }}</span>
          </div>

          <button class="logout-btn" @click="logout" title="Odjava">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { computed } from 'vue';
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
  const last  = user.value.last_name?.[0]  || '';
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

import { onMounted } from 'vue';
onMounted(() => {
  checkActionableRequests();
});
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────── */
.app-layout {
  background: #f0f4fa;
}

/* ── Header ──────────────────────────────────────────── */
.app-header {
  background: #16294e !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 24px rgba(10, 22, 40, 0.24);
}

.toolbar-shell {
  min-height: 64px;
  padding: 0 24px;
  gap: 8px;
}

.toolbar-spacer {
  flex: 1;
}

/* ── Brand ───────────────────────────────────────────── */
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  text-decoration: none;
  margin-right: 32px;
  flex-shrink: 0;
}

.brand__icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}

.brand:hover .brand__icon {
  background: rgba(255, 255, 255, 0.16);
}

.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand__name {
  font-size: 0.95rem;
  font-weight: 800;
  color: white;
  letter-spacing: 0.06em;
}

.brand__sub {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 2px;
  letter-spacing: 0.04em;
}

/* ── Nav ─────────────────────────────────────────────── */
.nav {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nav__item {
  all: unset;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: all 0.18s;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.nav__item:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.08);
}

.nav__item--active {
  color: white;
  background: rgba(255, 255, 255, 0.12);
}

/* ── User panel ──────────────────────────────────────── */
.user-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 6px 6px 10px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(74, 127, 212, 0.5);
  color: white;
  font-size: 0.72rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  min-width: 100px;
}

.user-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: white;
  letter-spacing: -0.01em;
}

.user-role {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 2px;
}

.logout-btn {
  all: unset;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.18s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 600px) {
  .toolbar-shell {
    padding: 0 14px;
    min-height: 56px;
  }

  .brand {
    margin-right: 0;
  }

  .brand__sub {
    display: none;
  }
}
</style>

<style>
/* Global notify stilovi */
.actionable-request-notify {
  min-width: 360px;
  max-width: 460px;
  border-radius: 14px !important;
  padding: 14px 16px !important;
  box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.25) !important;
}

.actionable-request-notify .q-notification__message {
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: -0.01em;
}

.actionable-request-notify .q-notification__caption {
  margin-top: 3px;
  opacity: 0.85;
  font-size: 0.78rem;
  line-height: 1.4;
}
</style>
