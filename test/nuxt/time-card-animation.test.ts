import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import TimeCard from '../../app/components/time-tracking-dashboard/TimeCard.vue'

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
const reducedMotion = ref(false)
vi.mock('motion-v', () => ({
  animate: animateMock,
  useReducedMotion: () => reducedMotion,
}))

const tracker = {
  title: 'Work',
  timeframes: {
    daily: { current: 5, previous: 7 },
    weekly: { current: 32, previous: 36 },
    monthly: { current: 103, previous: 128 },
  },
}
const wrappers: Awaited<ReturnType<typeof mountSuspended>>[] = []

beforeEach(() => {
  reducedMotion.value = false
  animateMock.mockReset().mockImplementation(() => ({ stop: vi.fn() }))
})

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})

async function mountCard() {
  const wrapper = await mountSuspended(TimeCard, { props: { tracker, timeframe: 'daily' } })
  wrappers.push(wrapper)
  return wrapper
}

function latestAnimation() {
  return animateMock.mock.calls.at(-1)![2]
}

describe('Time card number animation', () => {
  it('counts from zero on mount while exposing only the final total to screen readers', async () => {
    const wrapper = await mountCard()
    expect(animateMock).toHaveBeenCalledWith(
      0,
      5,
      expect.objectContaining({ duration: 0.5, ease: 'easeOut' }),
    )
    expect(wrapper.get('.current-hours [aria-hidden]').text()).toBe('0hr')
    expect(wrapper.get('.current-hours .sr-only').text()).toBe('5hrs')
    expect(wrapper.get('.previous-hours').text()).toBe('Yesterday - 7hrs')

    latestAnimation().onUpdate(1.2)
    await nextTick()
    expect(wrapper.get('.current-hours [aria-hidden]').text()).toBe('1hr')
    latestAnimation().onComplete()
    await nextTick()
    expect(wrapper.get('.current-hours [aria-hidden]').text()).toBe('5hrs')
  })

  it('counts up and down from the displayed total on timeframe changes', async () => {
    const wrapper = await mountCard()
    latestAnimation().onComplete()
    await wrapper.setProps({ timeframe: 'weekly' })
    expect(animateMock.mock.calls.at(-1)?.slice(0, 2)).toEqual([5, 32])
    expect(wrapper.get('.previous-hours').text()).toBe('Last Week - 36hrs')
    latestAnimation().onComplete()
    await wrapper.setProps({ timeframe: 'daily' })
    expect(animateMock.mock.calls.at(-1)?.slice(0, 2)).toEqual([32, 5])
  })

  it('stops an interrupted animation and retargets from the displayed integer', async () => {
    const wrapper = await mountCard()
    latestAnimation().onUpdate(2.7)
    const stop = animateMock.mock.results.at(-1)!.value.stop
    await wrapper.setProps({ timeframe: 'monthly' })
    expect(stop).toHaveBeenCalledOnce()
    expect(animateMock.mock.calls.at(-1)?.slice(0, 2)).toEqual([3, 103])
    expect(wrapper.get('.current-hours .sr-only').text()).toBe('103hrs')
    expect(wrapper.get('.current-hours').classes()).toContain('large-hours')
  })

  it('skips mount and update animations when reduced motion is requested', async () => {
    reducedMotion.value = true
    const wrapper = await mountCard()
    expect(wrapper.get('.current-hours [aria-hidden]').text()).toBe('5hrs')
    await wrapper.setProps({ timeframe: 'monthly' })
    expect(wrapper.get('.current-hours [aria-hidden]').text()).toBe('103hrs')
    expect(animateMock).not.toHaveBeenCalled()
  })

  it('lets the current animation finish and checks reduced motion on the next change', async () => {
    const wrapper = await mountCard()
    const stop = animateMock.mock.results.at(-1)!.value.stop
    reducedMotion.value = true
    await nextTick()
    expect(stop).not.toHaveBeenCalled()
    expect(wrapper.get('.current-hours [aria-hidden]').text()).toBe('0hr')

    latestAnimation().onComplete()
    await nextTick()
    expect(wrapper.get('.current-hours [aria-hidden]').text()).toBe('5hrs')
    await wrapper.setProps({ timeframe: 'weekly' })
    expect(wrapper.get('.current-hours [aria-hidden]').text()).toBe('32hrs')
    expect(animateMock).toHaveBeenCalledOnce()
  })

  it('stops the active animation on unmount', async () => {
    const wrapper = await mountCard()
    const stop = animateMock.mock.results.at(-1)!.value.stop
    wrapper.unmount()
    wrappers.splice(wrappers.indexOf(wrapper), 1)
    expect(stop).toHaveBeenCalledOnce()
  })
})
