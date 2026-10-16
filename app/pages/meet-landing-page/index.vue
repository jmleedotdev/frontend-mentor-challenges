<script setup lang="ts">
import { motion, useDomRef } from 'motion-v'
import type { Ref } from 'vue'
import { isNavigationFailure, NavigationFailureType } from 'vue-router'

definePageMeta({ layout: 'challenge' })
await useChallengePage()

const router = useRouter()
const route = useRoute()
const meetingsHeading = useDomRef() as Ref<HTMLHeadingElement | null>
const page = useTemplateRef('page')
const { createGroup, groupVariants, itemVariants, revealContaining, revealFocusedGroup } =
  useMeetScrollReveals()
const firstDivider = createGroup()
const gallery = createGroup()
const features = createGroup()
const secondDivider = createGroup()
const footer = createGroup()

onMounted(() => {
  watch(
    () => route.hash,
    (hash) => {
      const target = Array.from(page.value?.querySelectorAll('[id]') ?? []).find(
        (element) => `#${element.id}` === hash,
      )
      if (target) revealContaining(target)
    },
    { immediate: true, flush: 'post' },
  )

  const defaultScrollBehavior = router.options.scrollBehavior

  // Let Vue Router own scrolling as well as history, only customizing this section link.
  router.options.scrollBehavior = (to, from, savedPosition) => {
    const heading = meetingsHeading.value
    if (to.path === from.path && to.hash === '#smarter-meetings' && heading) {
      revealContaining(heading)
      return (
        savedPosition ?? {
          el: heading,
          top: Number.parseFloat(getComputedStyle(heading).scrollMarginTop) || 0,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        }
      )
    }

    return defaultScrollBehavior?.(to, from, savedPosition)
  }

  onBeforeUnmount(() => {
    router.options.scrollBehavior = defaultScrollBehavior
  })
})

const img = useImage()
const transparentImage =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const heroImages = {
  combined: img.getSizes('/img/meet-landing-page/tablet/image-hero.png', {
    sizes: '434px md:820px',
    modifiers: { width: 820, height: 303 },
  }),
  left: img.getSizes('/img/meet-landing-page/desktop/image-hero-left.png', {
    modifiers: { width: 394, height: 303 },
  }),
  right: img.getSizes('/img/meet-landing-page/desktop/image-hero-right.png', {
    modifiers: { width: 394, height: 303 },
  }),
}
const footerImages = {
  mobile: img.getSizes('/img/meet-landing-page/mobile/image-footer.jpg', {
    modifiers: { width: 750 },
  }),
  tablet: img.getSizes('/img/meet-landing-page/tablet/image-footer.jpg', {
    modifiers: { width: 1279 },
  }),
  desktop: img.getSizes('/img/meet-landing-page/desktop/image-footer.jpg', {
    modifiers: { width: 1440 },
  }),
}

const photos = [
  'image-woman-in-videocall.jpg',
  'image-women-videochatting.jpg',
  'image-men-in-meeting.jpg',
  'image-man-texting.jpg',
]

async function navigateToMeetings(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (!meetingsHeading.value) return

  event.preventDefault()
  const failure = await router.push({ hash: '#smarter-meetings', query: route.query })
  if (!failure || isNavigationFailure(failure, NavigationFailureType.duplicated)) {
    meetingsHeading.value?.focus({ preventScroll: true })
  }
}
</script>

