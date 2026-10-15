<script setup lang="ts">
definePageMeta({ layout: 'challenge' })
await useChallengePage()

const testimonials = [
  {
    id: 'daniel',
    name: 'Daniel Clifford',
    headline:
      'I received a job offer mid-course, and the subjects I learned were current, if not more so, in the company I joined. I honestly feel I got every penny’s worth.',
    quote:
      '“ I was an EMT for many years before I joined the bootcamp. I’ve been looking to make a transition and have heard some people who had an amazing experience here. I signed up for the free intro course and found it incredibly fun! I enrolled shortly thereafter. The next 12 weeks was the best - and most grueling - time of my life. Since completing the course, I’ve successfully switched careers, working as a Software Engineer at a VR startup. ”',
  },
  {
    id: 'jonathan',
    name: 'Jonathan Walters',
    headline: 'The team was very supportive and kept me motivated',
    quote:
      '“ I started as a total newbie with virtually no coding skills. I now work as a mobile engineer for a big company. This was one of the best investments I’ve made in myself. ”',
  },
  {
    id: 'jeanette',
    name: 'Jeanette Harmon',
    headline: 'An overall wonderful and rewarding experience',
    quote:
      '“ Thank you for the wonderful experience! I now have a job I really enjoy, and make a good living while doing something I love. ”',
  },
  {
    id: 'patrick',
    name: 'Patrick Abrams',
    headline:
      'Awesome teaching support from TAs who did the bootcamp themselves. Getting guidance from them and learning from their experiences was easy.',
    quote:
      '“ The staff seem genuinely concerned about my progress which I find really refreshing. The program gave me the confidence necessary to be able to go out in the world and present myself as a capable junior developer. The standard is above the rest. You will get the personal attention you need from an incredible community of smart and amazing people. ”',
  },
  {
    id: 'kira',
    name: 'Kira Whittle',
    headline: 'Such a life-changing experience. Highly recommended!',
    quote:
      '“ Before joining the bootcamp, I’ve never written a line of code. I needed some structure from professionals who can help me learn programming step by step. I was encouraged to enroll by a former student of theirs who can only say wonderful things about the program. The entire curriculum and staff did not disappoint. They were very hands-on and I never had to wait long for assistance. The agile team project, in particular, was outstanding. It took my learning to the next level in a way that no tutorial could ever have. In fact, I’ve often referred to it during interviews as an example of my development experience. It certainly helped me land a job as a full-stack developer after receiving multiple offers. 100% recommend! ”',
  },
]
</script>

<template>
  <main
    id="testimonials-grid-section"
    class="grid min-h-dvh items-start justify-items-center bg-[#f6f5f6] px-8.75 py-18.25 md:px-15 md:py-20.75 xl:items-center xl:px-8 xl:py-20"
    aria-labelledby="testimonials-heading"
  >
    <h1 id="testimonials-heading" class="sr-only">Testimonials grid section</h1>

    <div class="testimonials-grid grid w-full max-w-76.25 gap-8 md:max-w-161.75 xl:max-w-278.5">
      <article
        v-for="(testimonial, i) in testimonials"
        :key="testimonial.id"
        class="testimonial-card relative grid min-w-0 content-start gap-4 rounded-lg p-8"
        :class="`testimonial-card--${testimonial.id}`"
        :style="{ '--animation-delay': `${i * 0.3}s` }"
        :aria-labelledby="`${testimonial.id}-headline`"
      >
        <img
          v-if="testimonial.id === 'daniel'"
          src="/img/testimonials-grid-section/bg-pattern-quotation.svg"
          alt=""
          width="104"
          height="102"
          class="absolute top-0 right-15 hidden md:block"
        />

        <header class="relative grid grid-cols-[1.75rem_1fr] items-center gap-4.25 xl:gap-4">
          <NuxtImg
            :src="`/img/testimonials-grid-section/image-${testimonial.id}.jpg`"
            alt=""
            width="28"
            height="28"
            class="testimonial-avatar size-7 rounded-full"
          />
          <div class="grid gap-1">
            <p class="text-preset-2 testimonial-name">{{ testimonial.name }}</p>
            <p class="text-preset-4 testimonial-status">Verified Graduate</p>
          </div>
        </header>

        <blockquote class="relative grid gap-4">
          <h2 :id="`${testimonial.id}-headline`" class="text-preset-1 testimonial-headline">
            {{ testimonial.headline }}
          </h2>
          <p class="text-preset-3 testimonial-quote">{{ testimonial.quote }}</p>
        </blockquote>
      </article>
    </div>
  </main>
