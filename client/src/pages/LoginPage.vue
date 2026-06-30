<template>
  <q-page class="login-page">

    <!-- Brand panel — lijeva polovica (desktop), sakriva se na mobileu -->
    <div class="brand-panel">
      <div class="brand-panel__blob" aria-hidden="true" />
      <div class="brand-panel__content">
        <div class="brand-panel__brand">
          <img
            src="/veleri_logo_solo.svg"
            alt="Veleučilište u Rijeci"
            class="brand-panel__logo"
          />
          <span class="brand-panel__name">nabava<span class="brand-panel__name-accent">.XP</span></span>
        </div>
        <h2 class="brand-panel__claim">Digitalizacija nabave za Veleučilište u Rijeci</h2>
        <ul class="brand-panel__points">
          <li>
            <q-icon name="bolt" size="16px" />
            <span>Pratite zahtjeve u stvarnom vremenu</span>
          </li>
          <li>
            <q-icon name="inventory_2" size="16px" />
            <span>Centralizirana nabava</span>
          </li>
          <li>
            <q-icon name="history" size="16px" />
            <span>Potpuna povijest aktivnosti</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Form panel — desna polovica, na mobileu puna širina -->
    <div class="form-panel">
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

            <AuthFormHeader
              title-id="signin-title"
              :title="step === 'email' ? 'Prijava' : 'Unesite lozinku'"
              :subtitle="step === 'email' ? 'Prijavite se u nabava.XP' : 'Unesite svoju lozinku'"
              :show-back="step === 'password'"
              :back-text="email"
              @back="goBackToEmail"
            />

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
                href="mailto:ipetkovic@veleri.hr?subject=Upit%20vezan%20uz%20pristup%20sustavu%20nabava.XP"
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
    </div>

  </q-page>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'boot/axios';
import AuthFormHeader from 'components/AuthFormHeader.vue';

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

/* ── Animations ────────────────────────────────── */

@keyframes blob1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%       { transform: translate(30px, -20px) scale(1.06); }
  50%       { transform: translate(-15px, 25px) scale(0.96); }
  75%       { transform: translate(20px, 15px) scale(1.02); }
}

@keyframes card-enter {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes logo-fade {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Page shell — split screen ─────────────────── */

.login-page {
  position: relative;
  height: 100vh !important;
  min-height: 100vh !important;
  overflow: hidden;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Brand panel (lijevo) ──────────────────────── */
/* Apsolutno pozicionirano na puni .login-page (100vh), umjesto flex-stretch
   koji se nepouzdano ponašao unutar Quasarovog q-page/q-page-container lanca. */

.brand-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 50%;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: linear-gradient(160deg, #16294e 0%, #102038 60%, #0d1b30 100%);
  padding: 64px;
  box-sizing: border-box;
}

.brand-panel__blob {
  position: absolute;
  width: 480px;
  height: 480px;
  right: -150px;
  bottom: -150px;
  background: #00afdb;
  opacity: 0.22;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  animation: blob1 20s ease-in-out infinite;
}

.brand-panel__content {
  position: relative;
  z-index: 1;
  max-width: 440px;
}

.brand-panel__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
  animation: logo-fade 0.6s ease 0.1s both;
}

.brand-panel__logo {
  display: block;
  width: 72px;
  height: 72px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.brand-panel__name {
  color: #ffffff;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}

.brand-panel__name-accent {
  color: #00afdb;
}

.brand-panel__claim {
  margin: 0 0 28px;
  color: #ffffff;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.3;
}

.brand-panel__points {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.brand-panel__points li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
}

.brand-panel__points .q-icon {
  color: #00afdb;
  flex-shrink: 0;
}

/* ── Form panel (desno) ────────────────────────── */

.form-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 48px 24px;
  box-sizing: border-box;
  overflow-y: auto;
}

/* ── Card ──────────────────────────────────────── */

.login-shell {
  width: min(400px, 100%);
}

.signin-card {
  width: 100%;
  /* Fiksna min-height (viša od oba koraka) sprječava da centrirani .form-panel
     "skoči" kad se sadržaj forme promijeni između email/lozinka koraka.
     Kraći korak jednostavno ostavlja prazninu na dnu — to je namjerno. */
  min-height: 420px;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  box-sizing: border-box;
  animation: card-enter 0.5s ease forwards;
}

/* ── Form layout ───────────────────────────────── */

.signin-form {
  display: flex;
  flex-direction: column;
}

/* ── Logo (mobile-only mini header, brand panel je sakriven) ── */

.brand-row {
  display: none;
}

.brand-logo {
  display: block;
  width: 220px;
  height: auto;
  object-fit: contain;
  animation: logo-fade 0.6s ease 0.1s both;
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

.text-input:-webkit-autofill,
.text-input:-webkit-autofill:hover,
.text-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px white inset !important;
  -webkit-text-fill-color: #16294E !important;
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
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
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
  margin-top: 28px;
  color: #9ca3af;
  font-size: 0.75rem;
  text-align: center;
}

/* ── Tablet / mobile (<768px) — brand panel se sakriva, forma puna širina ── */

@media (max-width: 768px) {
  .login-page {
    height: auto !important;
    overflow: visible;
  }

  .brand-panel {
    display: none;
  }

  .form-panel {
    position: static;
    width: 100%;
    min-height: 100vh;
  }

  .brand-row {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }
}

@media (max-width: 560px) {
  .form-panel {
    padding: 32px 24px;
  }

  .login-shell {
    width: 100%;
  }

  .login-footer {
    display: none;
  }
}
</style>
