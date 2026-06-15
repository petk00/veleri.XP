<template>
  <q-page class="landing">

    <main class="landing__body">
      <div class="landing__intro">
        <div class="landing__greeting">Dobrodošli, {{ user?.first_name || 'korisniče' }}</div>
      </div>

      <div class="modules">
        <div class="module-tile">
          <button class="module-card" @click="$router.push('/dashboard')">
            <q-icon name="shopping_cart" size="28px" />
          </button>
          <div class="module-card__name">Modul nabava</div>
        </div>
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

.module-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.module-card {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background: #0067b8;
  color: #fff;
  border-radius: 18px;
  cursor: pointer;
  box-shadow:
    0 2px 8px rgba(0, 67, 150, 0.18),
    0 8px 24px rgba(0, 67, 150, 0.18);
  transition: box-shadow 0.18s, transform 0.18s;
}

.module-card:hover {
  box-shadow:
    0 4px 14px rgba(0, 67, 150, 0.28),
    0 12px 32px rgba(0, 67, 150, 0.22);
  transform: translateY(-2px);
}

.module-card__name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
  text-align: center;
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .landing__greeting {
    font-size: 1.5rem;
  }

  .module-card {
    width: 64px;
    height: 64px;
  }
}
</style>
