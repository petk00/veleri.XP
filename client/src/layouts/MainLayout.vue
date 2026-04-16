<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>XP</q-toolbar-title>

        <q-btn flat label="Dashboard" @click="$router.push('/dashboard')" />
        <q-btn flat label="Zahtjevi" @click="$router.push('/requests')" />
        <q-btn flat label="Odjava" @click="logout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.replace('/login');
};
</script>