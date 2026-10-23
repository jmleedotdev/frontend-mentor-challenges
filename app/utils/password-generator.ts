export const passwordCategories = [
  { id: 'uppercase', label: 'Include Uppercase Letters', characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { id: 'lowercase', label: 'Include Lowercase Letters', characters: 'abcdefghijklmnopqrstuvwxyz' },
  { id: 'numbers', label: 'Include Numbers', characters: '0123456789' },
  { id: 'symbols', label: 'Include Symbols', characters: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~' },
] as const

export type PasswordCategory = (typeof passwordCategories)[number]['id']

export function passwordSettingsError(length: number, categories: PasswordCategory[]) {
  if (!Number.isInteger(length) || length < 1 || length > 20) {
    return 'Choose a character length from 1 to 20.'
  }
  if (!categories.length) return 'Select at least one character category.'
  if (length < categories.length) return 'Use at least one character per selected category.'
  return ''
}

// Discard the extra random values so each character is equally likely.
function randomIndex(size: number) {
  const limit = 256 - (256 % size)
  const bytes = new Uint8Array(1)

  do {
    globalThis.crypto.getRandomValues(bytes)
  } while (bytes[0]! >= limit)

  return bytes[0]! % size
}

export function generatePassword(length: number, categories: PasswordCategory[]) {
  const error = passwordSettingsError(length, categories)
  if (error) throw new Error(error)

  const groups = passwordCategories.filter((category) => categories.includes(category.id))
  const pool = groups.map((group) => group.characters).join('')
  const characters = groups.map((group) => group.characters[randomIndex(group.characters.length)]!)

  while (characters.length < length) characters.push(pool[randomIndex(pool.length)]!)

  // Shuffle so the characters chosen for each category don't stay at the start in a fixed order.
  for (let index = characters.length - 1; index > 0; index--) {
    const other = randomIndex(index + 1)
    ;[characters[index], characters[other]] = [characters[other]!, characters[index]!]
  }

  return characters.join('')
}

export function passwordStrength(length: number, categories: PasswordCategory[]) {
  const poolSize = passwordCategories
    .filter((category) => categories.includes(category.id))
    .reduce((total, category) => total + category.characters.length, 0)

  if (!length || !poolSize) return null

  // A lightweight estimate, not a guarantee of resistance to password cracking.
  const bits = length * Math.log2(poolSize)

  if (bits < 28) return { label: 'TOO WEAK!', level: 1, color: 'var(--color-red-500)' }

  if (bits < 36) return { label: 'WEAK', level: 2, color: 'var(--color-orange-400)' }

  if (bits < 60) return { label: 'MEDIUM', level: 3, color: 'var(--color-yellow-300)' }

  return { label: 'STRONG', level: 4, color: 'var(--color-green-200)' }
}
