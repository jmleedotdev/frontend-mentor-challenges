import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Button from '../../app/components/newsletter-sign-up/Button.vue'

enableAutoUnmount(afterEach)

describe('Newsletter sign-up button', () => {
  it('renders a non-submitting native button with the supplied label by default', () => {
    const wrapper = mount(Button, { slots: { default: 'Dismiss message' } })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Dismiss message')
  })

  it('supports submitting the sign-up form', () => {
    const wrapper = mount(Button, {
      props: { type: 'submit' },
      slots: { default: 'Subscribe to monthly newsletter' },
    })

    expect(wrapper.attributes('type')).toBe('submit')
  })

  it('forwards native attributes and click handlers', async () => {
    const onClick = vi.fn()
    const wrapper = mount(Button, {
      attrs: { id: 'dismiss-newsletter', 'aria-label': 'Dismiss success message', onClick },
    })

    expect(wrapper.attributes('id')).toBe('dismiss-newsletter')
    expect(wrapper.attributes('aria-label')).toBe('Dismiss success message')
    await wrapper.trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('forwards the disabled attribute', () => {
    const wrapper = mount(Button, { attrs: { disabled: true } })

    expect((wrapper.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('exposes focus for modal focus management', () => {
    const wrapper = mount(Button, { attachTo: document.body })

    wrapper.vm.focus()

    expect(document.activeElement).toBe(wrapper.element)
  })
})
