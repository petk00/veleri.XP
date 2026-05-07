<template>
  <q-page class="landing">

    <header class="landing__header">
      <img src="/veleri-logo-horizontal.png" alt="Veleučilište u Rijeci" class="landing__logo" />
      <span class="landing__divider" aria-hidden="true" />
      <span class="landing__product">veleri.XP</span>
    </header>

    <main class="landing__body">
      <div class="landing__intro">
        <div class="landing__greeting">Dobrodošli, {{ user?.first_name || 'korisniče' }}</div>
        <div class="landing__hint">Odaberite modul za nastavak</div>
      </div>

      <div class="modules">
        <button class="module-card" @click="$router.push('/dashboard')">
          <div class="module-card__icon-wrap">
            <q-icon name="inventory_2" size="28px" />
          </div>
          <div class="module-card__body">
            <div class="module-card__name">Nabava</div>
            <div class="module-card__desc">Upravljanje zahtjevima za nabavu</div>
          </div>
          <q-icon name="chevron_right" size="20px" class="module-card__arrow" />
        </button>
      </div>
    </main>

    <footer class="landing__footer">
      <button class="logout-btn" @click="logout">
        <q-icon name="logout" size="14px" />
        <span>Odjava</span>
      </button>
    </footer>

  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { getStoredUser } from 'src/utils/authStorage';

const router = useRouter();
const user = getStoredUser();

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.replace('/login');
};
</script>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background:
    radial-gradient(circle at 10% 15%, rgba(219, 243, 255, 0.55), transparent 30%),
    radial-gradient(circle at 88% 80%, rgba(255, 244, 249, 0.6), transparent 30%),
    linear-gradient(135deg, #fbfdff 0%, #f7f5fb 55%, #fffdfb 100%);
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Header ── */
.landing__header {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 28px 40px;
  width: 100%;
  box-sizing: border-box;
}

.landing__logo {
  display: block;
  width: 130px;
  height: auto;
  object-fit: contain;
}

.landing__divider {
  width: 1px;
  height: 22px;
  background: #1a1a1a;
  margin: 0 22px;
  flex-shrink: 0;
}

.landing__product {
  color: #1a1a1a;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* ── Body ── */
.landing__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px 48px;
  width: 100%;
  box-sizing: border-box;
}

.landing__intro {
  text-align: center;
  margin-bottom: 40px;
}

.landing__greeting {
  font-size: 1.75rem;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 8px;
}

.landing__hint {
  font-size: 0.9375rem;
  color: #6b7280;
}

/* ── Module cards ── */
.modules {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.module-card {
  all: unset;
  display: flex;
  align-items: center;
  gap: 16px;
  width: 320px;
  padding: 20px 20px 20px 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.module-card:hover {
  border-color: #1a1a1a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.module-card__icon-wrap {
  display: flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f9fafb;
  color: #0067b8;
  transition: background 0.15s, border-color 0.15s;
}

.module-card:hover .module-card__icon-wrap {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.module-card__body {
  flex: 1;
  min-width: 0;
}

.module-card__name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 3px;
}

.module-card__desc {
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.4;
}

.module-card__arrow {
  color: #9ca3af;
  flex-shrink: 0;
  transition: color 0.15s, transform 0.15s;
}

.module-card:hover .module-card__arrow {
  color: #1a1a1a;
  transform: translateX(2px);
}

/* ── Footer ── */
.landing__footer {
  padding: 20px 40px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: flex-end;
}

.logout-btn {
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 3px;
  color: #9ca3af;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.logout-btn:hover {
  color: #374151;
  background: rgba(0, 0, 0, 0.04);
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .landing__header {
    padding: 20px 20px;
  }

  .landing__greeting {
    font-size: 1.375rem;
  }

  .module-card {
    width: 100%;
    max-width: 360px;
  }

  .landing__footer {
    padding: 16px 20px;
  }
}
</style>
