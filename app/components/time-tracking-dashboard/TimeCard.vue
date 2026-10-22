<script setup lang="ts">
import { animate, useReducedMotion } from 'motion-v'
import type { Timeframe, TimeTracker } from '#shared/types/time-tracker'

const { tracker, timeframe } = defineProps<{
  tracker: TimeTracker
  timeframe: Timeframe
}>()

const activity = computed(() => tracker.title.toLowerCase().replaceAll(' ', '-'))
const hours = computed(() => tracker.timeframes[timeframe])
const previousLabel = computed(
  () => ({ daily: 'Yesterday', weekly: 'Last Week', monthly: 'Last Month' })[timeframe],
)

const reducedMotion = useReducedMotion()
// Render the real total on the server and during hydration before animating on mount.
const displayedHours = ref(hours.value.current)

onMounted(() => {
  // Animate the displayed hours
  displayedHours.value = 0
  watch(
    () => hours.value.current,
    (target, _, onCleanup) => {
      if (reducedMotion.value || displayedHours.value === target) {
        displayedHours.value = target
        return
      }

      const animation = animate(displayedHours.value, target, {
        duration: 0.5,
        ease: 'easeOut',
        onUpdate: (value) => {
          displayedHours.value = Math.round(value)
        },
        onComplete: () => {
          displayedHours.value = target
        },
      })

      onCleanup(() => animation.stop())
    },
    { immediate: true },
  )
})

function formatHours(value: number) {
  return `${value}${value === 0 || value === 1 ? 'hr' : 'hrs'}`
}
</script>

<template>
  <article class="time-card" :data-activity="activity" :aria-labelledby="`activity-${activity}`">
    <img class="activity-icon" :src="`/img/time-tracking-dashboard/icon-${activity}.svg`" alt="" />

    <div class="card-content">
      <div class="card-header">
        <h2 :id="`activity-${activity}`">{{ tracker.title }}</h2>

        <img src="/img/time-tracking-dashboard/icon-ellipsis.svg" alt="" width="21" height="5" />
      </div>

      <div class="card-stats">
        <p class="current-hours" :class="{ 'large-hours': hours.current >= 100 }">
          <span aria-hidden="true">{{ formatHours(displayedHours) }}</span>
          <span class="sr-only">{{ formatHours(hours.current) }}</span>
        </p>

        <p class="previous-hours">{{ previousLabel }} - {{ formatHours(hours.previous) }}</p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.time-card {
  position: relative;
  min-width: 0;
  padding-top: 38px;
  overflow: hidden;
  border-radius: 15px;
  background: var(--color-navy-800);
}

.time-card[data-activity='work'] {
  background: var(--color-orange-300);
}

.time-card[data-activity='play'] {
  background: var(--color-blue-300);
}

.time-card[data-activity='study'] {
  background: var(--color-pink-400);
}

.time-card[data-activity='exercise'] {
  background: var(--color-green-400);
}

.time-card[data-activity='social'] {
  background: var(--color-purple-700);
}

.time-card[data-activity='self-care'] {
  background: var(--color-yellow-300);
}

.activity-icon {
  position: absolute;
  top: -10px;
  right: 17px;
}

[data-activity='exercise'] .activity-icon {
  top: 0;
}

[data-activity='social'] .activity-icon {
  top: -15px;
}

.card-content {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  min-height: 122px;
  padding: 24px;
  border-radius: 15px;
  background: var(--color-navy-900);
}

.time-card:hover .card-content {
  background: var(--color-navy-800);
}

.card-header,
.card-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-header h2 {
  font-size: 18px;
  line-height: 21px;
  font-weight: 500;
}

.card-header img {
  flex-shrink: 0;
}

.current-hours {
  font-size: 32px;
  line-height: 38px;
  font-weight: 300;
}

.previous-hours {
  color: var(--color-navy-200);
  font-size: 15px;
  line-height: 18px;
  text-align: right;
}

@media (min-width: 48rem) {
  .time-card {
    padding-top: 33px;
  }

  .activity-icon {
    top: -7px;
    right: 12px;
    transform: scale(0.737);
    transform-origin: top right;
  }

  [data-activity='social'] .activity-icon {
    top: -11px;
  }

  .card-header img {
    transform: scale(0.737);
    transform-origin: right center;
  }

  .card-content {
    min-height: 180px;
    padding-inline: 22px;
    gap: 16px;
  }

  .card-stats {
    align-items: flex-start;
    flex-direction: column;
  }

  .current-hours {
    font-size: 56px;
    line-height: 66px;
  }

  .large-hours {
    font-size: 46px;
  }

  .previous-hours {
    text-align: left;
  }
}

@media (min-width: 75rem) {
  .time-card {
    padding-top: 45px;
  }

  .activity-icon {
    top: -10px;
    right: 17px;
    transform: none;
  }

  [data-activity='social'] .activity-icon {
    top: -15px;
  }

  .card-header img {
    transform: none;
  }

  .card-content {
    min-height: 199px;
    padding: 31px 32px;
    gap: 24px;
  }

  .large-hours {
    font-size: 56px;
  }
}
</style>
