<script setup lang="ts">
const { data: challenges } = await useFetch('/api/challenges', { default: () => [] })
const { search, difficulties, hasActiveFilters, clearAll } = useChallengeFilters()

const visibleChallenges = computed(() =>
  filterChallenges(challenges.value, { search: search.value, difficulties: difficulties.value }),
)

useSeoMeta({
  description: "JM Lee's solutions to Frontend Mentor challenges.",
  ogTitle: 'Frontend Mentor Challenges',
  ogDescription: "JM Lee's solutions to Frontend Mentor challenges.",
})
</script>

<template>
  <ul v-if="visibleChallenges.length" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <li v-for="challenge in visibleChallenges" :key="challenge.slug">
      <ChallengeCard :challenge="challenge" class="h-full" />
    </li>
  </ul>

  <div v-else class="flex flex-col items-center gap-4 py-24 text-center">
    <p class="text-lg font-medium">No challenges found</p>
    <button
      v-if="hasActiveFilters"
      type="button"
      class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
      @click="clearAll"
    >
      Clear search &amp; filters
    </button>
  </div>
</template>
