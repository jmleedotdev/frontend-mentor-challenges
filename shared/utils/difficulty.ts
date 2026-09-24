export const DIFFICULTY_LABELS = {
  1: 'newbie',
  2: 'junior',
  3: 'intermediate',
  4: 'advanced',
  5: 'guru',
} as const

// Keep this after DIFFICULTY_LABELS: Nuxt's auto-import scanner (mlly) misses any export
// that follows an `export const x = [...]` array literal.
export const DIFFICULTIES = [1, 2, 3, 4, 5] as const