<template>
  <main
    id="meet-landing-page"
    ref="page"
    class="min-h-dvh overflow-x-clip bg-white text-slate-900"
    @focusin="revealFocusedGroup"
  >
    <header class="flex justify-center pt-12 xl:pt-20">
      <NuxtImg src="/img/meet-landing-page/logo.svg" alt="Meet" width="119" height="28" />
    </header>

    <section aria-labelledby="meet-title" class="px-8 pt-16 pb-8 md:pb-16 xl:px-20">
      <div class="hero-layout">
        <picture class="hero-combined block xl:hidden">
          <source
            media="(width < 80rem)"
            :srcset="heroImages.combined.srcset"
            :sizes="heroImages.combined.sizes"
          />
          <img
            :src="transparentImage"
            alt=""
            width="820"
            height="303"
            class="h-40 w-auto max-w-none md:h-75.75"
            fetchpriority="high"
          />
        </picture>

        <picture class="hero-left relative hidden h-full min-w-0 xl:block" aria-hidden="true">
          <source media="(min-width: 80rem)" :srcset="heroImages.left.srcset" />
          <img
            :src="transparentImage"
            alt=""
            width="394"
            height="303"
            class="absolute top-0 right-24 h-75.75 w-98.5 max-w-none"
          />
        </picture>

        <div
          class="hero-copy flex w-full max-w-76.25 flex-col items-center gap-6 text-center md:max-w-md xl:gap-8"
        >
          <h1 id="meet-title" class="text-preset-1 text-[2.5rem] md:text-5xl xl:text-[4rem]">
            Group Chat<br />for Everyone
          </h1>

          <p class="text-preset-4 text-slate-600 xl:text-lg">
            Meet makes it easy to connect with others face-to-face virtually and collaborate across
            any device.
          </p>

          <div class="flex flex-col items-center gap-4 md:flex-row md:gap-4.25">
            <MeetLandingPageButton>
              Download <span class="text-(--button-accent)">v1.3</span>
            </MeetLandingPageButton>

            <MeetLandingPageButton
              variant="purple"
              href="#smarter-meetings"
              @click="navigateToMeetings"
            >
              What is it?
            </MeetLandingPageButton>
          </div>
        </div>

        <picture class="hero-right relative hidden h-full min-w-0 xl:block" aria-hidden="true">
          <source media="(min-width: 80rem)" :srcset="heroImages.right.srcset" />
          <img
            :src="transparentImage"
            alt=""
            width="394"
            height="303"
            class="absolute bottom-0 left-24 h-75.75 w-98.5 max-w-none"
          />
        </picture>
      </div>
    </section>

    <section aria-labelledby="smarter-meetings" class="px-8 pt-8 pb-16 md:pt-14 xl:px-20 xl:pb-18">
      <div
        class="features mx-auto flex w-full max-w-280 flex-col items-center gap-16 md:max-xl:max-w-170"
      >
        <motion.div
          :ref="firstDivider.element"
          class="section-number"
          initial="visible"
          :animate="firstDivider.controls"
          :variants="itemVariants"
          aria-hidden="true"
        >
          <span>01</span>
        </motion.div>

        <motion.div
          :ref="gallery.element"
          class="photo-grid grid w-full grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 xl:gap-8"
          initial="visible"
          :animate="gallery.controls"
          :variants="groupVariants"
          aria-hidden="true"
        >
          <motion.img
            v-for="(photo, index) in photos"
            :key="photo"
            as-child
            :custom="index"
            :variants="itemVariants"
          >
            <NuxtImg
              :src="`/img/meet-landing-page/desktop/${photo}`"
              alt=""
              width="510"
              height="484"
              sizes="xs:50vw sm:50vw md:25vw lg:25vw xl:256px"
              loading="lazy"
              class="w-full rounded-lg object-cover"
            />
          </motion.img>
        </motion.div>

        <motion.div
          :ref="features.element"
          class="flex w-full max-w-126 flex-col items-center gap-8 text-center xl:max-w-136"
          initial="visible"
          :animate="features.controls"
          :variants="groupVariants"
        >
          <hgroup class="flex w-full flex-col items-center gap-4">
            <motion.p
              class="text-preset-3 text-xs text-cyan-600 uppercase md:text-sm xl:text-base"
              :variants="itemVariants"
            >
              Built for modern use
            </motion.p>
            <motion.h2
              id="smarter-meetings"
              ref="meetingsHeading"
              :custom="1"
              :variants="itemVariants"
              tabindex="-1"
              class="text-preset-2 max-w-111.25 scroll-mt-8 rounded-sm text-[2rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-600 md:text-4xl xl:text-[2.5rem]"
            >
              Smarter meetings, all in one place
            </motion.h2>
          </hgroup>

          <motion.p
            class="text-preset-4 text-slate-600 xl:text-lg"
            :custom="2"
            :variants="itemVariants"
          >
            Send messages, share files, show your screen, and record your meetings — all in one
            workspace. Control who can join with invite-only team access, data encryption, and data
            export.
          </motion.p>
        </motion.div>
      </div>
    </section>

    <footer aria-labelledby="meet-footer-title" class="isolate flex flex-col items-center">
      <motion.div
        :ref="secondDivider.element"
        class="section-number relative z-10 -mb-7"
        initial="visible"
        :animate="secondDivider.controls"
        :variants="itemVariants"
        aria-hidden="true"
      >
        <span>02</span>
      </motion.div>

      <div class="relative w-full bg-cyan-600 px-8 py-16 text-white xl:px-20 xl:py-28">
        <picture class="pointer-events-none absolute inset-0" aria-hidden="true">
          <source media="(min-width: 80rem)" :srcset="footerImages.desktop.srcset" />
          <source media="(min-width: 48rem)" :srcset="footerImages.tablet.srcset" />
          <NuxtImg
            src="/img/meet-landing-page/mobile/image-footer.jpg"
            :srcset="footerImages.mobile.srcset"
            sizes="100vw"
            alt=""
            width="750"
            height="856"
            loading="lazy"
            class="h-full w-full object-cover object-top opacity-10"
          />
        </picture>

        <motion.div
          :ref="footer.element"
          class="footer-copy relative mx-auto flex max-w-126 flex-col items-center gap-6 text-center xl:max-w-280 xl:flex-row xl:items-start xl:gap-8 xl:text-left"
          initial="visible"
          :animate="footer.controls"
          :variants="groupVariants"
        >
          <motion.h2
            id="meet-footer-title"
            :variants="itemVariants"
            class="text-preset-2 text-[2rem] md:text-4xl xl:min-w-0 xl:flex-1 xl:text-[2.5rem]"
          >
            Experience more together
          </motion.h2>

          <motion.p
            class="text-preset-4 xl:w-88.75 xl:shrink-0 xl:text-lg"
            :custom="1"
            :variants="itemVariants"
          >
            Stay connected with reliable HD meetings and unlimited one-on-one and group video
            sessions.
          </motion.p>

          <motion.div
            class="xl:flex xl:w-64 xl:shrink-0 xl:justify-end"
            :custom="2"
            :variants="itemVariants"
          >
            <MeetLandingPageButton variant="purple">
              Download <span class="text-(--button-accent)">v1.3</span>
            </MeetLandingPageButton>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  </main>
