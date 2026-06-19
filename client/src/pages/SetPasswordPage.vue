<template>
  <div class="set-password-wrap">
    <div class="sp-card">

      <div class="sp-card__top">
        <img src="/veleri_logo_solo.svg" alt="veleri.XP" class="sp-logo" />
      </div>

      <template v-if="state === 'form'">
        <h1 class="sp-title">Postavi lozinku</h1>
        <p class="sp-sub">Odaberite lozinku za svoj veleri.XP račun.</p>

        <form class="sp-form" @submit.prevent="submit">
          <div class="field">
            <label class="field-label">Nova lozinka</label>
            <input
              v-model="password"
              type="password"
              class="text-input"
              placeholder="Min. 8 znakova"
              autocomplete="new-password"
              required
            />
          </div>
          <div class="field">
            <label class="field-label">Ponovi lozinku</label>
            <input
              v-model="confirm"
              type="password"
              class="text-input"
              placeholder="Ponovite lozinku"
              autocomplete="new-password"
              required
            />
          </div>
          <div v-if="error" class="form-error">{{ error }}</div>
          <button type="submit" class="btn-primary" :disabled="saving">
            <q-spinner v-if="saving" size="14px" color="white" />
            <span v-else>Postavi lozinku i prijavi se</span>
          </button>
        </form>
      </template>

      <template v-else-if="state === 'success'">
        <div class="sp-result sp-result--ok">
          <q-icon name="check_circle" size="40px" color="green" />
          <h1 class="sp-title">Lozinka je postavljena</h1>
          <p class="sp-sub">Možete se prijaviti u aplikaciju.</p>
          <button class="btn-primary" @click="$router.push('/login')">Idi na prijavu</button>
        </div>
      </template>

      <template v-else-if="state === 'invalid'">
        <div class="sp-result sp-result--err">
          <q-icon name="error_outline" size="40px" color="red" />
          <h1 class="sp-title">Link nije valjan</h1>
          <p class="sp-sub">{{ error }}</p>
          <p class="sp-hint">Zamolite administratora da vam pošalje novi pozivni link.</p>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from 'boot/axios';

const route = useRoute();

const token = ref('');
const password = ref('');
const confirm = ref('');
const error = ref('');
const saving = ref(false);
const state = ref('form'); // 'form' | 'success' | 'invalid'

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
.set-password-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111827;
}

.sp-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-top: 2px solid #0067b8;
  border-radius: 0;
  padding: 36px 36px 40px;
}

.sp-card__top {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.sp-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
}

.sp-title {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
  text-align: center;
}

.sp-sub {
  margin: 0 0 24px;
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  line-height: 1.5;
}

.sp-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.text-input {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  outline: none;
  background: #fff;
  color: #111827;
  font: inherit;
  font-size: 0.9375rem;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.text-input:focus {
  border-color: #0067b8;
  box-shadow: 0 0 0 2px rgba(0,103,184,0.14);
}

.form-error {
  padding: 9px 12px;
  border-left: 3px solid #c50f1f;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.8125rem;
  line-height: 1.4;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: #0067b8;
  color: #fff;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 4px;
}
.btn-primary:hover:not(:disabled) { background: #005a9e; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.sp-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.sp-result .sp-title { margin-top: 8px; }
.sp-result .sp-sub { margin-bottom: 8px; }

.sp-hint {
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 4px;
}

.sp-result .btn-primary {
  margin-top: 12px;
}
</style>
