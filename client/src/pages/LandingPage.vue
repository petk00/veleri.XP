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
          <div class="module-card__top">
            <div class="module-card__icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Document body -->
                <rect x="3" y="1" width="16" height="21" rx="2.5" fill="white" fill-opacity="0.18" stroke="white" stroke-opacity="0.7" stroke-width="1.3"/>
                <!-- Folded corner -->
                <path d="M15 1 L19 5 L15 5 Z" fill="white" fill-opacity="0.35"/>
                <path d="M15 1 L19 5 H15 V1 Z" stroke="white" stroke-opacity="0.5" stroke-width="0.8"/>
                <!-- Line items -->
                <line x1="7" y1="10" x2="15" y2="10" stroke="white" stroke-opacity="0.85" stroke-width="1.2" stroke-linecap="round"/>
                <line x1="7" y1="13.5" x2="16" y2="13.5" stroke="white" stroke-opacity="0.6" stroke-width="1.2" stroke-linecap="round"/>
                <line x1="7" y1="17" x2="13" y2="17" stroke="white" stroke-opacity="0.4" stroke-width="1.2" stroke-linecap="round"/>
                <!-- Approval circle badge -->
                <circle cx="21" cy="21" r="6.5" fill="white" fill-opacity="0.15" stroke="white" stroke-opacity="0.65" stroke-width="1.1"/>
                <path d="M18.2 21.2 L20.4 23.4 L24.2 18.8" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="module-card__badge">Modul</span>
          </div>
          <div class="module-card__name">Nabava</div>
          <div class="module-card__desc">Upravljanje zahtjevima za nabavu materijala i usluga</div>
          <div class="module-card__action">
            <span>Otvori modul</span>
            <q-icon name="arrow_forward" size="14px" />
          </div>
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
  gap: 20px;
  justify-content: center;
}

.module-card {
  all: unset;
  position: relative;
  width: 264px;
  padding: 28px 24px 24px;
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.92);
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow:
    0 8px 24px rgba(0, 67, 150, 0.09),
    0 2px 6px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.module-card::before {
  content: '';
  position: absolute;
  top: -60px;
  left: -40px;
  width: 160px;
  height: 160px;
  background: radial-gradient(circle, rgba(0, 103, 184, 0.07), transparent 70%);
  pointer-events: none;
}

.module-card:hover {
  transform: translateY(-6px);
  box-shadow:
    0 20px 48px rgba(0, 67, 150, 0.14),
    0 4px 12px rgba(0, 0, 0, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.module-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.module-card__icon {
  display: flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #0078d4 0%, #0067b8 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 103, 184, 0.35);
  flex-shrink: 0;
}

.module-card__badge {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0067b8;
  background: rgba(0, 103, 184, 0.09);
  padding: 3px 8px;
  border-radius: 20px;
}

.module-card__name {
  font-size: 1.375rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 8px;
}

.module-card__desc {
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 28px;
  flex: 1;
}

.module-card__action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0067b8;
  transition: gap 0.15s;
}

.module-card:hover .module-card__action {
  gap: 9px;
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
