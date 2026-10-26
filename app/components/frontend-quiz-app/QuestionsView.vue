<script setup lang="ts">
import type { FrontendQuiz } from '#shared/types/frontend-quiz'

const { quiz, errorMessage = '' } = defineProps<{ quiz: FrontendQuiz; errorMessage?: string }>()
const emit = defineEmits<{ restart: [] }>()
const questionIndex = ref(0)
const selectedIndex = ref<number | null>(null)
const submitted = ref(false)
const complete = ref(false)
const score = ref(0)
const submissionError = ref('')
const heading = useTemplateRef<HTMLHeadingElement>('heading')
const nextButton = useTemplateRef<HTMLButtonElement>('nextButton')
const question = computed(() => quiz.questions[questionIndex.value])
const correctIndex = computed(() => question.value?.options.indexOf(question.value.answer))
const isCorrect = computed(() => selectedIndex.value === correctIndex.value)
const visibleError = computed(() => errorMessage || submissionError.value)
const id = useId()

async function focusHeading() {
  await nextTick()
  heading.value?.focus()
}

onMounted(focusHeading)
watch(
  () => quiz,
  async () => {
    questionIndex.value = 0
    selectedIndex.value = null
    submitted.value = false
    complete.value = false
    score.value = 0
    submissionError.value = ''
    await focusHeading()
  },
)

function selectAnswer(index: number) {
  if (submitted.value) return

  selectedIndex.value = index
  submissionError.value = ''
}

async function submitAnswer() {
  if (submitted.value || !question.value) return

  if (selectedIndex.value === null) {
    submissionError.value = 'Please select an answer'
    return
  }

  submitted.value = true

  if (isCorrect.value) score.value++

  await nextTick()
  nextButton.value?.focus({ preventScroll: true })
}

async function nextQuestion() {
  if (!submitted.value) return

  if (questionIndex.value === quiz.questions.length - 1) {
    complete.value = true
    return
  }

  questionIndex.value++
  selectedIndex.value = null
  submitted.value = false
  submissionError.value = ''
  await focusHeading()
}
</script>

