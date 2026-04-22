<template>
  <q-page class="dashboard-page q-pa-lg">
    <div class="page-shell">
      <section class="hero-section q-mb-xl">
        <div class="text-overline text-primary text-weight-bold">
          XP · SUSTAV NABAVE
        </div>

        <div class="text-h3 text-weight-bold q-mt-sm hero-title">
          Dobrodošao{{ user ? `, ${user.first_name}` : '' }}
        </div>

        <div class="text-subtitle1 text-grey-7 q-mt-md hero-subtitle">
          Odaberite jednu od glavnih akcija za nastavak rada u sustavu.
        </div>
      </section>

      <section class="row q-col-gutter-lg">
        <div class="col-12 col-md-6">
          <q-card
            class="action-card action-card--primary cursor-pointer"
            flat
            @click="$router.push('/requests/new')"
          >
            <q-card-section class="card-content">
              <div class="icon-wrap bg-primary text-white">
                <q-icon name="add_shopping_cart" size="30px" />
              </div>

              <div class="text-h5 text-weight-bold q-mt-lg">
                Novi zahtjev za nabavu
              </div>

              <div class="text-body1 text-grey-7 q-mt-sm">
                Pokrenite novi zahtjev i prođite kroz korake unosa podataka.
              </div>

              <div class="row items-center q-mt-xl text-primary text-weight-medium">
                <span>Započni</span>
                <q-icon name="arrow_forward" class="q-ml-sm" />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card
            class="action-card cursor-pointer"
            flat
            @click="$router.push('/requests')"
          >
            <q-card-section class="card-content">
              <div class="icon-wrap bg-grey-2 text-primary">
                <q-icon name="description" size="30px" />
              </div>

              <div class="text-h5 text-weight-bold q-mt-lg">
                Pregled zahtjeva
              </div>

              <div class="text-body1 text-grey-7 q-mt-sm">
                Pregledajte postojeće zahtjeve, status i nastavite rad na njima.
              </div>

              <div class="row items-center q-mt-xl text-primary text-weight-medium">
                <span>Otvori pregled</span>
                <q-icon name="arrow_forward" class="q-ml-sm" />
              </div>
            </q-card-section>
          </q-card>
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
  background:
    radial-gradient(circle at top left, rgba(25, 118, 210, 0.08), transparent 28%),
    linear-gradient(180deg, #f8fafc 0%, #f3f6fb 100%);
  min-height: 100vh;
}

.page-shell {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  padding-top: 8px;
}

.hero-title {
  letter-spacing: -0.02em;
}

.hero-subtitle {
  max-width: 700px;
  line-height: 1.6;
}

.action-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  min-height: 280px;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.12);
  border-color: rgba(25, 118, 210, 0.18);
}

.action-card--primary {
  background: linear-gradient(135deg, #ffffff 0%, #f7fbff 100%);
}

.card-content {
  padding: 28px;
}

.icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
