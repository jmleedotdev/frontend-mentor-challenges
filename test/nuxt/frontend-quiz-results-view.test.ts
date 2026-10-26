import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import ResultsView from '../../app/components/frontend-quiz-app/ResultsView.vue'

const { animateMock } = vi.hoisted(() => ({
  animateMock: vi.fn<
    (
      from: number,
      to: number,
      options: {
        duration: number
        ease: string
        onUpdate: (value: number) => void
        onComplete: () => void
      },
    ) => { stop: () => void }
  >(),
}))
const reducedMotion = ref(true)
vi.mock('motion-v', () => ({
  animate: animateMock,
  useReducedMotion: () => reducedMotion,
}))

beforeEach(() => {
  reducedMotion.value = true
  animateMock.mockReset().mockImplementation(() => ({ stop: vi.fn() }))
})

const subject = { title: 'Accessibility', icon: '/img/frontend-quiz-app/icon-accessibility.svg' }
const wrappers: ReturnType<typeof mount>[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

function mountView(score = 8, total = 10, selectedSubject = subject) {
  const wrapper = mount(ResultsView, {
    props: { subject: selectedSubject, score, total },
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

describe('Frontend quiz ResultsView', () => {
  it('renders the completion heading and subject and focuses the heading on entry', () => {
    const wrapper = mountView()
    const heading = wrapper.get('h1')
    expect(heading.text()).toBe('Quiz completed You scored...')
    expect(heading.get('strong').text()).toBe('You scored...')
    expect(heading.attributes('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(heading.element)
    expect(wrapper.get('section').attributes('aria-labelledby')).toBe(heading.attributes('id'))
    expect(wrapper.get('.subject-label').text()).toBe('Accessibility')
    expect(wrapper.get('.subject-icon img').attributes('src')).toBe(subject.icon)
    expect(wrapper.get('.subject-icon img').attributes('alt')).toBe('')
    expect(wrapper.get('.subject-icon').classes()).toContain('subject-icon--purple')
  })

  it.each([
    [0, 10],
    [8, 10],
    [10, 10],
    [2, 3],
    [1, 1],
  ])('shows %i correctly submitted answers out of %i questions', (score, total) => {
    const wrapper = mountView(score, total)
    expect(wrapper.get('.score-value').text()).toBe(String(score))
    expect(wrapper.get('.score-total').text()).toBe(`out of ${total}`)
    expect(wrapper.get('.score .sr-only').text()).toBe(`Your score: ${score} out of ${total}`)
    expect(wrapper.get('.score-value').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('.score-total').attributes('aria-hidden')).toBe('true')
    expect(animateMock).not.toHaveBeenCalled()
  })

  it('emits restart when Play Again is activated', async () => {
    const wrapper = mountView()
    const button = wrapper.get('button')
    expect(button.text()).toBe('Play Again')
    expect(button.attributes('type')).toBe('button')
    await button.trigger('click')
    expect(wrapper.emitted('restart')).toEqual([[]])
  })

  describe('score count-up', () => {
    beforeEach(() => {
      reducedMotion.value = false
    })

    it('counts from zero in whole numbers over one second without changing the accessible score', async () => {
      const wrapper = mountView()
      await nextTick()
      expect(animateMock).toHaveBeenCalledWith(
        0,
        8,
        expect.objectContaining({ duration: 1, ease: 'easeOut' }),
      )
      expect(wrapper.get('.score-value').text()).toBe('0')
      expect(document.activeElement).toBe(wrapper.get('h1').element)
      expect(wrapper.get('.score .sr-only').text()).toBe('Your score: 8 out of 10')
      expect(wrapper.find('[aria-live]').exists()).toBe(false)
      const options = animateMock.mock.calls[0]![2]
      options.onUpdate(3.6)
      await nextTick()
      expect(wrapper.get('.score-value').text()).toBe('4')
      expect(wrapper.get('.score .sr-only').text()).toBe('Your score: 8 out of 10')
      expect(wrapper.get('.score-total').text()).toBe('out of 10')
      options.onComplete()
      await nextTick()
      expect(wrapper.get('.score-value').text()).toBe('8')
    })

    it('keeps zero static without starting an animation', async () => {
      const wrapper = mountView(0)
      await nextTick()
      expect(wrapper.get('.score-value').text()).toBe('0')
      expect(animateMock).not.toHaveBeenCalled()
    })

    it('does not replay or interrupt the count-up on unrelated prop updates', async () => {
      const wrapper = mountView()
      const options = animateMock.mock.calls[0]![2]
      const stop = animateMock.mock.results[0]!.value.stop
      options.onUpdate(2)
      await wrapper.setProps({ subject: { ...subject }, total: 12 })
      expect(wrapper.get('.score-value').text()).toBe('2')
      expect(wrapper.get('.score .sr-only').text()).toBe('Your score: 8 out of 12')
      expect(stop).not.toHaveBeenCalled()
      expect(animateMock).toHaveBeenCalledOnce()
    })

    it('lets the current animation finish and checks reduced motion on the next mount', async () => {
      const wrapper = mountView()
      const stop = animateMock.mock.results[0]!.value.stop
      const options = animateMock.mock.calls[0]![2]
      options.onUpdate(3)
      reducedMotion.value = true
      await nextTick()
      expect(stop).not.toHaveBeenCalled()
      expect(wrapper.get('.score-value').text()).toBe('3')

      options.onComplete()
      await nextTick()
      expect(wrapper.get('.score-value').text()).toBe('8')

      const nextResults = mountView(5)
      await nextTick()
      expect(nextResults.get('.score-value').text()).toBe('5')
      expect(animateMock).toHaveBeenCalledOnce()
    })

    it('keeps Play Again usable during the count-up and stops on unmount', async () => {
      const wrapper = mountView()
      const stop = animateMock.mock.results[0]!.value.stop
      await wrapper.get('button').trigger('click')
      expect(wrapper.emitted('restart')).toEqual([[]])
      wrapper.unmount()
      wrappers.splice(wrappers.indexOf(wrapper), 1)
      expect(stop).toHaveBeenCalledOnce()
    })

    it('starts a fresh count-up when a new results view is mounted', async () => {
      const first = mountView()
      animateMock.mock.calls[0]![2].onComplete()
      first.unmount()
      wrappers.splice(wrappers.indexOf(first), 1)
      const second = mountView(3, 5)
      await nextTick()
      expect(animateMock).toHaveBeenCalledTimes(2)
      expect(animateMock.mock.calls[1]!.slice(0, 2)).toEqual([0, 3])
      expect(second.get('.score-value').text()).toBe('0')
    })
  })

  it('uses supplied subject data and escapes its title', () => {
    const wrapper = mountView(2, 3, { title: '<New subject>', icon: '/custom.svg' })
    expect(wrapper.get('.subject-label').text()).toBe('<New subject>')
    expect(wrapper.get('.subject-icon img').attributes('src')).toBe('/custom.svg')
    expect(wrapper.find('new').exists()).toBe(false)
  })
})
