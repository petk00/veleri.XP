<template>
  <div class="not-found">

    <header class="not-found__header">
      <img src="/veleri-logo-horizontal.png" alt="Veleučilište u Rijeci" class="not-found__logo" />
      <span class="not-found__divider" aria-hidden="true" />
      <span class="not-found__product">XP</span>
    </header>

    <main class="not-found__body">
      <div class="not-found__code">404</div>
      <h1 class="not-found__title">Stranica nije pronađena</h1>
      <p class="not-found__desc">
        Adresa koju ste upisali ne postoji ili je sadržaj premješten.
      </p>
      <button class="not-found__btn" @click="$router.push('/dashboard')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Natrag na početak</span>
      </button>
    </main>

  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 10% 15%, rgba(219, 243, 255, 0.55), transparent 30%),
    radial-gradient(circle at 88% 80%, rgba(255, 244, 249, 0.6), transparent 30%),
    linear-gradient(135deg, #fbfdff 0%, #f7f5fb 55%, #fffdfb 100%);
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.not-found__header {
  display: flex;
  align-items: center;
  padding: 28px 40px;
}

.not-found__logo {
  width: 130px;
  height: auto;
  object-fit: contain;
}

.not-found__divider {
  width: 1px;
  height: 22px;
  background: #1a1a1a;
  margin: 0 22px;
  flex-shrink: 0;
}

.not-found__product {
  color: #1a1a1a;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.not-found__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px 80px;
  text-align: center;
}

.not-found__code {
  font-size: 7rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  color: #e5e7eb;
  font-variant-numeric: tabular-nums;
  margin-bottom: 24px;
  user-select: none;
}

.not-found__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
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

.not-found__btn {
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 20px;
  background: #111827;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s;
}

.not-found__btn:hover {
  background: #000;
}
</style>
