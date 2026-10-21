<script setup lang="ts">
const { type = 'button' } = defineProps<{
  type?: 'button' | 'submit' | 'reset'
}>()

const button = useTemplateRef<HTMLButtonElement>('button')

function focus() {
  button.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <button ref="button" :type="type" class="newsletter-button">
    <slot />
  </button>
</template>

<style scoped>
.newsletter-button {
  width: 100%;
  min-height: 56px;
  padding: 16px;
  border: 0;
  border-radius: 8px;
  background: var(--color-blue-800);
  color: white;
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: 0;
  cursor: pointer;
}

.newsletter-button:hover {
  background: var(--color-red-gradient);
  box-shadow: 0 16px 32px var(--color-red-shadow);
}

.newsletter-button:focus-visible {
  outline: 2px solid var(--color-blue-800);
  outline-offset: 4px;
}
</style>
