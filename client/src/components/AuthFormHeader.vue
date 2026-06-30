<template>
  <div class="auth-form-header">
    <button
      type="button"
      class="auth-form-header__back"
      :class="{ 'auth-form-header__back--hidden': !showBack }"
      :disabled="!showBack"
      @click="$emit('back')"
    >
      <q-icon name="arrow_back" size="16px" />
      <span>{{ backText }}</span>
    </button>

    <h1 :id="titleId" class="auth-form-header__title">{{ title }}</h1>
    <p class="auth-form-header__subtitle">{{ subtitle }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  backText: { type: String, default: '' },
  titleId: { type: String, default: 'auth-form-title' },
});

defineEmits(['back']);
</script>

<style scoped>
/* Jedan izvor istine za naslov/podnaslov auth ekrana (login, set-password).
   Back-link je uvijek renderiran (skriven kad nije potreban) da naslov
   počinje na identičnoj Y-poziciji na svim koracima/ekranima. */

.auth-form-header__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 16px;
  margin-bottom: 16px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #4b5563;
  font: inherit;
  font-size: 0.8125rem;
  line-height: 16px;
  cursor: pointer;
  transition: color 0.15s;
}

.auth-form-header__back:hover { color: #111827; }

.auth-form-header__back--hidden {
  visibility: hidden;
  pointer-events: none;
}

.auth-form-header__back span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-form-header__title {
  margin: 0 0 6px;
  color: #16294e;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.2;
  text-align: center;
}

.auth-form-header__subtitle {
  margin: 0 0 22px;
  color: #6b7280;
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
}
</style>
