<script setup lang="ts">
definePageMeta({ layout: 'challenge' })
await useChallengePage()
</script>

<template>
  <main id="blog-preview-card" class="flex min-h-dvh items-center justify-center bg-yellow-500">
    <h1 class="sr-only">Blog preview card</h1>

    <article
      class="w-81.75 space-y-6 rounded-[20px] border border-gray-950 bg-white p-6 drop-shadow-[8px_8px_black] motion-safe:animate-fade-in-up xl:w-96"
    >
      <img
        src="/img/blog-preview-card/illustration-article.svg"
        alt=""
        width="336"
        height="201"
        class="w-full rounded-[10px]"
      />

      <div class="flex flex-col gap-3">
        <span
          class="text-preset-1 inline-block w-max rounded-sm bg-yellow-500 px-3 py-1 text-xs text-gray-950 xl:text-sm"
        >
          Learning
        </span>

        <span class="text-preset-2 text-xs xl:text-sm">
          Published <time datetime="2023-12-21">21 Dec 2023</time>
        </span>

        <h2 class="text-preset-1 text-xl font-extrabold lg:text-2xl">
          <NuxtLink
            to="#"
            class="transition-colors duration-200 hover:text-yellow-500 focus-visible:text-yellow-500"
            >HTML & CSS foundations</NuxtLink
          >
        </h2>

        <p class="text-preset-2 text-sm text-gray-500 xl:text-base">
          These languages are the backbone of every website, defining structure, content, and
          presentation.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <NuxtImg
          src="/img/blog-preview-card/image-avatar.webp"
          alt=""
          class="rounded-full"
          width="32"
          height="32"
        />

        <p class="text-preset-1 text-sm">Greg Hooper</p>
      </div>
    </article>
  </main>
</template>

<style scoped>
#blog-preview-card {
  font-family: 'Figtree', sans-serif;
  --color-yellow-500: hsl(47, 88%, 63%);
  --color-gray-500: hsl(0, 0%, 42%);
  --color-gray-950: hsl(0, 0%, 7%);
}

.text-preset-1 {
  font-weight: 800;
  line-height: 1.5;
  letter-spacing: 0px;
}

.text-preset-2 {
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0px;
}
</style>