</template>

<style scoped>
#meet-landing-page {
  font-family: 'Red Hat Display', sans-serif;
  --color-cyan-300: hsl(192, 90%, 77%);
  --color-cyan-600: hsl(192, 37%, 48%);
  --color-purple-300: hsl(268, 100%, 86%);
  --color-purple-600: hsl(268, 34%, 53%);
  --color-slate-300: hsl(240, 18%, 85%);
  --color-slate-600: hsl(240, 10%, 57%);
  --color-slate-900: hsl(240, 21%, 20%);
  --color-white: hsl(0, 0%, 98%);
  --cyan-hover: #71c0d4;
  --purple-hover: #b18bdd;
}

.text-preset-1,
.text-preset-2,
.text-preset-3,
.text-preset-5 {
  font-weight: 900;
}

.text-preset-1,
.text-preset-2,
.text-preset-3 {
  line-height: 1.1;
}

.text-preset-3 {
  letter-spacing: 4px;
}

.text-preset-4 {
  font-weight: 500;
  line-height: 1.5;
}

.text-preset-5 {
  line-height: 1.5;
}

.hero-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  max-width: 42.5rem;
  margin-inline: auto;
}

.section-number {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--color-slate-600);
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.5;
}

.section-number::before {
  content: '';
  width: 1px;
  height: 5rem;
  background: var(--color-slate-300);
}

.section-number span {
  display: grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  border: 1px solid var(--color-slate-300);
  border-radius: 50%;
  background: var(--color-white);
}

.photo-grid img {
  aspect-ratio: 147.5 / 144;
}

@media (min-width: 48rem) {
  .hero-layout {
    gap: 4.5rem;
  }

  .photo-grid img {
    aspect-ratio: 152 / 160;
  }
}

@media (min-width: 80rem) {
  .hero-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 28rem minmax(0, 1fr);
    gap: 2rem;
    max-width: 70rem;
    min-height: 22.5rem;
  }

  .photo-grid img {
    aspect-ratio: 1;
  }
}
</style>
