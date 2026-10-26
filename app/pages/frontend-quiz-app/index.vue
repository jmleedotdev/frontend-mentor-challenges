<script setup lang="ts">
import type { FrontendQuiz, FrontendQuizResponse } from '#shared/types/frontend-quiz'

definePageMeta({ layout: 'challenge' })
await useChallengePage()

const { data, status, error, refresh } =
  await useLazyFetch<FrontendQuizResponse>('/api/frontend-quizes')
const subjects = computed(() => (data.value?.success ? data.value.data : []))
const startMenuState = computed(() => {
  if (status.value === 'pending' || status.value === 'idle') return 'loading'

  if (error.value || !data.value?.success) return 'error'

  return subjects.value.length ? 'ready' : 'empty'
})

const selectedQuiz = shallowRef<FrontendQuiz | null>(null)
const menuError = ref('')

function startQuiz(title: string) {
  const quiz = subjects.value.find((subject) => subject.title === title)

  if (
    !quiz?.questions.length ||
    quiz.questions.some((question) => !question.options.includes(question.answer))
  ) {
    menuError.value = 'This quiz is unavailable. Please choose another subject.'
    return
  }

  menuError.value = ''
  selectedQuiz.value = quiz
}

function retrySubjects() {
  menuError.value = ''

  return refresh()
}

async function restartQuiz() {
  selectedQuiz.value = null
  await nextTick()
  document.getElementById('quiz-title')?.focus()
}

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// Treat legacy or invalid stored values as the documented light default.
watchEffect(() => {
  if (!colorMode.unknown && !['light', 'dark'].includes(colorMode.preference)) {
    colorMode.preference = 'light'
  }
})

if (import.meta.client) {
  useEventListener(window, 'storage', (event) => {
    if (event.key === 'app-color-mode' || event.key === null) {
      colorMode.preference = event.newValue === 'dark' ? 'dark' : 'light'
    }
  })
}

function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <main id="frontend-quiz-app" :data-theme="colorMode.value">
    <div class="quiz-shell" :class="{ 'quiz-shell--playing': selectedQuiz }">
      <header class="quiz-header">
        <FrontendQuizAppSubjectLabel v-if="selectedQuiz" :subject="selectedQuiz" />

        <FrontendQuizAppThemeToggle :is-dark="isDark" @toggle="toggleTheme" />
      </header>

      <FrontendQuizAppQuestionsView
        v-if="selectedQuiz"
        :quiz="selectedQuiz"
        @restart="restartQuiz"
      />
      <template v-else>
        <FrontendQuizAppStartMenu
          :subjects="subjects"
          :state="startMenuState"
          @retry="retrySubjects"
          @select="startQuiz"
        />

        <p v-if="menuError" class="menu-error" role="alert">{{ menuError }}</p>
      </template>
    </div>
  </main>
</template>

<style scoped>
#frontend-quiz-app {
  font-family: 'Rubik', sans-serif;
  --color-gray-50: #f4f6fa;
  --color-gray-500: #626c7f;
  --color-blue-50: #ebf0ff;
  --color-blue-100: hsl(220, 50%, 95%);
  --color-blue-300: #abc1e1;
  --color-blue-500: hsl(223, 100%, 59%);
  --color-blue-850: #3b4d66;
  --color-blue-900: #313e51;
  --color-blue-950: hsl(214, 24%, 23%);
  --color-green-100: #e0fdef;
  --color-green-500: #26d782;
  --color-purple-100: #f6e7ff;
  --color-purple-600: #a729f5;
  --color-orange-50: #fff5ed;
  --color-orange-400: hsl(22, 100%, 60%);
  --color-red-500: #ee5454;
  --page-background: var(--color-gray-50);
  --text-color: var(--color-blue-900);
  --muted-color: var(--color-gray-500);
  --card-background: white;
  --card-shadow: rgb(143 160 193 / 14%);
  --error-color: var(--color-red-500);
  --pattern-mobile: url('/img/frontend-quiz-app/pattern-background-mobile-light.svg');
  --pattern-tablet: url('/img/frontend-quiz-app/pattern-background-tablet-light.svg');
  --pattern-desktop: url('/img/frontend-quiz-app/pattern-background-desktop-light.svg');
  --light-icon-display: block;
  --dark-icon-display: none;
  --thumb-position: 0px;

  min-height: 100dvh;
  background-color: var(--page-background);
  background-image: var(--pattern-mobile);
  background-repeat: no-repeat;
  background-position: left top;
  color: var(--text-color);
  color-scheme: light;
}

:global(html.app-dark #frontend-quiz-app) {
  --page-background: var(--color-blue-900);
  --text-color: white;
  --muted-color: var(--color-blue-300);
  --card-background: var(--color-blue-850);
  --card-shadow: rgb(49 62 81 / 14%);
  --error-color: white;
  --pattern-mobile: url('/img/frontend-quiz-app/pattern-background-mobile-dark.svg');
  --pattern-tablet: url('/img/frontend-quiz-app/pattern-background-tablet-dark.svg');
  --pattern-desktop: url('/img/frontend-quiz-app/pattern-background-desktop-dark.svg');
  --light-icon-display: none;
  --dark-icon-display: block;
  --thumb-position: 100%;

  color-scheme: dark;
}

.quiz-shell {
  margin-inline: auto;
  padding: 14px 24px 48px;
}

.quiz-header {
  display: flex;
  justify-content: flex-end;
  height: 44px;
}

.quiz-shell--playing {
  padding-top: 16px;
}

.quiz-shell--playing .quiz-header {
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  height: 40px;
}

.menu-error {
  margin-top: 24px;
  color: var(--error-color);
  font-size: 18px;
}

@media (min-width: 48rem) {
  #frontend-quiz-app {
    background-image: var(--pattern-tablet);
  }

  .quiz-shell {
    padding: 46px 64px 64px;
  }

  .quiz-shell--playing {
    padding-top: 40px;
  }

  .quiz-shell--playing .quiz-header {
    height: 56px;
  }
}

@media (min-width: 80rem) {
  #frontend-quiz-app {
    background-image: var(--pattern-desktop);
    background-position: center top;
    background-size: cover;
  }

  .quiz-shell {
    max-width: 1288px;
    padding-top: 89px;
  }

  .quiz-shell--playing {
    padding-top: 83px;
  }
}
</style>
