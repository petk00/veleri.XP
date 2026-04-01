<template>
  <q-page class="row items-center justify-center bg-grey-2">
    <q-card style="width: 400px; max-width: 90vw" class="q-pa-md">
      <q-card-section>
        <div class="text-h5 text-center">Prijava</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="email" label="Email" outlined class="q-mb-md" />
        <q-input v-model="lozinka" label="Lozinka" type="password" outlined />
      </q-card-section>

      <q-card-section>
        <q-btn label="Test" color="primary" class="full-width" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const lozinka = ref('')
</script>