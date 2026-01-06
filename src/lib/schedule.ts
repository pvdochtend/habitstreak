import { SchedulePreset } from '@prisma/client'
import { getDayOfWeek } from './dates'

/**
 * Determine if a task is scheduled for a given date (YYYY-MM-DD)
 *
 * @param schedulePreset - The task's schedule preset
 * @param daysOfWeek - Custom days array (only used for CUSTOM preset). 0=Mon, 6=Sun
 * @param dateString - The date to check (YYYY-MM-DD)
 * @returns true if task is scheduled for this date
 */
export function isTaskScheduledForDate(
  schedulePreset: SchedulePreset,
  daysOfWeek: number[],
  dateString: string
): boolean {
  const dayOfWeek = getDayOfWeek(dateString)

  switch (schedulePreset) {
    case 'ALL_WEEK':
      return true

    case 'WORKWEEK':
      // Monday (0) to Friday (4)
      return dayOfWeek >= 0 && dayOfWeek <= 4

    case 'WEEKEND':
      // Saturday (5) and Sunday (6)
      return dayOfWeek === 5 || dayOfWeek === 6

    case 'CUSTOM':
      // Check if the day is in the custom days array
      return daysOfWeek.includes(dayOfWeek)

    default:
      return false
  }
}

/**
 * Get human-readable description of schedule preset (in Dutch)
 */
export function getSchedulePresetLabel(preset: SchedulePreset): string {
  switch (preset) {
    case 'ALL_WEEK':
      return 'Elke dag'
    case 'WORKWEEK':
      return 'Werkdagen (ma-vr)'
    case 'WEEKEND':
      return 'Weekend (za-zo)'
    case 'CUSTOM':
      return 'Aangepast'
    default:
      return 'Onbekend'
  }
}

/**
 * Get day name in Dutch
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
  return days[dayOfWeek] || 'Onbekend'
}

/**
 * Validate custom days of week array
 */
export function isValidDaysOfWeek(days: number[]): boolean {
  if (!Array.isArray(days)) {
    return false
  }

  // All values must be 0-6
  return days.every((day) => day >= 0 && day <= 6)
}
