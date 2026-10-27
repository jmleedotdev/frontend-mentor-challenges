import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import InteractiveRating from '../../app/pages/interactive-rating-component/index.vue'

mockNuxtImport('useChallengePage', () => async () => {})

const wrappers: Awaited<ReturnType<typeof mountSuspended>>[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

async function mountPage() {
  const wrapper = await mountSuspended(InteractiveRating, {
    route: '/interactive-rating-component',
  })
  wrappers.push(wrapper)
  return wrapper
}

describe('Interactive rating component', () => {
  it('starts with five unselected ratings and an enabled Submit button', async () => {
    const wrapper = await mountPage()
    expect(wrapper.get('h1').text()).toBe('How did we do?')
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(5)
    expect(wrapper.find('input:checked').exists()).toBe(false)
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('.thank-you-content').exists()).toBe(false)
  })

  it('requires a rating and clears the accessible validation message on selection', async () => {
    const wrapper = await mountPage()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="alert"]').text()).toBe('Please select a rating')
    expect(wrapper.get('fieldset').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('fieldset').attributes('aria-describedby')).toContain('rating-error')
    expect(wrapper.find('.thank-you-content').exists()).toBe(false)
    await wrapper.get('#rating-3').setValue(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('fieldset').attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.get('fieldset').attributes('aria-describedby')).not.toContain('rating-error')
  })

  it.each([1, 2, 3, 4, 5])(
    'confirms the submitted rating %i and replaces the form',
    async (rating) => {
      const wrapper = await mountPage()
      await wrapper.get(`#rating-${rating}`).setValue(true)
      await wrapper.get('form').trigger('submit')
      expect(wrapper.get('h1').text()).toBe('Thank you!')
      expect(wrapper.get('.rating-summary').text()).toBe(`You selected ${rating} out of 5`)
      expect(wrapper.find('form').exists()).toBe(false)
      expect(wrapper.find('button').exists()).toBe(false)
      expect(wrapper.get('section').attributes('aria-labelledby')).toBe('thank-you-title')
      expect(wrapper.get('.thank-you-image img').attributes('src')).toBe(
        '/img/interactive-rating-component/illustration-thank-you.svg',
      )
    },
  )

  it('allows a selection to change and submits only the latest choice', async () => {
    const wrapper = await mountPage()
    const card = wrapper.get('.rating-card').element
    await wrapper.get('#rating-2').setValue(true)
    await wrapper.get('#rating-5').setValue(true)
    expect(wrapper.findAll('input:checked')).toHaveLength(1)
    expect(wrapper.get('input:checked').attributes('id')).toBe('rating-5')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('.rating-summary').text()).toBe('You selected 5 out of 5')
    expect(wrapper.get('.rating-card').element).toBe(card)
  })

  it('starts a fresh visit without retaining a submitted rating', async () => {
    const previousVisit = await mountPage()
    await previousVisit.get('#rating-4').setValue(true)
    await previousVisit.get('form').trigger('submit')
    const nextVisit = await mountPage()
    expect(nextVisit.find('input:checked').exists()).toBe(false)
    expect(nextVisit.find('.thank-you-content').exists()).toBe(false)
  })
})
