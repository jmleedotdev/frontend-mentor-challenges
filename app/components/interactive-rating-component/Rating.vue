<script setup lang="ts">
defineProps<{ ratingCount: number }>()
const emit = defineEmits<{ submit: [rating: number] }>()

const selectedRating = ref<number | null>(null)
const showError = ref(false)
const ratingGroup = useTemplateRef<HTMLFieldSetElement>('ratingGroup')

async function submitRating() {
  if (selectedRating.value === null) {
    showError.value = true
    await nextTick()
    ratingGroup.value?.querySelector('input')?.focus()
    return
  }

  emit('submit', selectedRating.value)
}
</script>

<template>
  <form class="rating-form" novalidate @submit.prevent="submitRating">
    <div class="star-container" aria-hidden="true">
      <div class="star-image">
        <img src="/img/interactive-rating-component/icon-star.svg" alt="" width="17" height="16" />
      </div>
    </div>

    <div class="rating-content">
      <h1 id="rating-title" class="text-preset-1">How did we do?</h1>

      <p id="rating-description" class="text-preset-4-regular">
        Please let us know how we did with your support request. All feedback is appreciated to help
        us improve our offering!
      </p>

      <fieldset
        ref="ratingGroup"
        class="rating-options"
        :aria-invalid="showError ? 'true' : undefined"
        :aria-describedby="showError ? 'rating-description rating-error' : 'rating-description'"
      >
        <legend class="sr-only">Rating out of {{ ratingCount }}</legend>

        <label v-for="rating in ratingCount" :key="rating" class="rating-option">
          <input
            :id="`rating-${rating}`"
            v-model="selectedRating"
            class="sr-only"
            type="radio"
            name="rating"
            :value="rating"
            :aria-label="`${rating} out of ${ratingCount}`"
            required
            @change="showError = false"
          />

          <span class="rating-value text-preset-3" aria-hidden="true">{{ rating }}</span>
        </label>
      </fieldset>

      <p v-if="showError" id="rating-error" class="rating-error text-preset-4-regular" role="alert">
        Please select a rating
      </p>
    </div>

    <button type="submit" class="submit-button text-preset-5-semibold">SUBMIT</button>
  </form>
</template>

<style scoped>
.rating-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.star-container {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-gray-900);
}

.star-image {
  width: calc(17px * 5 / 6);
  height: calc(16px * 5 / 6);
}

.star-image img {
  display: block;
  max-width: none;
  transform-origin: top left;
  transform: scale(calc(5 / 6));
}

.rating-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rating-content > p {
  color: var(--color-gray-500);
}

.rating-options {
  display: flex;
  justify-content: space-between;
  gap: 0;
  min-width: 0;
  border: 0;
  padding: 0 2.5px;
}

.rating-option {
  position: relative;
  cursor: pointer;
}

.rating-value {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-gray-900);
  color: var(--color-gray-500);
}

.rating-option input:checked + .rating-value {
  background: white;
  color: var(--color-gray-950);
}

.submit-button {
  width: 100%;
  min-height: 45px;
  border: 0;
  border-radius: 22.5px;
  padding: 8px 16px;
  background: var(--color-orange-500);
  color: var(--color-gray-950);
  cursor: pointer;
}

@media (hover: hover) {
  .rating-option:hover .rating-value {
    background: var(--color-orange-500);
    color: var(--color-gray-950);
  }

  .submit-button:hover {
    background: white;
  }
}

.rating-option input:focus-visible + .rating-value,
.submit-button:focus-visible {
  outline: 2px solid var(--color-orange-500);
  outline-offset: 4px;
}

.rating-content > .rating-error {
  color: var(--color-orange-500);
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

.text-preset-3 {
  font-size: 1rem; /* 16px */
  font-weight: 700;
  line-height: 24px;
  letter-spacing: 0.2px;
}

.text-preset-5-semibold {
  font-size: 0.875rem; /* 14px */
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0.17px;
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

  .text-preset-3,
  .text-preset-5-semibold {
    font-size: 0.875rem; /* 14px */
    font-weight: 700;
    line-height: 24px;
    letter-spacing: 1.87px;
  }
}

@media (min-width: 48rem) {
  .rating-form {
    gap: 32px;
  }

  .star-container {
    width: 48px;
    height: 48px;
  }

  .star-image {
    width: 17px;
    height: 16px;
  }

  .star-image img {
    transform: none;
  }

  .rating-options {
    padding: 0;
  }

  .rating-value {
    width: 51px;
    height: 51px;
  }
}
</style>
