import { User, Task, CheckIn, SchedulePreset, CheckInStatus } from '@prisma/client'

// ════════════════════════════════════
// DATABASE TYPES (re-exported)
// ════════════════════════════════════
export type { User, Task, CheckIn, SchedulePreset, CheckInStatus }

// ════════════════════════════════════
// THEME TYPES
// ════════════════════════════════════
export type ColorScheme = 'blue' | 'pink'

// ════════════════════════════════════
// PWA TYPES
// ════════════════════════════════════

/**
 * Browser event fired when PWA is installable (Chromium only)
 * @see https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<{
    outcome: 'accepted' | 'dismissed'
  }>
}

/**
 * Platform detection result for PWA install flow
 */
export type PwaPlatform = 'ios' | 'chromium' | 'unsupported'

// Extend global types for PWA browser APIs
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
    appinstalled: Event
  }
  interface Navigator {
    /** iOS Safari standalone mode indicator */
    standalone?: boolean
  }
}

// ════════════════════════════════════
// AUTH TYPES
// ════════════════════════════════════
export interface AuthUser {
  id: string
  email: string
}

export interface SignupInput {
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

// ════════════════════════════════════
// API RESPONSE TYPES
// ════════════════════════════════════
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ════════════════════════════════════
// TASK TYPES
// ════════════════════════════════════
export interface TaskWithCheckIn extends Task {
  checkIns: CheckIn[]
}

export interface CreateTaskInput {
  title: string
  schedulePreset: SchedulePreset
  daysOfWeek?: number[] // Only for CUSTOM preset
  icon?: string
}

export interface UpdateTaskInput {
  title?: string
  schedulePreset?: SchedulePreset
  daysOfWeek?: number[]
  isActive?: boolean
  icon?: string
}

// ════════════════════════════════════
// CHECK-IN TYPES
// ════════════════════════════════════
export interface CreateCheckInInput {
  taskId: string
  date: string // YYYY-MM-DD
}

export interface DeleteCheckInInput {
  taskId: string
  date: string // YYYY-MM-DD
}

// ════════════════════════════════════
// INSIGHTS TYPES
// ════════════════════════════════════
export interface DayInsight {
  date: string // YYYY-MM-DD
  completedCount: number
  scheduledCount: number
  isSuccessful: boolean // completedCount >= min(dailyTarget, scheduledCount)
}

export interface InsightsData {
  days: DayInsight[]
  dailyTarget: number
  currentStreak: number
  bestStreak: number
}

// ════════════════════════════════════
// TODAY TYPES
// ════════════════════════════════════
export interface TodayTask {
  id: string
  title: string
  icon?: string
  isCompleted: boolean
  checkInId?: string
}

export interface TodayData {
  date: string // YYYY-MM-DD
  tasks: TodayTask[]
  completedCount: number
  totalCount: number
  dailyTarget: number
  isSuccessful: boolean // completedCount >= min(dailyTarget, totalCount)
}
