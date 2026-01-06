import { describe, it, expect } from 'vitest'
import {
  isTaskScheduledForDate,
  getSchedulePresetLabel,
  getDayName,
  isValidDaysOfWeek,
} from '@/lib/schedule'

describe('Schedule utilities', () => {
  describe('isTaskScheduledForDate', () => {
    it('should schedule ALL_WEEK for every day', () => {
      expect(isTaskScheduledForDate('ALL_WEEK', [], '2024-01-01')).toBe(true) // Monday
      expect(isTaskScheduledForDate('ALL_WEEK', [], '2024-01-06')).toBe(true) // Saturday
      expect(isTaskScheduledForDate('ALL_WEEK', [], '2024-01-07')).toBe(true) // Sunday
    })

    it('should schedule WORKWEEK for Mon-Fri only', () => {
      expect(isTaskScheduledForDate('WORKWEEK', [], '2024-01-01')).toBe(true) // Monday
      expect(isTaskScheduledForDate('WORKWEEK', [], '2024-01-02')).toBe(true) // Tuesday
      expect(isTaskScheduledForDate('WORKWEEK', [], '2024-01-03')).toBe(true) // Wednesday
      expect(isTaskScheduledForDate('WORKWEEK', [], '2024-01-04')).toBe(true) // Thursday
      expect(isTaskScheduledForDate('WORKWEEK', [], '2024-01-05')).toBe(true) // Friday
      expect(isTaskScheduledForDate('WORKWEEK', [], '2024-01-06')).toBe(false) // Saturday
      expect(isTaskScheduledForDate('WORKWEEK', [], '2024-01-07')).toBe(false) // Sunday
    })

    it('should schedule WEEKEND for Sat-Sun only', () => {
      expect(isTaskScheduledForDate('WEEKEND', [], '2024-01-01')).toBe(false) // Monday
      expect(isTaskScheduledForDate('WEEKEND', [], '2024-01-05')).toBe(false) // Friday
      expect(isTaskScheduledForDate('WEEKEND', [], '2024-01-06')).toBe(true) // Saturday
      expect(isTaskScheduledForDate('WEEKEND', [], '2024-01-07')).toBe(true) // Sunday
    })

    it('should schedule CUSTOM for specified days only', () => {
      // Monday, Wednesday, Friday (0, 2, 4)
      const customDays = [0, 2, 4]

      expect(isTaskScheduledForDate('CUSTOM', customDays, '2024-01-01')).toBe(true) // Monday
      expect(isTaskScheduledForDate('CUSTOM', customDays, '2024-01-02')).toBe(false) // Tuesday
      expect(isTaskScheduledForDate('CUSTOM', customDays, '2024-01-03')).toBe(true) // Wednesday
      expect(isTaskScheduledForDate('CUSTOM', customDays, '2024-01-04')).toBe(false) // Thursday
      expect(isTaskScheduledForDate('CUSTOM', customDays, '2024-01-05')).toBe(true) // Friday
      expect(isTaskScheduledForDate('CUSTOM', customDays, '2024-01-06')).toBe(false) // Saturday
      expect(isTaskScheduledForDate('CUSTOM', customDays, '2024-01-07')).toBe(false) // Sunday
    })
  })

  describe('getSchedulePresetLabel', () => {
    it('should return Dutch labels for each preset', () => {
      expect(getSchedulePresetLabel('ALL_WEEK')).toBe('Elke dag')
      expect(getSchedulePresetLabel('WORKWEEK')).toBe('Werkdagen (ma-vr)')
      expect(getSchedulePresetLabel('WEEKEND')).toBe('Weekend (za-zo)')
      expect(getSchedulePresetLabel('CUSTOM')).toBe('Aangepast')
    })
  })

  describe('getDayName', () => {
    it('should return Dutch day names (ISO order: 0=Mon)', () => {
      expect(getDayName(0)).toBe('Ma')
      expect(getDayName(1)).toBe('Di')
      expect(getDayName(2)).toBe('Wo')
      expect(getDayName(3)).toBe('Do')
      expect(getDayName(4)).toBe('Vr')
      expect(getDayName(5)).toBe('Za')
      expect(getDayName(6)).toBe('Zo')
    })

    it('should handle invalid input', () => {
      expect(getDayName(7)).toBe('Onbekend')
      expect(getDayName(-1)).toBe('Onbekend')
    })
  })

  describe('isValidDaysOfWeek', () => {
    it('should validate correct arrays', () => {
      expect(isValidDaysOfWeek([0, 1, 2])).toBe(true)
      expect(isValidDaysOfWeek([6])).toBe(true)
      expect(isValidDaysOfWeek([0, 2, 4, 6])).toBe(true)
      expect(isValidDaysOfWeek([])).toBe(true) // Empty is technically valid
    })

    it('should reject invalid arrays', () => {
      expect(isValidDaysOfWeek([7])).toBe(false) // Out of range
      expect(isValidDaysOfWeek([-1])).toBe(false) // Out of range
      expect(isValidDaysOfWeek([0, 1, 7])).toBe(false) // Contains invalid
      // @ts-ignore - Testing runtime validation
      expect(isValidDaysOfWeek('not-an-array')).toBe(false)
      // @ts-ignore - Testing runtime validation
      expect(isValidDaysOfWeek(null)).toBe(false)
    })
  })
})
