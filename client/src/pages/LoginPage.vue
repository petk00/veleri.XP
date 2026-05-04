<template>
  <q-page class="login-page">
    <div class="background-shape background-shape--one" aria-hidden="true" />
    <div class="background-shape background-shape--two" aria-hidden="true" />
    <div class="background-shape background-shape--three" aria-hidden="true" />

    <main class="login-shell">
      <section class="signin-card" aria-labelledby="signin-title">
        <form class="signin-form" @submit.prevent="submitCurrentStep">
          <div class="brand-row">
            <img
              src="/veleri-logo-horizontal.png"
              alt="Veleučilište u Rijeci"
              class="brand-logo"
            />
          </div>

          <button
            v-if="step === 'password'"
            type="button"
            class="back-step"
            :disabled="loading"
            @click="goBackToEmail"
          >
            <q-icon name="arrow_back" size="18px" />
            <span>{{ email }}</span>
          </button>

          <h1 id="signin-title" class="signin-title">
            {{ step === 'email' ? 'Prijava u sustav' : 'Unesite lozinku' }}
          </h1>

          <div v-if="step === 'email'" class="field">
            <label class="sr-only" for="login-email">E-mail adresa</label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              class="text-input"
              placeholder="E-mail adresa"
              autocomplete="username"
              :disabled="loading"
              autofocus
            />
          </div>

          <div v-else class="field">
            <label class="sr-only" for="login-password">Lozinka</label>
            <div class="password-field">
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="text-input"
                placeholder="Lozinka"
                autocomplete="current-password"
                :disabled="loading"
                autofocus
              />
              <button
                type="button"
                class="password-toggle"
                :title="showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'"
                :disabled="loading"
                @click="showPassword = !showPassword"
              >
                <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" size="18px" />
              </button>
            </div>
          </div>

          <div v-if="step === 'email'" class="account-copy">
            <span>Nemate korisnički račun?</span>
            <button type="button">Zatražite pristup</button>
          </div>

          <button v-if="step === 'email'" type="button" class="support-link">
            Ne možete pristupiti računu?
          </button>

          <div v-if="errorMessage" class="form-error" role="alert">
            {{ errorMessage }}
          </div>

          <div class="actions">
            <button
              type="submit"
              class="primary-btn"
              :disabled="loading"
            >
              <q-spinner v-if="loading" size="18px" color="white" />
              <span v-else>{{ step === 'email' ? 'Dalje' : 'Prijavi se' }}</span>
            </button>
          </div>
        </form>
      </section>

    </main>

    <footer class="login-footer">
      <span>© {{ currentYear }} Veleučilište u Rijeci - sva prava pridržana</span>
    </footer>
  </q-page>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'boot/axios';

const router = useRouter();

const step = ref('email');
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const currentYear = computed(() => new Date().getFullYear());

const focusPassword = async () => {
  await nextTick();
  document.getElementById('login-password')?.focus();
};

const continueToPassword = async () => {
  errorMessage.value = '';

  if (!email.value.trim()) {
    errorMessage.value = 'Unesite e-mail adresu.';
    return;
  }

  step.value = 'password';
  await focusPassword();
};

const goBackToEmail = async () => {
  errorMessage.value = '';
  step.value = 'email';
  await nextTick();
  document.getElementById('login-email')?.focus();
};

const submitCurrentStep = () => {
  if (step.value === 'email') {
    continueToPassword();
    return;
  }

  handleLogin();
};

const handleLogin = async () => {
  errorMessage.value = '';

  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Unesite e-mail adresu i lozinku.';
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
    errorMessage.value =
      error?.response?.data?.message || 'Prijava nije uspjela. Provjerite unesene podatke.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  position: relative;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 20%, rgba(219, 243, 255, 0.78), transparent 30%),
    radial-gradient(circle at 70% 62%, rgba(255, 244, 249, 0.85), transparent 34%),
    linear-gradient(135deg, #f8fbff 0%, #f5f2fb 50%, #fffdfb 100%);
  color: #1b1b1b;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 48px 24px;
}

.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(112deg, transparent 13%, rgba(180, 220, 255, 0.22) 13.2%, transparent 13.9%),
    linear-gradient(24deg, transparent 42%, rgba(255, 220, 215, 0.24) 42.2%, transparent 43%),
    radial-gradient(circle, rgba(255, 255, 255, 0.9) 0 1px, transparent 1.3px);
  background-size: auto, auto, 68px 68px;
  opacity: 0.7;
}

