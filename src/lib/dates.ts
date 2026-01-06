import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { format, subDays, parseISO, startOfDay } from 'date-fns'

const TIMEZONE = 'Europe/Amsterdam'

/**
 * Get current date in Amsterdam timezone as YYYY-MM-DD string
 */
export function getTodayInAmsterdam(): string {
  const now = new Date()
  return formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd')
}

/**
 * Get date N days ago in Amsterdam timezone as YYYY-MM-DD string
 */
export function getDaysAgoInAmsterdam(daysAgo: number): string {
  const now = new Date()
  const zonedNow = toZonedTime(now, TIMEZONE)
  const pastDate = subDays(zonedNow, daysAgo)
  return format(pastDate, 'yyyy-MM-dd')
}

/**
 * Get the day of week (0=Monday, 6=Sunday) for a YYYY-MM-DD date in Amsterdam timezone
 * ISO 8601 standard: Monday is 0
 */
export function getDayOfWeek(dateString: string): number {
  const date = parseISO(dateString)
  const zonedDate = toZonedTime(date, TIMEZONE)
  const jsDay = zonedDate.getDay() // 0=Sunday, 6=Saturday

  // Convert to ISO 8601: 0=Monday, 6=Sunday
  return jsDay === 0 ? 6 : jsDay - 1
}

/**
 * Format a date string for display
 */
export function formatDateForDisplay(dateString: string): string {
  const date = parseISO(dateString)
  const zonedDate = toZonedTime(date, TIMEZONE)
  return format(zonedDate, 'd MMMM yyyy')
}

/**
 * Get array of last N days as YYYY-MM-DD strings (including today)
 * Returns in chronological order (oldest first)
 */
export function getLastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    days.push(getDaysAgoInAmsterdam(i))
  }
  return days
}

/**
 * Validate that a string is a valid YYYY-MM-DD date
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) {
    return false
  }

  const date = parseISO(dateString)
  return !isNaN(date.getTime())
}
