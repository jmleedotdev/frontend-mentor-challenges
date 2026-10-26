<script setup lang="ts">
import type { FrontendQuiz } from '#shared/types/frontend-quiz'

defineProps<{ subject: Pick<FrontendQuiz, 'title' | 'icon'> }>()

const subjectColors: Record<string, string> = {
  HTML: 'orange',
  CSS: 'green',
  JavaScript: 'blue',
  Accessibility: 'purple',
}
</script>

<template>
  <span class="subject-label">
    <span class="subject-icon" :class="`subject-icon--${subjectColors[subject.title] ?? 'purple'}`">
      <img :src="subject.icon" alt="" />
    </span>

    <span>{{ subject.title }}</span>
  </span>
</template>

<style scoped>
.subject-label {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
  overflow-wrap: anywhere;
}

.subject-icon {
  display: grid;
  flex: 0 0 40px;
  place-items: center;
  height: 40px;
  border-radius: 6px;
}

.subject-icon img {
  width: 32px;
  height: 32px;
}

.subject-icon--orange {
  background: var(--color-orange-50);
}

.subject-icon--green {
  background: var(--color-green-100);
}

.subject-icon--blue {
  background: var(--color-blue-50);
}

.subject-icon--purple {
  background: var(--color-purple-100);
}

@media (min-width: 48rem) {
  .subject-label {
    gap: 24px;
    font-size: 28px;
  }

  .subject-icon {
    flex-basis: 56px;
    height: 56px;
    border-radius: 12px;
  }

  .subject-icon img {
    width: 40px;
    height: 40px;
  }
}
</style>
