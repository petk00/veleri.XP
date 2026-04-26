<template>
  <q-page class="dashboard-page q-pa-lg">
    <div class="page-shell">
      <section class="hero-section">
        <div class="hero-eyebrow">XP · SUSTAV NABAVE</div>
        <div class="hero-title">
          Dobrodošao{{ user ? `, ${user.first_name}` : '' }}
        </div>
        <div class="hero-subtitle">
          Odaberite jednu od glavnih akcija za nastavak rada u sustavu.
        </div>
      </section>

      <section class="cards-row">
        <div
          class="action-card action-card--primary cursor-pointer"
          @click="$router.push('/requests/new')"
        >
          <div class="action-card__icon action-card__icon--blue">
            <q-icon name="add_shopping_cart" size="22px" />
          </div>
          <div class="action-card__body">
            <div class="action-card__title">Novi zahtjev za nabavu</div>
            <div class="action-card__desc">
              Pokrenite novi zahtjev i prođite kroz korake unosa podataka.
            </div>
          </div>
          <div class="action-card__arrow">
            <q-icon name="chevron_right" size="20px" />
          </div>
        </div>

        <div
          class="action-card cursor-pointer"
          @click="$router.push('/requests')"
        >
          <div class="action-card__icon action-card__icon--neutral">
            <q-icon name="description" size="22px" />
          </div>
          <div class="action-card__body">
            <div class="action-card__title">Pregled zahtjeva</div>
            <div class="action-card__desc">
              Pregledajte postojeće zahtjeve, status i nastavite rad na njima.
            </div>
          </div>
          <div class="action-card__arrow">
            <q-icon name="chevron_right" size="20px" />
          </div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { getStoredUser } from 'src/utils/authStorage';

const user = getStoredUser();
</script>

<style scoped>
.dashboard-page {
  background: #F5F5F7;
  min-height: 100vh;
}

.page-shell {
  max-width: 860px;
  margin: 0 auto;
  padding-top: 20px;
}

.hero-section {
  margin-bottom: 36px;
}

.hero-eyebrow {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #86868B;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.hero-title {
  font-size: 2.4rem;
  font-weight: 700;
  color: #1D1D1F;
  letter-spacing: -0.04em;
  line-height: 1.1;
  margin-bottom: 12px;
}

.hero-subtitle {
  font-size: 0.95rem;
  color: #6E6E73;
  line-height: 1.55;
  max-width: 480px;
}

.cards-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 18px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 28px rgba(0, 0, 0, 0.06);
  padding: 22px 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.05),
    0 16px 40px rgba(0, 0, 0, 0.1);
}

.action-card:active {
  transform: scale(0.99);
}

.action-card--primary {
  border-color: rgba(0, 175, 219, 0.2);
}

.action-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-card__icon--blue {
  background: linear-gradient(145deg, #00AFDB, #0099c4);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 175, 219, 0.3);
}

.action-card__icon--neutral {
  background: #F5F5F7;
  color: #16294E;
  border: 0.5px solid rgba(0,0,0,0.08);
}

.action-card__body {
  flex: 1;
}

.action-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: #1D1D1F;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.action-card__desc {
  font-size: 0.85rem;
  color: #6E6E73;
  line-height: 1.45;
}

.action-card__arrow {
  color: #AEAEB2;
  flex-shrink: 0;
}
</style>
