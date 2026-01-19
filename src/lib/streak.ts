import { prisma } from './prisma'
import { getLastNDays, getTodayInAmsterdam } from './dates'
import { isTaskScheduledForDate } from './schedule'

/**
 * Determine if a day is successful based on completion vs effective target.
 *
 * effectiveTarget = min(dailyTarget, scheduledCount)
 *
 * This allows success when fewer tasks are scheduled than the daily target,
 * e.g., a user with dailyTarget=3 and only 2 ALL_WEEK tasks can still
 * succeed on weekends (WORKWEEK tasks not scheduled).
 *
 * @param completedCount - Number of tasks completed on the day
 * @param scheduledCount - Number of tasks scheduled for the day
 * @param dailyTarget - User's daily goal
 * @returns true if the day counts as successful for streak purposes
 */
export function isDaySuccessful(
  completedCount: number,
  scheduledCount: number,
  dailyTarget: number
): boolean {
  // Days with no scheduled tasks are not evaluated
  // (caller should handle this case by skipping the day)
  if (scheduledCount === 0) {
    return false
  }

  const effectiveTarget = Math.min(dailyTarget, scheduledCount)
  return completedCount >= effectiveTarget
}

/**
 * Calculate the current streak for a user
 * A streak is consecutive days where completedCount >= dailyTarget
 * Missing a day resets the streak to 0
 *
 * @param userId - The user ID
 * @returns Current streak count
 */
export async function calculateCurrentStreak(userId: string): Promise<number> {
  // Get user's daily target
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyTarget: true },
  })

  if (!user) {
    return 0
  }

  const dailyTarget = user.dailyTarget
  const today = getTodayInAmsterdam()

  // Get all active tasks
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      isActive: true,
    },
    select: {
      id: true,
      schedulePreset: true,
      daysOfWeek: true,
    },
  })

  // Get check-ins for the last 365 days (enough to calculate any streak)
  const last365Days = getLastNDays(365)
  const checkIns = await prisma.checkIn.findMany({
    where: {
      userId,
      date: {
        in: last365Days,
      },
    },
    select: {
      date: true,
      taskId: true,
    },
  })

  // Build map of date -> completed count
  const completedByDate = new Map<string, number>()
  for (const checkIn of checkIns) {
    const count = completedByDate.get(checkIn.date) || 0
    completedByDate.set(checkIn.date, count + 1)
  }

  // Calculate streak by walking backwards from today
  let streak = 0
  for (let i = 0; i < last365Days.length; i++) {
    const date = last365Days[last365Days.length - 1 - i] // Start from today

    // Count how many tasks were scheduled for this date
    const scheduledCount = tasks.filter((task) =>
      isTaskScheduledForDate(task.schedulePreset, task.daysOfWeek, date)
    ).length

    const completedCount = completedByDate.get(date) || 0

    // If no tasks were scheduled, this day doesn't affect the streak
    // (user can't complete what doesn't exist)
    if (scheduledCount === 0) {
      continue
    }

    // Check if this day was successful using effective target
    const isSuccessful = isDaySuccessful(completedCount, scheduledCount, dailyTarget)

    if (isSuccessful) {
      streak++
    } else {
      // Streak broken
      break
    }
  }

  return streak
}

/**
 * Calculate the best streak (all-time) for a user
 * This is the longest consecutive streak the user has ever had
 *
 * @param userId - The user ID
 * @returns Best streak count
 */
export async function calculateBestStreak(userId: string): Promise<number> {
  // Get user's daily target
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyTarget: true, createdAt: true },
  })

  if (!user) {
    return 0
  }

  const dailyTarget = user.dailyTarget

  // Get all tasks (including inactive)
  const tasks = await prisma.task.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      schedulePreset: true,
      daysOfWeek: true,
    },
  })

  // Get all check-ins
  const checkIns = await prisma.checkIn.findMany({
    where: {
      userId,
    },
    select: {
      date: true,
      taskId: true,
    },
    orderBy: {
      date: 'asc',
    },
  })

  if (checkIns.length === 0) {
    return 0
  }

  // Get date range from first to last check-in
  const firstDate = checkIns[0].date
  const lastDate = checkIns[checkIns.length - 1].date

  // Build map of date -> completed count
  const completedByDate = new Map<string, number>()
  for (const checkIn of checkIns) {
    const count = completedByDate.get(checkIn.date) || 0
    completedByDate.set(checkIn.date, count + 1)
  }

  // Generate all dates in range
  const allDates = getDateRangeArray(firstDate, lastDate)

  // Calculate best streak
  let bestStreak = 0
  let currentStreak = 0

  for (const date of allDates) {
    // Count scheduled tasks for this date
    const scheduledCount = tasks.filter((task) =>
      isTaskScheduledForDate(task.schedulePreset, task.daysOfWeek, date)
    ).length

    const completedCount = completedByDate.get(date) || 0

    // If no tasks scheduled, skip this day
    if (scheduledCount === 0) {
      continue
    }

    // Check if successful using effective target
    const isSuccessful = isDaySuccessful(completedCount, scheduledCount, dailyTarget)

    if (isSuccessful) {
      currentStreak++
      bestStreak = Math.max(bestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  return bestStreak
}

/**
 * Helper: Generate array of all dates between start and end (inclusive)
 */
function getDateRangeArray(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  const current = new Date(start)
  while (current <= end) {
    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, '0')
    const day = String(current.getDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)

    current.setDate(current.getDate() + 1)
  }

  return dates
}
