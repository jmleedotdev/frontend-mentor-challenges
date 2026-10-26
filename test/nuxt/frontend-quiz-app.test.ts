import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import FrontendQuizPage from '../../app/pages/frontend-quiz-app/index.vue'
import type { FrontendQuiz, FrontendQuizResponse } from '../../shared/types/frontend-quiz'

const { fetchMock, colorModeMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  colorModeMock: vi.fn(),
}))
mockNuxtImport('useChallengePage', () => async () => {})
mockNuxtImport('useLazyFetch', () => fetchMock)
mockNuxtImport('useColorMode', () => colorModeMock)

const subjects: FrontendQuiz[] = [
  {
    title: 'JavaScript',
    icon: '/img/frontend-quiz-app/icon-js.svg',
    questions: [
      { question: 'What is const?', options: ['A declaration'], answer: 'A declaration' },
    ],
  },
  { title: 'HTML', icon: '/img/frontend-quiz-app/icon-html.svg', questions: [] },
]
const wrappers: Awaited<ReturnType<typeof mountSuspended>>[] = []
let response: {
  data: ReturnType<typeof ref<FrontendQuizResponse | null>>
  status: ReturnType<typeof ref<string>>
  error: ReturnType<typeof ref<Error | null>>
  refresh: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  colorModeMock.mockReturnValue(
    reactive({
      preference: 'light',
      get value(): string {
        return this.preference
      },
      unknown: false,
    }),
  )
  localStorage.removeItem('app-color-mode')
  response = {
    data: ref({ success: true, data: subjects }),
    status: ref('success'),
    error: ref(null),
    refresh: vi.fn(),
  }
  fetchMock.mockReset().mockReturnValue(response)
})

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  localStorage.removeItem('app-color-mode')
})

async function mountPage() {
  const wrapper = await mountSuspended(FrontendQuizPage, { route: '/frontend-quiz-app' })
  wrappers.push(wrapper)
  return wrapper
}

