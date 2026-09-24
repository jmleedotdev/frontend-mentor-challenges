import type { LocationQueryValue } from 'vue-router'
import type { Challenge, Difficulty } from '#shared/types/challenge'
import { DIFFICULTIES } from '#shared/utils/difficulty'

type QueryValue = LocationQueryValue | LocationQueryValue[] | undefined

export interface ChallengeFilters {
  search: string
  difficulties: Difficulty[]
}

/** Repeated keys (`?q=a&q=b`) use the first value. */
function firstQueryValue(value: QueryValue): string {
  const first = Array.isArray(value) ? value[0] : value
  return first ?? ''
}

/** Reads `?q=` as a single string. */
export function parseSearchQuery(value: QueryValue): string {
  return firstQueryValue(value)
}

/** Reads `?difficulty=1,3` into known difficulties, deduped and easiest first. */
export function parseDifficultyQuery(value: QueryValue): Difficulty[] {
  const levels = firstQueryValue(value).split(',').map(Number)
  return DIFFICULTIES.filter((difficulty) => levels.includes(difficulty))
}

/** Writes difficulties as `1,3` (easiest first), or `undefined` to drop the key. */
export function formatDifficultyQuery(difficulties: Difficulty[]): string | undefined {
  return difficulties.length ? [...difficulties].sort((a, b) => a - b).join(',') : undefined
}

/** Title search (case-insensitive) AND any of the selected difficulties. Keeps the input order. */
export function filterChallenges(challenges: Challenge[], filters: ChallengeFilters): Challenge[] {
  const search = filters.search.trim().toLowerCase()

  return challenges.filter(
    (challenge) =>
      challenge.title.toLowerCase().includes(search) &&
      (filters.difficulties.length === 0 || filters.difficulties.includes(challenge.difficulty)),
  )
}
