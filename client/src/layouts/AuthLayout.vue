<template>
  <q-layout view="lHh Lpr lFf" class="auth-layout">
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
</script>

<style>
.auth-layout,
.auth-layout .q-layout,
.auth-layout .q-page-container,
.auth-layout .q-page {
  min-height: 100vh;
  background: transparent !important;
}

.page-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.page-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.page-enter-from   { opacity: 0; transform: translateY(8px); }
.page-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
