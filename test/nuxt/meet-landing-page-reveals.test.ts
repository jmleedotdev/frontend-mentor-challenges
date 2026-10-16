import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { EventTarget as DOMEventTarget } from 'happy-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRouter } from '#app'
import MeetPage from '../../app/pages/meet-landing-page/index.vue'

mockNuxtImport('useChallengePage', () => async () => {})

// happy-dom has no layout or viewport intersection delivery.
const observers = new Set<ViewportObserver>()
class ViewportObserver {
  targets = new Set<Element>()

  constructor(readonly callback: IntersectionObserverCallback) {
    observers.add(this)
  }

  observe(target: Element) {
    this.targets.add(target)
  }

  unobserve(target: Element) {
    this.targets.delete(target)
  }

  disconnect() {
    this.targets.clear()
    observers.delete(this)
  }

  takeRecords() {
    return []
  }
}

function intersect(target: Element, isIntersecting: boolean) {
  for (const observer of observers) {
    if (!observer.targets.has(target)) continue
    observer.callback(
      [
        {
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 0.1 : 0,
        } as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    )
  }
}

const wrappers: Awaited<ReturnType<typeof mountSuspended>>[] = []

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', ViewportObserver)
  // Nuxt's test environment retains Node's EventTarget; Motion checks the DOM class.
  vi.stubGlobal('EventTarget', DOMEventTarget)
  const animate = HTMLElement.prototype.animate
  vi.spyOn(HTMLElement.prototype, 'animate').mockImplementation(function (
    this: HTMLElement,
    keyframes,
    options,
  ) {
    const animation = animate.call(this, keyframes, options)
    // happy-dom eagerly creates this promise, unlike the browser's lazy finished getter.
    void animation.finished.catch((error) => {
      if (error.name !== 'AbortError') throw error
    })
    return animation
  })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const top =
      this.matches('.photo-grid, .section-number, .footer-copy') ||
      this.querySelector('#smarter-meetings')
        ? 2000
        : 0
    return {
      top,
      bottom: top + 200,
      left: 0,
      right: 400,
      width: 400,
      height: 200,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }
  })
})

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  observers.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Meet scroll reveals', () => {
  it('does not hide content already visible at startup', async () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
      top: 0,
      bottom: 200,
      left: 0,
      right: 400,
      width: 400,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const wrapper = await mountSuspended(MeetPage, { route: '/meet-landing-page' })
    wrappers.push(wrapper)

    for (const selector of ['#smarter-meetings', '.photo-grid img', '#meet-footer-title']) {
      const element = wrapper.get<HTMLElement>(selector).element
      expect(getComputedStyle(element).opacity || '1').toBe('1')
      expect(element.getAnimations()).toHaveLength(0)
    }
  })

  it('leaves content readable when viewport observation is unavailable', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const wrapper = await mountSuspended(MeetPage, { route: '/meet-landing-page' })
    wrappers.push(wrapper)

    expect(wrapper.get<HTMLHeadingElement>('#smarter-meetings').element.style.opacity).not.toBe('0')
    expect(wrapper.get<HTMLImageElement>('.photo-grid img').element.style.opacity).not.toBe('0')
  })

  it('never leaves keyboard focus inside an invisible footer group', async () => {
    const wrapper = await mountSuspended(MeetPage, {
      route: '/meet-landing-page',
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    const heading = wrapper.get<HTMLHeadingElement>('#meet-footer-title').element
    await vi.waitFor(() => expect(heading.style.opacity).toBe('0'))

    wrapper.get<HTMLButtonElement>('footer button').element.focus()

    await vi.waitFor(() => {
      expect(heading.style.opacity).toBe('1')
      expect(
        wrapper.get<HTMLButtonElement>('footer button').element.parentElement!.style.opacity,
      ).toBe('1')
    })
  })

  it('immediately finishes pending and running reveals when reduced motion is enabled', async () => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const matchMedia = window.matchMedia.bind(window)
    vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
      query === '(prefers-reduced-motion: reduce)' ? preference : matchMedia(query),
    )
    const wrapper = await mountSuspended(MeetPage, {
      route: '/meet-landing-page',
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    await vi.waitFor(() =>
      expect(wrapper.get<HTMLImageElement>('.photo-grid img').element.style.opacity).toBe('0'),
    )
    intersect(wrapper.get('.photo-grid').element, true)
    await vi.waitFor(() =>
      expect(
        wrapper.get<HTMLImageElement>('.photo-grid img').element.getAnimations().length,
      ).toBeGreaterThan(0),
    )

    preference.dispatchEvent(Object.assign(new Event('change'), { matches: true }))

    await vi.waitFor(() => {
      const content = wrapper.findAll<HTMLElement>(
        '.photo-grid img, .section-number, #smarter-meetings, #meet-footer-title',
      )
      expect(content.every((element) => element.element.style.opacity === '1')).toBe(true)
    })
    preference.dispatchEvent(Object.assign(new Event('change'), { matches: false }))
    expect(wrapper.get<HTMLImageElement>('.photo-grid img').element.style.opacity).toBe('1')
  })

  it.each(['smarter-meetings', 'meet-footer-title'])(
    'keeps the directly linked %s heading visible on entry',
    async (id) => {
      const wrapper = await mountSuspended(MeetPage, { route: `/meet-landing-page#${id}` })
      wrappers.push(wrapper)

      expect(wrapper.get<HTMLHeadingElement>(`#${id}`).element.style.opacity).not.toBe('0')
    },
  )

  it('makes the heading visible before the router scrolls to it', async () => {
    const wrapper = await mountSuspended(MeetPage, { route: '/meet-landing-page' })
    wrappers.push(wrapper)
    const heading = wrapper.get<HTMLHeadingElement>('#smarter-meetings').element
    await vi.waitFor(() => expect(heading.style.opacity).toBe('0'))

    const router = useRouter()
    const from = router.currentRoute.value
    await router.options.scrollBehavior?.({ ...from, hash: '#smarter-meetings' }, from, null)

    await vi.waitFor(() => {
      expect(heading.style.opacity).toBe('1')
      expect(heading.style.transform).toBe('none')
    })
  })

  it('reveals feature copy independently of the gallery, dividers, and footer', async () => {
    const wrapper = await mountSuspended(MeetPage, {
      route: '/meet-landing-page',
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    const heading = wrapper.get<HTMLHeadingElement>('#smarter-meetings').element
    const copy = heading.parentElement!.parentElement!
    const text = Array.from(copy.querySelectorAll<HTMLElement>('p, h2'))
    const divider = wrapper.get<HTMLElement>('.section-number').element
    const footerHeading = wrapper.get<HTMLHeadingElement>('#meet-footer-title').element

    await vi.waitFor(() => {
      expect(text.map((element) => element.style.opacity)).toEqual(['0', '0', '0'])
      expect(divider.style.opacity).toBe('0')
      expect(footerHeading.style.opacity).toBe('0')
    })
    intersect(copy, true)
    await vi.waitFor(() =>
      expect(text.every((element) => element.getAnimations().length > 0)).toBe(true),
    )
    text.forEach((element) => element.getAnimations().forEach((animation) => animation.finish()))
    await vi.waitFor(() =>
      expect(text.map((element) => element.style.opacity)).toEqual(['1', '1', '1']),
    )

    expect(wrapper.get<HTMLImageElement>('.photo-grid img').element.style.opacity).toBe('0')
    expect(divider.style.opacity).toBe('0')
    expect(footerHeading.style.opacity).toBe('0')
    expect(wrapper.get('footer picture img').attributes('style')).toBeUndefined()
  })

  it('leaves all content visible when reduced motion is requested', async () => {
    const matchMedia = window.matchMedia.bind(window)
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
      const result = matchMedia(query)
      return query === '(prefers-reduced-motion: reduce)'
        ? Object.defineProperty(result, 'matches', { value: true })
        : result
    })
    const wrapper = await mountSuspended(MeetPage, { route: '/meet-landing-page' })
    wrappers.push(wrapper)

    for (const photo of wrapper.findAll<HTMLImageElement>('.photo-grid img')) {
      expect(getComputedStyle(photo.element).opacity || '1').toBe('1')
      expect(photo.element.getAnimations()).toHaveLength(0)
    }
  })

  it('reveals below-viewport photos once and keeps them visible on re-entry', async () => {
    const wrapper = await mountSuspended(MeetPage, {
      route: '/meet-landing-page',
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    const photos = wrapper.findAll<HTMLImageElement>('.photo-grid img')

    expect(photos).toHaveLength(4)
    await vi.waitFor(() =>
      expect(photos.every((photo) => photo.element.style.opacity === '0')).toBe(true),
    )
    expect(wrapper.get('#meet-title').attributes('style')).toBeUndefined()

    const grid = wrapper.get('.photo-grid').element
    intersect(grid, true)
    // Advance the browser animation boundary; happy-dom doesn't run a visual timeline.
    await vi.waitFor(() => expect(photos[3]!.element.getAnimations().length).toBeGreaterThan(0))
    photos.forEach((photo) =>
      photo.element.getAnimations().forEach((animation) => animation.finish()),
    )
    await vi.waitFor(
      () => {
        expect(photos.map((photo) => photo.element.style.opacity)).toEqual(['1', '1', '1', '1'])
      },
      { timeout: 2500 },
    )

    intersect(grid, false)
    intersect(grid, true)
    expect(photos.every((photo) => photo.element.style.opacity === '1')).toBe(true)
  })
})
