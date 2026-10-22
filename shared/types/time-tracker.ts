export type Timeframe = 'daily' | 'weekly' | 'monthly'

export interface TimeTracker {
  title: string
  timeframes: Record<Timeframe, { current: number; previous: number }>
}

export interface TimeTrackersResponse {
  success: boolean
  user: {
    id: number
    fullName: string
  }
  data: TimeTracker[]
}
