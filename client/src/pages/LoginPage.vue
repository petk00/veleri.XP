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
          autocomplete="username"
        />

        <q-input
          v-model="password"
          label="Lozinka"
          :type="showPassword ? 'text' : 'password'"
          outlined
          autocomplete="current-password"
          @keyup.enter="handleLogin"
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <q-banner
          v-if="errorMessage"
          class="bg-red-1 text-red-8"
          rounded
        >
          {{ errorMessage }}
        </q-banner>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          color="primary"
          label="Prijavi se"
          :loading="loading"
          @click="handleLogin"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'boot/axios';

const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  errorMessage.value = '';

  if (!email.value || !password.value) {
    errorMessage.value = 'Unesi email i lozinku.';
    return;
  }

  loading.value = true;

  try {
    const response = await api.post('/auth/login', {
      email: email.value.trim(),
      password: password.value,
    });

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    router.replace('/dashboard');
  } catch (error) {
    console.error('LOGIN ERROR:', error?.response?.data || error);

    errorMessage.value =
      error?.response?.data?.message || 'Greška pri prijavi.';
  } finally {
    loading.value = false;
  }
};
</script>