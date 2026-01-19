import { describe, it, expect } from 'vitest'
import { isDaySuccessful } from '@/lib/streak'

describe('isDaySuccessful', () => {
  describe('basic cases', () => {
    it('returns true when completed >= dailyTarget', () => {
      expect(isDaySuccessful(3, 5, 3)).toBe(true)
      expect(isDaySuccessful(5, 5, 3)).toBe(true)
    })

    it('returns false when completed < dailyTarget', () => {
      expect(isDaySuccessful(2, 5, 3)).toBe(false)
      expect(isDaySuccessful(0, 5, 3)).toBe(false)
    })
  })

  describe('effective target when scheduledCount < dailyTarget', () => {
    it('succeeds when all scheduled tasks completed (fewer than target)', () => {
      // dailyTarget=3, but only 2 tasks scheduled
      // User completes both -> should succeed
      expect(isDaySuccessful(2, 2, 3)).toBe(true)
    })

    it('succeeds when completed > scheduledCount (bonus completions)', () => {
      // Completes more than scheduled (edge case, shouldn't happen but be safe)
      expect(isDaySuccessful(3, 2, 3)).toBe(true)
    })

    it('fails when not all scheduled tasks completed', () => {
      // dailyTarget=3, 2 scheduled, only 1 completed -> fail
      expect(isDaySuccessful(1, 2, 3)).toBe(false)
    })

    it('handles single task scenarios', () => {
      // Only 1 task scheduled, dailyTarget=3
      expect(isDaySuccessful(1, 1, 3)).toBe(true)  // Completed the 1 task
      expect(isDaySuccessful(0, 1, 3)).toBe(false) // Didn't complete it
    })
  })

  describe('zero scheduled tasks', () => {
    it('returns false when no tasks scheduled', () => {
      // Days with no scheduled tasks should not count as success
      // (caller should skip these days in streak calculation)
      expect(isDaySuccessful(0, 0, 3)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles dailyTarget of 1', () => {
      expect(isDaySuccessful(1, 5, 1)).toBe(true)
      expect(isDaySuccessful(0, 5, 1)).toBe(false)
      expect(isDaySuccessful(1, 1, 1)).toBe(true)
    })

    it('handles equal scheduledCount and dailyTarget', () => {
      expect(isDaySuccessful(3, 3, 3)).toBe(true)
      expect(isDaySuccessful(2, 3, 3)).toBe(false)
    })

    it('handles very high dailyTarget with few tasks', () => {
      // User set dailyTarget=10 but only has 2 tasks
      expect(isDaySuccessful(2, 2, 10)).toBe(true)
      expect(isDaySuccessful(1, 2, 10)).toBe(false)
    })
  })
})

describe('streak calculation scenarios', () => {
  // These document expected behavior for manual testing
  // Full integration would require mocking Prisma

  describe('WORKWEEK + ALL_WEEK task combinations', () => {
    it('documents: weekend with only ALL_WEEK tasks should use reduced target', () => {
      // User has:
      // - 2 ALL_WEEK tasks
      // - 1 WORKWEEK task
      // - dailyTarget = 3
      //
      // On Saturday (WORKWEEK not scheduled):
      // - scheduledCount = 2 (only ALL_WEEK)
      // - effectiveTarget = min(3, 2) = 2
      // - Completing both ALL_WEEK tasks = success
      expect(isDaySuccessful(2, 2, 3)).toBe(true)
    })

    it('documents: weekday with all tasks should use full target', () => {
      // On Monday (all scheduled):
      // - scheduledCount = 3
      // - effectiveTarget = min(3, 3) = 3
      // - Must complete all 3 for success
      expect(isDaySuccessful(3, 3, 3)).toBe(true)
      expect(isDaySuccessful(2, 3, 3)).toBe(false)
    })
  })

  describe('WEEKEND only scenarios', () => {
    it('documents: user with only WEEKEND tasks on weekday', () => {
      // User has only WEEKEND tasks, dailyTarget=1
      // On Monday: scheduledCount = 0
      // This day should be SKIPPED, not counted as success or failure
      // isDaySuccessful returns false, but caller must check scheduledCount first
      expect(isDaySuccessful(0, 0, 1)).toBe(false)
    })
  })
})
