<template>
  <div class="flex min-h-dvh flex-col bg-gray-50 font-showcase text-gray-900">
    <AppHeader />
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-10">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
