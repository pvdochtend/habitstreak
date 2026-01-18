# Feature Research: Streak Calculation

**Domain:** Habit Tracking - Streak Calculation with Variable Schedules
**Researched:** 2026-01-18
**Confidence:** HIGH

## Executive Summary

Streak calculation in habit tracking apps follows two main paradigms: **hard streaks** (consecutive completions, reset on miss) and **soft scores** (weighted algorithms, gradual decay). For HabitStreak's bug (weekends with weekday-only tasks incorrectly affecting streaks), the industry-standard solution is clear: **days with no scheduled tasks should be transparent to streak calculation** - they neither break nor extend the streak.

The current HabitStreak implementation already attempts this (lines 76-78 in `streak.ts` use `continue` for days with `scheduledCount === 0`), but there may be edge cases or a bug in how the algorithm handles the dailyTarget comparison when no tasks are scheduled.

**Primary recommendation:** Days with zero scheduled tasks should be skipped entirely in streak calculation. A day is only evaluated for streak purposes if `scheduledCount > 0`.

## Streak Calculation Best Practices

### Core Algorithm Patterns

Leading habit apps use one of two approaches:

| Approach | How It Works | Apps Using It | Pros | Cons |
|----------|--------------|---------------|------|------|
| **Hard Streak** | Count consecutive successful days; any miss resets to 0 | Duolingo, Habitica, Streaks (iOS) | Simple to understand, strong motivation | Punishing, can demoralize after long streaks |
| **Soft Score** | Exponential smoothing; misses reduce score gradually | Loop Habit Tracker | Forgiving, psychologically healthier | Less intuitive, harder to gamify |

**For HabitStreak's use case** (dailyTarget-based success), the hard streak approach is appropriate but must correctly handle schedule variations.

### Industry Standard: Skip Non-Scheduled Days

According to Habitica documentation (HIGH confidence):
> "If a Daily is not scheduled on a particular day...then you do _not_ lose the streak."

According to HabitBoard (MEDIUM confidence):
> "Skipping days don't break the streak" - automatic skip days for habits not planned daily.

**Consensus:** Non-scheduled days are transparent to streak calculation. They do not:
- Break an existing streak
- Extend an existing streak
- Count toward or against daily targets

### The "Successful Day" Definition

For apps with daily targets (like HabitStreak):

```
isSuccessful(date) =
  IF scheduledCount(date) == 0:
    SKIP (do not evaluate this day)
  ELSE:
    completedCount(date) >= dailyTarget
```

**Critical insight:** The condition `scheduledCount === 0` means "this day is not relevant to habit tracking" - it should be completely ignored when walking through dates.

## Handling Variable Schedules

| Schedule Type | Streak Behavior | Implementation |
|---------------|-----------------|----------------|
| **ALL_WEEK** | Every day evaluated | Standard streak logic |
| **WORKWEEK** | Mon-Fri evaluated, Sat-Sun skipped | Skip days where no tasks scheduled |
| **WEEKEND** | Sat-Sun evaluated, Mon-Fri skipped | Skip days where no tasks scheduled |
| **CUSTOM** | Only selected days evaluated | Skip days not in daysOfWeek array |
| **Mixed** (multiple tasks, different schedules) | Days with ANY scheduled task are evaluated | `scheduledCount > 0` determines evaluation |

### Algorithm Pseudocode (Correct Implementation)

```typescript
function calculateCurrentStreak(userId: string): number {
  const dailyTarget = user.dailyTarget
  const tasks = getActiveTasks(userId)

  let streak = 0

  // Walk backwards from today
  for (const date of datesFromTodayBackwards) {
    const scheduledCount = countScheduledTasks(tasks, date)
    const completedCount = countCompletedTasks(userId, date)

    // KEY: Skip days with no scheduled tasks entirely
    if (scheduledCount === 0) {
      continue  // This day doesn't exist for streak purposes
    }

    // Evaluate success against daily target
    if (completedCount >= dailyTarget) {
      streak++
    } else {
      break  // Streak broken
    }
  }

  return streak
}
```

### Edge Case: dailyTarget vs scheduledCount

**Potential bug identified:** If `dailyTarget = 3` but only 2 tasks are scheduled on a WORKWEEK Saturday (which has 0 scheduled tasks), what happens?

Current logic: `completedCount >= dailyTarget` is evaluated after checking `scheduledCount === 0`.

**But consider:** What if user has:
- 5 tasks total (3 WORKWEEK, 2 ALL_WEEK)
- dailyTarget = 3
- It's Saturday

