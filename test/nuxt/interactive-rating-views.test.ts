import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import Rating from '../../app/components/interactive-rating-component/Rating.vue'
import ThankYou from '../../app/components/interactive-rating-component/ThankYou.vue'

const wrappers: Awaited<ReturnType<typeof mountSuspended>>[] = []
const hosts: HTMLElement[] = []

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  hosts.splice(0).forEach((host) => host.remove())
})

function attachTo() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  hosts.push(host)
  return host
}

async function mountRating(ratingCount = 5) {
  const wrapper = await mountSuspended(Rating, { props: { ratingCount }, attachTo: attachTo() })
  wrappers.push(wrapper)
  return wrapper
}

describe('Rating', () => {
  it('uses the ratingCount prop for options, the group label and accessible option labels', async () => {
    const wrapper = await mountRating(3)
    expect(wrapper.findAll('[type="radio"]')).toHaveLength(3)
    expect(wrapper.get('legend').text()).toBe('Rating out of 3')
    expect(wrapper.get('#rating-3').attributes('aria-label')).toBe('3 out of 3')
    expect(wrapper.find('input:checked').exists()).toBe(false)
  })

  it('keeps invalid submissions local and focuses the first option', async () => {
    const wrapper = await mountRating()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toBe('Please select a rating')
    expect(document.activeElement).toBe(wrapper.get('#rating-1').element)
    await wrapper.get('#rating-2').setValue(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits only the latest selected rating on valid submission', async () => {
    const wrapper = await mountRating()
    await wrapper.get('#rating-2').setValue(true)
    await wrapper.get('#rating-4').setValue(true)
    expect(wrapper.emitted('submit')).toBeUndefined()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([[4]])
  })
})

describe('ThankYou', () => {
  it('displays the submitted rating and count from props and focuses its heading on mount', async () => {
    const wrapper = await mountSuspended(ThankYou, {
      props: { submittedRating: 2, ratingCount: 3 },
      attachTo: attachTo(),
    })
    wrappers.push(wrapper)
    expect(wrapper.get('.rating-summary').text()).toBe('You selected 2 out of 3')
    expect(document.activeElement).toBe(wrapper.get('h1').element)
    expect(wrapper.get('h1').attributes('tabindex')).toBe('-1')
    expect(wrapper.find('form').exists()).toBe(false)
    await wrapper.setProps({ submittedRating: 1, ratingCount: 5 })
    expect(wrapper.get('.rating-summary').text()).toBe('You selected 1 out of 5')
  })
})
