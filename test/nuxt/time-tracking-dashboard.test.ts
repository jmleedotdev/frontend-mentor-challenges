import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import TimeTrackingPage from '../../app/pages/time-tracking-dashboard/index.vue'
import type { TimeTracker, TimeTrackersResponse } from '../../shared/types/time-tracker'

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))
mockNuxtImport('useChallengePage', () => async () => {})
mockNuxtImport('useLazyFetch', () => fetchMock)

const trackers: TimeTracker[] = [
  {
    title: 'Work',
    timeframes: {
      daily: { current: 5, previous: 7 },
      weekly: { current: 32, previous: 36 },
      monthly: { current: 103, previous: 128 },
    },
  },
  {
    title: 'Study',
    timeframes: {
      daily: { current: 0, previous: 1 },
      weekly: { current: 4, previous: 7 },
      monthly: { current: 13, previous: 19 },
    },
  },
]

const user = { id: 1, fullName: 'Jeremy Robson' }
const wrappers: Awaited<ReturnType<typeof mountSuspended>>[] = []
let response: {
  data: ReturnType<typeof ref<TimeTrackersResponse | null>>
  status: ReturnType<typeof ref<string>>
  error: ReturnType<typeof ref<Error | null>>
  refresh: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  response = {
    data: ref({ success: true, user, data: trackers }),
    status: ref('success'),
    error: ref(null),
    refresh: vi.fn(),
  }
  fetchMock.mockReset().mockReturnValue(response)
})

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})

async function mountPage() {
  const wrapper = await mountSuspended(TimeTrackingPage, { route: '/time-tracking-dashboard' })
  wrappers.push(wrapper)
  return wrapper
}

describe('Time tracking dashboard', () => {
  it('fetches API data once and defaults to Daily with singular and zero hours', async () => {
    const wrapper = await mountPage()
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/time-trackers')
    expect(wrapper.get('button[aria-pressed="true"]').text()).toBe('Daily')
    await vi.waitFor(() =>
      expect(wrapper.findAll('.current-hours [aria-hidden]').map((card) => card.text())).toEqual([
        '5hrs',
        '0hr',
      ]),
    )
    expect(wrapper.findAll('.previous-hours').map((card) => card.text())).toEqual([
      'Yesterday - 7hrs',
      'Yesterday - 1hr',
    ])
    expect(wrapper.findAll('article')).toHaveLength(2)
    expect(wrapper.find('article button').exists()).toBe(false)
    expect(wrapper.get('[data-activity="work"] .activity-icon').attributes('src')).toBe(
      '/img/time-tracking-dashboard/icon-work.svg',
    )
  })

  it('renders the full name from the API rather than a hardcoded name', async () => {
    response.data.value = {
      success: true,
      user: { id: 1, fullName: 'Alex Morgan' },
      data: trackers,
    }
    const wrapper = await mountPage()
    expect(wrapper.get('#report-name').text()).toBe('Alex Morgan')
  })

  it('updates every card and comparison label without refetching or navigating', async () => {
    const wrapper = await mountPage()
    for (const [label, values, previous] of [
      ['Weekly', ['32hrs', '4hrs'], ['Last Week - 36hrs', 'Last Week - 7hrs']],
      ['Monthly', ['103hrs', '13hrs'], ['Last Month - 128hrs', 'Last Month - 19hrs']],
      ['Daily', ['5hrs', '0hr'], ['Yesterday - 7hrs', 'Yesterday - 1hr']],
    ] as const) {
      const button = wrapper.findAll('.timeframes button').find((item) => item.text() === label)!
      await button.trigger('click')
      expect(wrapper.findAll('[aria-pressed="true"]')).toHaveLength(1)
      expect(button.attributes('aria-pressed')).toBe('true')
      await vi.waitFor(() =>
        expect(wrapper.findAll('.current-hours [aria-hidden]').map((card) => card.text())).toEqual(
          values,
        ),
      )
      expect(wrapper.findAll('.previous-hours').map((card) => card.text())).toEqual(previous)
    }
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('starts a fresh page on Daily rather than persisting the previous selection', async () => {
    const wrapper = await mountPage()
    await wrapper.findAll('.timeframes button')[2]!.trigger('click')
    const freshPage = await mountPage()
    expect(freshPage.get('[aria-pressed="true"]').text()).toBe('Daily')
  })

  it('shows a busy loading state without sample cards', async () => {
    response.status.value = 'pending'
    response.data.value = null
    const wrapper = await mountPage()
    expect(wrapper.get('#report-name').text()).toBe('User')
    expect(wrapper.get('[role="status"]').text()).toBe('Loading time trackers…')
    expect(wrapper.get('.results').attributes('aria-busy')).toBe('true')
    expect(wrapper.find('article').exists()).toBe(false)
  })

  it.each(['network', 'unsuccessful response'])(
    'shows an error and retries after %s',
    async (failure) => {
      if (failure === 'network') {
        response.status.value = 'error'
        response.error.value = new Error('Unavailable')
        response.data.value = null
      } else {
        response.data.value = { success: false, user, data: [] }
      }
      const wrapper = await mountPage()
      expect(wrapper.get('[role="alert"]').text()).toContain("We couldn't load your time trackers.")
      expect(wrapper.find('article').exists()).toBe(false)
      await wrapper.get('.retry-button').trigger('click')
      expect(response.refresh).toHaveBeenCalledTimes(1)

      response.error.value = null
      response.data.value = { success: true, user, data: trackers }
      response.status.value = 'success'
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
      expect(wrapper.findAll('article')).toHaveLength(2)
    },
  )

  it('distinguishes an empty report from a loading or error state', async () => {
    response.data.value = { success: true, user, data: [] }
    const wrapper = await mountPage()
    expect(wrapper.get('[role="status"]').text()).toBe('No activities to report yet.')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('article').exists()).toBe(false)
  })
})
