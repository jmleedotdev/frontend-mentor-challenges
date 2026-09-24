import type { LocationQueryRaw } from 'vue-router'
import type { Difficulty } from '#shared/types/challenge'

/** Gallery search and difficulty filters, stored in the URL query (`?q=&difficulty=`). */
export function useChallengeFilters() {
  const route = useRoute()
  const router = useRouter()

  // `replace` so typing in the search box doesn't flood the history; undefined drops the key.
  function updateQuery(patch: LocationQueryRaw) {
    return router.replace({ query: { ...route.query, ...patch } })
  }

  const search = computed({
    get: () => parseSearchQuery(route.query.q),
    set: (value: string) => updateQuery({ q: value || undefined }),
  })

  const difficulties = computed({
    get: () => parseDifficultyQuery(route.query.difficulty),
    set: (value: Difficulty[]) => updateQuery({ difficulty: formatDifficultyQuery(value) }),
  })

  const hasActiveFilters = computed(() => search.value !== '' || difficulties.value.length > 0)

  function clearAll() {
    return updateQuery({ q: undefined, difficulty: undefined })
  }

  return { search, difficulties, hasActiveFilters, clearAll }
}
