import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRouter } from '#app'
import MeetPage from '../../app/pages/meet-landing-page/index.vue'

mockNuxtImport('useChallengePage', () => async () => {})

const wrappers: Awaited<ReturnType<typeof mountSuspended>>[] = []

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})

describe('Meet section navigation', () => {
  it('updates the router hash, preserves the query, and focuses the template-ref heading', async () => {
    const wrapper = await mountSuspended(MeetPage, {
      route: '/meet-landing-page?preview=1',
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    const router = useRouter()
    const heading = wrapper.get('#smarter-meetings').element
    const focus = vi.spyOn(heading as HTMLHeadingElement, 'focus')
    const push = vi.spyOn(router, 'push')

    await wrapper.get('a[href="#smarter-meetings"]').trigger('click', { button: 0 })
    await flushPromises()

    await push.mock.results[0]?.value
    await flushPromises()
    expect(router.currentRoute.value.hash).toBe('#smarter-meetings')
    expect(router.currentRoute.value.query).toEqual({ preview: '1' })
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })

    await wrapper.get('a[href="#smarter-meetings"]').trigger('click', { button: 0 })
    await flushPromises()
    expect(focus).toHaveBeenCalledTimes(2)
  })

  it.each([
    { reducedMotion: false, behavior: 'smooth' },
    { reducedMotion: true, behavior: 'instant' },
  ])('lets the router scroll with $behavior behavior', async ({ reducedMotion, behavior }) => {
    const wrapper = await mountSuspended(MeetPage, { route: '/meet-landing-page' })
    wrappers.push(wrapper)
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: reducedMotion } as MediaQueryList)
    const router = useRouter()
    const from = router.currentRoute.value
    const to = { ...from, hash: '#smarter-meetings' }
    const heading = wrapper.get('#smarter-meetings').element

    expect(await router.options.scrollBehavior?.(to, from, null)).toMatchObject({
      el: heading,
      behavior,
    })
    const savedPosition = { left: 0, top: 120 }
    expect(await router.options.scrollBehavior?.(to, from, savedPosition)).toEqual(savedPosition)
  })

  it('leaves modified clicks to the browser', async () => {
    const wrapper = await mountSuspended(MeetPage, { route: '/meet-landing-page' })
    wrappers.push(wrapper)
    const push = vi.spyOn(useRouter(), 'push')

    await wrapper.get('a[href="#smarter-meetings"]').trigger('click', { ctrlKey: true })

    expect(push).not.toHaveBeenCalled()
  })

  it('restores the default scroll behavior when leaving the page', async () => {
    const router = useRouter()
    const defaultScrollBehavior = router.options.scrollBehavior
    const wrapper = await mountSuspended(MeetPage, { route: '/meet-landing-page' })

    expect(router.options.scrollBehavior).not.toBe(defaultScrollBehavior)
    wrapper.unmount()
    expect(router.options.scrollBehavior).toBe(defaultScrollBehavior)
  })
})
