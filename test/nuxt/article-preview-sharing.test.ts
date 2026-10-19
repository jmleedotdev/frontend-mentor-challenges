import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ArticlePage from '../../app/pages/article-preview-component/index.vue'

mockNuxtImport('useChallengePage', () => async () => {})

const wrappers: Awaited<ReturnType<typeof mountSuspended>>[] = []

async function mountPage() {
  const wrapper = await mountSuspended(ArticlePage, {
    route: '/article-preview-component',
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})

describe('Article sharing', () => {
  it('starts closed and toggles with the share button', async () => {
    const wrapper = await mountPage()
    const button = wrapper.get('button[aria-controls="article-share-panel"]')
    const panel = wrapper.get('#article-share-panel')

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(panel.isVisible()).toBe(false)
    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(panel.isVisible()).toBe(true)
    await button.trigger('click')
    expect(panel.isVisible()).toBe(false)
  })

  it('dismisses with Escape and returns focus to the share button', async () => {
    const wrapper = await mountPage()
    const button = wrapper.get('button')
    await button.trigger('click')
    ;(wrapper.get('#article-share-panel a').element as HTMLAnchorElement).focus()

    await wrapper.get('#article-share-panel a').trigger('keydown', { key: 'Tab' })
    expect(button.attributes('aria-expanded')).toBe('true')
    await wrapper.get('#article-share-panel a').trigger('keydown', { key: 'Escape' })

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button.element)
  })

  it('keeps panel clicks open but dismisses clicks outside the controls', async () => {
    const wrapper = await mountPage()
    const button = wrapper.get('button')
    await button.trigger('click')
    await wrapper.get('#article-share-panel').trigger('pointerdown')
    expect(button.attributes('aria-expanded')).toBe('true')
    await button.trigger('pointerdown')
    expect(button.attributes('aria-expanded')).toBe('true')

    await wrapper.get('h1').trigger('pointerdown')
    expect(button.attributes('aria-expanded')).toBe('false')
    await button.trigger('click')
    await wrapper.get('main').trigger('pointerdown')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('links to the official social websites without sharing parameters', async () => {
    const wrapper = await mountPage()
    await wrapper.get('button').trigger('click')
    const links = wrapper.findAll('#article-share-panel a')
    expect(links).toHaveLength(3)
    expect(links.map((link) => link.attributes('href'))).toEqual([
      'https://www.facebook.com/',
      'https://x.com/',
      'https://www.pinterest.com/',
    ])
    for (const link of links) {
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toContain('noopener')
      expect(link.attributes('aria-label')).toMatch(/^Visit .+ \(opens in a new tab\)$/)
    }
  })

  it('does not handle pointer or keyboard events outside main', async () => {
    const wrapper = await mountPage()
    const button = wrapper.get('button')
    await button.trigger('click')

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()

    expect(button.attributes('aria-expanded')).toBe('true')
  })
})
