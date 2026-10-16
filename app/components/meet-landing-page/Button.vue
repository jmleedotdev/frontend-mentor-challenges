<script setup lang="ts">
const { variant = 'cyan', href = undefined } = defineProps<{
  variant?: 'cyan' | 'purple'
  href?: string
}>()
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :type="href ? undefined : 'button'"
    class="meet-button inline-flex cursor-pointer items-center justify-center gap-1 rounded-full px-10 py-4 text-base leading-normal font-black whitespace-nowrap text-white focus-visible:outline-2 focus-visible:outline-offset-4"
    :data-variant="variant"
  >
    <slot />
  </component>
</template>

<style scoped>
.meet-button {
  background-color: var(--color-cyan-600);
  --button-hover: var(--cyan-hover);
  --button-accent: var(--color-cyan-300);
  outline-color: var(--color-slate-900);
}

.meet-button[data-variant='purple'] {
  background-color: var(--color-purple-600);
  --button-hover: var(--purple-hover);
  --button-accent: var(--color-purple-300);
}

@media (hover: hover) {
  .meet-button:hover {
    background-color: var(--button-hover);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .meet-button {
    transition: background-color 150ms ease;
  }
}
</style>
