<script setup lang="ts">
useHead({
  titleTemplate: (title) =>
    title ? `${title} | Frontend Mentor Challenges` : 'Frontend Mentor Challenges',
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
