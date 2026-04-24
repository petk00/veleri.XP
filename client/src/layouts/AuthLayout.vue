<template>
  <q-layout view="lHh Lpr lFf" class="auth-layout">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
</script>

<style>
.auth-layout {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 0% 0%, rgba(74, 127, 212, 0.18) 0%, transparent 50%),
    radial-gradient(ellipse at 100% 100%, rgba(22, 41, 78, 0.4) 0%, transparent 50%),
    linear-gradient(160deg, #0a1628 0%, #16294e 50%, #1a3260 100%);
}
</style>
