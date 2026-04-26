<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header class="app-header">
      <q-toolbar class="toolbar-shell">
        <div class="brand-wrap cursor-pointer" @click="$router.push('/dashboard')">
          <div class="brand-badge">
            <q-icon name="inventory_2" size="16px" />
          </div>
          <div class="brand-text">
            <div class="brand-title">XP</div>
            <div class="brand-subtitle">Sustav nabave</div>
          </div>
        </div>

        <div class="nav-links gt-sm">
          <q-btn
            flat no-caps class="nav-btn"
            :class="{ 'nav-btn--active': isActive('/dashboard') }"
            label="Dashboard"
            @click="$router.push('/dashboard')"
          />
          <q-btn
            flat no-caps class="nav-btn"
            :class="{ 'nav-btn--active': isActive('/requests') }"
            label="Zahtjevi"
            @click="$router.push('/requests')"
          />
        </div>

        <q-space />

        <div v-if="user" class="user-panel">
          <q-avatar class="user-avatar" size="34px">
            {{ initials }}
          </q-avatar>

          <div class="user-meta gt-xs">
            <div class="user-name">{{ fullName }}</div>
            <div class="user-role">{{ user.role_name }}</div>
          </div>

          <q-btn flat round dense icon="logout" class="logout-btn" @click="logout">
            <q-tooltip>Odjava</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container class="page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getStoredUser } from 'src/utils/authStorage';

const router = useRouter();
const route = useRoute();

const user = computed(() => {
  return getStoredUser();
});

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
  if (path === '/requests') {
    return route.path.startsWith('/requests');
  }
  return route.path === path;
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.replace('/login');
};
</script>

<style>
*, *::before, *::after {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
    'Helvetica Neue', Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

<style scoped>
.app-layout {
  background: #F5F5F7;
}

.app-header {
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: saturate(200%) blur(24px);
  -webkit-backdrop-filter: saturate(200%) blur(24px);
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
  box-shadow: none;
}

.toolbar-shell {
  min-height: 64px;
  padding: 0 32px;
}

.brand-wrap {
  display: flex;
  align-items: center;
  gap: 11px;
}

.brand-badge {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #16294E;
  color: white;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #16294E;
  letter-spacing: 0.06em;
}

.brand-subtitle {
  font-size: 0.67rem;
  color: #86868B;
  font-weight: 400;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 36px;
}

.nav-btn {
  border-radius: 8px;
  padding: 5px 14px;
  color: #424245;
  font-weight: 500;
  font-size: 0.875rem;
  letter-spacing: -0.01em;
  transition: all 0.15s ease;
}

.nav-btn:hover {
  color: #16294E;
  background: rgba(22, 41, 78, 0.05);
}

.nav-btn--active {
  color: #00AFDB;
  background: rgba(0, 175, 219, 0.09);
  font-weight: 600;
}

.user-panel {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  background: #16294E;
  color: white;
  font-weight: 600;
  font-size: 0.7rem !important;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #16294E;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.user-role {
  font-size: 0.7rem;
  color: #86868B;
}

.logout-btn {
  color: #86868B;
  transition: color 0.15s;
}

.logout-btn:hover {
  color: #16294E;
}

.page-container {
  min-height: calc(100vh - 64px);
}

@media (max-width: 600px) {
  .toolbar-shell { padding: 0 18px; }
  .brand-subtitle { display: none; }
}
</style>
