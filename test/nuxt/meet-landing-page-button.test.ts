import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Button from '../../app/components/meet-landing-page/Button.vue'

describe('Meet landing page button', () => {
  it('renders a non-submitting button by default', () => {
    const wrapper = mount(Button, { slots: { default: 'Download' } })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.attributes('href')).toBeUndefined()
    expect(wrapper.attributes('data-variant')).toBe('cyan')
    expect(wrapper.text()).toBe('Download')
  })

  it('renders a native link when given a destination', () => {
    const wrapper = mount(Button, {
      props: { variant: 'purple', href: '#smarter-meetings' },
      slots: { default: 'What is it?' },
    })

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('#smarter-meetings')
    expect(wrapper.attributes('type')).toBeUndefined()
    expect(wrapper.attributes('data-variant')).toBe('purple')
  })

  it('keeps the entire label, including version markup, in the default slot', () => {
    const wrapper = mount(Button, {
      slots: { default: 'Download <span class="text-(--button-accent)">v1.3</span>' },
    })

    expect(wrapper.text()).toBe('Download v1.3')
    expect(wrapper.get('span').text()).toBe('v1.3')
  })

  it('allows the page to handle clicks without adding its own action', async () => {
    const wrapper = mount(Button, { slots: { default: 'Download' } })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.element.tagName).toBe('BUTTON')
  })
})
