<template>
  <q-page class="login-page flex flex-center">
    <div class="login-shell">
      <div class="login-brand">
        <div class="login-brand__badge">
          <q-icon name="inventory_2" size="20px" />
        </div>
        <div class="login-brand__name">XP Sustav nabave</div>
      </div>

      <div class="login-heading">Prijava u sustav</div>

      <div class="login-form">
        <div class="form-field">
          <q-input
            v-model="email"
            label="Email adresa"
            type="email"
            outlined
            autocomplete="username"
            class="clean-input"
          />
        </div>

        <div class="form-field">
          <q-input
            v-model="password"
            label="Lozinka"
            :type="showPassword ? 'text' : 'password'"
            outlined
            autocomplete="current-password"
            class="clean-input"
            @keyup.enter="handleLogin"
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer text-grey-5"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
        </div>

        <div v-if="errorMessage" class="error-banner">
          <q-icon name="error_outline" size="16px" />
          <span>{{ errorMessage }}</span>
        </div>

        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Prijavi se"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        />
      </div>
    </div>
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

<style scoped>
.login-page {
  background: #F9FAFB;
  min-height: 100vh;
}

.login-shell {
  width: 380px;
  max-width: 90vw;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
  justify-content: center;
}

.login-brand__badge {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #1E40AF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-brand__name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
}

.login-heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 28px;
  text-align: center;
  letter-spacing: -0.02em;
}

.login-form {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  width: 100%;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 6px;
  color: #991B1B;
  font-size: 0.875rem;
}

.login-btn {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  background: #1E40AF !important;
  margin-top: 4px;
}
</style>
