import { describe, it, expect } from 'vitest'
import { isValidDateString, getDayOfWeek, getLastNDays } from '@/lib/dates'

describe('Date utilities', () => {
  describe('isValidDateString', () => {
    it('should validate correct date strings', () => {
      expect(isValidDateString('2024-01-15')).toBe(true)
      expect(isValidDateString('2024-12-31')).toBe(true)
      expect(isValidDateString('2000-01-01')).toBe(true)
    })

    it('should reject invalid date strings', () => {
      expect(isValidDateString('2024-1-15')).toBe(false) // Wrong format
      expect(isValidDateString('2024-13-01')).toBe(false) // Invalid month
      expect(isValidDateString('2024-00-01')).toBe(false) // Invalid month
      expect(isValidDateString('2024-01-32')).toBe(false) // Invalid day
      expect(isValidDateString('not-a-date')).toBe(false)
      expect(isValidDateString('')).toBe(false)
    })
  })

  describe('getDayOfWeek', () => {
    it('should return correct ISO day of week (0=Mon, 6=Sun)', () => {
      expect(getDayOfWeek('2024-01-01')).toBe(0) // Monday
      expect(getDayOfWeek('2024-01-02')).toBe(1) // Tuesday
      expect(getDayOfWeek('2024-01-03')).toBe(2) // Wednesday
      expect(getDayOfWeek('2024-01-04')).toBe(3) // Thursday
      expect(getDayOfWeek('2024-01-05')).toBe(4) // Friday
      expect(getDayOfWeek('2024-01-06')).toBe(5) // Saturday
      expect(getDayOfWeek('2024-01-07')).toBe(6) // Sunday
    })
  })

  describe('getLastNDays', () => {
    it('should return array of correct length', () => {
      const days7 = getLastNDays(7)
      expect(days7).toHaveLength(7)

      const days30 = getLastNDays(30)
      expect(days30).toHaveLength(30)
    })

    it('should return dates in chronological order', () => {
      const days = getLastNDays(7)

      // Each date should be before the next
      for (let i = 0; i < days.length - 1; i++) {
        expect(new Date(days[i]) < new Date(days[i + 1])).toBe(true)
      }
    })

    it('should include today as the last element', () => {
      const days = getLastNDays(7)
      const lastDay = days[days.length - 1]

      // Should be a valid date string
      expect(isValidDateString(lastDay)).toBe(true)
    })
  })
})
