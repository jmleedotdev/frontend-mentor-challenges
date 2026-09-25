<template>
  <header class="sticky top-0 z-10 border-b border-gray-200 bg-white">
    <div
      class="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6"
    >
      <h1 class="text-xl font-semibold tracking-tight">
        <NuxtLink to="/">{{ SITE_NAME }}</NuxtLink>
      </h1>
      <div class="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput class="md:w-72" />
        <DifficultyFilter />
      </div>
    </div>
  </header>
</template>
