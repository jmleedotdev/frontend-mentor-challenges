<template>
  <div>
    <slot />
    <NuxtLink
      to="/"
      aria-label="All challenges"
      class="fixed right-4 bottom-4 z-50 flex size-10 items-center justify-center rounded-full bg-white/90 opacity-70 shadow-md ring-1 ring-black/10 transition-opacity hover:opacity-100 focus-visible:opacity-100"
    >
      <img src="/favicon.ico" alt="" width="24" height="24" class="size-6" />
    </NuxtLink>
  </div>
</template>
