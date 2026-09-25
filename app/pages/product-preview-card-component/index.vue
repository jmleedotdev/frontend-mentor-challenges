<script setup lang="ts">
definePageMeta({ layout: 'challenge' })
await useChallengePage()

const img = useImage()
const desktopImage = img.getSizes('/img/product-preview-card-component/image-product-desktop.jpg', {
  modifiers: { width: 300, height: 450 },
})

const addedToCart = ref(false)
const isAdding = ref(false)
let timeoutId: ReturnType<typeof setTimeout> | undefined

const addToCartText = computed(() => (addedToCart.value ? 'Added to cart' : 'Add to cart'))

function addToCart() {
  if (isAdding.value) return

  isAdding.value = true
  addedToCart.value = false

  timeoutId = setTimeout(() => {
    isAdding.value = false
    addedToCart.value = true
  }, 500)
}

onBeforeUnmount(() => clearTimeout(timeoutId))
</script>

<template>
  <main
    id="product-preview-card-component"
    class="flex min-h-[calc(100vh+160px)] items-center justify-center bg-(--color-cream) selection:bg-green-500 selection:text-white md:min-h-screen"
  >
    <article class="flex w-87.5 flex-col overflow-hidden rounded-lg bg-white md:w-150 md:flex-row">
      <picture class="md:shrink-0">
        <source media="(min-width: 48rem)" :srcset="desktopImage.srcset" width="300" height="450" />
        <NuxtImg
          src="/img/product-preview-card-component/image-product-mobile.jpg"
          alt="A close-up of a perfume bottle"
          width="350"
          height="342"
          class="w-full md:w-75"
        />
      </picture>

      <div class="flex flex-col gap-6 p-8">
        <hgroup class="flex flex-col gap-6">
          <p class="text-preset-4 text-gray-500 uppercase">Perfume</p>

          <h1 class="text-preset-1 text-black">Gabrielle Essence Eau De Parfum</h1>
        </hgroup>

        <p class="text-preset-3 text-gray-500">
          A floral, solar and voluptuous interpretation composed by Olivier Polge, Perfumer-Creator
          for the House of CHANEL.
        </p>

        <div class="flex items-center gap-4" aria-label="Prices" role="group">
          <p class="text-preset-1 text-green-500">
            <span class="sr-only">Sale price: </span>$149.99
          </p>
          <del class="text-preset-5 text-gray-500">
            <span class="sr-only">Original price: </span>$169.99
          </del>
        </div>

        <p class="sr-only" role="status">{{ addedToCart ? 'Added to cart' : '' }}</p>
        <button
          type="button"
          class="text-preset-2 inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-green-500 py-4 text-white transition-colors duration-300 focus-visible:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 active:bg-green-700 enabled:hover:bg-green-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-75"
          :aria-disabled="isAdding"
          @click="addToCart"
        >
          <NuxtImg
            src="/img/product-preview-card-component/icon-cart.svg"
            alt=""
            width="18"
            height="18"
            densities="x1"
            class="h-4.5"
            :class="{ 'slide-right': isAdding }"
          />
          <span :class="{ hidden: isAdding }">{{ addToCartText }}</span>
        </button>
      </div>
    </article>
  </main>
</template>

<style scoped>
#product-preview-card-component {
  font-family: 'Montserrat', sans-serif;
  --color-green-500: hsl(158, 36%, 37%);
  --color-green-700: hsl(158, 42%, 18%);
  --color-black: hsl(212, 21%, 14%);
  --color-gray-500: hsl(228, 12%, 48%);
  --color-cream: hsl(30, 38%, 92%);
}

.text-preset-1 {
  font-family: 'Fraunces', serif;
  font-size: 2rem; /* 32px */
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0px;
}

.text-preset-2 {
  font-size: 0.875rem; /* 14px */
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0px;
}

.text-preset-3 {
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: 0px;
}

.text-preset-4 {
  font-size: 0.75rem; /* 12px */
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 5px;
}

.text-preset-5 {
  font-size: 0.8125rem; /* 13px */
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0px;
}

@media (prefers-reduced-motion: no-preference) {
  article {
    animation: fade-in 1s ease-out;
  }

  .slide-right {
    animation: slide-right 500ms ease-in forwards;
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

@keyframes slide-right {
  to {
    transform: translateX(2000%);
  }
}
</style>
