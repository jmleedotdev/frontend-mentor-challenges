import type { Challenge } from '#shared/types/challenge'

/**
 * Loads the current challenge's entry (slug = first path segment) and sets its SEO meta.
 * Throws a 404 if the page has no matching entry in `server/utils/challenges.ts`.
 */
export async function useChallengePage() {
  const route = useRoute()
  const { siteUrl } = useRuntimeConfig().public
  const slug = route.path.split('/')[1]

  const request = useFetch<Challenge>(`/api/challenges/${slug}`)
  const challenge = request.data

  useSeoMeta({
    title: () => challenge.value?.title,
    description: () => challenge.value?.description,
    ogTitle: () => challenge.value?.title,
    ogDescription: () => challenge.value?.description,
    ogImage: `${siteUrl}/images/${slug}/thumbnail.webp`,
  })

  await request

  if (!challenge.value) {
    throw createError({ statusCode: 404, statusMessage: 'Challenge not found', fatal: true })
  }

  return challenge
}
