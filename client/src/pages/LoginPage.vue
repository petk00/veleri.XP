<template>
  <q-page class="login-page">

    <!-- Lijeva strana — branding -->
    <div class="login-brand">
      <div class="brand-inner">

        <div class="brand-logo">
          <div class="brand-logo__icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="11" height="11" rx="3" fill="white" fill-opacity="0.9"/>
              <rect x="15" y="2" width="11" height="11" rx="3" fill="white" fill-opacity="0.5"/>
              <rect x="2" y="15" width="11" height="11" rx="3" fill="white" fill-opacity="0.5"/>
              <rect x="15" y="15" width="11" height="11" rx="3" fill="white" fill-opacity="0.9"/>
            </svg>
          </div>
          <div class="brand-logo__text">
            <span class="brand-logo__name">XP</span>
            <span class="brand-logo__sub">Veleučilište u Rijeci</span>
          </div>
        </div>

        <div class="brand-headline">
          <h1>Sustav za<br>upravljanje<br>nabavom</h1>
        </div>

        <div class="brand-features">
          <div class="brand-feature">
            <div class="brand-feature__dot"></div>
            <span>Digitalni workflow zahtjeva</span>
          </div>
          <div class="brand-feature">
            <div class="brand-feature__dot"></div>
            <span>Praćenje statusa u realnom vremenu</span>
          </div>
          <div class="brand-feature">
            <div class="brand-feature__dot"></div>
            <span>Arhiva dokumenata i ponuda</span>
          </div>
        </div>

        <div class="brand-footer">
          © {{ new Date().getFullYear() }} Veleučilište u Rijeci
        </div>

      </div>

      <!-- Dekorativni geometrijski elementi -->
      <div class="geo geo--circle-lg" aria-hidden="true"></div>
      <div class="geo geo--circle-sm" aria-hidden="true"></div>
      <div class="geo geo--line" aria-hidden="true"></div>
    </div>

    <!-- Desna strana — forma -->
    <div class="login-form-side">
      <div class="login-form-wrap">

        <div class="form-header">
          <h2 class="form-title">Dobrodošao</h2>
          <p class="form-subtitle">Prijavite se u sustav s vašim korisničkim podacima.</p>
        </div>

        <div class="form-fields">
          <div class="field-group">
            <label class="field-label">E-mail adresa</label>
            <div class="field-input-wrap" :class="{ 'field-input-wrap--focus': emailFocused }">
              <svg class="field-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                v-model="email"
                type="email"
                class="field-input"
                placeholder="ime.prezime@veleri.hr"
                autocomplete="username"
                @focus="emailFocused = true"
                @blur="emailFocused = false"
                @keyup.enter="handleLogin"
              />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Lozinka</label>
            <div class="field-input-wrap" :class="{ 'field-input-wrap--focus': passwordFocused }">
              <svg class="field-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="field-input"
                placeholder="••••••••"
                autocomplete="current-password"
                @focus="passwordFocused = true"
                @blur="passwordFocused = false"
                @keyup.enter="handleLogin"
              />
              <button
                type="button"
                class="field-toggle"
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="errorMessage" class="form-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ errorMessage }}
          </div>

          <button
            class="form-submit"
            :class="{ 'form-submit--loading': loading }"
            :disabled="loading"
            @click="handleLogin"
          >
            <span v-if="!loading">Prijavi se</span>
            <span v-else class="form-submit__spinner"></span>
          </button>
        </div>

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
const emailFocused = ref(false);
const passwordFocused = ref(false);

const handleLogin = async () => {
  errorMessage.value = '';

  if (!email.value || !password.value) {
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
      error?.response?.data?.message || 'Neispravni podaci za prijavu.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ── Page layout ─────────────────────────────────────── */
.login-page {
  display: flex;
  min-height: 100vh;
}

/* ── Brand (left) ────────────────────────────────────── */
.login-brand {
  position: relative;
  width: 44%;
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.brand-inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  padding: 52px 48px;
  width: 100%;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: auto;
}

.brand-logo__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.brand-logo__text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-logo__name {
  font-size: 1.1rem;
  font-weight: 800;
  color: white;
  letter-spacing: 0.04em;
}

.brand-logo__sub {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.55);
  margin-top: 2px;
  letter-spacing: 0.02em;
}

.brand-headline {
  margin: 48px 0 40px;
}

.brand-headline h1 {
  font-size: 2.6rem;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 48px;
}

.brand-feature {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255,255,255,0.7);
  font-size: 0.875rem;
  font-weight: 500;
}

.brand-feature__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(74, 127, 212, 1);
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(74, 127, 212, 0.25);
}

.brand-footer {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.04em;
  margin-top: auto;
}

/* Geo dekoracije */
.geo {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.geo--circle-lg {
  width: 360px;
  height: 360px;
  border: 1px solid rgba(255,255,255,0.06);
  bottom: -120px;
  right: -100px;
}

.geo--circle-sm {
  width: 180px;
  height: 180px;
  border: 1px solid rgba(255,255,255,0.08);
  bottom: -20px;
  right: 20px;
}

.geo--line {
  width: 1px;
  height: 100%;
  top: 0;
  right: 0;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255,255,255,0.1) 30%,
    rgba(255,255,255,0.1) 70%,
    transparent
  );
  border-radius: 0;
}

/* ── Form (right) ────────────────────────────────────── */
.login-form-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 48px 24px;
}

.login-form-wrap {
  width: 100%;
  max-width: 400px;
}

.form-header {
  margin-bottom: 40px;
}

.form-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0a1628;
  letter-spacing: -0.03em;
  margin: 0 0 8px;
  line-height: 1.1;
}

.form-subtitle {
  font-size: 0.9rem;
  color: #5a6a85;
  margin: 0;
  line-height: 1.5;
}

/* Fields */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #16294e;
}

.field-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 52px;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-input-wrap--focus {
  border-color: #16294e;
  box-shadow: 0 0 0 3px rgba(22, 41, 78, 0.08);
}

.field-input-icon {
  color: #94a3b8;
  flex-shrink: 0;
  transition: color 0.2s;
}

.field-input-wrap--focus .field-input-icon {
  color: #16294e;
}

.field-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  color: #0a1628;
  font-family: inherit;
}

.field-input::placeholder {
  color: #cbd5e1;
}

.field-toggle {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  align-items: center;
  transition: color 0.2s;
  flex-shrink: 0;
}

.field-toggle:hover {
  color: #16294e;
}

/* Error */
.form-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 10px;
  color: #be123c;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Submit */
.form-submit {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #16294e 0%, #2a4f96 100%);
  color: white;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  box-shadow: 0 8px 24px rgba(22, 41, 78, 0.28);
}

.form-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 32px rgba(22, 41, 78, 0.36);
}

.form-submit:active:not(:disabled) {
  transform: translateY(0);
}

.form-submit--loading {
  opacity: 0.8;
  cursor: not-allowed;
}

.form-submit__spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }

  .login-brand {
    width: 100%;
    min-height: 220px;
  }

  .brand-inner {
    padding: 32px 24px;
  }

  .brand-headline h1 {
    font-size: 1.8rem;
  }

  .brand-features {
    display: none;
  }

  .brand-footer {
    display: none;
  }

  .login-form-side {
    padding: 40px 24px;
  }
}
</style>
