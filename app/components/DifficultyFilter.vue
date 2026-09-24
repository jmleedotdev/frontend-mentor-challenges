<script setup lang="ts">
const { difficulties } = useChallengeFilters()

const panelId = useId()
const button = useTemplateRef('button')
const panel = useTemplateRef('panel')

const position = ref({ top: 0, right: 0 })

function onBeforeToggle(event: ToggleEvent) {
  if (event.newState !== 'open' || !button.value) return
  const rect = button.value.getBoundingClientRect()
  position.value = { top: rect.bottom + 8, right: window.innerWidth - rect.right }
}

function closePanel() {
  panel.value?.hidePopover()
}

onMounted(() => window.addEventListener('resize', closePanel))
onBeforeUnmount(() => window.removeEventListener('resize', closePanel))
</script>

<template>
  <button
    ref="button"
    type="button"
    :popovertarget="panelId"
    class="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
  >
    <Icon name="lucide:funnel" class="size-4" />
    Filter
    <span
      v-if="difficulties.length"
      class="rounded-full bg-gray-900 px-2 py-0.5 text-xs leading-none font-semibold text-white"
    >
      {{ difficulties.length }}
      <span class="sr-only">active</span>
    </span>
  </button>

  <div
    :id="panelId"
    ref="panel"
    popover
    class="inset-auto m-0 w-56 rounded-md border border-gray-200 bg-white p-4 font-showcase text-gray-900 shadow-lg"
    :style="{ top: `${position.top}px`, right: `${position.right}px` }"
    @beforetoggle="onBeforeToggle"
  >
    <fieldset>
      <legend class="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
        Difficulty
      </legend>
      <label
        v-for="difficulty in DIFFICULTIES"
        :key="difficulty"
        class="flex cursor-pointer items-center gap-3 py-1.5"
      >
        <input
          v-model="difficulties"
          type="checkbox"
          :value="difficulty"
          class="size-4 accent-gray-900"
        />
        <DifficultyBadge :difficulty="difficulty" />
      </label>
    </fieldset>
    <button
      type="button"
      :disabled="!difficulties.length"
      class="mt-3 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      @click="difficulties = []"
    >
      Clear
    </button>
  </div>
</template>
