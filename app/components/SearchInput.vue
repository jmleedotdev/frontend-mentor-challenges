<script setup lang="ts">
const { search } = useChallengeFilters()
</script>

<template>
  <label class="relative block">
    <span class="sr-only">Search challenges</span>
    <input
      v-model="search"
      type="search"
      placeholder="Search challenges..."
      class="w-full rounded-md border border-gray-300 bg-white py-2.5 pr-10 pl-3 text-sm placeholder:text-gray-500 focus:border-gray-900 focus:outline-none"
    />
    <Icon
      name="lucide:search"
      class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-500"
    />
  </label>
</template>
