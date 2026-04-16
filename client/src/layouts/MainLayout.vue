<template>
  <q-layout view="lHh Lpr lFf" class="app-layout">
    <q-header class="app-header">
      <q-toolbar class="toolbar-shell">
        <div class="brand-wrap cursor-pointer" @click="$router.push('/dashboard')">
          <div class="brand-badge">
            <q-icon name="inventory_2" size="20px" />
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
          <q-avatar class="user-avatar" size="46px">
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

const router = useRouter();
const route = useRoute();

const user = computed(() => {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
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

<style scoped>
.app-layout {
  background: #f6f8fc;
}

.app-header {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.toolbar-shell {
  min-height: 78px;
  padding: 0 24px;
}

.brand-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
  color: white;
  box-shadow: 0 10px 24px rgba(25, 118, 210, 0.28);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.02em;
}

.brand-subtitle {
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 3px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 28px;
}

.nav-btn {
  border-radius: 14px;
  padding: 8px 14px;
  color: #475569;
  font-weight: 600;
}

.nav-btn--active {
  background: rgba(25, 118, 210, 0.1);
  color: #1976d2;
}

.user-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 18px;
  padding: 8px 10px 8px 8px;
}

.user-avatar {
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
  color: white;
  font-weight: 700;
}

.user-meta {
  display: flex;
  flex-direction: column;
  min-width: 140px;
}

.user-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.user-role {
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 2px;
}

.logout-btn {
  color: #64748b;
}

.page-container {
  min-height: calc(100vh - 78px);
}

@media (max-width: 600px) {
  .toolbar-shell {
    padding: 0 14px;
  }

  .brand-subtitle {
    display: none;
  }
}
</style>