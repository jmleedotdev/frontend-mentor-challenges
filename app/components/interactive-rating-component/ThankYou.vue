<script setup lang="ts">
defineProps<{
  submittedRating: number
  ratingCount: number
}>()

const thankYouTitle = useTemplateRef<HTMLHeadingElement>('thankYouTitle')

onMounted(() => thankYouTitle.value?.focus())
</script>

<template>
  <div class="thank-you-content">
    <div class="thank-you-image">
      <img
        src="/img/interactive-rating-component/illustration-thank-you.svg"
        alt=""
        width="162"
        height="108"
      />
    </div>

    <p class="rating-summary text-preset-4-regular">
      You selected {{ submittedRating }} out of {{ ratingCount }}
    </p>

    <div class="thank-you-message">
      <h1 id="thank-you-title" ref="thankYouTitle" class="text-preset-1" tabindex="-1">
        Thank you!
      </h1>

      <p class="text-preset-4-regular">
        We appreciate you taking the time to give a rating. If you ever need more support, don’t
        hesitate to get in touch!
      </p>
    </div>
  </div>
</template>

<style scoped>
.thank-you-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  align-items: center;
  text-align: center;
}

.thank-you-image img {
  display: block;
  max-width: none;
  transform-origin: top left;
  transform: scale(calc(8 / 9));
}

.thank-you-message {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.thank-you-message > p {
  color: var(--color-gray-500);
}

.thank-you-image {
  width: 144px;
  height: 96px;
}

.rating-summary {
  display: grid;
  place-items: center;
  min-width: 168px;
  min-height: 32px;
  border-radius: 22.5px;
  padding: 0 12px;
  background: var(--color-gray-900);
  color: var(--color-orange-500);
}

#thank-you-title:focus {
  outline: none;
}

.text-preset-1 {
  font-size: 1.75rem; /* 28px */
  font-weight: 700;
  line-height: 35px;
  letter-spacing: 0px;
}

.text-preset-4-regular {
  font-size: 0.9375rem; /* 15px */
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0px;
}

@media (width < 48rem) {
  .text-preset-1 {
    font-size: 1.5rem; /* 24px */
    line-height: 30px;
  }

  .text-preset-4-regular {
    font-size: 0.875rem; /* 14px */
    line-height: 22px;
  }
}

@media (min-width: 48rem) {
  .thank-you-content {
    gap: 32px;
    max-width: 340px;
  }

  .thank-you-image img {
    transform: none;
  }

  .thank-you-image {
    width: 162px;
    height: 108px;
  }

  .rating-summary {
    min-width: 193px;
    padding: 0 16px;
  }
}
</style>
