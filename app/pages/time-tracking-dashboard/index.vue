<script setup lang="ts">
import type { Timeframe } from '#shared/types/time-tracker'

definePageMeta({ layout: 'challenge' })
await useChallengePage()

const timeframe = ref<Timeframe>('daily')
const timeframes: { value: Timeframe; label: Capitalize<Timeframe> }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]
const { data, status, error, refresh } = await useLazyFetch('/api/time-trackers')
const trackers = computed(() => data.value?.data ?? [])
</script>

<template>
  <main
    id="time-tracking-dashboard"
    class="flex min-h-dvh items-center justify-center bg-(--color-navy-950) text-white"
  >
    <div class="dashboard">
      <section class="report" aria-labelledby="report-name">
        <div class="profile">
          <NuxtImg
            class="avatar"
            src="/img/time-tracking-dashboard/image-jeremy.png"
            alt=""
            width="78"
            height="78"
          />

          <div class="profile-copy">
            <p>Report for</p>
            <h1 id="report-name">{{ data?.user.fullName ?? 'User' }}</h1>
          </div>
        </div>

        <div class="timeframes" role="group" aria-label="Report timeframe">
          <button
            v-for="period in timeframes"
            :key="period.value"
            type="button"
            :aria-pressed="timeframe === period.value"
            @click="timeframe = period.value"
          >
            {{ period.label }}
          </button>
        </div>
      </section>

      <div id="time-tracker-results" class="results" :aria-busy="status === 'pending'">
        <p v-if="status === 'pending' || status === 'idle'" class="status-message" role="status">
          Loading time trackers…
        </p>
        <div v-else-if="error || !data?.success" class="status-message" role="alert">
          <p>We couldn't load your time trackers.</p>
          <button type="button" class="retry-button" @click="refresh()">Retry</button>
        </div>
        <p v-else-if="!trackers.length" class="status-message" role="status">
          No activities to report yet.
        </p>
        <div v-else class="time-cards">
          <TimeTrackingDashboardTimeCard
            v-for="tracker in trackers"
            :key="tracker.title"
            :tracker="tracker"
            :timeframe="timeframe"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
#time-tracking-dashboard {
  font-family: 'Rubik', sans-serif;
  --color-orange-300: hsl(15, 100%, 70%);
  --color-yellow-300: hsl(43, 84%, 65%);
  --color-blue-300: hsl(195, 74%, 62%);
  --color-pink-400: hsl(348, 100%, 68%);
  --color-green-400: hsl(145, 58%, 55%);
  --color-purple-500: hsl(235, 45%, 61%);
  --color-purple-600: hsl(246, 80%, 60%);
  --color-purple-700: hsl(264, 64%, 52%);
  --color-navy-200: hsl(236, 100%, 87%);
  --color-navy-800: #33397a;
  --color-navy-900: hsl(235, 46%, 20%);
  --color-navy-950: hsl(226, 43%, 10%);
  padding: 81px 24px;
}

.dashboard,
.time-cards {
  display: grid;
  gap: 24px;
}

.dashboard {
  width: 100%;
  max-width: 480px;
}

.report {
  min-width: 0;
  overflow: hidden;
  border-radius: 15px;
  background: var(--color-navy-900);
}

.profile {
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 133px;
  padding: 32px;
  border-radius: 15px;
  background: var(--color-purple-600);
}

.avatar {
  box-sizing: content-box;
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  margin: -3px;
  border: 3px solid white;
  border-radius: 50%;
}

.profile-copy p {
  margin-bottom: 8px;
  color: var(--color-navy-200);
  font-size: 15px;
  line-height: 18px;
}

.profile-copy h1 {
  font-size: 24px;
  line-height: 28px;
  font-weight: 300;
}

.timeframes {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70px;
}

.timeframes button {
  flex: 1;
  padding: 12px 0;
  color: var(--color-purple-500);
  font-size: 18px;
  line-height: 21px;
  cursor: pointer;
}

.timeframes button:hover,
.timeframes button:focus-visible,
.timeframes button[aria-pressed='true'] {
  color: white;
}

button:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
  border-radius: 4px;
}

.results {
  min-width: 0;
}

.status-message {
  padding: 32px 24px;
  border-radius: 15px;
  background: var(--color-navy-900);
  color: var(--color-navy-200);
}

.retry-button {
  margin-top: 16px;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--color-purple-600);
  color: white;
  cursor: pointer;
}

@media (max-width: 23rem) {
  .profile {
    gap: 16px;
    padding-inline: 24px;
  }
}

@media (min-width: 48rem) {
  #time-tracking-dashboard {
    padding: 64px 32px;
  }

  .dashboard {
    max-width: 612px;
  }

  .timeframes {
    gap: 8px;
  }

  .timeframes button {
    flex: 0 1 109px;
  }

  .time-cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 75rem) {
  .dashboard {
    grid-template-columns: 255px minmax(0, 1fr);
    gap: 32px;
    max-width: 1116px;
  }

  .profile {
    align-items: flex-start;
    flex-direction: column;
    gap: 40px;
    min-height: 354px;
  }

  .avatar {
    width: 78px;
    height: 78px;
  }

  .profile-copy {
    max-width: 150px;
  }

  .profile-copy p {
    margin-bottom: 0;
  }

  .profile-copy h1 {
    font-size: 40px;
    line-height: 47px;
  }

  .timeframes {
    align-items: flex-start;
    flex-direction: column;
    gap: 21px;
    padding: 28px 32px 32px;
  }

  .timeframes button {
    flex: none;
    padding: 0;
  }

  .time-cards {
    gap: 32px;
  }
}
</style>
