<script setup lang="ts">
definePageMeta({ layout: 'challenge' })
await useChallengePage()

const links = [
  {
    title: 'GitHub',
    to: 'https://github.com/',
  },
  {
    title: 'Frontend Mentor',
    to: 'https://www.frontendmentor.io/',
  },
  {
    title: 'LinkedIn',
    to: 'https://www.linkedin.com/',
  },
  {
    title: 'Twitter',
    to: 'https://x.com/',
  },
  {
    title: 'Instagram',
    to: 'https://www.instagram.com/',
  },
]
</script>

<template>
  <main
    id="social-links-profile"
    class="flex min-h-dvh items-center justify-center bg-gray-900 p-6"
  >
    <article
      class="flex w-full max-w-81.75 flex-col items-center gap-6 rounded-xl bg-gray-800 p-6 lg:max-w-96 lg:p-10"
    >
      <NuxtImg
        src="/img/social-links-profile/avatar-jessica.jpeg"
        alt="Avatar of Jessica Randall"
        width="88"
        height="88"
        class="rounded-full"
      />

      <div class="w-full text-center">
        <h1 class="text-preset-1-bold text-white">Jessica Randall</h1>

        <p class="text-preset-2-bold mt-1 block text-green-500">London, United Kingdom</p>
      </div>

      <p class="text-preset-2 text-center text-white">"Front-end developer and avid reader."</p>

      <nav class="w-full" aria-label="Social links">
        <ul class="flex flex-col gap-4">
          <li v-for="link in links" :key="link.title">
            <NuxtLink
              :to="link.to"
              external
              target="_blank"
              :aria-label="`${link.title} (opens in a new tab)`"
              class="text-preset-2-bold block rounded-lg bg-gray-700 py-3 text-center text-white transition-colors duration-200 hover:bg-green-500 hover:text-gray-700 focus:bg-green-500 focus:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-500 motion-reduce:transition-none"
            >
              {{ link.title }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </article>
  </main>
</template>

<style scoped>
#social-links-profile {
  font-family: 'Inter', sans-serif;
  --color-green-500: hsl(75, 94%, 57%);
  --color-gray-700: hsl(0, 0%, 20%);
  --color-gray-800: hsl(0, 0%, 12%);
  --color-gray-900: hsl(0, 0%, 8%);
}

.text-preset-1-bold {
  font-size: 1.5rem; /* 24px */
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0px;
}

.text-preset-2 {
  font-size: 0.875rem; /* 14px */
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0px;
}

.text-preset-2-bold {
  font-size: 0.875rem; /* 14px */
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: 0px;
}

@media (prefers-reduced-motion: no-preference) {
  article {
    animation: fade-in 1s ease-out;
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
