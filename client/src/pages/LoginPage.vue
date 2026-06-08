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
              src="/logo.svg"
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
            <q-icon name="arrow_back" size="16px" />
            <span>{{ email }}</span>
          </button>

          <h1 id="signin-title" class="signin-title">
            {{ step === 'email' ? 'Prijavite se u aplikaciju nabave' : 'Unesite lozinku' }}
          </h1>

          <div v-if="step === 'email'" class="field">
            <label class="field-label" for="login-email">E-mail adresa</label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              class="text-input"
              placeholder="ime.prezime@veleri.hr"
              autocomplete="username"
              :disabled="loading"
              autofocus
            />
          </div>

          <div v-else class="field">
            <label class="field-label" for="login-password">Lozinka</label>
            <div class="password-field">
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="text-input"
                placeholder="••••••••"
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

          <div v-if="errorMessage" class="form-error" role="alert">
            {{ errorMessage }}
          </div>

          <div class="actions">
            <button type="submit" class="primary-btn" :disabled="loading">
              <q-spinner v-if="loading" size="16px" color="white" />
              <span v-else>{{ step === 'email' ? 'Dalje' : 'Prijavi se' }}</span>
            </button>
          </div>

          <div v-if="step === 'email'" class="help-section">
            <a
              href="mailto:ipetkovic@veleri.hr?subject=Zahtjev%20za%20korisnički%20račun"
              class="help-item"
            >
              <div class="help-item__body">
                <span class="help-item__question">Nemate korisnički račun?</span>
                <span class="help-item__action">Zatražite pristup</span>
              </div>
              <q-icon name="chevron_right" size="16px" class="help-item__arrow" />
            </a>
            <a
              href="mailto:ipetkovic@veleri.hr?subject=Problem%20s%20pristupom%20ili%20zaboravljena%20lozinka"
              class="help-item"
            >
              <div class="help-item__body">
                <span class="help-item__question">Zaboravili ste lozinku ili imate problem s pristupom?</span>
                <span class="help-item__action">Zatražite podršku</span>
              </div>
              <q-icon name="chevron_right" size="16px" class="help-item__arrow" />
            </a>
          </div>

        </form>
      </section>
    </main>

    <footer class="login-footer">
      <span>© {{ currentYear }} Veleučilište u Rijeci. Sva prava pridržana.</span>
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

    router.replace('/home');
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message || 'Prijava nije uspjela. Provjerite unesene podatke.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ── Page & background ─────────────────────────── */

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
  color: #111827;
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
  width: 680px; height: 620px;
  left: -160px; bottom: -240px;
  transform: rotate(-42deg);
}

.background-shape--two {
  width: 700px; height: 520px;
  right: -150px; top: -260px;
  transform: rotate(-12deg);
}

.background-shape--three {
  width: 680px; height: 360px;
  right: 145px; bottom: -150px;
  border-color: rgba(238, 220, 214, 0.42);
  transform: rotate(17deg);
}

/* ── Card ──────────────────────────────────────── */

.login-shell {
  position: relative;
  z-index: 1;
  width: min(420px, 100%);
}

.signin-card {
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-top: 2px solid #0067b8;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 36px 40px 32px;
  box-sizing: border-box;
}

/* ── Form layout ───────────────────────────────── */

.signin-form {
  display: flex;
  flex-direction: column;
}

/* ── Logo ──────────────────────────────────────── */

.brand-row {
  margin-bottom: 28px;
  display: flex;
  justify-content: center;
}

.brand-logo {
  display: block;
  width: 120px;
  height: 120px;
  object-fit: contain;
}

/* ── Back button ───────────────────────────────── */

.back-step {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #4b5563;
  font: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: color 0.15s;
}

.back-step:hover { color: #111827; }

.back-step span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.signin-title {
  margin: 0 0 24px;
  color: #111827;
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

/* ── Fields ────────────────────────────────────── */

.field {
  margin-bottom: 18px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  color: #374151;
  font-size: 0.8125rem;
  font-weight: 500;
}

.text-input {
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  outline: none;
  background: #fff;
  color: #111827;
  font: inherit;
  font-size: 0.9375rem;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.text-input::placeholder {
  color: #9ca3af;
}

.text-input:hover:not(:disabled):not(:focus) {
  border-color: #9ca3af;
}

.text-input:focus {
  border-color: #0067b8;
  box-shadow: 0 0 0 2px rgba(0, 103, 184, 0.14);
}

.text-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.password-field {
  position: relative;
}

.password-field .text-input {
  padding-right: 38px;
}

.password-toggle {
  position: absolute;
  right: 1px;
  top: 1px;
  bottom: 1px;
  width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0 2px 2px 0;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.15s;
}

.password-toggle:hover { color: #4b5563; }

/* ── Error ─────────────────────────────────────── */

.form-error {
  margin-bottom: 14px;
  padding: 9px 12px;
  border-left: 3px solid #c50f1f;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.8125rem;
  line-height: 1.4;
}

/* ── Actions ───────────────────────────────────── */

.actions {
  margin-top: 4px;
  margin-bottom: 0;
}

.primary-btn {
  display: inline-flex;
  width: 100%;
  height: 38px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 3px;
  background: #0067b8;
  color: #fff;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.primary-btn:hover:not(:disabled) { background: #005a9e; }

.primary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ── Help section ──────────────────────────────── */

.help-section {
  margin-top: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.help-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  text-decoration: none;
  color: inherit;
  background: #fff;
  transition: background 0.12s;
}

.help-item:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}

.help-item:hover {
  background: #f9fafb;
}

.help-item:hover .help-item__action {
  text-decoration: underline;
}

.help-item__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.help-item__question {
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.4;
}

.help-item__action {
  color: #0067b8;
  font-size: 0.8125rem;
  font-weight: 600;
}

.help-item__arrow {
  color: #d1d5db;
  flex-shrink: 0;
  transition: color 0.12s, transform 0.12s;
}

.help-item:hover .help-item__arrow {
  color: #0067b8;
  transform: translateX(2px);
}

/* ── Footer ────────────────────────────────────── */

.login-footer {
  position: absolute;
  right: 20px;
  bottom: 14px;
  z-index: 1;
  color: rgba(17, 24, 39, 0.4);
  font-size: 0.75rem;
}

/* ── Mobile ────────────────────────────────────── */

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
    border: none;
    border-top: 2px solid #0067b8;
    box-shadow: none;
    padding: 32px 24px 36px;
  }

  .login-footer {
    display: none;
  }
}
</style>
