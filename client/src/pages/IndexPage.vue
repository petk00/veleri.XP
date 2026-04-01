<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Test povezivanja</div>

    <q-btn label="Test backend" @click="testBackend" />

    <div class="q-mt-md">
      {{ poruka }}
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { api } from 'src/boot/axios'

const poruka = ref('')

const testBackend = async () => {
  try {
    const response = await api.get('/api/test')
    poruka.value = response.data.message
  } catch (error) {
    poruka.value = 'Greška kod spajanja na backend'
    console.error(error)
  }
}
</script>