<template>
  <q-page class="dashboard-page q-pa-lg">
    <div class="page-shell">
      <section class="hero-section q-mb-xl">
        <div class="hero-eyebrow">XP · SUSTAV NABAVE</div>

        <div class="hero-title">
          Dobrodošao{{ user ? `, ${user.first_name}` : '' }}
        </div>

        <div class="hero-subtitle">
          Odaberite jednu od glavnih akcija za nastavak rada u sustavu.
        </div>
      </section>

      <section class="row q-col-gutter-lg">
        <div class="col-12 col-md-6">
          <div
            class="action-card action-card--primary cursor-pointer"
            @click="$router.push('/requests/new')"
          >
            <div class="action-card__icon action-card__icon--blue">
              <q-icon name="add_shopping_cart" size="22px" />
            </div>

            <div class="action-card__title">
              Novi zahtjev za nabavu
            </div>

            <div class="action-card__desc">
              Pokrenite novi zahtjev i prođite kroz korake unosa podataka.
            </div>

            <div class="action-card__cta">
              <span>Započni</span>
              <q-icon name="arrow_forward" size="16px" />
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <div
            class="action-card cursor-pointer"
            @click="$router.push('/requests')"
          >
            <div class="action-card__icon action-card__icon--neutral">
              <q-icon name="description" size="22px" />
            </div>

            <div class="action-card__title">
              Pregled zahtjeva
            </div>

            <div class="action-card__desc">
              Pregledajte postojeće zahtjeve, status i nastavite rad na njima.
            </div>

            <div class="action-card__cta">
              <span>Otvori pregled</span>
              <q-icon name="arrow_forward" size="16px" />
            </div>
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
  background: #F9FAFB;
  min-height: 100vh;
}

.page-shell {
  max-width: 1000px;
  margin: 0 auto;
  padding-top: 16px;
}

.hero-section {
  padding-top: 8px;
}

.hero-eyebrow {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #9CA3AF;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 10px;
}

.hero-subtitle {
  font-size: 0.95rem;
  color: #6B7280;
  max-width: 520px;
  line-height: 1.6;
}

.action-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 28px;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.action-card:hover {
  border-color: #BFDBFE;
  box-shadow: 0 4px 16px rgba(30, 64, 175, 0.08);
}

.action-card--primary {
  border-color: #DBEAFE;
  background: #FAFEFF;
}

.action-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.action-card__icon--blue {
  background: #EFF6FF;
  color: #1E40AF;
}

.action-card__icon--neutral {
  background: #F3F4F6;
  color: #374151;
}

.action-card__title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

.action-card__desc {
  font-size: 0.875rem;
  color: #6B7280;
  line-height: 1.55;
  flex: 1;
}

.action-card__cta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1E40AF;
  margin-top: 20px;
}
</style>
