import { describe, expect, it, vi } from 'vitest'
import {
  generatePassword,
  passwordCategories,
  passwordSettingsError,
  passwordStrength,
  type PasswordCategory,
} from '../../app/utils/password-generator'

const allCategories = passwordCategories.map((category) => category.id)

describe('Password generation', () => {
  it.each([0, -1, 21, 1.5, NaN])('rejects invalid length %s', (length) => {
    expect(() => generatePassword(length, ['numbers'])).toThrow('Choose a character length')
  })

  it('rejects missing categories and lengths shorter than the selected category count', () => {
    expect(passwordSettingsError(10, [])).toBe('Select at least one character category.')
    expect(() => generatePassword(3, allCategories)).toThrow('one character per selected category')
    expect(passwordSettingsError(4, allCategories)).toBe('')
  })

  it.each(passwordCategories)(
    'uses only $id characters when it is the only category',
    (category) => {
      for (let attempt = 0; attempt < 20; attempt++) {
        const password = generatePassword(20, [category.id])
        expect(password).toHaveLength(20)
        expect([...password].every((character) => category.characters.includes(character))).toBe(
          true,
        )
      }
    },
  )

  it.each([4, 10, 20])('includes every selected category at length %s', (length) => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const password = generatePassword(length, allCategories)
      expect(password).toHaveLength(length)
      for (const category of passwordCategories) {
        expect([...password].some((character) => category.characters.includes(character))).toBe(
          true,
        )
      }
    }
  })

  it('discards random bytes outside the unbiased range', () => {
    const random = vi.spyOn(globalThis.crypto, 'getRandomValues')
    random.mockImplementationOnce((array) => {
      ;(array as Uint8Array)[0] = 255
      return array
    })
    random.mockImplementationOnce((array) => {
      ;(array as Uint8Array)[0] = 7
      return array
    })
    try {
      expect(generatePassword(1, ['numbers'])).toBe('7')
      expect(random).toHaveBeenCalledTimes(2)
    } finally {
      random.mockRestore()
    }
  })
})

describe('Password strength estimate', () => {
  it('has no score without a generated length or character pool', () => {
    expect(passwordStrength(0, allCategories)).toBeNull()
    expect(passwordStrength(10, [])).toBeNull()
  })

  it.each<[number, PasswordCategory[], string, number]>([
    [8, ['numbers'], 'TOO WEAK!', 1],
    [9, ['numbers'], 'WEAK', 2],
    [10, ['uppercase', 'lowercase', 'numbers'], 'MEDIUM', 3],
    [11, ['uppercase', 'lowercase', 'numbers'], 'STRONG', 4],
  ])('scores length %s with %s as %s', (length, categories, label, level) => {
    expect(passwordStrength(length, categories)).toMatchObject({ label, level })
  })
})