</template>

<style scoped>
#testimonials-grid-section {
  font-family: 'Barlow Semi Condensed', sans-serif;
  --color-purple-50: hsl(260, 100%, 95%);
  --color-purple-300: hsl(264, 82%, 80%);
  --color-purple-500: hsl(263, 55%, 52%);
  --color-gray-100: hsl(214, 17%, 92%);
  --color-gray-200: hsl(0, 0%, 81%);
  --color-gray-300: hsl(215, 10%, 67%);
  --color-gray-400: hsl(224, 10%, 45%);
  --color-gray-500: hsl(217, 19%, 35%);
  --color-dark-blue: hsl(219, 29%, 14%);
  --color-black: hsl(0, 0%, 7%);
}

.text-preset-1 {
  font-size: 1.25rem; /* 20px */
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0px;
}

.text-preset-2 {
  font-size: 0.8125rem; /* 13px */
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: 0px;
}

.text-preset-3 {
  font-size: 0.8125rem; /* 13px */
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0px;
}

.text-preset-4 {
  font-size: 0.6875rem; /* 11px */
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: 0px;
}

.testimonials-grid {
  grid-template-areas:
    'daniel'
    'jonathan'
    'jeanette'
    'patrick'
    'kira';
}

.testimonial-card {
  background: white;
  color: var(--color-gray-500);
  box-shadow: 40px 60px 50px -47px rgb(72 85 106 / 25%);
}

.testimonial-status,
.testimonial-quote {
  color: var(--color-gray-400);
}

.testimonial-card--daniel {
  grid-area: daniel;
  background: var(--color-purple-500);
  color: white;
}

.testimonial-card--daniel .testimonial-status,
.testimonial-card--daniel .testimonial-quote {
  color: var(--color-purple-50);
}

.testimonial-card--daniel .testimonial-avatar {
  box-shadow: 0 0 0 2px var(--color-purple-300);
}

.testimonial-card--jonathan {
  grid-area: jonathan;
  background: var(--color-gray-500);
  color: white;
}

.testimonial-card--jonathan .testimonial-status,
.testimonial-card--kira .testimonial-status {
  color: var(--color-gray-300);
}

.testimonial-card--jonathan .testimonial-quote,
.testimonial-card--patrick .testimonial-quote {
  color: var(--color-gray-100);
}

.testimonial-card--jeanette {
  grid-area: jeanette;
}

.testimonial-card--jeanette .testimonial-name,
.testimonial-card--kira .testimonial-name {
  line-height: 1;
}

.testimonial-card--patrick {
  grid-area: patrick;
  background: var(--color-dark-blue);
  color: white;
}

.testimonial-card--patrick .testimonial-headline {
  color: var(--color-gray-200);
}

.testimonial-card--patrick .testimonial-status {
  color: white;
}

.testimonial-card--patrick .testimonial-avatar {
  box-shadow: 0 0 0 2px var(--color-purple-500);
}

.testimonial-card--kira {
  grid-area: kira;
}

@media (min-width: 48rem) {
  .testimonial-card--jonathan .testimonial-status {
    color: var(--color-gray-100);
  }

  .testimonial-card--kira .testimonial-status {
    color: var(--color-gray-400);
  }

  .testimonials-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-areas:
      'daniel daniel'
      'jonathan jeanette'
      'patrick patrick'
      'kira kira';
  }
}

@media (min-width: 80rem) {
  .testimonials-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-areas:
      'daniel daniel jonathan kira'
      'jeanette patrick patrick kira';
    row-gap: 1.5rem;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .testimonial-card {
    animation: fade-in 0.3s ease-out backwards;
    animation-delay: var(--animation-delay);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
