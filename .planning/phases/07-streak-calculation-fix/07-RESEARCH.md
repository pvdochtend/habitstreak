# Phase 7: Streak Calculation Fix - Research

**Researched:** 2026-01-19
**Domain:** Streak algorithm logic, unit testing
**Confidence:** HIGH

## Summary

The streak calculation bug is a straightforward logic error: the `isSuccessful` check compares `completedCount >= dailyTarget` without accounting for days where fewer tasks are scheduled than the daily target. The fix is well-understood: use `effectiveTarget = min(dailyTarget, scheduledCount)` instead of raw `dailyTarget`.

The bug appears in **four locations** (not two as originally stated), and one of those locations is already correctly accounting for `scheduledCount` in its data structure but not in its `isSuccessful` calculation. The fix is purely algorithmic with no library dependencies.

**Primary recommendation:** Extract the `effectiveTarget` calculation into a reusable pure function, apply it consistently across all four affected locations, and add comprehensive unit tests for the pure logic.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | existing | Unit testing | Already configured in project |
| TypeScript | existing | Type safety | Already configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | - | No new libraries needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| N/A | - | This is pure logic fix, no library decisions |

**Installation:**
```bash
# No new dependencies required
```

## Architecture Patterns

### Recommended Approach: Extract Pure Function

Extract the success determination logic into a pure, testable function:

```typescript
// src/lib/streak.ts (new function)

/**
 * Determine if a day is successful based on completed and scheduled counts.
 * A day is successful when:
 * - completedCount >= effectiveTarget
 * - effectiveTarget = min(dailyTarget, scheduledCount)
 *
 * This ensures users can succeed even when fewer tasks are scheduled
 * than their daily target (e.g., weekends with only ALL_WEEK tasks).
 */
export function isDaySuccessful(
  completedCount: number,
  scheduledCount: number,
  dailyTarget: number
): boolean {
  // If no tasks scheduled, day doesn't count (neither success nor failure)
  if (scheduledCount === 0) {
    return false // Or handle separately - caller should skip these days
  }

  const effectiveTarget = Math.min(dailyTarget, scheduledCount)
  return completedCount >= effectiveTarget
}
```

### Apply Consistently Across All Locations

The same logic must be applied in all four locations:

1. **`src/lib/streak.ts:81`** - `calculateCurrentStreak()` line 81
2. **`src/lib/streak.ts:176`** - `calculateBestStreak()` line 176
3. **`src/app/api/insights/route.ts:80`** - dayInsights `isSuccessful`
4. **`src/app/api/today/route.ts:65`** - today's `isSuccessful`

### Project Structure (No Changes)
```
src/
├── lib/
│   └── streak.ts        # Add isDaySuccessful() function, update both calculate functions
├── app/api/
│   ├── insights/route.ts  # Import and use isDaySuccessful
│   └── today/route.ts     # Import and use isDaySuccessful
tests/
└── unit/
    └── streak.test.ts     # NEW: comprehensive streak tests
```

### Pattern: Centralize Success Logic

**What:** Define success determination in ONE place, import everywhere
**When to use:** When the same business rule is computed in multiple locations
**Example:**
```typescript
// BEFORE: Duplicated, inconsistent logic
// streak.ts
const isSuccessful = completedCount >= dailyTarget

// insights/route.ts
isSuccessful: completedCount >= dailyTarget

// today/route.ts
isSuccessful: completedCount >= dailyTarget

// AFTER: Single source of truth
// streak.ts
export function isDaySuccessful(completedCount, scheduledCount, dailyTarget) { ... }

// All other files
import { isDaySuccessful } from '@/lib/streak'
isSuccessful: isDaySuccessful(completedCount, scheduledCount, dailyTarget)
```

### Anti-Patterns to Avoid

- **Inline Fix Without Extraction:** Don't just change `completedCount >= dailyTarget` to `completedCount >= Math.min(dailyTarget, scheduledCount)` in each location. Extract to a function for testability and consistency.

- **Fixing Only Two Locations:** The bug exists in four places. Don't fix just the streak functions and forget the API routes.

- **Testing Integration Instead of Unit:** Don't rely only on E2E tests. The logic is pure and should be unit tested.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date manipulation | Custom date math | `date-fns` / existing `dates.ts` | Already in project, handles timezone correctly |
| Schedule checking | Inline day-of-week logic | `isTaskScheduledForDate()` | Already correct, well-tested |

**Key insight:** The existing schedule logic is correct. The bug is only in the success determination formula, not in the scheduling.

## Common Pitfalls

### Pitfall 1: Forgetting scheduledCount === 0 Days

**What goes wrong:** The effectiveTarget formula `min(dailyTarget, 0) = 0` would make ANY day with no scheduled tasks "successful" if you just check `completedCount >= 0`.

**Why it happens:** Focus on the `min()` fix without considering the edge case.

**How to avoid:** Days with `scheduledCount === 0` should be skipped entirely (neither success nor failure). The existing code already does this with `continue` statements in streak functions.