describe('Frontend quiz start menu', () => {
  it.each([
    ['invalid', 'light'],
    ['light', 'light'],
    ['dark', 'dark'],
  ])('reflects color-mode preference %s as %s', async (preference, expectedTheme) => {
    colorModeMock().preference = preference

    const wrapper = await mountPage()
    expect(wrapper.get('main').attributes('data-theme')).toBe(expectedTheme)
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe(
      String(expectedTheme === 'dark'),
    )
  })

  it('starts a subject, completes it and returns to a fresh menu without resetting the theme', async () => {
    const wrapper = await mountPage()
    const toggle = wrapper.get('[role="switch"]')
    await toggle.trigger('click')
    const currentTheme = toggle.attributes('aria-checked')
    await wrapper.get('button.subject-card').trigger('click')
    expect(wrapper.find('.start-menu').exists()).toBe(false)
    expect(wrapper.get('.quiz-header .subject-label').text()).toBe('JavaScript')
    expect(wrapper.get('h1').text()).toBe('What is const?')
    await wrapper.get('input[type="radio"]').setValue(true)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('.action-button').text()).toBe('See results')
    await wrapper.get('.action-button').trigger('click')
    expect(wrapper.get('.score .sr-only').text()).toBe('Your score: 1 out of 1')
    expect(wrapper.get('.score-total').text()).toBe('out of 1')
    await wrapper.get('.action-button').trigger('click')
    expect(wrapper.get('h1').text()).toBe('Welcome to theFrontend Quiz!')
    expect(wrapper.find('.quiz-header .subject-label').exists()).toBe(false)
    expect(toggle.attributes('aria-checked')).toBe(currentTheme)
    await wrapper.get('button.subject-card').trigger('click')
    expect(wrapper.get('.question-count').text()).toBe('Question 1 of 1')
    expect(wrapper.find('input:checked').exists()).toBe(false)
    expect(wrapper.get('.action-button').attributes('disabled')).toBeDefined()
  })

  it('does not persist progress when the page remounts', async () => {
    const first = await mountPage()
    await first.get('button.subject-card').trigger('click')
    await first.get('input').setValue(true)
    await first.get('form').trigger('submit')
    const second = await mountPage()
    expect(second.find('.start-menu').exists()).toBe(true)
    expect(second.find('.questions-view').exists()).toBe(false)
  })

  it('keeps unavailable quizzes on the menu with a useful message', async () => {
    const wrapper = await mountPage()
    await wrapper.findAll('button.subject-card')[1]!.trigger('click')
    expect(wrapper.get('[role="alert"]').text()).toContain('This quiz is unavailable')
    expect(wrapper.find('.start-menu').exists()).toBe(true)
    await wrapper.get('button.subject-card').trigger('click')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('What is const?')
  })

  it('renders API subjects in response order with supplied titles and full icon URLs', async () => {
    const wrapper = await mountPage()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/frontend-quizes')
    expect(wrapper.findAll('.subject-card').map((card) => card.text())).toEqual([
      'JavaScript',
      'HTML',
    ])
    expect(wrapper.findAll('.subject-icon img').map((icon) => icon.attributes('src'))).toEqual(
      subjects.map((subject) => subject.icon),
    )
    expect(wrapper.findAll('.subject-icon').map((icon) => icon.classes())).toEqual([
      ['subject-icon', 'subject-icon--blue'],
      ['subject-icon', 'subject-icon--orange'],
    ])
    expect(wrapper.get('.subject-results').attributes('aria-busy')).toBe('false')
    expect(wrapper.findAll('.subjects button')).toHaveLength(2)
    expect(wrapper.text()).not.toContain('What is const?')
  })

  it('uses API content rather than falling back to hardcoded subjects or icon paths', async () => {
    response.data.value = {
      success: true,
      data: [{ title: '<New subject>', icon: '/custom-subject.svg', questions: [] }],
    }
    const wrapper = await mountPage()
    expect(wrapper.findAll('.subject-card')).toHaveLength(1)
    expect(wrapper.get('.subject-card').text()).toBe('<New subject>')
    expect(wrapper.get('.subject-icon img').attributes('src')).toBe('/custom-subject.svg')
    expect(wrapper.get('.subject-icon').classes()).toContain('subject-icon--purple')
    expect(wrapper.find('new').exists()).toBe(false)
  })

  it.each(['pending', 'idle'])(
    'shows loading without fallback subjects when %s',
    async (status) => {
      response.status.value = status
      response.data.value = null
      const wrapper = await mountPage()
      expect(wrapper.get('[role="status"]').text()).toBe('Loading quiz subjects…')
      expect(wrapper.get('.subject-results').attributes('aria-busy')).toBe('true')
      expect(wrapper.find('.subject-card').exists()).toBe(false)
      expect(wrapper.find('.retry-button').exists()).toBe(false)

      response.data.value = { success: true, data: subjects }
      response.status.value = 'success'
      await nextTick()
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      expect(wrapper.findAll('.subject-card')).toHaveLength(2)
    },
  )

  it.each(['network', 'unsuccessful response', 'empty response'])(
    'shows a message and recovers via Retry after %s',
    async (failure) => {
      if (failure === 'network') {
        response.status.value = 'error'
        response.error.value = new Error('Unavailable')
        response.data.value = null
      } else {
        response.data.value = { success: failure === 'empty response', data: [] }
      }
      const wrapper = await mountPage()
      const message = wrapper.get(
        failure === 'empty response' ? '[role="status"]' : '[role="alert"]',
      )
      expect(message.text()).toContain(
        failure === 'empty response'
          ? 'No quiz subjects are available right now.'
          : "We couldn't load the quiz subjects.",
      )
      expect(wrapper.find('.subject-card').exists()).toBe(false)

      const toggle = wrapper.get('[role="switch"]')
      const wasDark = toggle.attributes('aria-checked') === 'true'
      await toggle.trigger('click')
      expect(toggle.attributes('aria-checked')).toBe(String(!wasDark))

      await wrapper.get('.retry-button').trigger('click')
      expect(response.refresh).toHaveBeenCalledTimes(1)
      response.status.value = 'pending'
      await nextTick()
      expect(wrapper.get('[role="status"]').text()).toBe('Loading quiz subjects…')
      expect(wrapper.find('.retry-button').exists()).toBe(false)

      response.error.value = null
      response.data.value = { success: true, data: subjects }
      response.status.value = 'success'
      await nextTick()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(wrapper.find('.retry-button').exists()).toBe(false)
      expect(wrapper.findAll('.subject-card')).toHaveLength(2)
      expect(toggle.attributes('aria-checked')).toBe(String(!wasDark))
    },
  )
})
