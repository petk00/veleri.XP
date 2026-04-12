<template>
  <q-page class="flex flex-center column">
    <div class="text-h5 q-mb-md">Quasar + Node</div>
    <div>{{ message }}</div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'src/boot/axios'

const message = ref('Učitavanje...')

onMounted(async () => {
  try {
    const response = await api.get('/')
    message.value = response.data.message
  } catch (error) {
    console.error(error)
    message.value = 'Greška kod spajanja na backend'
  }
})
</script>