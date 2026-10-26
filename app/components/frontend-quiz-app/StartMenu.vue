<script setup lang="ts">
import type { FrontendQuiz } from '#shared/types/frontend-quiz'

defineProps<{
  subjects: readonly Pick<FrontendQuiz, 'title' | 'icon'>[]
  state: 'loading' | 'error' | 'empty' | 'ready'
}>()
const emit = defineEmits<{ retry: []; select: [title: string] }>()
</script>

<template>
  <div class="start-menu">
    <section class="welcome" aria-labelledby="quiz-title">
      <h1 id="quiz-title" tabindex="-1">
        <span>Welcome to the</span>
        <strong class="font-medium">Frontend Quiz!</strong>
      </h1>

      <p>Pick a subject to get started.</p>
    </section>

    <div class="subject-results" :aria-busy="state === 'loading'">
      <p v-if="state === 'loading'" class="status-message" role="status">Loading quiz subjects…</p>
      <div v-else-if="state === 'error'" class="status-message" role="alert">
        <p>We couldn't load the quiz subjects.</p>

        <button type="button" class="retry-button" @click="emit('retry')">Retry</button>
      </div>
      <div v-else-if="state === 'empty'" class="status-message" role="status">
        <p>No quiz subjects are available right now.</p>

        <button type="button" class="retry-button" @click="emit('retry')">Retry</button>
      </div>
      <ul v-else class="subjects" aria-label="Quiz subjects">
        <li v-for="subject in subjects" :key="subject.title">
          <button type="button" class="subject-card" @click="emit('select', subject.title)">
            <FrontendQuizAppSubjectLabel :subject="subject" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.start-menu {
  display: grid;
  gap: 40px;
  margin-top: 46px;
}

.welcome h1 {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 40px;
  font-weight: 300;
  line-height: 1;
  letter-spacing: 0;
}

.welcome h1:focus {
  outline: none;
}

.welcome p {
  margin-top: 16px;
  color: var(--muted-color);
  font-size: 14px;
  font-weight: 400;
  font-style: italic;
  line-height: 1.5;
}

.subject-results {
  min-width: 0;
}

.status-message {
  color: var(--muted-color);
  font-size: 18px;
  line-height: 1.5;
}

.retry-button {
  margin-top: 16px;
  padding: 12px 24px;
  border: 0;
  border-radius: 12px;
  background: var(--color-purple-600);
  color: white;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

.retry-button:focus-visible,
.subject-card:focus-visible {
  outline: 3px solid var(--color-purple-600);
  outline-offset: 4px;
}

.subjects {
  display: grid;
  gap: 16px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.subject-card {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px;
  border: 0;
  border-radius: 12px;
  background: var(--card-background);
  color: inherit;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 16px 40px var(--card-shadow);
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
}

/* Target mouse/trackpad not touch, prevents sticky hover */
@media (hover: hover) {
  .subject-card:hover {
    outline: 3px solid var(--color-purple-600);
  }
}

@media (min-width: 48rem) {
  .start-menu {
    gap: 64px;
    margin-top: 39px;
  }

  .welcome h1 {
    font-size: 64px;
  }

  .welcome p {
    font-size: 20px;
  }

  .subjects {
    gap: 24px;
  }

  .subject-card {
    gap: 32px;
    border-radius: 24px;
    font-size: 28px;
  }

  .subject-card :deep(.subject-label) {
    gap: 32px;
  }
}

@media (min-width: 80rem) {
  .start-menu {
    grid-template-columns: minmax(0, 465px) minmax(0, 564px);
    align-items: start;
    gap: 128px;
    margin-top: 91px;
  }

  .welcome p {
    margin-top: 48px;
  }

  .subjects {
    gap: 16px;
  }

  .subject-card {
    padding: 24px;
  }
}
</style>
