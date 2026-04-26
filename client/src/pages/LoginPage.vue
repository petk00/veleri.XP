<template>
  <q-page class="login-page flex flex-center">
    <div class="login-shell">
      <div class="login-brand">
        <div class="login-brand__badge">
          <q-icon name="inventory_2" size="22px" />
        </div>
      </div>

      <div class="login-heading">Prijavite se</div>
      <div class="login-subheading">XP Sustav nabave</div>

      <div class="login-form">
        <q-input
          v-model="email"
          label="Email"
          type="email"
          outlined
          autocomplete="username"
          class="apple-input"
        />

        <q-input
          v-model="password"
          label="Lozinka"
          :type="showPassword ? 'text' : 'password'"
          outlined
          autocomplete="current-password"
          class="apple-input"
          @keyup.enter="handleLogin"
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              style="color: #86868B;"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <transition name="fade-slide">
          <div v-if="errorMessage" class="error-banner">
            <q-icon name="error_outline" size="15px" style="flex-shrink:0;" />
            <span>{{ errorMessage }}</span>
          </div>
        </transition>

        <q-btn
          unelevated
          no-caps
          label="Prijava"
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
    errorMessage.value = error?.response?.data?.message || 'Greška pri prijavi.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  background: #F5F5F7;
  min-height: 100vh;
}

.login-shell {
  width: 360px;
  max-width: 92vw;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-brand {
  margin-bottom: 20px;
}

.login-brand__badge {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #16294E;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(22, 41, 78, 0.25);
}

.login-heading {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1D1D1F;
  letter-spacing: -0.03em;
  text-align: center;
  margin-bottom: 4px;
}

.login-subheading {
  font-size: 0.9rem;
  color: #86868B;
  text-align: center;
  margin-bottom: 28px;
}

.login-form {
  width: 100%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 18px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 12px 40px rgba(0, 0, 0, 0.07);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 59, 48, 0.08);
  border: 0.5px solid rgba(255, 59, 48, 0.25);
  border-radius: 10px;
  color: #C00;
  font-size: 0.83rem;
  line-height: 1.4;
}

.login-btn {
  width: 100%;
  height: 46px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  background: #16294E !important;
  color: white !important;
  margin-top: 4px;
  transition: opacity 0.2s, transform 0.15s;
}

.login-btn:hover {
  opacity: 0.88;
}

.login-btn:active {
  transform: scale(0.985);
}

.fade-slide-enter-active { transition: all 0.2s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(-6px); }
</style>
