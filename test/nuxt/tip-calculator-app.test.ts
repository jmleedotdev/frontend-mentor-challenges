import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import TipCalculator from '../../app/pages/tip-calculator-app/index.vue'

mockNuxtImport('useChallengePage', () => async () => {})

const wrappers: Awaited<ReturnType<typeof mountSuspended>>[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

async function mountPage() {
  const wrapper = await mountSuspended(TipCalculator, { route: '/tip-calculator-app' })
  wrappers.push(wrapper)
  return wrapper
}

function amounts(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  return [wrapper.get('#tip-amount').text(), wrapper.get('#total-amount').text()]
}

describe('Tip calculator', () => {
  it('starts empty without errors or a selected tip and disables Reset', async () => {
    const wrapper = await mountPage()
    expect(
      wrapper.findAll('input').map((input) => (input.element as HTMLInputElement).value),
    ).toEqual(['', '', ''])
    expect(wrapper.find('[aria-pressed="true"]').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(amounts(wrapper)).toEqual(['$0.00', '$0.00'])
    expect(wrapper.get('[type="reset"]').attributes('disabled')).toBeDefined()
  })

  it('updates live and floors both amounts without rounding the tip before the total', async () => {
    const wrapper = await mountPage()
    await wrapper.get('#bill').setValue('142.55')
    await wrapper.get('#people').setValue('5')
    await wrapper.findAll('.tip-button')[2]!.trigger('click')
    expect(amounts(wrapper)).toEqual(['$4.27', '$32.78'])
    await wrapper.get('#people').setValue('3')
    expect(amounts(wrapper)).toEqual(['$7.12', '$54.64'])
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('15%')
  })

  it.each([
    ['1.13', '0', '$0.00', '$1.13'],
    ['0.29', '100', '$0.29', '$0.58'],
    ['1.15', '100', '$1.15', '$2.30'],
    ['1.01', '0.5', '$0.00', '$1.01'],
    ['100', '125.5', '$125.50', '$225.50'],
    ['100', '0', '$0.00', '$100.00'],
  ])(
    'floors correctly for bill %s and custom tip %s',
    async (bill, tip, expectedTip, expectedTotal) => {
      const wrapper = await mountPage()
      await wrapper.get('#bill').setValue(bill)
      await wrapper.get('#people').setValue('1')
      await wrapper.get('#custom-tip').setValue(tip)
      expect(amounts(wrapper)).toEqual([expectedTip, expectedTotal])
    },
  )

  it.each([
    ['100', '100.00'],
    ['100.1', '100.10'],
    ['100.10', '100.10'],
    ['0', '0.00'],
    ['', ''],
  ])('formats bill %s as %s on blur', async (value, formatted) => {
    const wrapper = await mountPage()
    const input = wrapper.get('#bill')
    await input.setValue(value)
    await input.trigger('blur')
    expect((input.element as HTMLInputElement).value).toBe(formatted)
    // Other reactive updates must not strip the formatted trailing zero.
    await wrapper.get('#people').setValue('2')
    expect((input.element as HTMLInputElement).value).toBe(formatted)
  })

  it('truncates excess bill decimals immediately and calculates from the limited value', async () => {
    const wrapper = await mountPage()
    const input = wrapper.get('#bill')
    await input.setValue('100.1299')
    expect((input.element as HTMLInputElement).value).toBe('100.12')
    await wrapper.get('#people').setValue('1')
    await wrapper.get('#custom-tip').setValue('100')
    expect(amounts(wrapper)).toEqual(['$100.12', '$200.24'])
    await input.trigger('blur')
    expect((input.element as HTMLInputElement).value).toBe('100.12')
    await wrapper.get('form').trigger('reset')
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(wrapper.get('[type="reset"]').attributes('disabled')).toBeDefined()
  })

  it('makes custom and preset tips mutually exclusive', async () => {
    const wrapper = await mountPage()
    await wrapper.get('#bill').setValue('100')
    await wrapper.get('#people').setValue('2')
    await wrapper.findAll('.tip-button')[0]!.trigger('click')
    await wrapper.get('#custom-tip').setValue('12.5')
    expect(wrapper.find('[aria-pressed="true"]').exists()).toBe(false)
    expect(amounts(wrapper)).toEqual(['$6.25', '$56.25'])
    await wrapper.get('#custom-tip').setValue('-5')
    expect(wrapper.find('#custom-tip-error').exists()).toBe(true)
    await wrapper.findAll('.tip-button')[3]!.trigger('click')
    expect(wrapper.find('#custom-tip-error').exists()).toBe(false)
    expect(wrapper.get('#custom-tip').attributes('aria-invalid')).toBe('false')
    expect(wrapper.get('#custom-tip').attributes('aria-describedby')).toBeUndefined()
    expect((wrapper.get('#custom-tip').element as HTMLInputElement).value).toBe('')
    expect(wrapper.findAll('[aria-pressed="true"]')).toHaveLength(1)
    expect(amounts(wrapper)).toEqual(['$12.50', '$62.50'])
  })

  it.each([
    ['0', '$0.00'],
    ['100', '$50.00'],
    ['', '$0.00'],
  ])('clears a negative bill error when changed to %s', async (value, total) => {
    const wrapper = await mountPage()
    await wrapper.get('#people').setValue('2')
    await wrapper.get('#bill').setValue('-100')
    expect(wrapper.get('#bill').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#bill').attributes('aria-describedby')).toBe('bill-error')
    expect(wrapper.get('#bill-error').attributes('role')).toBe('alert')
    expect(wrapper.get('#bill-error').text()).toBe("Can't be negative")
    expect(amounts(wrapper)).toEqual(['$0.00', '$0.00'])

    await wrapper.get('#bill').setValue(value)
    expect(wrapper.find('#bill-error').exists()).toBe(false)
    expect(wrapper.get('#bill').attributes('aria-invalid')).toBe('false')
    expect(wrapper.get('#bill').attributes('aria-describedby')).toBeUndefined()
    expect(amounts(wrapper)).toEqual(['$0.00', total])
  })

  it.each([
    ['0', '$0.00', '$50.00'],
    ['12.5', '$6.25', '$56.25'],
    ['125.5', '$62.75', '$112.75'],
    ['', '$0.00', '$50.00'],
  ])('clears a negative custom tip error when changed to %s', async (value, tip, total) => {
    const wrapper = await mountPage()
    await wrapper.get('#bill').setValue('100')
    await wrapper.get('#people').setValue('2')
    await wrapper.get('#custom-tip').setValue('-5')
    expect(wrapper.get('#custom-tip').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#custom-tip').attributes('aria-describedby')).toBe('custom-tip-error')
    expect(wrapper.get('#custom-tip-error').attributes('role')).toBe('alert')
    expect(wrapper.get('#custom-tip-error').text()).toBe("Can't be negative")
    expect(amounts(wrapper)).toEqual(['$0.00', '$0.00'])

    await wrapper.get('#custom-tip').setValue(value)
    expect(wrapper.find('#custom-tip-error').exists()).toBe(false)
    expect(wrapper.get('#custom-tip').attributes('aria-invalid')).toBe('false')
    expect(wrapper.get('#custom-tip').attributes('aria-describedby')).toBeUndefined()
    expect(amounts(wrapper)).toEqual([tip, total])
  })

  it.each(['0', '-1', '1.5'])(
    'rejects %s people and recovers when corrected or cleared',
    async (count) => {
      const wrapper = await mountPage()
      await wrapper.get('#bill').setValue('100')
      await wrapper.get('#people').setValue(count)
      expect(wrapper.get('#people').attributes('aria-invalid')).toBe('true')
      expect(wrapper.get('#people').attributes('aria-describedby')).toBe('people-error')
      expect(wrapper.get('[role="alert"]').text()).toBe(
        count === '0' ? "Can't be zero" : 'Use a whole number',
      )
      expect(amounts(wrapper)).toEqual(['$0.00', '$0.00'])
      await wrapper.get('#people').setValue('2')
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(amounts(wrapper)).toEqual(['$0.00', '$50.00'])
      await wrapper.get('#people').setValue('')
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(amounts(wrapper)).toEqual(['$0.00', '$0.00'])
    },
  )

  it('clears everything including errors on Reset', async () => {
    const wrapper = await mountPage()
    await wrapper.get('#bill').setValue('-100')
    await wrapper.get('#custom-tip').setValue('-12.5')
    await wrapper.get('#people').setValue('0')
    expect(wrapper.get('[type="reset"]').attributes('disabled')).toBeUndefined()
    await wrapper.get('form').trigger('reset')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('#bill').attributes('aria-invalid')).toBe('false')
    expect(wrapper.get('#bill').attributes('aria-describedby')).toBeUndefined()
    expect(wrapper.get('#custom-tip').attributes('aria-invalid')).toBe('false')
    expect(wrapper.get('#custom-tip').attributes('aria-describedby')).toBeUndefined()
    expect(
      wrapper.findAll('input').map((input) => (input.element as HTMLInputElement).value),
    ).toEqual(['', '', ''])
    expect(amounts(wrapper)).toEqual(['$0.00', '$0.00'])
    expect(wrapper.get('[type="reset"]').attributes('disabled')).toBeDefined()
    await wrapper.findAll('.tip-button')[2]!.trigger('click')
    await wrapper.get('form').trigger('reset')
    expect(wrapper.find('[aria-pressed="true"]').exists()).toBe(false)
  })

  it('never displays negative results for negative bills or tips', async () => {
    const wrapper = await mountPage()
    await wrapper.get('#people').setValue('1')
    await wrapper.get('#bill').setValue('-100')
    expect(amounts(wrapper)).toEqual(['$0.00', '$0.00'])
    await wrapper.get('#bill').setValue('100')
    await wrapper.get('#custom-tip').setValue('-5')
    expect(amounts(wrapper)).toEqual(['$0.00', '$0.00'])
  })
})
