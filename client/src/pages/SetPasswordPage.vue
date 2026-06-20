<template>
  <q-page class="sp-page">
    <div class="blob blob--1" aria-hidden="true" />
    <div class="blob blob--2" aria-hidden="true" />
    <div class="blob blob--3" aria-hidden="true" />

    <main class="sp-shell">
      <section class="sp-card">

        <div class="brand-row">
          <img
            src="/veleri-logo-horizontal.svg"
            alt="Veleučilište u Rijeci"
            class="brand-logo"
          />
        </div>

        <template v-if="state === 'form'">
          <h1 class="sp-title">Postavi lozinku</h1>
          <p class="sp-subtitle">Odaberite lozinku za svoj veleri.XP račun.</p>

          <form @submit.prevent="submit">
            <div class="field">
              <label class="field-label" for="sp-password">Nova lozinka</label>
              <div class="password-field">
                <input
                  id="sp-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="text-input"
                  placeholder="Min. 8 znakova"
                  autocomplete="new-password"
                  :disabled="saving"
                  autofocus
                />
                <button
                  type="button"
                  class="password-toggle"
                  :title="showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'"
                  :disabled="saving"
                  @click="showPassword = !showPassword"
                >
                  <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" size="18px" />
                </button>
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="sp-confirm">Ponovi lozinku</label>
              <div class="password-field">
                <input
                  id="sp-confirm"
                  v-model="confirm"
                  :type="showConfirm ? 'text' : 'password'"
                  class="text-input"
                  placeholder="Ponovite lozinku"
                  autocomplete="new-password"
                  :disabled="saving"
                />
                <button
                  type="button"
                  class="password-toggle"
                  :title="showConfirm ? 'Sakrij lozinku' : 'Prikaži lozinku'"
                  :disabled="saving"
                  @click="showConfirm = !showConfirm"
                >
                  <q-icon :name="showConfirm ? 'visibility_off' : 'visibility'" size="18px" />
                </button>
              </div>
            </div>

            <div v-if="error" class="form-error" role="alert">{{ error }}</div>

            <div class="actions">
              <button type="submit" class="primary-btn" :disabled="saving">
                <q-spinner v-if="saving" size="16px" color="white" />
                <span v-else>Postavi lozinku i prijavi se</span>
              </button>
            </div>
          </form>
        </template>

        <template v-else-if="state === 'success'">
          <div class="sp-result">
            <q-icon name="check_circle" size="48px" class="result-icon result-icon--ok" />
            <h1 class="sp-title">Lozinka je postavljena</h1>
            <p class="sp-subtitle">Možete se prijaviti u aplikaciju.</p>
            <div class="actions">
              <button class="primary-btn" @click="$router.push('/login')">Idi na prijavu</button>
            </div>
          </div>
        </template>

        <template v-else-if="state === 'invalid'">
          <div class="sp-result">
            <q-icon name="error_outline" size="48px" class="result-icon result-icon--err" />
            <h1 class="sp-title">Link nije valjan</h1>
            <p class="sp-subtitle">{{ error }}</p>
            <p class="sp-hint">Zamolite administratora da vam pošalje novi pozivni link.</p>
          </div>
        </template>

      </section>
    </main>

    <footer class="sp-footer">
      <span>© {{ currentYear }} Veleučilište u Rijeci. Sva prava pridržana.</span>
    </footer>
  </q-page>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from 'boot/axios';

const route = useRoute();

const token = ref('');
const password = ref('');
const confirm = ref('');
const error = ref('');
const saving = ref(false);
const state = ref('form'); // 'form' | 'success' | 'invalid'
const showPassword = ref(false);
const showConfirm = ref(false);

const currentYear = computed(() => new Date().getFullYear());

onMounted(() => {
  const t = route.query.token;
  if (!t) {
    error.value = 'Nedostaje token u linku.';
    state.value = 'invalid';
    return;
  }
  token.value = t;
});

const submit = async () => {
  error.value = '';
  if (password.value.length < 8) {
    error.value = 'Lozinka mora imati najmanje 8 znakova.';
    return;
  }
  if (password.value !== confirm.value) {
    error.value = 'Lozinke se ne podudaraju.';
    return;
  }
  saving.value = true;
  try {
    await api.post('/auth/set-password', { token: token.value, password: password.value });
    state.value = 'success';
  } catch (err) {
    const msg = err?.response?.data?.message || 'Greška pri postavljanju lozinke.';
    if (err?.response?.status === 400) {
      error.value = msg;
      state.value = 'invalid';
    } else {
      error.value = msg;
    }
  } finally {
    saving.value = false;
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

.sp-page {
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

.sp-shell {
  position: relative;
  z-index: 1;
  width: min(420px, 100%);
}

.sp-card {
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

/* ── Typography ────────────────────────────────── */

.sp-title {
  margin: 0 0 4px;
  color: #16294e;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.2;
  text-align: center;
}

.sp-subtitle {
  margin: 0 0 24px;
  color: #6b7280;
  font-size: 0.8125rem;
  font-weight: 400;
  text-align: center;
  line-height: 1.5;
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

.text-input::placeholder { color: #9ca3af; }

.text-input:hover:not(:disabled):not(:focus) { border-color: #9ca3af; }

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

/* ── Result states ─────────────────────────────── */

.sp-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.sp-result .sp-title { margin-top: 8px; }
.sp-result .sp-subtitle { margin-bottom: 4px; }
.sp-result .actions { width: 100%; margin-top: 16px; }

.result-icon--ok { color: #16a34a; }
.result-icon--err { color: #dc2626; }

.sp-hint {
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.5;
}

/* ── Footer ────────────────────────────────────── */

.sp-footer {
  position: absolute;
  right: 20px;
  bottom: 14px;
  z-index: 1;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
}

/* ── Mobile ────────────────────────────────────── */

@media (max-width: 560px) {
  .sp-page {
    align-items: flex-start;
    padding: 0;
  }

  .blob {
    display: none;
  }

  .sp-shell {
    width: 100%;
  }

  .sp-card {
    border-radius: 0;
    border: none;
    box-shadow: none;
    padding: 32px 24px 36px;
    min-height: 100vh;
    background: rgba(255, 255, 255, 0.95);
  }

  .sp-footer {
    display: none;
  }
}
</style>
