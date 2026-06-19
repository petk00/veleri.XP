<template>
  <q-page class="login-page">
    <div class="blob blob--1" aria-hidden="true" />
    <div class="blob blob--2" aria-hidden="true" />
    <div class="blob blob--3" aria-hidden="true" />

    <main class="login-shell">
      <section class="signin-card" aria-labelledby="signin-title">
        <form class="signin-form" @submit.prevent="submitCurrentStep">

          <div class="brand-row">
            <img
              src="/veleri-logo-horizontal.svg"
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
            {{ step === 'email' ? 'Dobrodošli u sustav veleri.XP' : 'Unesite lozinku' }}
          </h1>
          <p v-if="step === 'email'" class="signin-subtitle">Platforma za digitalizaciju poslovnih procesa</p>

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

          <div class="help-section">
            <p class="help-title">Trebate pomoć?</p>
            <p class="help-desc">Nemate korisnički račun ili imate problem s prijavom (zaboravljena lozinka, greška pri pristupu)?</p>
            <a
              href="mailto:ipetkovic@veleri.hr?subject=Upit%20vezan%20uz%20pristup%20sustavu%20veleri.XP"
              class="help-cta"
            >
              Kontaktirajte administratora sustava
              <q-icon name="arrow_forward" size="14px" />
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const continueToPassword = async () => {
  errorMessage.value = '';

  if (!email.value.trim()) {
    errorMessage.value = 'Unesite e-mail adresu.';
    return;
  }

  if (!emailRegex.test(email.value.trim())) {
    errorMessage.value = 'Unesite ispravnu e-mail adresu (npr. ime.prezime@veleri.hr).';
    return;
  }

  loading.value = true;

  try {
    await api.post('/auth/check-email', { email: email.value.trim() });
    step.value = 'password';
    await focusPassword();
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message || 'Greška pri provjeri e-maila.';
  } finally {
    loading.value = false;
  }
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

    localStorage.setItem('user', JSON.stringify(response.data.user));

    router.replace('/requests');
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message || 'Prijava nije uspjela. Provjerite unesene podatke.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>

/* ── Animations ────────────────────────────────── */

@keyframes blob1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%       { transform: translate(40px, -30px) scale(1.08); }
  50%       { transform: translate(-20px, 40px) scale(0.95); }
  75%       { transform: translate(30px, 20px) scale(1.03); }
}

@keyframes blob2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(-50px, 30px) scale(1.06); }
  66%       { transform: translate(30px, -40px) scale(0.97); }
}

@keyframes blob3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  40%       { transform: translate(25px, 50px) scale(1.04); }
  80%       { transform: translate(-35px, -20px) scale(0.96); }
}

@keyframes card-enter {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes logo-fade {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Page & blobs ──────────────────────────────── */

.login-page {
  position: relative;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: transparent;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 48px 24px;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
}

.blob--1 {
  width: 560px;
  height: 560px;
  background: #16294e;
  opacity: 0.65;
  top: -140px;
  left: -180px;
  animation: blob1 18s ease-in-out infinite;
}

.blob--2 {
  width: 520px;
  height: 520px;
  background: #00afdb;
  opacity: 0.55;
  bottom: -120px;
  right: -140px;
  animation: blob2 20s ease-in-out infinite;
}

.blob--3 {
  width: 400px;
  height: 400px;
  background: #00afdb;
  opacity: 0.35;
  top: 38%;
  left: 45%;
  animation: blob3 15s ease-in-out infinite;
}

/* ── Card ──────────────────────────────────────── */

.login-shell {
  position: relative;
  z-index: 1;
  width: min(420px, 100%);
}

.signin-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 36px 40px 32px;
  box-sizing: border-box;
  animation: card-enter 0.5s ease forwards;
}

/* ── Form layout ───────────────────────────────── */

.signin-form {
  display: flex;
  flex-direction: column;
}

/* ── Logo ──────────────────────────────────────── */

.brand-row {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.brand-logo {
  display: block;
  width: 270px;
  height: auto;
  object-fit: contain;
  animation: logo-fade 0.6s ease 0.1s both;
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

/* ── Typography ────────────────────────────────── */

.signin-title {
  margin: 0 0 4px;
  color: #16294e;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.2;
  text-align: center;
}

.signin-subtitle {
  margin: 0 0 24px;
  color: #6b7280;
  font-size: 0.8125rem;
  font-weight: 400;
  text-align: center;
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
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  background: #fff;
  color: #111827;
  font: inherit;
  font-size: 0.9375rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.text-input::placeholder {
  color: #9ca3af;
}

.text-input:hover:not(:disabled):not(:focus) {
  border-color: #9ca3af;
}

.text-input:focus {
  border-color: #00afdb;
  box-shadow: 0 0 0 3px rgba(0, 175, 219, 0.3);
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
  border-radius: 0 7px 7px 0;
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
  border-radius: 0 6px 6px 0;
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
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #16294e 0%, #00afdb 100%);
  color: #fff;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-btn:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 175, 219, 0.35);
}

.primary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ── Help section ──────────────────────────────── */

.help-section {
  margin-top: 20px;
  padding: 12px 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
}

.help-title {
  margin: 0 0 4px;
  color: #374151;
  font-size: 0.8125rem;
  font-weight: 600;
}

.help-desc {
  margin: 0 0 10px;
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.5;
}

.help-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #00afdb;
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  transition: gap 0.15s;
}

.help-cta:hover {
  text-decoration: underline;
  gap: 6px;
}

/* ── Footer ────────────────────────────────────── */

.login-footer {
  position: absolute;
  right: 20px;
  bottom: 14px;
  z-index: 1;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
}

/* ── Mobile ────────────────────────────────────── */

@media (max-width: 560px) {
  .login-page {
    align-items: flex-start;
    padding: 0;
  }

  .blob {
    display: none;
  }

  .login-shell {
    width: 100%;
  }

  .signin-card {
    border-radius: 0;
    border: none;
    box-shadow: none;
    padding: 32px 24px 36px;
    min-height: 100vh;
    background: rgba(255, 255, 255, 0.95);
  }

  .login-footer {
    display: none;
  }
}
</style>
