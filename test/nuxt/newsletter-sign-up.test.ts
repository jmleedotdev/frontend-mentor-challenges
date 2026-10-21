import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import NewsletterPage from '../../app/pages/newsletter-sign-up/index.vue'
import SuccessModal from '../../app/components/newsletter-sign-up/SuccessModal.vue'

mockNuxtImport('useChallengePage', () => async () => {})

const wrappers: Awaited<ReturnType<typeof mountSuspended>>[] = []

async function mountPage() {
  const wrapper = await mountSuspended(NewsletterPage, {
    route: '/newsletter-sign-up',
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})

describe('Newsletter sign-up', () => {
  it('does not show an error before submitting, even while typing an invalid address', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('dialog').exists()).toBe(false)
    await wrapper.get('input').setValue('ash#loremcompany.com')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('false')
    expect(wrapper.get('form').attributes()).toHaveProperty('novalidate')
  })

  it.each(['', 'ash#loremcompany.com', 'ash@', 'ash @example.com'])(
    'rejects invalid email %j with the designed, associated inline error',
    async (email) => {
      const wrapper = await mountPage()
      const input = wrapper.get('input')
      await input.setValue(email)
      await wrapper.get('form').trigger('submit')
      expect(wrapper.get('[role="alert"]').text()).toBe('Valid email required')
      expect(input.attributes('aria-invalid')).toBe('true')
      expect(input.attributes('aria-describedby')).toBe('newsletter-email-error')
      expect(document.activeElement).toBe(input.element)
      expect(wrapper.find('dialog').exists()).toBe(false)
    },
  )

  it('keeps the error until the address is valid, without opening success while typing', async () => {
    const wrapper = await mountPage()
    await wrapper.get('form').trigger('submit')
    await wrapper.get('input').setValue('still-invalid')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    await wrapper.get('input').setValue('ash@example.com')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('false')
    expect(wrapper.get('input').attributes('aria-describedby')).toBeUndefined()
    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('opens a separate success modal with the submitted email and immediately resets the form', async () => {
    const wrapper = await mountPage()
    await wrapper.get('input').setValue('reader+monthly@example.com')
    await wrapper.get('form').trigger('submit')
    await nextTick()
    expect(wrapper.findComponent(SuccessModal).props('email')).toBe('reader+monthly@example.com')
    expect(wrapper.get('dialog').attributes()).toHaveProperty('open')
    expect(wrapper.get('dialog strong').text()).toBe('reader+monthly@example.com')
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(wrapper.get('dialog button').element)

    await wrapper.get('dialog').trigger('click')
    expect(wrapper.get('dialog').attributes()).toHaveProperty('open')
    await wrapper.get('dialog button').trigger('click')
    await nextTick()
    expect(wrapper.find('dialog').exists()).toBe(false)
    expect(wrapper.find('form').exists()).toBe(true)
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.activeElement).toBe(wrapper.get('button[type="submit"]').element)
  })

  it('handles native Escape cancellation and supports another submission', async () => {
    const wrapper = await mountPage()
    for (const email of ['first@example.com', 'second@example.com']) {
      await wrapper.get('input').setValue(email)
      await wrapper.get('form').trigger('submit')
      await nextTick()
      expect(wrapper.get('dialog strong').text()).toBe(email)
      await wrapper.get('dialog').trigger('cancel')
      await nextTick()
      expect(wrapper.find('dialog').exists()).toBe(false)
      expect(document.activeElement).toBe(wrapper.get('button[type="submit"]').element)
    }
  })

  it('restores the previous scroll setting when unmounted with an open modal', async () => {
    document.documentElement.style.overflow = 'clip'
    const wrapper = await mountPage()
    await wrapper.get('input').setValue('reader@example.com')
    await wrapper.get('form').trigger('submit')
    await nextTick()
    wrapper.unmount()
    wrappers.splice(wrappers.indexOf(wrapper), 1)
    expect(document.documentElement.style.overflow).toBe('clip')
    document.documentElement.style.overflow = ''
  })
})
