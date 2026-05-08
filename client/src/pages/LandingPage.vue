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
          <q-icon name="inventory_2" size="110px" class="module-card__watermark" aria-hidden="true" />
          <div class="module-card__content">
            <div class="module-card__icon">
              <q-icon name="inventory_2" size="28px" />
            </div>
            <div class="module-card__name">Nabava</div>
            <div class="module-card__desc">Upravljanje zahtjevima za nabavu</div>
            <div class="module-card__action">
              <span>Otvori</span>
              <q-icon name="arrow_forward" size="15px" />
            </div>
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
  width: 210px;
  height: 270px;
  padding: 24px;
  background: linear-gradient(150deg, #0078d4 0%, #0067b8 55%, #004e8c 100%);
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: 0 4px 18px rgba(0, 103, 184, 0.28);
  transition: transform 0.18s, box-shadow 0.18s;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 28px rgba(0, 103, 184, 0.4);
}

.module-card__watermark {
  position: absolute;
  right: -18px;
  bottom: -18px;
  color: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.module-card__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.module-card__icon {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  margin-bottom: auto;
}

.module-card__name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.01em;
  margin-bottom: 6px;
}

.module-card__desc {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.45;
  margin-bottom: 18px;
}

.module-card__action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  transition: gap 0.15s;
}

.module-card:hover .module-card__action {
  gap: 8px;
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