Saturday has 2 scheduled tasks (the ALL_WEEK ones). User completes both. Is Saturday successful?
- `scheduledCount = 2` (not 0, so day is evaluated)
- `completedCount = 2`
- `dailyTarget = 3`
- `2 >= 3` is FALSE -> streak broken!

**This may be the bug.** User completed all scheduled tasks but still failed because dailyTarget exceeds scheduledCount.

## Edge Cases

| Edge Case | Recommended Behavior | Rationale |
|-----------|---------------------|-----------|
| **No scheduled tasks today** | Skip day entirely | Day is irrelevant to habit tracking; neither helps nor hurts |
| **scheduledCount < dailyTarget** | SUCCESS if completedCount == scheduledCount | User completed everything available; shouldn't be penalized |
| **Schedule changes mid-streak** | Use current schedule going forward, historical data uses historical schedule | Prevents retroactive streak breaks |
| **Task deleted mid-streak** | Historical check-ins remain valid | Completed work should count |
| **Task added mid-streak** | Only affects future days | No retroactive requirements |
| **Timezone: user travels** | Use configured timezone (Europe/Amsterdam for HabitStreak) | Consistency over accuracy |
| **Midnight boundary** | Optional: grace period (3-6 hours) | Prevents losing streaks from being minutes late |
| **DST transitions** | Use timezone-aware date library | 23/25 hour days can break naive date math |

### Schedule Changes Mid-Streak

**Recommended approach:** Calculate streak using task schedules as they were when completions occurred.

However, this requires storing historical schedule data, which adds complexity. A simpler approach:
- Use current task schedules for all calculations
- Accept that changing a task from WORKWEEK to ALL_WEEK might retroactively add "missed" days
- Document this behavior to users

**Habitica's approach:** Users can manually adjust streaks to account for schedule changes.

### dailyTarget Edge Case: Recommended Fix

```typescript
// Current (potentially buggy)
const isSuccessful = completedCount >= dailyTarget

// Recommended fix
const effectiveTarget = Math.min(dailyTarget, scheduledCount)
const isSuccessful = completedCount >= effectiveTarget
```

This ensures users aren't penalized when fewer tasks are scheduled than their daily target.

## Competitor Analysis

| App | Streak Approach | Schedule Handling | Notable Feature |
|-----|-----------------|-------------------|-----------------|
| **Habitica** | Hard streak per task | Non-scheduled days preserve streak | Manual streak adjustment, freeze skills |
| **Streaks (iOS)** | Hard streak, flexible frequency | "X times per week" - doesn't require specific days | Apple Health integration |
| **Loop Habit Tracker** | Soft score (exponential smoothing) | Frequency-based (3x/week) | Score doesn't crash from occasional misses |
| **Duolingo** | Hard streak, daily only | No variable schedules | Streak freeze (proactive protection) |
| **HabitBoard** | Hard streak with skip feature | Automatic skip days for non-daily habits | Manual skip preserves streak |

### Key Insights from Competitors

1. **Habitica (HIGH confidence):** "A Daily that is not due can be completed to earn the usual rewards, but if it is not completed, it does not cause damage and does not lose its streak."

2. **Loop Habit Tracker (HIGH confidence):** Uses exponential smoothing formula `pow(0.5, frequency / 13.0)` - but this is for habit "strength" not traditional streaks. Non-daily habits are evaluated against their prescribed frequency.

3. **Duolingo (MEDIUM confidence):** Simple daily streak with streak freeze items. No variable schedules - every day requires completion.

4. **HabitBoard (MEDIUM confidence):** Allows manual skip via long-press, which preserves streak. Also supports automatic skip days for habits with weekly goals.

## Algorithm Recommendation for HabitStreak

### Recommended Changes

1. **Fix the dailyTarget edge case:**
   ```typescript
   // In calculateCurrentStreak and calculateBestStreak
   const effectiveTarget = Math.min(dailyTarget, scheduledCount)
   const isSuccessful = completedCount >= effectiveTarget
   ```

2. **Keep the skip logic for zero scheduled tasks:**
   ```typescript
   if (scheduledCount === 0) {
     continue  // Already correct
   }
   ```

3. **Consider adding streak freeze feature (future):**
   - Schema already has `streakFreezes` field
   - Proactive (must be purchased/earned before miss)
   - Automatically consumed on first eligible miss

### Full Corrected Algorithm

