import { describe, expect, it } from 'vitest'
import type { Challenge } from '#shared/types/challenge'
import {
  filterChallenges,
  formatDifficultyQuery,
  parseDifficultyQuery,
  parseSearchQuery,
} from '../../app/utils/challenge-filters'

const challenges: Challenge[] = [
  { slug: 'qr-code', title: 'QR code component', description: '', difficulty: 1 },
  { slug: 'blog-card', title: 'Blog preview card', description: '', difficulty: 1 },
  { slug: 'rest-countries', title: 'REST Countries API', description: '', difficulty: 4 },
  { slug: 'tip-calc', title: 'Tip calculator app', description: '', difficulty: 2 },
]

const slugs = (result: Challenge[]) => result.map((challenge) => challenge.slug)

describe('parseSearchQuery', () => {
  it('reads a single value', () => expect(parseSearchQuery('card')).toBe('card'))
  it('uses the first of repeated values', () => expect(parseSearchQuery(['a', 'b'])).toBe('a'))
  it('defaults to an empty string', () => {
    expect(parseSearchQuery(undefined)).toBe('')
    expect(parseSearchQuery(null)).toBe('')
    expect(parseSearchQuery([])).toBe('')
  })
})

describe('parseDifficultyQuery', () => {
  it('reads a single value', () => expect(parseDifficultyQuery('2')).toEqual([2]))
  it('reads comma-separated values, easiest first', () =>
    expect(parseDifficultyQuery('5,1,3')).toEqual([1, 3, 5]))
  it('drops unknown values and duplicates', () =>
    expect(parseDifficultyQuery('0,2,2,6,guru,,1.5')).toEqual([2]))
  it('uses the first of repeated keys', () =>
    expect(parseDifficultyQuery(['1,2', '5'])).toEqual([1, 2]))
  it('defaults to no difficulties', () => {
    expect(parseDifficultyQuery(undefined)).toEqual([])
    expect(parseDifficultyQuery('')).toEqual([])
  })
})

describe('formatDifficultyQuery', () => {
  it('joins with commas, easiest first', () =>
    expect(formatDifficultyQuery([5, 1, 3])).toBe('1,3,5'))
  it('drops the key when nothing is selected', () =>
    expect(formatDifficultyQuery([])).toBeUndefined())
})

describe('filterChallenges', () => {
  it('returns everything in the original order when no filters are set', () =>
    expect(slugs(filterChallenges(challenges, { search: '', difficulties: [] }))).toEqual([
      'qr-code',
      'blog-card',
      'rest-countries',
      'tip-calc',
    ]))

  it('searches titles case-insensitively, ignoring surrounding whitespace', () =>
    expect(slugs(filterChallenges(challenges, { search: '  CARD ', difficulties: [] }))).toEqual([
      'blog-card',
    ]))

  it('matches any of the selected difficulties', () =>
    expect(slugs(filterChallenges(challenges, { search: '', difficulties: [2, 4] }))).toEqual([
      'rest-countries',
      'tip-calc',
    ]))

  it('combines search and difficulties', () =>
    expect(slugs(filterChallenges(challenges, { search: 'co', difficulties: [1] }))).toEqual([
      'qr-code',
    ]))

  it('returns nothing when nothing matches', () =>
    expect(filterChallenges(challenges, { search: 'zzz', difficulties: [] })).toEqual([]))
})
