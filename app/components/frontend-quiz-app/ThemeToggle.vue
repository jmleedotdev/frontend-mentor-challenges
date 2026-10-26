<script setup lang="ts">
defineProps<{ isDark: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    role="switch"
    aria-label="Dark mode"
    :aria-checked="isDark"
    @click="$emit('toggle')"
  >
    <span class="theme-icon" aria-hidden="true">
      <img class="light-theme-icon" src="/img/frontend-quiz-app/icon-sun-dark.svg" alt="" />
      <img class="dark-theme-icon" src="/img/frontend-quiz-app/icon-sun-light.svg" alt="" />
    </span>

    <span class="toggle-track" aria-hidden="true">
      <span class="toggle-thumb" />
    </span>

    <span class="theme-icon" aria-hidden="true">
      <img class="light-theme-icon" src="/img/frontend-quiz-app/icon-moon-dark.svg" alt="" />
      <img class="dark-theme-icon" src="/img/frontend-quiz-app/icon-moon-light.svg" alt="" />
    </span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
}

.theme-toggle:focus-visible {
  outline: 3px solid var(--color-purple-600);
  outline-offset: 4px;
}

.theme-icon {
  display: grid;
  grid-template-columns: 100%;
  place-items: center;
  width: 16px;
  height: 16px;
}

.theme-icon img {
  grid-area: 1 / 1;
  width: 100%;
  height: 100%;
}

.light-theme-icon {
  display: var(--light-icon-display);
}

.dark-theme-icon {
  display: var(--dark-icon-display);
}

.toggle-track {
  width: 32px;
  height: 20px;
  padding: 4px;
  border-radius: 999px;
  background: var(--color-purple-600);
}

.toggle-thumb {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  transform: translateX(var(--thumb-position));
}

@media (min-width: 48rem) {
  .theme-toggle {
    gap: 16px;
  }

  .theme-icon {
    width: 24px;
    height: 24px;
  }

  .toggle-track {
    width: 48px;
    height: 28px;
  }

  .toggle-thumb {
    width: 20px;
    height: 20px;
  }
}
</style>
