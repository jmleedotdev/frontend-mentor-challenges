<script setup lang="ts">
const route = useRoute()
const { siteUrl } = useRuntimeConfig().public
const pageUrl = computed(() => `${siteUrl}${route.path}`)

useHead({
  titleTemplate: (title) => (title ? `${title} | ${SITE_NAME}` : SITE_NAME),
  link: [{ rel: 'canonical', href: pageUrl }],
})

useSeoMeta({
  ogUrl: pageUrl,
  ogSiteName: SITE_NAME,
  ogLocale: 'en_US',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
