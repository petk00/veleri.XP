<template>
  <q-page class="landing">

    <main class="landing__body">
      <div class="landing__intro">
        <div class="landing__greeting">Dobrodošli, {{ user?.first_name || 'korisniče' }}</div>
      </div>

      <div class="modules">
        <button class="module-card" @click="$router.push('/dashboard')">
          <div class="module-card__icon">
            <q-icon name="shopping_cart" size="22px" />
          </div>
          <div class="module-card__action">
            <span>Otvori aplikaciju nabave</span>
            <q-icon name="arrow_forward" size="15px" />
          </div>
        </button>
      </div>
    </main>

  </q-page>
</template>

<script setup>
import { getStoredUser } from 'src/utils/authStorage';

const user = getStoredUser();
</script>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111827;
}

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
  margin-bottom: 32px;
}

.landing__greeting {
  font-size: 2rem;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

/* ── Module card ── */
.modules {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.module-card {
  all: unset;
  width: 340px;
  padding: 22px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 8px 32px rgba(0, 67, 150, 0.10);
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  font: inherit;
}

.module-card:hover {
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 16px 48px rgba(0, 67, 150, 0.15);
}

.module-card__icon {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  background: rgba(0, 103, 184, 0.10);
  color: #0067b8;
  border-radius: 12px;
  flex-shrink: 0;
}

.module-card__action {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0067b8;
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .landing__greeting {
    font-size: 1.5rem;
  }

  .module-card {
    width: 100%;
    max-width: 360px;
  }
}
</style>
