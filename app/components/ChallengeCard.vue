<script setup lang="ts">
defineProps<{ challenge: Challenge }>()
</script>

<template>
  <NuxtLink
    :to="`/${challenge.slug}`"
    target="_blank"
    rel="noopener"
    class="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
  >
    <div class="relative aspect-4/3 bg-gray-100">
      <NuxtImg
        :src="`/img/${challenge.slug}/thumbnail.jpg`"
        alt=""
        width="384"
        height="288"
        sizes="sm:100vw md:50vw lg:384px"
        loading="lazy"
        class="size-full object-cover object-top"
      />
      <DifficultyBadge
        :difficulty="challenge.difficulty"
        class="absolute top-3 right-3 rounded-full bg-white px-3 py-1 shadow-sm"
      />
    </div>
    <div class="flex flex-col gap-3 p-6">
      <h2 class="text-xl font-medium">
        {{ challenge.title }}
        <span class="sr-only">(opens in a new tab)</span>
      </h2>
      <p class="text-gray-500">{{ challenge.description }}</p>
    </div>
  </NuxtLink>
</template>