<template>
  <FrontendQuizAppResultsView
    v-if="complete"
    :subject="quiz"
    :score="score"
    :total="quiz.questions.length"
    @restart="emit('restart')"
  />

  <div v-else-if="question" class="questions-view">
    <section class="question-panel" :aria-labelledby="`${id}-question`">
      <div class="question-text">
        <p class="question-count">
          Question {{ questionIndex + 1 }} of {{ quiz.questions.length }}
        </p>
        <h1 :id="`${id}-question`" ref="heading" tabindex="-1">{{ question.question }}</h1>
      </div>
      <div
        class="progress-track"
        role="progressbar"
        aria-label="Quiz progress"
        :aria-valuenow="questionIndex + 1"
        :aria-valuemax="quiz.questions.length"
        :aria-valuemin="0"
        :aria-valuetext="`Question ${questionIndex + 1} of ${quiz.questions.length}`"
      >
        <span :style="{ width: `${((questionIndex + 1) / quiz.questions.length) * 100}%` }" />
      </div>
    </section>

    <form class="answer-form" @submit.prevent="submitAnswer">
      <fieldset class="answer-options" :aria-labelledby="`${id}-question`" :disabled="submitted">
        <label
          v-for="(option, index) in question.options"
          :key="`${questionIndex}-${index}`"
          class="answer-option"
          :class="{
            'answer-option--selected': !submitted && selectedIndex === index,
            'answer-option--correct': submitted && selectedIndex === index && isCorrect,
            'answer-option--incorrect': submitted && selectedIndex === index && !isCorrect,
            'answer-option--locked': submitted,
          }"
        >
          <input
            class="sr-only"
            type="radio"
            :name="`${id}-answer`"
            :value="index"
            :checked="selectedIndex === index"
            @change="selectAnswer(index)"
          />
          <span class="answer-letter" aria-hidden="true">{{
            String.fromCharCode(65 + index)
          }}</span>
          <span class="answer-text">{{ option }}</span>
          <img
            v-if="submitted && index === correctIndex"
            class="answer-feedback"
            src="/img/frontend-quiz-app/icon-correct.svg"
            alt="Correct answer"
          />
          <img
            v-else-if="submitted && selectedIndex === index"
            class="answer-feedback"
            src="/img/frontend-quiz-app/icon-incorrect.svg"
            alt="Incorrect answer"
          />
        </label>
      </fieldset>

      <p class="sr-only" role="status" aria-atomic="true">
        <template v-if="submitted">
          {{ isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${question.answer}.` }}
        </template>
      </p>
      <button
        v-if="!submitted"
        type="submit"
        class="action-button"
        :disabled="selectedIndex === null"
        :aria-describedby="visibleError ? `${id}-error` : undefined"
      >
        Submit Answer
      </button>
      <button v-else ref="nextButton" type="button" class="action-button" @click="nextQuestion">
        {{ questionIndex === quiz.questions.length - 1 ? 'See results' : 'Next Question' }}
      </button>
      <p v-if="visibleError" :id="`${id}-error`" class="error-message" role="alert">
        <img src="/img/frontend-quiz-app/icon-error.svg" alt="" />
        {{ visibleError }}
      </p>
    </form>
  </div>
</template>

<style scoped>
.questions-view {
  display: grid;
  gap: 40px;
  margin-top: 48px;
}

.question-panel,
.question-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.question-panel {
  gap: 24px;
}

.question-text {
  gap: 16px;
}

.question-count {
  color: var(--muted-color);
  font-size: 14px;
  font-style: italic;
  line-height: 1.5;
}

h1 {
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

h1:focus {
  outline: none;
}

.progress-track {
  height: 16px;
  padding: 4px;
  border-radius: 999px;
  background: var(--card-background);
}

.progress-track span {
  display: block;
  height: 8px;
  border-radius: inherit;
  background: var(--color-purple-600);
}

.answer-form,
.answer-options {
  display: grid;
  min-width: 0;
  gap: 16px;
}

.answer-form {
  align-content: start;
}

.answer-options {
  margin: 0;
  padding: 0;
  border: 0;
}

.answer-option {
  --option-accent: transparent;
  display: flex;
  position: relative;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 16px;
  border-radius: 12px;
  background: var(--card-background);
  box-shadow:
    inset 0 0 0 3px var(--option-accent),
    0 16px 40px var(--card-shadow);
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
}

.answer-letter {
  display: grid;
  flex: 0 0 40px;
  place-items: center;
  height: 40px;
  border-radius: 6px;
  background: var(--color-gray-50);
  color: var(--color-gray-500);
  line-height: 1;
}

.answer-text {
  min-width: 0;
  overflow-wrap: anywhere;
}

.answer-option--selected {
  --option-accent: var(--color-purple-600);
}

.answer-option--correct {
  --option-accent: var(--color-green-500);
}

.answer-option--incorrect {
  --option-accent: var(--color-red-500);
}

.answer-option--selected .answer-letter,
.answer-option--correct .answer-letter,
.answer-option--incorrect .answer-letter {
  background: var(--option-accent);
  color: white;
}

.answer-option--locked {
  cursor: default;
}

.answer-option:has(input:focus-visible),
.action-button:focus-visible {
  outline: 3px solid var(--color-purple-600);
  outline-offset: 4px;
}

.answer-feedback {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  margin-left: auto;
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

.action-button:disabled {
  background: #d394fa;
  cursor: not-allowed;
}

.error-message {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  color: var(--error-color);
  font-size: 18px;
  line-height: 1.2;
}

.error-message img {
  width: 32px;
  height: 32px;
}

@media (hover: hover) {
  .answer-option:not(.answer-option--locked):hover {
    --option-accent: var(--color-purple-600);
  }

  .answer-option:not(.answer-option--locked):hover .answer-letter {
    background: var(--option-accent);
    color: white;
  }

  .action-button:not(:disabled):hover {
    background: #d394fa;
  }
}

@media (min-width: 48rem) {
  .questions-view {
    margin-top: 49px;
  }

  .question-panel {
    gap: 40px;
  }

  .question-text {
    gap: 24px;
  }

  .question-count {
    font-size: 20px;
  }

  h1 {
    font-size: 36px;
  }

  .answer-form {
    gap: 32px;
  }

  .answer-options {
    gap: 24px;
  }

  .answer-option {
    gap: 32px;
    border-radius: 24px;
    font-size: 28px;
  }

  .answer-letter {
    flex-basis: 56px;
    height: 56px;
    border-radius: 12px;
  }

  .answer-feedback {
    flex-basis: 40px;
    width: 40px;
    height: 40px;
  }

  .action-button {
    min-height: 92px;
    padding: 32px;
    border-radius: 24px;
    font-size: 28px;
  }

  .error-message {
    font-size: 24px;
  }

  .error-message img {
    width: 40px;
    height: 40px;
  }
}

@media (min-width: 80rem) {
  .questions-view {
    grid-template-columns: minmax(0, 465px) minmax(0, 564px);
    align-items: start;
    gap: 128px;
    margin-top: 85px;
  }

  .question-panel {
    justify-content: space-between;
    min-height: 469px;
  }

  .answer-options {
    gap: 16px;
  }

  .answer-option {
    padding: 24px;
  }
}
</style>
