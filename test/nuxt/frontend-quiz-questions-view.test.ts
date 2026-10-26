import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import QuestionsView from '../../app/components/frontend-quiz-app/QuestionsView.vue'
import type { FrontendQuiz } from '../../shared/types/frontend-quiz'

const quiz: FrontendQuiz = {
  title: 'Accessibility',
  icon: '/img/frontend-quiz-app/icon-accessibility.svg',
  questions: [
    {
      question: 'Minimum contrast?',
      options: ['4.5 : 1', '3 : 1', '2.5 : 1', '5 : 1'],
      answer: '4.5 : 1',
    },
    {
      question: 'An accessible element?',
      options: ['A button', 'A clickable div'],
      answer: 'A button',
    },
  ],
}
const wrappers: ReturnType<typeof mount>[] = []
beforeEach(() => {
  // Keep the existing interaction tests in source order; shuffle tests override this.
  vi.spyOn(Math, 'random').mockReturnValue(0.999)
})
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})

function mountView(errorMessage?: string) {
  const wrapper = mount(QuestionsView, { props: { quiz, errorMessage }, attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

async function submit(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('form').trigger('submit')
}

async function advance(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('.action-button').trigger('click')
  await nextTick()
}

describe('Frontend quiz QuestionsView', () => {
  it('shuffles copied questions and options once per attempt while preserving scoring', async () => {
    vi.mocked(Math.random).mockReturnValue(0)
    const original = structuredClone(quiz)
    const wrapper = mountView()
    const seen: string[] = []

    expect(wrapper.get('h1').text()).toBe('An accessible element?')
    expect(wrapper.findAll('.answer-text').map((option) => option.text())).toEqual([
      'A clickable div',
      'A button',
    ])

    for (let index = 0; index < quiz.questions.length; index++) {
      const heading = wrapper.get('h1').text()
      seen.push(heading)
      const source = quiz.questions.find((question) => question.question === heading)!
      const options = wrapper.findAll('.answer-text').map((option) => option.text())
      expect(options).not.toEqual(source.options)
      expect([...options].sort()).toEqual([...source.options].sort())
      expect(wrapper.findAll('.answer-letter').map((letter) => letter.text())).toEqual(
        options.map((_, optionIndex) => String.fromCharCode(65 + optionIndex)),
      )
      const correctIndex = options.indexOf(source.answer)
      await wrapper.findAll('input')[(correctIndex + 1) % options.length]!.setValue(true)
      await wrapper.findAll('input')[correctIndex]!.setValue(true)
      expect(wrapper.get('h1').text()).toBe(heading)
      expect(wrapper.findAll('.answer-text').map((option) => option.text())).toEqual(options)
      await submit(wrapper)
      expect(wrapper.get('[role="status"]').text()).toBe('Correct!')
      expect(wrapper.findAll('.answer-text').map((option) => option.text())).toEqual(options)
      await advance(wrapper)
    }

    expect(seen).toEqual([...quiz.questions].reverse().map((question) => question.question))
    expect(wrapper.get('.score .sr-only').text()).toBe('Your score: 2 out of 2')
    expect(quiz).toEqual(original)
  })

  it('creates a fresh shuffle when the same subject is mounted for another attempt', () => {
    const first = mountView()
    expect(first.get('h1').text()).toBe('Minimum contrast?')
    first.unmount()

    vi.mocked(Math.random).mockReturnValue(0)
    const second = mountView()
    expect(second.get('h1').text()).toBe('An accessible element?')
    expect(second.findAll('.answer-text').map((option) => option.text())).toEqual([
      'A clickable div',
      'A button',
    ])
    expect(second.find('input:checked').exists()).toBe(false)
  })

  it('reshuffles and resets when a different quiz is supplied', async () => {
    const wrapper = mountView()
    await wrapper.findAll('input')[0]!.setValue(true)
    await submit(wrapper)

    vi.mocked(Math.random).mockReturnValue(0)
    await wrapper.setProps({ quiz: { ...quiz, title: 'HTML' } })
    expect(wrapper.get('h1').text()).toBe('An accessible element?')
    expect(wrapper.findAll('.answer-text').map((option) => option.text())).toEqual([
      'A clickable div',
      'A button',
    ])
    expect(wrapper.get('.question-count').text()).toBe('Question 1 of 2')
    expect(wrapper.find('input:checked').exists()).toBe(false)
    expect(wrapper.find('.answer-feedback').exists()).toBe(false)
  })

  it('starts unselected, disables submission and exposes question progress', () => {
    const wrapper = mountView()
    expect(wrapper.get('h1').text()).toBe('Minimum contrast?')
    expect(wrapper.get('.question-count').text()).toBe('Question 1 of 2')
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('1')
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuemax')).toBe('2')
    expect(wrapper.get('.progress-track span').attributes('style')).toContain('width: 50%')
    expect(wrapper.findAll('input:checked')).toHaveLength(0)
    expect(wrapper.get('.action-button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('.answer-feedback').exists()).toBe(false)
  })

  it('allows changes before submission without revealing correctness', async () => {
    const wrapper = mountView()
    await wrapper.findAll('input')[0]!.setValue(true)
    expect(wrapper.get('.action-button').attributes('disabled')).toBeUndefined()
    expect(wrapper.findAll('.answer-option--selected')).toHaveLength(1)
    await wrapper.findAll('input')[2]!.setValue(true)
    expect(wrapper.get('input:checked').element).toBe(wrapper.findAll('input')[2]!.element)
    expect(wrapper.findAll('.answer-option--selected')).toHaveLength(1)
    expect(wrapper.find('.answer-feedback').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').text()).toBe('')
  })

  it('locks a correct answer, announces feedback, prevents repeated scoring and resets the next question', async () => {
    const wrapper = mountView()
    await wrapper.findAll('input')[0]!.setValue(true)
    await submit(wrapper)
    expect(wrapper.get('.answer-option--correct').text()).toBe('A4.5 : 1')
    expect(wrapper.find('img[alt="Correct answer"]').exists()).toBe(true)
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[role="status"]').text()).toBe('Correct!')
    expect(wrapper.get('.action-button').text()).toBe('Next Question')
    expect(document.activeElement).toBe(wrapper.get('.action-button').element)
    await wrapper.findAll('input')[1]!.trigger('change')
    expect(wrapper.findAll('.answer-option')[0]!.classes()).toContain('answer-option--correct')
    await submit(wrapper)
    await advance(wrapper)
    expect(wrapper.get('h1').text()).toBe('An accessible element?')
    expect(document.activeElement).toBe(wrapper.get('h1').element)
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('2')
    expect(wrapper.get('.progress-track span').attributes('style')).toContain('width: 100%')
    expect(wrapper.find('input:checked').exists()).toBe(false)
    expect(wrapper.find('.answer-feedback').exists()).toBe(false)
    expect(wrapper.get('.action-button').attributes('disabled')).toBeDefined()
    await wrapper.findAll('input')[1]!.setValue(true)
    await submit(wrapper)
    expect(wrapper.get('.action-button').text()).toBe('See results')
    await advance(wrapper)
    expect(wrapper.get('h1').text()).toBe('Quiz completed You scored...')
    expect(document.activeElement).toBe(wrapper.get('h1').element)
    expect(wrapper.get('.score .sr-only').text()).toBe('Your score: 1 out of 2')
    expect(wrapper.get('.score-total').text()).toBe('out of 2')
    await advance(wrapper)
    expect(wrapper.emitted('restart')).toEqual([[]])
  })

  it('marks a wrong selection red and reveals the correct option without a green selection border', async () => {
    const wrapper = mountView()
    await wrapper.findAll('input')[2]!.setValue(true)
    await submit(wrapper)
    expect(wrapper.get('.answer-option--incorrect').text()).toBe('C2.5 : 1')
    expect(wrapper.get('.answer-option--incorrect img').attributes('alt')).toBe('Incorrect answer')
    expect(wrapper.findAll('.answer-option')[0]!.find('img[alt="Correct answer"]').exists()).toBe(
      true,
    )
    expect(wrapper.find('.answer-option--correct').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').text()).toBe('Incorrect. The correct answer is 4.5 : 1.')
    expect(wrapper.get('.action-button').text()).toBe('Next Question')
  })

  it('completes an all-incorrect quiz with a zero score', async () => {
    const wrapper = mountView()
    for (let index = 0; index < quiz.questions.length; index++) {
      await wrapper.findAll('input')[1]!.setValue(true)
      await submit(wrapper)
      await advance(wrapper)
    }
    expect(wrapper.get('.score-value').text()).toBe('0')
    expect(wrapper.get('.score-total').text()).toBe('out of 2')
  })

  it('defensively rejects an empty submission and clears the error upon selection', async () => {
    const wrapper = mountView()
    await submit(wrapper)
    expect(wrapper.get('[role="alert"]').text()).toBe('Please select an answer')
    expect(wrapper.get('.action-button').attributes('disabled')).toBeDefined()
    expect(wrapper.get('fieldset').attributes('disabled')).toBeUndefined()
    await wrapper.findAll('input')[1]!.setValue(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('uses the error area below the button for other errors too', () => {
    const wrapper = mountView('Something went wrong. Please try again.')
    const error = wrapper.get('[role="alert"]')
    expect(error.text()).toBe('Something went wrong. Please try again.')
    expect(wrapper.get('.action-button').attributes('aria-describedby')).toBe(
      error.attributes('id'),
    )
    expect(wrapper.get('.answer-form').element.lastElementChild).toBe(error.element)
  })

  it('resets the session if the quiz changes and escapes question and option text', async () => {
    const wrapper = mountView()
    await wrapper.findAll('input')[0]!.setValue(true)
    await submit(wrapper)
    await wrapper.setProps({
      quiz: {
        title: 'HTML',
        icon: '/custom.svg',
        questions: [
          { question: '<script>question</script>', options: ['<button>'], answer: '<button>' },
        ],
      },
    })
    expect(wrapper.get('h1').text()).toBe('<script>question</script>')
    expect(wrapper.get('.answer-text').text()).toBe('<button>')
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.get('.action-button').attributes('disabled')).toBeDefined()
    await wrapper.get('input').setValue(true)
    await submit(wrapper)
    await advance(wrapper)
    expect(wrapper.get('.score .sr-only').text()).toBe('Your score: 1 out of 1')
    expect(wrapper.get('.score-total').text()).toBe('out of 1')
  })
})
