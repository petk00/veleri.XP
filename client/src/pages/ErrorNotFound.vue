<template>
  <div class="not-found">

    <!-- Puni navbar ako je korisnik ulogiran — može normalno nastaviti navigirati -->
    <header v-if="user" class="topbar">
      <button class="brand" @click="$router.push('/')">
        <img src="/veleri_logo_solo.svg" alt="Veleučilište u Rijeci" class="brand__logo" />
        <span class="brand__name">
          <span style="color: #1b2d59">nabava</span><span style="color: #00afdb">.XP</span>
        </span>
      </button>

      <div class="topbar-divider" />

      <nav class="topbar-nav">
        <button class="nav-item" @click="$router.push('/novizahtjev')">
          <img src="/solarlinear_NOVIZAHTJEV.svg" width="20" height="20" class="nav-item__icon" />
          <span>Novi zahtjev</span>
        </button>
        <button class="nav-item" @click="$router.push('/zahtjevi')">
          <img src="/solarlinear_MOJIZAHTJEVI.svg" width="20" height="20" class="nav-item__icon" />
          <span>Zahtjevi</span>
        </button>
        <template v-if="isAdmin">
          <button class="nav-item" @click="$router.push('/financije')">
            <img src="/solarlinear_FINANCIRANJE.svg" width="20" height="20" class="nav-item__icon" />
            <span>Financije</span>
          </button>
          <div class="nav-sep" />
          <button class="nav-item" @click="$router.push('/korisnici')">
            <img src="/solarlinear_KORISNICI.svg" width="20" height="20" class="nav-item__icon" />
            <span>Korisnici</span>
          </button>
        </template>
      </nav>

      <div class="topbar-spacer" />

      <div class="avatar" :style="{ background: avatarColor }">{{ initials }}</div>
    </header>

    <!-- Minimalni brand header ako korisnik nije ulogiran -->
    <header v-else class="not-found__header">
      <img src="/veleri_logo_solo.svg" alt="Veleučilište u Rijeci" class="not-found__logo" />
      <span class="not-found__brand-name">
        <span style="color: #1b2d59">nabava</span><span style="color: #00afdb">.XP</span>
      </span>
    </header>

    <main class="not-found__body">
      <div class="not-found__code" aria-hidden="true">404</div>
      <h1 class="not-found__title">Stranica nije pronađena</h1>
      <p class="not-found__desc">
        Stranica koju tražite ne postoji ili je premještena.
      </p>
      <div class="not-found__actions">
        <button class="not-found__cta" type="button" @click="$router.push('/')">
          <q-icon name="home" size="18px" />
          <span>Natrag na početnu</span>
        </button>
        <button class="not-found__secondary" type="button" @click="$router.push('/zahtjevi')">
          Natrag na zahtjeve
        </button>
      </div>
    </main>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getStoredUser } from 'src/utils/authStorage';

const user = computed(() => getStoredUser());
const isAdmin = computed(() => user.value?.role_name === 'Administrator');

const initials = computed(() => {
  if (!user.value) return '?';
  const first = user.value.first_name?.[0] || '';
  const last = user.value.last_name?.[0] || '';
  return `${first}${last}`.toUpperCase();
});

const avatarColor = computed(() => {
  const palette = ['#1b2d59', '#00afdb', '#0e7490', '#1d4ed8', '#2563eb', '#0891b2', '#16294e', '#0369a1'];
  const str = (user.value?.first_name || '') + (user.value?.last_name || '');
  const idx = [...str].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % palette.length;
  return palette[idx];
});
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 10% 12%, rgba(0, 175, 219, 0.10), transparent 32%),
    radial-gradient(circle at 90% 82%, rgba(27, 45, 89, 0.08), transparent 32%),
    #f8f9fa;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Navbar (ulogirani korisnik) — isti brand jezik kao MainLayout ── */
.topbar {
  display: flex;
  align-items: stretch;
  height: 52px;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.brand {
  all: unset;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0 4px;
  transition: opacity 0.12s;
}
.brand:hover { opacity: 0.72; }
.brand__logo { width: 28px; height: 28px; object-fit: contain; display: block; }
.brand__name {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  white-space: nowrap;
  line-height: 1;
}
.topbar-divider { width: 1px; background: #e5e7eb; margin: 10px 20px; flex-shrink: 0; }
.topbar-nav { display: flex; align-items: stretch; gap: 2px; }
.nav-item {
  all: unset;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1b2d59;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.12s, background 0.12s;
}
.nav-item:hover { color: #00afdb; background: rgba(0, 175, 219, 0.06); }
.nav-item__icon { opacity: 0.6; flex-shrink: 0; }
.nav-sep { width: 1px; background: #e5e7eb; margin: 12px 6px; flex-shrink: 0; }
.topbar-spacer { flex: 1; }
.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  align-self: center;
}

/* ── Minimalni header (neulogiran korisnik) ── */
.not-found__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 28px 40px;
  flex-shrink: 0;
}
.not-found__logo { width: 32px; height: 32px; object-fit: contain; }
.not-found__brand-name {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

/* ── Body ── */
.not-found__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px 100px;
  text-align: center;
}

.not-found__code {
  font-size: 8rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  margin-bottom: 20px;
  user-select: none;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #16294e 0%, #00afdb 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.not-found__title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #16294e;
  letter-spacing: -0.02em;
  margin: 0 0 10px;
}

.not-found__desc {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.5;
  max-width: 380px;
  margin: 0 0 32px;
}

.not-found__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.not-found__cta {
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 26px;
  border-radius: 10px;
  background: linear-gradient(135deg, #16294e 0%, #00afdb 100%);
  color: #ffffff;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  box-sizing: border-box;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.not-found__cta:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 175, 219, 0.35);
}

.not-found__secondary {
  all: unset;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0e7490;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.12s, color 0.12s;
}
.not-found__secondary:hover {
  background: rgba(0, 175, 219, 0.08);
  color: #00afdb;
}
</style>
