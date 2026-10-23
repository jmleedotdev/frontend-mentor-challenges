import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PasswordGenerator from '../../app/pages/password-generator-app/index.vue'

mockNuxtImport('useChallengePage', () => async () => {})

const wrappers: Awaited<ReturnType<typeof mountSuspended>>[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
  vi.useRealTimers()
})

async function mountPage() {
  const wrapper = await mountSuspended(PasswordGenerator, { route: '/password-generator-app' })
  wrappers.push(wrapper)
  return wrapper
}

async function configure(wrapper: Awaited<ReturnType<typeof mountPage>>, length = 10) {
  await wrapper.get('#password-length').setValue(length)
  for (const checkbox of wrapper.findAll('[type="checkbox"]').slice(0, 3)) {
    await checkbox.setValue(true)
  }
}

function mockClipboard(write = vi.fn().mockResolvedValue(undefined)) {
  vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({ write } as unknown as Clipboard)
  return write
}

describe('Password generator page', () => {
  it('starts empty with zero length, unchecked categories and empty strength bars', async () => {
    const wrapper = await mountPage()
    expect(wrapper.get('#generated-password').text()).toBe('P4$5W0rD!')
    expect(wrapper.get('#generated-password').classes()).toContain('password-placeholder')
    expect((wrapper.get('#password-length').element as HTMLInputElement).value).toBe('10')
    expect(
      wrapper.findAll('[type="checkbox"]').every((el) => !(el.element as HTMLInputElement).checked),
    ).toBe(true)
    expect(wrapper.get('.strength-label').text()).toBe('')
    expect(wrapper.get('.copied').text()).toBe('')
    expect(wrapper.get('[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.copy-button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('requires valid settings and includes all selected categories on Generate', async () => {
    const wrapper = await mountPage()
    await wrapper.get('#password-length').setValue(10)
    expect(wrapper.get('[type="submit"]').attributes('disabled')).toBeDefined()
    await configure(wrapper, 2)
    expect(wrapper.get('[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('#settings-help').text()).toContain('one character per selected category')
    await wrapper.get('#password-length').setValue(10)
    expect(wrapper.get('[type="submit"]').attributes('disabled')).toBeUndefined()
    await wrapper.get('form').trigger('submit')
    const password = wrapper.get('#generated-password').text()
    expect(password).toHaveLength(10)
    expect(password).toMatch(/^[a-zA-Z0-9]+$/)
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[0-9]/)
    expect(wrapper.get('.strength-label').text()).toBe('MEDIUM')
    expect(wrapper.findAll('.strength-bar[style]')).toHaveLength(3)
    expect(wrapper.get('.copy-button').attributes('disabled')).toBeUndefined()
  })

  it('keeps output and strength unchanged when settings change', async () => {
    const wrapper = await mountPage()
    await configure(wrapper)
    await wrapper.get('form').trigger('submit')
    const password = wrapper.get('#generated-password').text()
    await wrapper.get('#password-length').setValue(20)
    await wrapper.findAll('[type="checkbox"]')[3]!.setValue(true)
    expect(wrapper.get('#generated-password').text()).toBe(password)
    expect(wrapper.get('.strength-label').text()).toBe('MEDIUM')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('#generated-password').text()).toHaveLength(20)
    expect(wrapper.get('.strength-label').text()).toBe('STRONG')
  })

  it('copies exactly the generated password and clears COPIED on another generation', async () => {
    const write = mockClipboard()
    const wrapper = await mountPage()
    await configure(wrapper)
    await wrapper.get('form').trigger('submit')
    await wrapper.get('.copy-button').trigger('click')
    await flushPromises()
    expect(write).toHaveBeenCalledTimes(1)
    const [item] = write.mock.calls[0]![0] as ClipboardItem[]
    expect(await (await item!.getType('text/plain')).text()).toBe(
      wrapper.get('#generated-password').text(),
    )
    expect(wrapper.get('.copied').text()).toBe('COPIED')
    await wrapper.get('#password-length').setValue(12)
    expect(wrapper.get('.copied').text()).toBe('COPIED')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('.copied').text()).toBe('')
  })

  it('resets COPIED after 1.5 seconds and restarts the timer on another copy', async () => {
    mockClipboard()
    const wrapper = await mountPage()
    await configure(wrapper)
    await wrapper.get('form').trigger('submit')
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await wrapper.get('.copy-button').trigger('click')
    await flushPromises()
    expect(wrapper.get('.copied').text()).toBe('COPIED')
    await vi.advanceTimersByTimeAsync(1000)
    await wrapper.get('.copy-button').trigger('click')
    await flushPromises()
    await vi.advanceTimersByTimeAsync(1499)
    expect(wrapper.get('.copied').text()).toBe('COPIED')
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.get('.copied').text()).toBe('')
  })

  it('does not show COPIED before clipboard success or for an obsolete password', async () => {
    let finishCopy!: () => void
    const write = mockClipboard(
      vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finishCopy = resolve
          }),
      ),
    )
    const wrapper = await mountPage()
    await configure(wrapper)
    await wrapper.get('form').trigger('submit')
    await wrapper.get('.copy-button').trigger('click')
    expect(wrapper.get('.copied').text()).toBe('')
    expect(wrapper.get('.copy-button').attributes('disabled')).toBeDefined()
    await wrapper.get('.copy-button').trigger('click')
    expect(write).toHaveBeenCalledTimes(1)
    await wrapper.get('form').trigger('submit')
    finishCopy()
    await flushPromises()
    expect(wrapper.get('.copied').text()).toBe('')
    expect(wrapper.get('.copy-button').attributes('disabled')).toBeUndefined()
    await wrapper.get('.copy-button').trigger('click')
    finishCopy()
    await flushPromises()
    expect(wrapper.get('.copied').text()).toBe('COPIED')
  })

  it('accepts best-effort legacy fallback feedback even when execCommand returns false', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('Denied')))
    const wrapper = await mountPage()
    await configure(wrapper)
    await wrapper.get('form').trigger('submit')
    const legacyCopy = vi.fn().mockReturnValue(false)
    Object.defineProperty(document, 'execCommand', { configurable: true, value: legacyCopy })
    try {
      await wrapper.get('.copy-button').trigger('click')
      await flushPromises()
      expect(legacyCopy).toHaveBeenCalledWith('copy')
      expect(wrapper.get('.copied').text()).toBe('COPIED')
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    } finally {
      Reflect.deleteProperty(document, 'execCommand')
    }
  })

  it('announces thrown clipboard errors and recovers on a successful retry', async () => {
    const write = mockClipboard(
      vi.fn().mockRejectedValueOnce(new Error('Denied')).mockResolvedValue(undefined),
    )
    const wrapper = await mountPage()
    await configure(wrapper)
    await wrapper.get('form').trigger('submit')
    await wrapper.get('.copy-button').trigger('click')
    await flushPromises()
    expect(wrapper.get('.copied').text()).toBe('')
    expect(wrapper.get('[role="alert"]').text()).toContain('Could not copy')
    await wrapper.get('.copy-button').trigger('click')
    await flushPromises()
    expect(write).toHaveBeenCalledTimes(2)
    expect(wrapper.get('.copied').text()).toBe('COPIED')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('handles unavailable clipboard and cryptographic APIs without claiming success', async () => {
    const wrapper = await mountPage()
    await configure(wrapper)
    const random = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(() => {
      throw new Error('Unavailable')
    })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="alert"]').text()).toContain('Unable to generate a secure password')
    expect(wrapper.get('#generated-password').classes()).toContain('password-placeholder')
    random.mockRestore()
    await wrapper.get('form').trigger('submit')
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(undefined as unknown as Clipboard)
    await wrapper.get('.copy-button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Could not copy')
    expect(wrapper.get('.copied').text()).toBe('')
  })
})