**Warning signs:** Test case "0 tasks scheduled, 0 completed" incorrectly passes as successful.

### Pitfall 2: Inconsistent Fix Across Locations

**What goes wrong:** Fixing streak calculation but not the insights API `isSuccessful` field, leading to UI showing "goal achieved" inconsistently with streak calculation.

**Why it happens:** Not grepping for all uses of `completedCount >= dailyTarget`.

**How to avoid:** Use centralized function imported in all four locations.

**Warning signs:** Streak count doesn't match number of days marked successful in insights.

### Pitfall 3: Testing Only Happy Path

**What goes wrong:** Tests pass with ALL_WEEK tasks, but WORKWEEK-only scenarios still fail.

**Why it happens:** Writing tests for what you fixed, not for what could break.

**How to avoid:** Enumerate all schedule preset combinations in tests (see Code Examples below).

**Warning signs:** Manual testing reveals edge cases not in unit tests.

### Pitfall 4: Changing Best Streak Logic Differently

**What goes wrong:** `calculateBestStreak` iterates from first check-in to last, and uses ALL tasks (including inactive). Current streak only uses active tasks. This is intentional but can cause confusion.

**Why it happens:** Not understanding the different semantics of current vs best streak.

**How to avoid:** Review existing code comments. Best streak is "all-time best" and should include inactive tasks. Current streak is "current active tasks."

**Warning signs:** Changing best streak to only consider active tasks (wrong).

### Pitfall 5: Forgetting Type Comment Updates

**What goes wrong:** `src/types/index.ts` has a comment `isSuccessful: boolean // completedCount >= dailyTarget` that will be misleading after the fix.

**Why it happens:** Comments are easy to forget when changing logic.

**How to avoid:** Update the type comment to reflect new logic.

**Warning signs:** Comments don't match implementation.

## Code Examples

### Core Success Function

```typescript
// src/lib/streak.ts

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
```

### Updated calculateCurrentStreak (lines 74-89)

```typescript
// Replace lines 74-89 in calculateCurrentStreak()

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
```

### Updated calculateBestStreak (lines 169-184)

```typescript
// Replace lines 169-184 in calculateBestStreak()

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
```

### Updated Insights Route (line 80)

```typescript
// src/app/api/insights/route.ts
import { isDaySuccessful } from '@/lib/streak'

// In the dayInsights map, change line 80:
isSuccessful: isDaySuccessful(completedCount, scheduledCount, dailyTarget),
```

### Updated Today Route (line 65)

```typescript
// src/app/api/today/route.ts
import { isDaySuccessful } from '@/lib/streak'

// Line 65, note that totalCount IS scheduledCount for today:
isSuccessful: isDaySuccessful(completedCount, totalCount, dailyTarget),
```

### Comprehensive Unit Tests

```typescript
// tests/unit/streak.test.ts
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
```

### Type Comment Update

```typescript
// src/types/index.ts line 82
export interface DayInsight {
  date: string // YYYY-MM-DD
  completedCount: number
  scheduledCount: number
  isSuccessful: boolean // completedCount >= min(dailyTarget, scheduledCount)
}
```

## State of the Art (current year)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `completedCount >= dailyTarget` | `completedCount >= min(dailyTarget, scheduledCount)` | This phase | Correct behavior for variable scheduled counts |

**New tools/patterns to consider:**
- None - this is a bug fix, not a feature change

**Deprecated/outdated:**
- The current implementation is buggy, not deprecated

## Open Questions

Things that couldn't be fully resolved:

1. **Should `isSuccessful` be computed client-side?**
   - What we know: Currently computed server-side in 4 locations
   - What's unclear: Would client computation reduce API complexity?
   - Recommendation: Keep server-side - the logic belongs with streak calculation, and client already receives `scheduledCount` and `dailyTarget` if needed. Consistency matters more than optimization here.

2. **Should we add effectiveTarget to API responses?**
   - What we know: UI currently shows `completedCount / dailyTarget`
   - What's unclear: Should it show `completedCount / effectiveTarget` on low-scheduled days?
   - Recommendation: Out of scope for this phase. Current UI is fine. If needed, can add `effectiveTarget` to API response in future.

## Sources

### Primary (HIGH confidence)
- Direct code analysis of `src/lib/streak.ts`
- Direct code analysis of `src/app/api/insights/route.ts`
- Direct code analysis of `src/app/api/today/route.ts`
- Existing test patterns from `tests/unit/schedule.test.ts`, `tests/unit/dates.test.ts`

### Secondary (MEDIUM confidence)
- N/A - all findings based on direct code review

### Tertiary (LOW confidence)
- N/A

## Metadata

**Confidence breakdown:**
- Algorithm fix: HIGH - direct code analysis confirms the bug and solution
- Affected locations: HIGH - grep confirms exactly 4 locations with same pattern
- Test approach: HIGH - existing test patterns in project provide clear template
- Edge cases: HIGH - exhaustively enumerated from schedule preset combinations

**Research date:** 2026-01-19
**Valid until:** N/A - this is a one-time bug fix, research doesn't expire
