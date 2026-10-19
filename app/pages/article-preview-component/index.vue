<script setup lang="ts">
definePageMeta({ layout: 'challenge' })
await useChallengePage()

const isShareOpen = ref(false)
const shareButton = useTemplateRef<HTMLButtonElement>('shareButton')
const sharePanel = useTemplateRef<HTMLDivElement>('sharePanel')
const shareLinks = [
  {
    name: 'Facebook',
    icon: 'facebook',
    href: 'https://www.facebook.com/',
  },
  {
    name: 'X (Twitter)',
    icon: 'twitter',
    href: 'https://x.com/',
  },
  {
    name: 'Pinterest',
    icon: 'pinterest',
    href: 'https://www.pinterest.com/',
  },
]

function dismissOnOutsideClick(event: PointerEvent) {
  if (
    event.target instanceof Node &&
    !shareButton.value?.contains(event.target) &&
    !sharePanel.value?.contains(event.target)
  ) {
    isShareOpen.value = false
  }
}

function dismissOnEscape() {
  if (isShareOpen.value) {
    isShareOpen.value = false
    shareButton.value?.focus()
  }
}
</script>

<template>
  <main
    id="article-preview-component"
    class="flex min-h-dvh items-center justify-center bg-gray-200 px-6 py-6 text-gray-900"
    @pointerdown="dismissOnOutsideClick"
    @keydown.esc="dismissOnEscape"
  >
    <article
      class="preview-card relative rounded-[10px] bg-white"
      :class="{ 'share-open': isShareOpen }"
    >
      <div class="image-container relative overflow-hidden">
        <NuxtImg
          src="/img/article-preview-component/drawers.jpg"
          alt="A green chest of drawers styled with framed prints and a vase of dried grasses"
          width="660"
          height="528"
          class="card-image block"
        />
      </div>

      <div class="card-content">
        <h1 class="text-preset-1-bold">
          Shift the overall look and feel by adding these wonderful touches to furniture in your
          home
        </h1>

        <p class="text-preset-2-medium article-description text-gray-500">
          Ever been in a room and felt like something was missing? Perhaps it felt slightly bare and
          uninviting. I’ve got some simple tips to help you make any room feel complete.
        </p>

        <div class="card-footer flex items-center justify-between">
          <div class="author flex items-center gap-4">
            <NuxtImg
              src="/img/article-preview-component/avatar-michelle.jpg"
              alt=""
              width="40"
              height="40"
              class="size-10 rounded-full"
            />
            <div>
              <p class="text-preset-2-bold">Michelle Appleton</p>
              <time datetime="2020-06-28" class="text-preset-2-medium block text-gray-400">
                28 Jun 2020
              </time>
            </div>
          </div>

          <div class="share-controls">
            <button
              ref="shareButton"
              type="button"
              class="share-button relative z-10 flex size-8 cursor-pointer items-center justify-center rounded-full bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-900"
              aria-label="Share article"
              aria-controls="article-share-panel"
              :aria-expanded="isShareOpen"
              @click="isShareOpen = !isShareOpen"
            >
              <img
                src="/img/article-preview-component/icon-share.svg"
                alt=""
                width="15"
                height="13"
              />
            </button>

            <div
              v-show="isShareOpen"
              id="article-share-panel"
              ref="sharePanel"
              role="group"
              aria-label="Share this article"
              class="share-panel absolute flex items-center gap-6 bg-gray-900"
            >
              <span class="text-preset-3 text-gray-400 uppercase">Share</span>
              <div class="flex items-center gap-4">
                <NuxtLink
                  v-for="link in shareLinks"
                  :key="link.icon"
                  :to="link.href"
                  :aria-label="`Share on ${link.name} (opens in a new tab)`"
                  external
                  target="_blank"
                  class="flex size-5 items-center justify-center rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  <img
                    :src="`/img/article-preview-component/icon-${link.icon}.svg`"
                    alt=""
                    width="20"
                    :height="link.icon === 'twitter' ? 17 : 20"
                  />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  </main>
</template>

<style scoped>
#article-preview-component {
  font-family: 'Manrope', sans-serif;
  text-rendering: geometricPrecision;
  --color-gray-200: hsl(210, 46%, 95%);
  --color-gray-400: hsl(212, 23%, 69%);
  --color-gray-500: hsl(214, 17%, 51%);
  --color-gray-900: hsl(217, 19%, 35%);
}

.preview-card {
  width: 327px;
  max-width: 100%;
  box-shadow: 0 40px 40px rgb(201 213 225 / 50%);
}

.image-container {
  height: 200px;
  border-radius: 10px 10px 0 0;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 26%;
}

.card-content {
  padding: 32px 30px 18px;
}

.article-description {
  margin-top: 24px;
}

.card-footer {
  margin-top: 48px;
}

.share-panel {
  z-index: 1;
  inset: auto 0 0;
  height: 76px;
  padding: 0 30px;
  border-radius: 0 0 10px 10px;
}

.share-open .share-button {
  background: var(--color-gray-500);
}

.share-open .share-button img {
  filter: brightness(0) invert(1);
}

.share-open .author {
  visibility: hidden;
}

@media (min-width: 48rem) {
  .preview-card {
    display: grid;
    grid-template-columns: 229px 1fr;
    gap: 32px;
    width: 608px;
    min-height: 346px;
  }

  .image-container {
    height: 100%;
    border-radius: 10px 0 0 10px;
  }

  .card-image {
    position: absolute;
    width: 122.806%;
    max-width: none;
    object-fit: fill;
  }

  .card-content {
    align-self: center;
    padding: 30px 36px 30px 0;
  }

  .card-footer {
    margin-top: 24px;
    padding-right: 5px;
  }

  .share-controls {
    position: relative;
  }

  .share-panel {
    inset: auto auto calc(100% + 29px) 50%;
    width: 248px;
    height: 56px;
    padding: 0 38px;
    border-radius: 10px;
    transform: translateX(-50%);
    box-shadow: 0 10px 10px rgb(201 213 225 / 50%);
  }

  .share-panel::after {
    position: absolute;
    top: 100%;
    left: 50%;
    border: 12px solid transparent;
    border-top-color: var(--color-gray-900);
    border-bottom: 0;
    content: '';
    transform: translateX(-50%);
  }

  .share-open .author {
    visibility: visible;
  }
}

@media (min-width: 64rem) {
  .preview-card {
    grid-template-columns: 285px 1fr;
    gap: 40px;
    width: 730px;
    min-height: 280px;
  }

  .card-content {
    padding-right: 40px;
  }

  .card-footer {
    padding-right: 3px;
  }
}

.text-preset-1-bold {
  font-size: 1.25rem; /* 20px */
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: 0.25px;
}

.text-preset-2-bold,
.text-preset-2-medium,
.text-preset-3 {
  font-size: 0.8125rem; /* 13px */
  line-height: 1.4;
}

.text-preset-2-bold,
.text-preset-2-medium {
  letter-spacing: 0.12%;
}

.text-preset-2-medium {
  font-weight: 500;
}

.text-preset-2-bold {
  font-weight: 700;
}

.text-preset-3 {
  font-weight: 500;
  letter-spacing: 25%;
}

@media (prefers-reduced-motion: no-preference) {
  main {
    animation: fade-in 1s ease-out;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