```typescript
export async function calculateCurrentStreak(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyTarget: true },
  })
  if (!user) return 0

  const dailyTarget = user.dailyTarget
  const today = getTodayInAmsterdam()

  const tasks = await prisma.task.findMany({
    where: { userId, isActive: true },
    select: { id: true, schedulePreset: true, daysOfWeek: true },
  })

  const last365Days = getLastNDays(365)
  const checkIns = await prisma.checkIn.findMany({
    where: { userId, date: { in: last365Days } },
    select: { date: true, taskId: true },
  })

  const completedByDate = new Map<string, number>()
  for (const checkIn of checkIns) {
    completedByDate.set(checkIn.date, (completedByDate.get(checkIn.date) || 0) + 1)
  }

  let streak = 0
  for (let i = 0; i < last365Days.length; i++) {
    const date = last365Days[last365Days.length - 1 - i]

    const scheduledCount = tasks.filter((task) =>
      isTaskScheduledForDate(task.schedulePreset, task.daysOfWeek, date)
    ).length

    // Skip days with no scheduled tasks
    if (scheduledCount === 0) {
      continue
    }

    const completedCount = completedByDate.get(date) || 0

    // FIX: Use effective target (can't require more than scheduled)
    const effectiveTarget = Math.min(dailyTarget, scheduledCount)
    const isSuccessful = completedCount >= effectiveTarget

    if (isSuccessful) {
      streak++
    } else {
      break
    }
  }

  return streak
}
```

### Why This Fix Works

| Scenario | Before Fix | After Fix |
|----------|------------|-----------|
| Saturday, 2 ALL_WEEK tasks, dailyTarget=3, completed=2 | FAIL (2 < 3) | SUCCESS (2 >= min(3,2)=2) |
| Saturday, 0 tasks scheduled, dailyTarget=3 | SKIP | SKIP (unchanged) |
| Monday, 5 tasks scheduled, dailyTarget=3, completed=3 | SUCCESS | SUCCESS (unchanged) |
| Monday, 5 tasks scheduled, dailyTarget=3, completed=2 | FAIL | FAIL (unchanged) |

## Alternative Approaches Considered

### 1. Soft Score (Loop-style)

**Pros:** More forgiving, psychologically healthier
**Cons:** Harder to understand, different user mental model

**Not recommended** because HabitStreak's existing UI and user expectations are built around traditional streaks.

### 2. Per-Task Streaks (Habitica-style)

**Pros:** More granular tracking
**Cons:** Major architecture change, different product concept

**Not recommended** for this bug fix; could be future feature.

### 3. Percentage-Based Success

Instead of `completedCount >= target`, use `completedCount / scheduledCount >= percentage`.

**Not recommended** because it changes the meaning of dailyTarget and existing user expectations.

## Open Questions

1. **Historical schedule changes:** Should we store task schedule history to accurately calculate streaks when schedules change?
   - Current recommendation: Use current schedules; document behavior.
   - Higher-effort alternative: Store schedule snapshots.

2. **Streak freeze implementation:** When should streak freezes be consumed?
   - Duolingo: Automatically at end of day
   - Habitica: Via character skills
   - Recommendation: Automatic consumption, document in settings

3. **Grace period:** Should completions shortly after midnight count for previous day?
   - Industry practice: 3-6 hour grace period is common
   - Current HabitStreak: Strict midnight cutoff
   - Recommendation: Keep strict for simplicity; consider as future enhancement

## Sources

### Primary (HIGH confidence)
- [Habitica Wiki - Streaks](https://habitica.fandom.com/wiki/Streaks) - Detailed streak mechanics
- [Habitica Wiki - Dailies](https://habitica.fandom.com/wiki/Dailies) - Schedule handling rules
- [Loop Habit Tracker GitHub](https://github.com/iSoron/uhabits) - Algorithm source code
- [Loop Habit Tracker FAQ](https://github.com/iSoron/uhabits/discussions/689) - Score calculation details

### Secondary (MEDIUM confidence)
- [Trophy - How to Build a Streaks Feature](https://trophy.so/blog/how-to-build-a-streaks-feature) - Implementation guide
- [HabitBoard - Streaks and Personal Agency](https://habitboard.app/streaks/) - Skip day philosophy
- [Duolingo Wiki - Streak](https://duolingo.fandom.com/wiki/Streak) - Freeze mechanics
- [Zapier - Best Habit Tracker Apps 2025](https://zapier.com/blog/best-habit-tracker-app/) - Industry overview

### Tertiary (LOW confidence)
- Various app store descriptions and marketing pages

## Metadata

**Confidence breakdown:**
- Skip non-scheduled days: HIGH - Verified across multiple authoritative sources (Habitica docs, Loop implementation)
- dailyTarget edge case fix: HIGH - Logical analysis of code + industry patterns
- Streak freeze patterns: MEDIUM - Based on Duolingo/Habitica but implementation varies
- Schedule change handling: LOW - Limited authoritative sources; recommendations based on general principles

**Research date:** 2026-01-18
**Valid until:** ~60 days (streak calculation patterns are stable; no major paradigm shifts expected)
