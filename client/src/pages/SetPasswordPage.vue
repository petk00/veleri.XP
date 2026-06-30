<template>
  <q-page class="sp-page">

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
        <h2 class="brand-panel__claim">Postavite lozinku za pristup sustavu</h2>
        <ul class="brand-panel__points">
          <li>
            <q-icon name="lock" size="16px" />
            <span>Sigurna, jednokratna postavka lozinke</span>
          </li>
          <li>
            <q-icon name="bolt" size="16px" />
            <span>Trenutni pristup odmah nakon potvrde</span>
          </li>
          <li>
            <q-icon name="verified_user" size="16px" />
            <span>Podaci zaštićeni šifriranjem</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Form panel — desna polovica, na mobileu puna širina -->
    <div class="form-panel">
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
            <AuthFormHeader
              title-id="sp-title"
              title="Postavi lozinku"
              subtitle="Odaberite lozinku za svoj račun"
            />

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

                <div v-if="password.length > 0" class="strength-meter">
                  <div class="strength-meter__bar">
                    <span
                      class="strength-meter__fill"
                      :class="`strength-meter__fill--${strength.level}`"
                      :style="{ width: strength.percent + '%' }"
                    />
                  </div>
                  <span class="strength-meter__label" :class="`strength-meter__label--${strength.level}`">
                    {{ strength.label }}
                  </span>
                </div>

                <ul class="requirements">
                  <li :class="{ 'requirements__item--ok': hasMinLength }">
                    <q-icon :name="hasMinLength ? 'check_circle' : 'radio_button_unchecked'" size="14px" />
                    <span>Najmanje 8 znakova</span>
                  </li>
                </ul>
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

                <p
                  v-if="confirm.length > 0"
                  class="match-indicator"
                  :class="passwordsMatch ? 'match-indicator--ok' : 'match-indicator--err'"
                >
                  <q-icon :name="passwordsMatch ? 'check_circle' : 'cancel'" size="14px" />
                  <span>{{ passwordsMatch ? 'Lozinke se podudaraju' : 'Lozinke se ne podudaraju' }}</span>
                </p>
              </div>

              <div v-if="error" class="form-error" role="alert">{{ error }}</div>

              <div class="actions">
                <button type="submit" class="primary-btn" :disabled="saving || !canSubmit">
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
              <a
                href="mailto:ipetkovic@veleri.hr?subject=Upit%20vezan%20uz%20link%20za%20postavljanje%20lozinke%20nabava.XP"
                class="help-cta"
              >
                Kontaktirajte administratora sustava
                <q-icon name="arrow_forward" size="14px" />
              </a>
            </div>
          </template>

        </section>
      </main>

      <footer class="sp-footer">
        <span>© {{ currentYear }} Veleučilište u Rijeci. Sva prava pridržana.</span>
      </footer>
    </div>

  </q-page>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from 'boot/axios';
import AuthFormHeader from 'components/AuthFormHeader.vue';

const route = useRoute();

const INVALID_TOKEN_MESSAGE = 'Link za postavljanje lozinke je istekao ili nije važeći. Kontaktirajte administratora sustava.';

const token = ref('');
const password = ref('');
const confirm = ref('');
const error = ref('');
const saving = ref(false);
const state = ref('form'); // 'form' | 'success' | 'invalid'
const showPassword = ref(false);
const showConfirm = ref(false);

const currentYear = computed(() => new Date().getFullYear());

const hasMinLength = computed(() => password.value.length >= 8);
const passwordsMatch = computed(() => confirm.value.length > 0 && password.value === confirm.value);
const canSubmit = computed(() => hasMinLength.value && passwordsMatch.value);

const strength = computed(() => {
  const val = password.value;
  if (!val) return { level: 'none', label: '', percent: 0 };

  let score = 0;
  if (val.length >= 8) score++;
  if (val.length >= 12) score++;
  if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  if (score <= 1) return { level: 'weak', label: 'Slaba', percent: 33 };
  if (score <= 3) return { level: 'medium', label: 'Srednja', percent: 66 };
  return { level: 'strong', label: 'Jaka', percent: 100 };
});

