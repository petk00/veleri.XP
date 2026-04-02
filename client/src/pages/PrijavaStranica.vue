<template>
  <q-page class="row items-center justify-center bg-grey-2">
    <q-card style="width: 400px; max-width: 90vw" class="q-pa-md">
      <q-card-section>
        <div class="text-h5 text-center">Prijava</div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="email"
          label="Email"
          type="email"
          outlined
          class="q-mb-md"
        />

        <q-input
          v-model="lozinka"
          label="Lozinka"
          :type="prikaziLozinku ? 'text' : 'password'"
          outlined
        >
          <template #append>
            <q-icon
              :name="prikaziLozinku ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="prikaziLozinku = !prikaziLozinku"
            />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section>
        <q-btn
          label="Prijavi se"
          color="primary"
          class="full-width"
          @click="prijava"
        />
      </q-card-section>

      <q-card-section v-if="poruka">
        <div class="text-negative text-center">
          {{ poruka }}
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from 'src/boot/axios'

const router = useRouter()

const email = ref('')
const lozinka = ref('')
const prikaziLozinku = ref(false)
const poruka = ref('')

const prijava = async () => {
  poruka.value = ''

  try {
    const response = await api.post('/api/login', {
      email: email.value,
      password: lozinka.value
    })

    if (response.data.success) {
      router.push('/moji-nalozi')
    } else {
      poruka.value = 'Prijava nije uspjela.'
    }
  } catch (error) {
    poruka.value = 'Greška kod spajanja na server.'
    console.error(error)
  }
}
</script>