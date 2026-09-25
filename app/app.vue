<script setup lang="ts">
const route = useRoute()
const { siteUrl } = useRuntimeConfig().public
const pageUrl = computed(() => `${siteUrl}${route.path}`)

useHead({
  titleTemplate: (title) =>
    title ? `${title} | Frontend Mentor Challenges` : 'Frontend Mentor Challenges',
  link: [{ rel: 'canonical', href: pageUrl }],
})

useSeoMeta({
  ogUrl: pageUrl,
  twitterCard: 'summary',
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
