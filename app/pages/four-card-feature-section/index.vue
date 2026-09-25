<script setup lang="ts">
definePageMeta({ layout: 'challenge' })
await useChallengePage()

const cards = [
  {
    title: 'Supervisor',
    description: 'Monitors activity to identify project roadblocks',
    icon: '/img/four-card-feature-section/icon-supervisor.svg',
    accent: 'bg-cyan-500',
  },
  {
    title: 'Team Builder',
    description: 'Scans our talent network to create the optimal team for your project',
    icon: '/img/four-card-feature-section/icon-team-builder.svg',
    accent: 'bg-red-500',
  },
  {
    title: 'Karma',
    description: 'Regularly evaluates our talent to ensure quality',
    icon: '/img/four-card-feature-section/icon-karma.svg',
    accent: 'bg-orange-500',
  },
  {
    title: 'Calculator',
    description: 'Uses data from past projects to provide better delivery estimates',
    icon: '/img/four-card-feature-section/icon-calculator.svg',
    accent: 'bg-blue-500',
  },
]
</script>

<template>
  <main
    id="four-card-feature-section"
    class="flex min-h-dvh min-w-93.75 flex-col items-center gap-15 bg-gray-100 py-14 text-gray-500 md:gap-18.5 md:py-20 xl:py-25.5"
    aria-labelledby="powered-by-technology"
  >
    <div class="w-full max-w-79 md:max-w-135">
      <hgroup class="text-center">
        <p class="text-preset-2 fade-in text-2xl md:text-4xl">Reliable, efficient delivery</p>

        <h1
          id="powered-by-technology"
          class="text-preset-1 fade-in animation-delay text-2xl md:text-4xl"
        >
          Powered by Technology
        </h1>
      </hgroup>

      <p
        class="text-preset-4 fade-in animation-delay mt-4 text-center"
        style="--animation-delay: 0.4s"
      >
        Our Artificial Intelligence powered tools use millions of project data points to ensure that
        your project is successful
      </p>
    </div>

    <div
      class="fade-in animation-delay w-full max-w-79 md:max-w-165 xl:max-w-278.5"
      style="--animation-delay: 0.6s"
    >
      <ul role="list" class="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        <li
          v-for="(card, i) in cards"
          :key="card.title"
          class="relative flex w-78.5 flex-col gap-8 overflow-hidden rounded-lg bg-white p-8 shadow-[0_20px_20px_-20px_var(--color-gray-300)] transition-[scale,background-color] duration-300 hover:bg-gray-50 motion-safe:hover:scale-105 xl:w-full"
          :class="[
            { 'xl:row-span-2 xl:m-auto': i === 0 },
            { 'md:-order-1 md:col-span-2 md:mx-auto xl:order-0 xl:col-span-1': i === 1 },
            { 'xl:order-1 xl:mx-auto': i === 2 },
            {
              'md:col-span-2 md:mx-auto xl:col-span-1 xl:row-span-2 xl:m-auto':
                i === cards.length - 1,
            },
          ]"
        >
          <div class="absolute top-0 right-0 left-0 h-1" :class="card.accent" aria-hidden="true" />

          <div class="space-y-1.5">
            <h2 class="text-preset-3">
              {{ card.title }}
            </h2>

            <p class="text-preset-5 text-gray-400">
              {{ card.description }}
            </p>
          </div>

          <NuxtImg :src="card.icon" alt="" class="size-16 self-end" width="64" height="64" />
        </li>
      </ul>
    </div>
  </main>
</template>

<style scoped>
#four-card-feature-section {
  font-family: 'Poppins', sans-serif;
  --color-red-500: hsl(0, 78%, 62%);
  --color-cyan-500: hsl(180, 62%, 55%);
  --color-orange-500: hsl(34, 97%, 64%);
  --color-blue-500: hsl(212, 86%, 64%);
  --color-gray-500: hsl(234, 12%, 34%);
  --color-gray-400: hsl(212, 6%, 44%);
}

.text-preset-1 {
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.25px;
}

.text-preset-2 {
  font-weight: 200;
  line-height: 1.4;
  letter-spacing: 0.25px;
}

.text-preset-3 {
  font-size: 1.25rem; /* 20px */
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: 0px;
}

.text-preset-4 {
  font-size: 0.9375rem; /* 15px */
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: 0px;
}

.text-preset-5 {
  font-size: 0.8125rem; /* 13px */
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0px;
}

@media (prefers-reduced-motion: no-preference) {
  .fade-in {
    animation: fade-in 1s ease-out;
    animation-fill-mode: backwards;
  }

  .animation-delay {
    --animation-delay: 0.2s;
    animation-delay: var(--animation-delay);
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
