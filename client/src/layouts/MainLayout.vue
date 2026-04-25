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
            flat
            no-caps
            class="nav-btn"
            :class="{ 'nav-btn--active': isActive('/dashboard') }"
            label="Dashboard"
            @click="$router.push('/dashboard')"
          />
          <q-btn
            flat
            no-caps
            class="nav-btn"
            :class="{ 'nav-btn--active': isActive('/requests') }"
            label="Zahtjevi"
            @click="$router.push('/requests')"
          />
        </div>

        <q-space />

        <div v-if="user" class="user-panel">
          <q-avatar class="user-avatar" size="32px">
            {{ initials }}
          </q-avatar>

          <div class="user-meta gt-xs">
            <div class="user-name">{{ fullName }}</div>
            <div class="user-role">{{ user.role_name }}</div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="logout"
            class="logout-btn"
            @click="logout"
          >
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
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

body, .q-page, .app-layout, .q-card, .q-btn, .q-input, .q-select, .q-table, .q-timeline {
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
}
</style>

<style scoped>
.app-layout {
  background: #F9FAFB;
}

.app-header {
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
  box-shadow: none;
}

.toolbar-shell {
  min-height: 60px;
  padding: 0 28px;
}

.brand-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-badge {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1E40AF;
  color: white;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: 0.06em;
}

.brand-subtitle {
  font-size: 0.7rem;
  color: #9CA3AF;
  font-weight: 400;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 28px;
}

.nav-btn {
  border-radius: 6px;
  padding: 5px 12px;
  color: #6B7280;
  font-weight: 500;
  font-size: 0.875rem;
  letter-spacing: 0;
}

.nav-btn--active {
  color: #1E40AF;
  background: #EFF6FF;
}

.user-panel {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  background: #111827;
  color: white;
  font-weight: 600;
  font-size: 0.7rem !important;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
}

.user-role {
  font-size: 0.7rem;
  color: #9CA3AF;
  font-weight: 400;
}

.logout-btn {
  color: #9CA3AF;
}

.page-container {
  min-height: calc(100vh - 60px);
}

@media (max-width: 600px) {
  .toolbar-shell {
    padding: 0 16px;
  }

  .brand-subtitle {
    display: none;
  }
}
</style>
