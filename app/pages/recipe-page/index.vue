<script setup lang="ts">
definePageMeta({ layout: 'challenge' })
await useChallengePage()

const preparationTime = [
  {
    title: 'Total',
    description: 'Approximately 10 minutes',
  },
  {
    title: 'Preparation',
    description: '5 minutes',
  },
  {
    title: 'Cooking',
    description: '5 minutes',
  },
]

const ingredients = [
  {
    description: '2-3 large eggs',
  },
  {
    description: 'Salt, to taste',
  },
  {
    description: 'Pepper, to taste',
  },
  {
    description: '1 tablespoon of butter or oil',
  },
  {
    description: 'Optional fillings: cheese, diced vegetables, cooked meats, herbs',
  },
]

const instructions = [
  {
    title: 'Beat the eggs',
    description:
      'In a bowl, beat the eggs with a pinch of salt and pepper until they are well mixed. You can add a tablespoon of water or milk for a fluffier texture.',
  },
  {
    title: 'Heat the pan',
    description: 'Place a non-stick frying pan over medium heat and add butter or oil.',
  },
  {
    title: 'Cook the omelette',
    description:
      'Once the butter is melted and bubbling, pour in the eggs. Tilt the pan to ensure the eggs evenly coat the surface.',
  },
  {
    title: 'Add fillings (optional)',
    description:
      'When the eggs begin to set at the edges but are still slightly runny in the middle, sprinkle your chosen fillings over one half of the omelette.',
  },
  {
    title: 'Fold and serve',
    description:
      'As the omelette continues to cook, carefully lift one edge and fold it over the fillings. Let it cook for another minute, then slide it onto a plate.',
  },
  {
    title: 'Enjoy',
    description: 'Serve hot, with additional salt and pepper if needed.',
  },
]

const nutrition = [
  {
    title: 'Calories',
    description: '277kcal',
  },
  {
    title: 'Carbs',
    description: '0g',
  },
  {
    title: 'Protein',
    description: '20g',
  },
  {
    title: 'Fat',
    description: '22g',
  },
]
</script>

<template>
  <main
    id="recipe-page"
    class="flex min-h-screen items-center justify-center bg-stone-100 selection:bg-rose-800 selection:text-white"
  >
    <article
      class="text-preset-4 bg-white md:my-32 md:w-154 md:rounded-3xl md:motion-safe:animate-fade-in-up lg:w-184"
    >
      <div class="md:m-10">
        <NuxtImg
          src="/img/recipe-page/image-omelette.jpeg"
          alt="A folded omelette on a plate"
          width="393"
          height="180"
          sizes="100vw md:536px lg:656px"
          class="w-full md:rounded-xl"
        />
      </div>

      <div class="mx-8 my-10 flex flex-col gap-8">
        <section aria-labelledby="simple-omelette-recipe">
          <h1
            id="simple-omelette-recipe"
            class="text-preset-1 text-[36px] text-stone-900 md:text-[40px]"
            tabindex="-1"
          >
            <NuxtLink
              to="#simple-omelette-recipe"
              class="header-anchor"
              aria-label="Permalink to “Simple Omelette Recipe”"
            />
            Simple Omelette Recipe
          </h1>

          <p class="text-preset-4 mt-6 text-stone-600">
            An easy and quick dish, perfect for any meal. This classic omelette combines beaten eggs
            cooked to perfection, optionally filled with your choice of cheese, vegetables, or
            meats.
          </p>
        </section>

        <section aria-label="Preparation time" class="rounded-xl bg-rose-50 p-6">
          <p class="text-preset-3 text-rose-800">
            <strong>Preparation time</strong>
          </p>

          <ul class="mt-4">
            <li v-for="p in preparationTime" :key="p.title">
              <strong>{{ p.title }}:</strong> {{ p.description }}
            </li>
          </ul>
        </section>

        <section aria-labelledby="ingredients">
          <h2 id="ingredients" class="text-preset-2 text-(--color-brown-800)" tabindex="-1">
            <NuxtLink
              to="#ingredients"
              class="header-anchor"
              aria-label="Permalink to “Ingredients”"
            />
            Ingredients
          </h2>

          <ul class="mt-6">
            <li v-for="i in ingredients" :key="i.description">
              {{ i.description }}
            </li>
          </ul>
        </section>

        <hr role="none" />

        <section aria-labelledby="instructions">
          <h2 id="instructions" class="text-preset-2 text-(--color-brown-800)" tabindex="-1">
            <NuxtLink
              to="#instructions"
              class="header-anchor"
              aria-label="Permalink to “Instructions”"
            />
            Instructions
          </h2>

          <ol class="mt-6">
            <li v-for="i in instructions" :key="i.title">
              <strong>{{ i.title }}:</strong> {{ i.description }}
            </li>
          </ol>
        </section>

        <hr role="none" />

        <section aria-labelledby="nutrition">
          <h2 id="nutrition" class="text-preset-2 text-(--color-brown-800)" tabindex="-1">
            <NuxtLink to="#nutrition" class="header-anchor" aria-label="Permalink to “Nutrition”" />
            Nutrition
          </h2>

          <p class="mt-6 text-stone-600">
            The table below shows nutritional values per serving without the additional fillings.
          </p>

          <table class="mt-6 w-full">
            <caption class="sr-only">
              Nutritional values per serving without the additional fillings
            </caption>

            <tbody>
              <tr
                v-for="n in nutrition"
                :key="n.title"
                class="border-b border-stone-200 last:border-0 first:[&_td]:pt-0 last:[&_td]:pb-0 first:[&_th]:pt-0 last:[&_th]:pb-0"
              >
                <th class="w-1/2 py-3 pr-4 pl-8 text-left font-normal text-stone-600">
                  {{ n.title }}
                </th>
                <td class="w-1/2 py-3 pr-8 font-bold text-(--color-brown-800)">
                  {{ n.description }}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </article>
  </main>
</template>

<style scoped>
#recipe-page {
  font-family: 'Outfit', sans-serif;
  --color-stone-100: hsl(30, 54%, 90%);
  --color-stone-200: hsl(30, 18%, 87%);
  --color-stone-600: hsl(30, 10%, 34%);
  --color-stone-900: hsl(24, 5%, 18%);
  --color-brown-800: hsl(14, 45%, 36%);
  --color-rose-800: hsl(332, 51%, 32%);
  --color-rose-50: hsl(330, 100%, 98%);
}

.text-preset-1 {
  font-family: 'Young Serif', sans-serif;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0px;
}

.text-preset-2 {
  font-family: 'Young Serif', sans-serif;
  font-size: 1.75rem; /* 28px */
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0px;
}

.text-preset-3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem; /* 20px */
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0px;
}

.text-preset-4 {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem; /* 16px */
  line-height: 1.5;
  letter-spacing: 0px;
}

hr {
  color: var(--color-stone-200);
}

ul,
ol {
  margin-left: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

ul {
  list-style-type: disc;
}

ol {
  list-style-type: decimal;
}

li {
  padding-left: 1rem;
  color: var(--color-stone-600);
}

li::marker {
  color: var(--color-rose-800);
  font-weight: 700;
}

h1:hover .header-anchor,
h2:hover .header-anchor,
.header-anchor:focus-visible {
  opacity: 1;
}

.header-anchor {
  color: var(--color-rose-800);
  float: left;
  opacity: 0;
  margin-left: -0.87em;
  font-weight: 500;
  transition:
    color 0.25s,
    opacity 0.25s;
}

.header-anchor::before {
  content: '#';
}
</style>
