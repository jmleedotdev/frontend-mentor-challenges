<script setup lang="ts">
import Rating from '~/components/interactive-rating-component/Rating.vue'
import ThankYou from '~/components/interactive-rating-component/ThankYou.vue'

definePageMeta({ layout: 'challenge' })
await useChallengePage()

const ratingCount = 5
const submittedRating = ref<number | null>(null)
</script>

<template>
  <main
    id="interactive-rating-component"
    class="flex min-h-dvh flex-col items-center justify-center bg-gray-950 p-6 text-white"
  >
    <section
      class="rating-card motion-safe:animate-fade-in-up"
      :aria-labelledby="submittedRating === null ? 'rating-title' : 'thank-you-title'"
    >
      <Rating
        v-if="submittedRating === null"
        :rating-count="ratingCount"
        @submit="submittedRating = $event"
      />
      <ThankYou v-else :submitted-rating="submittedRating" :rating-count="ratingCount" />
    </section>
  </main>
</template>

<style scoped>
#interactive-rating-component {
  font-family: 'Overpass', sans-serif;
  --color-gray-500: hsl(217, 12%, 63%);
  --color-gray-900: hsl(213, 19%, 18%);
  --color-gray-950: hsl(216, 12%, 8%);
  --color-orange-500: hsl(25, 97%, 53%);
}

.rating-card {
  display: grid;
  place-items: center;
  width: 327px;
  max-width: 100%;
  min-height: 360px;
  padding: 24px;
  border-radius: 15px;
  background: radial-gradient(ellipse 99% 99% at 50% 0%, #232a34 0%, #181e27 100%);
}

@media (min-width: 48rem) {
  .rating-card {
    width: 412px;
    min-height: 416px;
    padding: 32px 30.5px;
    border-radius: 30px;
  }
}
</style>