onMounted(() => {
  const t = route.query.token;
  if (!t) {
    error.value = INVALID_TOKEN_MESSAGE;
    state.value = 'invalid';
    return;
  }
  token.value = t;
});

const submit = async () => {
  error.value = '';
  if (!canSubmit.value) {
    error.value = !hasMinLength.value
      ? 'Lozinka mora imati najmanje 8 znakova.'
      : 'Lozinke se ne podudaraju.';
    return;
  }
  saving.value = true;
  try {
    await api.post('/auth/set-password', { token: token.value, password: password.value });
    state.value = 'success';
  } catch (err) {
    const msg = err?.response?.data?.message || 'Greška pri postavljanju lozinke.';
    if (err?.response?.status === 400) {
      error.value = msg || INVALID_TOKEN_MESSAGE;
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

/* ── Page shell — split screen (ista obitelj kao LoginPage) ── */

.sp-page {
  position: relative;
  height: 100vh !important;
  min-height: 100vh !important;
  overflow: hidden;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Brand panel (lijevo) ──────────────────────── */

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

.sp-shell {
  width: min(400px, 100%);
}

.sp-card {
  width: 100%;
  /* Fiksna min-height (ista logika kao LoginPage .signin-card) sprječava da
     centrirani .form-panel "skoči" pri prijelazu forma → success/invalid stanje. */
  min-height: 420px;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  box-sizing: border-box;
  animation: card-enter 0.5s ease forwards;
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

/* ── Typography ────────────────────────────────── */

.sp-title {
  margin: 0 0 22px;
  color: #16294e;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.2;
  text-align: center;
}

.sp-subtitle {
  margin: 0 0 12px;
  color: #6b7280;
  font-size: 0.8125rem;
  font-weight: 400;
  text-align: center;
  line-height: 1.5;
}

/* ── Fields ────────────────────────────────────── */

.field {
  margin-bottom: 14px;
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

/* ── Password strength meter ───────────────────── */

.strength-meter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.strength-meter__bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #e5e7eb;
  overflow: hidden;
}

.strength-meter__fill {
  display: block;
  height: 100%;
  border-radius: 2px;
  transition: width 0.2s ease, background 0.2s ease;
}

.strength-meter__fill--weak   { background: #dc2626; }
.strength-meter__fill--medium { background: #d97706; }
.strength-meter__fill--strong { background: #16a34a; }

.strength-meter__label {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 600;
}

.strength-meter__label--weak   { color: #dc2626; }
.strength-meter__label--medium { color: #d97706; }
.strength-meter__label--strong { color: #16a34a; }

/* ── Live requirements checklist ───────────────── */

.requirements {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
}

.requirements li {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 0.75rem;
  line-height: 1.4;
}

.requirements li .q-icon { color: #d1d5db; }

.requirements__item--ok {
  color: #16a34a !important;
}

.requirements__item--ok .q-icon { color: #16a34a !important; }

/* ── Live match indicator ──────────────────────── */

.match-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 0;
  font-size: 0.75rem;
  font-weight: 500;
}

.match-indicator--ok  { color: #16a34a; }
.match-indicator--err { color: #dc2626; }

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

/* ── Help CTA (invalid state) ──────────────────── */

.help-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
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

/* ── Footer ────────────────────────────────────── */

.sp-footer {
  margin-top: 28px;
  color: #9ca3af;
  font-size: 0.75rem;
  text-align: center;
}

/* ── Tablet / mobile (<768px) — brand panel se sakriva, forma puna širina ── */

@media (max-width: 768px) {
  .sp-page {
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

  .sp-shell {
    width: 100%;
  }

  .sp-footer {
    display: none;
  }
}
</style>
