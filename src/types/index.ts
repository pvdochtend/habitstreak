import { User, Task, CheckIn, SchedulePreset, CheckInStatus } from '@prisma/client'

// ════════════════════════════════════
// DATABASE TYPES (re-exported)
// ════════════════════════════════════
export type { User, Task, CheckIn, SchedulePreset, CheckInStatus }

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
  isSuccessful: boolean // completedCount >= dailyTarget
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
  isSuccessful: boolean
}
