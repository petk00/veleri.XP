<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title class="cursor-pointer" @click="$router.push('/dashboard')">
          XP
        </q-toolbar-title>

        <q-btn flat label="Dashboard" @click="$router.push('/dashboard')" />
        <q-btn flat label="Zahtjevi" @click="$router.push('/requests')" />

        <q-space />

        <div v-if="user" class="row items-center q-gutter-sm q-mr-md">
          <q-avatar color="primary" text-color="white">
            {{ initials }}
          </q-avatar>

          <div class="column">
            <div class="text-subtitle2">{{ fullName }}</div>
            <div class="text-caption">{{ user.role_name }}</div>
          </div>
        </div>

        <q-btn flat label="Odjava" @click="logout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

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

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.replace('/login');
};
</script>