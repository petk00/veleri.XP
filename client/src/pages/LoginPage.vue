<template>
  <q-page class="login-page">

    <!-- ─────────────────────────────────
         LEFT — Brand panel (navy)
         ───────────────────────────────── -->
    <aside class="brand-panel">
      <div class="brand-panel__inner">

        <!-- Brand mark -->
        <div class="brand-mark">
          <img src="/logo.png" alt="Veleučilište u Rijeci" class="brand-mark__square" />
          <div class="brand-mark__text">
            <span class="brand-mark__name">veleri.XP</span>
            <span class="brand-mark__sub">Veleučilište u Rijeci</span>
          </div>
        </div>

        <!-- Headline -->
        <div class="brand-headline">
          <h1>Sustav<br>nabave</h1>
          <p>Digitalna platforma za upravljanje i prikupljanje zahtjeva za nabavu</p>
        </div>

        <!-- Footer -->
        <div class="brand-footer">
          © {{ currentYear }} Veleučilište u Rijeci
        </div>

      </div>
    </aside>

    <!-- ─────────────────────────────────
         RIGHT — Form panel
         ───────────────────────────────── -->
    <section class="form-panel">
      <div class="form-panel__inner">

        <header class="form-header">
          <h2>Prijava u sustav</h2>
          <p>Prijavite se s vašim Veleri korisničkim podacima.</p>
        </header>

        <form class="login-form" @submit.prevent="handleLogin">

          <!-- Email -->
          <div class="field">
            <label for="login-email">E-mail adresa</label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              class="input"
              placeholder="username@veleri.hr"
              autocomplete="username"
              :disabled="loading"
            />
          </div>

          <!-- Password with toggle -->
          <div class="field">
            <label for="login-password">Lozinka</label>
            <div class="input-with-action">
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input"
                placeholder="••••••••"
                autocomplete="current-password"
                :disabled="loading"
              />
              <button
                type="button"
                class="input-toggle"
                tabindex="-1"
                :title="showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'"
                @click="showPassword = !showPassword"
              >
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  size="18px"
                />
              </button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="errorMessage" class="form-error" role="alert">
            <q-icon name="error_outline" size="16px" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="submit-btn"
            :disabled="loading"
          >
            <q-spinner v-if="loading" size="18px" color="white" />
            <span v-else>Prijavi se</span>
          </button>

        </form>

        <div class="form-help">
          Nemate pristup?
          <span class="form-help__highlight">
            Obratite se administratoru sustava
          </span>
          radi pozivnice za registraciju.
        </div>

      </div>
    </section>

  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'boot/axios';

const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const currentYear = computed(() => new Date().getFullYear());

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
/* ─────────────────────────────────────
   PAGE — split layout
   ───────────────────────────────────── */
.login-page {
  display: flex;
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ─────────────────────────────────────
   LEFT — Brand panel
   ───────────────────────────────────── */
.brand-panel {
  width: 45%;
  flex-shrink: 0;
  background: #16294E;
  position: relative;
  overflow: hidden;
}

/* Subtilna cyan akcent linija na desnom rubu */
.brand-panel::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    transparent,
    #00AFDB 30%,
    #00AFDB 70%,
    transparent
  );
}

.brand-panel__inner {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 56px 56px 40px;
  position: relative;
  z-index: 1;
}

/* Brand mark */
.brand-mark {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark__square {
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex-shrink: 0;
  background: white;
  border-radius: 6px;
  padding: 4px;
  box-sizing: border-box;
}

.brand-mark__text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-mark__name {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  letter-spacing: -0.005em;
}

.brand-mark__sub {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 2px;
}

/* Headline */
.brand-headline {
  margin: 56px 0;
}

.brand-headline h1 {
  font-size: 2.75rem;
  font-weight: 600;
  color: white;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
}

.brand-headline p {
  font-size: 0.9375rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.55;
  margin: 0;
  max-width: 420px;
}

/* Footer */
.brand-footer {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.02em;
}

/* ─────────────────────────────────────
   RIGHT — Form panel
   ───────────────────────────────────── */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F5;
  padding: 48px 32px;
}

.form-panel__inner {
  width: 100%;
  max-width: 380px;
}

/* Header */
.form-header {
  margin-bottom: 32px;
}

.form-header h2 {
  font-size: 1.625rem;
  font-weight: 600;
  color: #16294E;
  letter-spacing: -0.015em;
  margin: 0 0 6px;
  line-height: 1.2;
}

.form-header p {
  font-size: 0.875rem;
  color: #605E5C;
  line-height: 1.5;
  margin: 0;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #424242;
  letter-spacing: 0.01em;
}

.input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-family: inherit;
  font-size: 0.875rem;
  color: #201F1E;
  background: white;
  border: 1px solid #C8C6C4;
  border-radius: 4px;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
}

.input::placeholder {
  color: #A19F9D;
}

.input:hover:not(:disabled) {
  border-color: #605E5C;
}

.input:focus {
  border-color: #16294E;
  box-shadow: 0 0 0 1px #16294E;
}

.input:disabled {
  background: #FAFAFA;
  color: #A19F9D;
  cursor: not-allowed;
}

/* Input with action button (password visibility) */
.input-with-action {
  position: relative;
}

.input-with-action .input {
  padding-right: 38px;
}

.input-toggle {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #605E5C;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.input-toggle:hover {
  background: #F3F2F1;
  color: #201F1E;
}

/* Error */
.form-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #FDE7E9;
  border: 1px solid #F1B0B7;
  border-radius: 4px;
  color: #A4262C;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.4;
}

.form-error .q-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

/* Submit */
.submit-btn {
  width: 100%;
  height: 38px;
  margin-top: 4px;
  border: 1px solid #16294E;
  border-radius: 4px;
  background: #16294E;
  color: white;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  background: #0F1F3D;
  border-color: #0F1F3D;
}

.submit-btn:active:not(:disabled) {
  background: #091538;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Help text */
.form-help {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #E1DFDD;
  font-size: 0.75rem;
  color: #605E5C;
  line-height: 1.6;
  text-align: center;
}

.form-help__highlight {
  color: #16294E;
  font-weight: 500;
}

/* ─────────────────────────────────────
   Responsive
   ───────────────────────────────────── */
@media (max-width: 900px) {
  .brand-panel__inner {
    padding: 40px 36px 32px;
  }
  .brand-headline {
    margin: 40px 0;
  }
  .brand-headline h1 {
    font-size: 2.25rem;
  }
}

@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }
  .brand-panel {
    width: 100%;
    min-height: 200px;
  }
  .brand-panel::after {
    top: auto;
    right: 0;
    left: 0;
    bottom: 0;
    width: auto;
    height: 2px;
    background: linear-gradient(
      to right,
      transparent,
      #00AFDB 30%,
      #00AFDB 70%,
      transparent
    );
  }
  .brand-panel__inner {
    padding: 32px 24px 24px;
  }
  .brand-mark__square {
    width: 40px;
    height: 40px;
  }
  .brand-headline {
    margin: 24px 0 16px;
  }
  .brand-headline h1 {
    font-size: 1.5rem;
  }
  .brand-headline p {
    font-size: 0.875rem;
  }
  .brand-footer {
    display: none;
  }
  .form-panel {
    padding: 32px 24px 48px;
  }
}
</style>
