import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ThemeToggle from '../../app/components/frontend-quiz-app/ThemeToggle.vue'

describe('Frontend quiz theme toggle', () => {
  it('reflects the supplied theme in its accessible switch state', async () => {
    const wrapper = mount(ThemeToggle, { props: { isDark: false } })
    const toggle = wrapper.get('button')
    expect(toggle.attributes('type')).toBe('button')
    expect(toggle.attributes('role')).toBe('switch')
    expect(toggle.attributes('aria-label')).toBe('Dark mode')
    expect(toggle.attributes('aria-checked')).toBe('false')

    await wrapper.setProps({ isDark: true })
    expect(toggle.attributes('aria-checked')).toBe('true')
    wrapper.unmount()
  })

  it('requests a toggle without changing the parent-owned theme', async () => {
    const wrapper = mount(ThemeToggle, { props: { isDark: false } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('toggle')).toEqual([[]])
    expect(wrapper.get('button').attributes('aria-checked')).toBe('false')
    wrapper.unmount()
  })
})