.background-shape {
  position: absolute;
  border: 2px solid rgba(188, 222, 255, 0.5);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 0 80px rgba(217, 239, 255, 0.34);
  pointer-events: none;
}

.background-shape--one {
  width: 680px;
  height: 620px;
  left: -160px;
  bottom: -240px;
  transform: rotate(-42deg);
}

.background-shape--two {
  width: 700px;
  height: 520px;
  right: -150px;
  top: -260px;
  transform: rotate(-12deg);
}

.background-shape--three {
  width: 680px;
  height: 360px;
  right: 145px;
  bottom: -150px;
  border-color: rgba(238, 220, 214, 0.42);
  transform: rotate(17deg);
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(440px, 100%);
}

.signin-card {
  width: 100%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.signin-card {
  min-height: 338px;
  padding: 44px 44px 40px;
}

.signin-form {
  display: flex;
  min-height: 254px;
  flex-direction: column;
}

.brand-row {
  display: inline-flex;
  align-items: center;
  margin-left: -10px;
  margin-bottom: 18px;
}

.brand-logo {
  display: block;
  width: 450px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.back-step {
  display: inline-flex;
  width: 100%;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px -4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #1b1b1b;
  font: inherit;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}

.back-step span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.signin-title {
  margin: 0 0 18px;
  color: #1b1b1b;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
}

.field {
  margin-bottom: 16px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.text-input {
  width: 100%;
  height: 36px;
  padding: 5px 0 7px;
  border: 0;
  border-bottom: 1px solid #666;
  border-radius: 0;
  outline: none;
  background: transparent;
  color: #1b1b1b;
  font: inherit;
  font-size: 15px;
}

.text-input::placeholder {
  color: #616161;
  opacity: 1;
}

.text-input:focus {
  border-bottom-color: #0067b8;
  box-shadow: 0 1px 0 #0067b8;
}

.text-input:disabled {
  color: #767676;
  cursor: not-allowed;
}

.password-field {
  position: relative;
}

.password-field .text-input {
  padding-right: 34px;
}

.password-toggle {
  position: absolute;
  right: 0;
  top: 3px;
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: #616161;
  cursor: pointer;
}

.account-copy {
  display: flex;
  gap: 4px;
  margin-top: 2px;
  font-size: 13px;
}

.account-copy button,
.support-link {
  border: 0;
  background: transparent;
  color: #0067b8;
  font: inherit;
  cursor: pointer;
}

.account-copy button {
  padding: 0;
}

.support-link {
  width: fit-content;
  margin-top: 18px;
  padding: 0;
  font-size: 13px;
  text-align: left;
}

.account-copy button:hover,
.support-link:hover {
  color: #004578;
  text-decoration: underline;
}

.form-error {
  margin-top: 16px;
  color: #a4262c;
  font-size: 13px;
  line-height: 1.4;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 28px;
}

.primary-btn {
  display: inline-flex;
  min-width: 108px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid #0067b8;
  background: #0067b8;
  color: white;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.primary-btn:hover:not(:disabled) {
  border-color: #005da6;
  background: #005da6;
}

.primary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.login-footer {
  position: absolute;
  right: 20px;
  bottom: 14px;
  z-index: 1;
  display: flex;
  gap: 18px;
  color: rgba(27, 27, 27, 0.72);
  font-size: 12px;
}

@media (max-width: 560px) {
  .login-page {
    align-items: flex-start;
    padding: 0;
    background: #fff;
  }

  .login-page::before,
  .background-shape {
    display: none;
  }

  .login-shell {
    width: 100%;
  }

  .signin-card {
    min-height: auto;
    padding: 32px 28px 36px;
    box-shadow: none;
  }

  .signin-form {
    min-height: 300px;
  }

  .login-footer {
    position: fixed;
    right: 16px;
    bottom: 10px;
    left: 16px;
    justify-content: space-between;
  }
}
</style>
