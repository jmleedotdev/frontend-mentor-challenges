<script setup lang="ts">
defineProps<{ difficulty: Difficulty }>()

const swatchClass: Record<Difficulty, string> = {
  1: 'bg-cyan-500',
  2: 'bg-emerald-500',
  3: 'bg-amber-400',
  4: 'bg-orange-500',
  5: 'bg-rose-600',
}
</script>

<template>
  <span class="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
    <span aria-hidden="true" class="size-3 rounded-xs" :class="swatchClass[difficulty]" />
    {{ DIFFICULTY_LABELS[difficulty] }}
  </span>
</template>
