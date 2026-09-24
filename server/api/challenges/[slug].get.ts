export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const challenge = challenges.find((challenge) => challenge.slug === slug)

  if (!challenge) {
    throw createError({ statusCode: 404, statusMessage: 'Challenge not found' })
  }

  return challenge
})
