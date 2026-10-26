<script setup lang="ts">
import { animate, useReducedMotion } from 'motion-v'
import type { FrontendQuiz } from '#shared/types/frontend-quiz'

const { score } = defineProps<{
  subject: Pick<FrontendQuiz, 'title' | 'icon'>
  score: number
  total: number
}>()
defineEmits<{ restart: [] }>()

const heading = useTemplateRef<HTMLHeadingElement>('heading')
const id = useId()

const reducedMotion = useReducedMotion()
const displayedScore = ref(score)
let animation: { stop: () => void } | undefined

onMounted(() => {
  heading.value?.focus()

  if (reducedMotion.value || score === 0) return

  displayedScore.value = 0
  animation = animate(0, score, {
    duration: 1,
    ease: 'easeOut',
    onUpdate: (value) => {
      displayedScore.value = Math.round(value)
    },
    onComplete: () => {
      displayedScore.value = score
    },
  })
})

onBeforeUnmount(() => animation?.stop())
</script>

<template>
  <section class="results-view" :aria-labelledby="`${id}-results`">
    <h1 :id="`${id}-results`" ref="heading" tabindex="-1">
      Quiz completed <strong>You scored...</strong>
    </h1>

    <div class="results-summary">
      <div class="score-card">
        <FrontendQuizAppSubjectLabel :subject="subject" />
        <p class="score">
          <span class="sr-only">Your score: {{ score }} out of {{ total }}</span>
          <span class="score-value" aria-hidden="true">{{ displayedScore }}</span>
          <span class="score-total" aria-hidden="true">out of {{ total }}</span>
        </p>
      </div>
      <button type="button" class="action-button" @click="$emit('restart')">Play Again</button>
    </div>
  </section>
</template>

<style scoped>
.results-view {
  display: grid;
  gap: 40px;
  margin-top: 48px;
}

h1 {
  min-width: 0;
  font-size: 40px;
  font-weight: 300;
  line-height: 1;
  overflow-wrap: anywhere;
}

h1 strong {
  display: block;
  margin-top: 8px;
  font-weight: 500;
}

h1:focus {
  outline: none;
}

.results-summary {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: 16px;
}

.score-card {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding: 32px;
  border-radius: 12px;
  background: var(--card-background);
  box-shadow: 0 16px 40px var(--card-shadow);
}

.score {
  display: grid;
  gap: 16px;
  text-align: center;
}

.score-value {
  font-size: 88px;
  font-weight: 500;
  line-height: 1;
}

.score-total {
  color: var(--muted-color);
  font-size: 18px;
  line-height: 1;
}

.action-button {
  width: 100%;
  min-height: 56px;
  padding: 16px;
  border: 0;
  border-radius: 12px;
  background: var(--color-purple-600);
  box-shadow: 0 16px 40px var(--card-shadow);
  color: white;
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
}

.action-button:focus-visible {
  outline: 3px solid var(--color-purple-600);
  outline-offset: 4px;
}

@media (hover: hover) {
  .action-button:hover {
    background: #d394fa;
  }
}

@media (min-width: 48rem) {
  .results-view {
    gap: 64px;
    margin-top: 49px;
  }

  h1 {
    font-size: 64px;
  }

  .results-summary {
    gap: 32px;
  }

  .score-card {
    gap: 40px;
    padding: 48px;
    border-radius: 24px;
  }

  .score-value {
    font-size: 144px;
  }

  .score-total {
    font-size: 24px;
    line-height: 1.5;
  }

  .action-button {
    min-height: 92px;
    padding: 32px;
    border-radius: 24px;
    font-size: 28px;
  }
}

@media (min-width: 80rem) {
  .results-view {
    grid-template-columns: minmax(0, 465px) minmax(0, 564px);
    align-items: start;
    gap: 128px;
    margin-top: 85px;
  }
}
</style>
