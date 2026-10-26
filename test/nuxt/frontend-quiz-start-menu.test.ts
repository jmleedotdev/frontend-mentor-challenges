import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StartMenu from '../../app/components/frontend-quiz-app/StartMenu.vue'

const subjects = [
  { title: 'HTML', icon: '/img/frontend-quiz-app/icon-html.svg' },
  { title: 'CSS', icon: '/img/frontend-quiz-app/icon-css.svg' },
]

describe('Frontend quiz StartMenu', () => {
  it('renders from subject summaries and updates when its props change', async () => {
    const wrapper = mount(StartMenu, { props: { subjects, state: 'ready' } })
    try {
      expect(wrapper.get('h1 span').text()).toBe('Welcome to the')
      expect(wrapper.get('h1 strong').text()).toBe('Frontend Quiz!')
      expect(wrapper.findAll('.subject-card').map((card) => card.text())).toEqual(['HTML', 'CSS'])
      expect(wrapper.findAll('button.subject-card')).toHaveLength(2)
      await wrapper.get('button.subject-card').trigger('click')
      expect(wrapper.emitted('select')).toEqual([['HTML']])

      await wrapper.setProps({ subjects: [subjects[1]!] })
      expect(wrapper.findAll('.subject-card').map((card) => card.text())).toEqual(['CSS'])
      expect(wrapper.get('.subject-icon img').attributes('src')).toBe(subjects[1]!.icon)
    } finally {
      wrapper.unmount()
    }
  })

  it('hides existing subjects while loading and renders them when ready', async () => {
    const wrapper = mount(StartMenu, { props: { subjects, state: 'loading' } })
    try {
      expect(wrapper.get('[role="status"]').text()).toBe('Loading quiz subjects…')
      expect(wrapper.get('.subject-results').attributes('aria-busy')).toBe('true')
      expect(wrapper.find('.subject-card, .retry-button').exists()).toBe(false)

      await wrapper.setProps({ state: 'ready' })
      expect(wrapper.get('.subject-results').attributes('aria-busy')).toBe('false')
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
      expect(wrapper.findAll('.subject-card')).toHaveLength(2)
    } finally {
      wrapper.unmount()
    }
  })

  it.each(['error', 'empty'] as const)('emits retry in the %s state', async (state) => {
    const wrapper = mount(StartMenu, { props: { subjects: [], state } })
    try {
      expect(
        wrapper.get(state === 'error' ? '[role="alert"]' : '[role="status"]').text(),
      ).toContain(
        state === 'error'
          ? "We couldn't load the quiz subjects."
          : 'No quiz subjects are available right now.',
      )
      expect(wrapper.find('.subject-card').exists()).toBe(false)
      await wrapper.get('.retry-button').trigger('click')
      expect(wrapper.emitted('retry')).toEqual([[]])
    } finally {
      wrapper.unmount()
    }
  })
})
