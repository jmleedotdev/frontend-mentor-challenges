import type { DIFFICULTIES } from '../utils/difficulty'

/** 1 = newbie, 2 = junior, 3 = intermediate, 4 = advanced, 5 = guru */
export type Difficulty = (typeof DIFFICULTIES)[number]

export interface Challenge {
  slug: string
  title: string
  description: string
  difficulty: Difficulty
}
