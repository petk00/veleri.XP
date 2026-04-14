<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card style="width: 400px; max-width: 90vw;">
      <q-card-section>
        <div class="text-h5 text-center q-mb-md">Prijava</div>
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-input
          v-model="email"
          label="Email"
          type="email"
          outlined
        />

        <q-input
          v-model="password"
          label="Lozinka"
          :type="showPassword ? 'text' : 'password'"
          outlined
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          color="primary"
          label="Prijavi se"
          @click="handleLogin"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const router = useRouter();
const $q = useQuasar();

const email = ref('');
const password = ref('');
const showPassword = ref(false);

const handleLogin = () => {
  if (!email.value || !password.value) {
    $q.notify({
      type: 'negative',
      message: 'Unesi email i lozinku.',
    });
    return;
  }

  router.push('/dashboard');
};
</script>