---
phase: 04
plan: 01
subsystem: celebrations
tags: [confetti, haptics, state-management, hooks]

requires:
  - 03-03-canvas-confetti
  - 03-02-haptics

provides:
  - all-tasks-done-celebration
  - usePrevious-hook

affects:
  - 04-02-streak-display

tech-stack:
  added: []
  patterns: [state-transition-detection, derived-state]

decisions:
  - usePrevious-hook-for-transition-detection
  - page-level-celebration-trigger

key-files:
  created:
    - src/lib/hooks.ts
  modified:
    - src/app/(main)/vandaag/page.tsx

metrics:
  duration: 9m
  completed: 2026-01-17
---

# Phase 04 Plan 01: All Tasks Done Celebration Summary

**One-liner:** Large confetti explosion + haptic feedback fires when user completes the last remaining task for the day

## What Was Built

Implemented milestone celebration for completing all daily tasks using existing confetti and haptics infrastructure from Phase 3.

**Key Features:**
- `usePrevious` hook for tracking state transitions
- Detection logic for incomplete → all-complete transition
- Large confetti burst (80 particles, 100° spread) from screen center
- Success haptic pattern accompanies celebration
- Prevents celebration on page load with complete data
- Only fires on actual transition, not static state

## How It Works

**usePrevious Hook (`src/lib/hooks.ts`):**
- Generic `usePrevious<T>(value: T)` utility hook
- Uses `useRef` to store current and previous values
- Returns `undefined` on first render
- Updates previous value when current value changes
- Standard React pattern for state transition detection

**Celebration Trigger Logic (`vandaag/page.tsx`):**
```typescript
// Track previous completedCount
const prevCompletedCount = usePrevious(data?.completedCount)

// Derive celebration condition
const allTasksComplete = data && data.totalCount > 0 && data.completedCount === data.totalCount
const justCompletedAll = allTasksComplete &&
  prevCompletedCount !== undefined &&
  prevCompletedCount < data.totalCount

// Fire celebration on transition
useEffect(() => {
  if (justCompletedAll) {
    fireAllTasksConfetti()
    triggerHaptic('success')
  }
}, [justCompletedAll])
```

**Why This Works:**
- `prevCompletedCount !== undefined` prevents firing on page load when data arrives already complete
- `prevCompletedCount < data.totalCount` ensures celebration only on transition from incomplete to complete
- `useEffect` with `justCompletedAll` dependency ensures it runs exactly once per transition
- Page-level detection avoids duplicate triggers from individual task items

## Test Scenarios Verified

✅ **Complete tasks one by one** → Confetti fires only on final task completion
✅ **Refresh page when all complete** → No confetti (prevCompletedCount = undefined)
✅ **Uncheck task, recheck it** → Confetti fires when returning to all-complete
✅ **Complete all tasks from empty** → Confetti fires correctly
✅ **Reduced motion preference** → Respects prefers-reduced-motion via fireAllTasksConfetti

## Decisions Made

**1. usePrevious hook pattern**
- **Decision:** Implement standard React usePrevious pattern with useRef
- **Rationale:** Reliable, well-documented pattern for state transition detection
- **Alternative considered:** Custom state tracking with useState
- **Why chosen:** useRef approach is simpler, no extra renders, standard pattern

**2. Page-level celebration trigger**
- **Decision:** Detect completion transition at page level, not in task items
- **Rationale:** Prevents duplicate triggers, ensures single celebration per transition
- **Alternative considered:** Trigger from handleToggleTask or task items
- **Why chosen:** Derived state approach is cleaner, single source of truth

**3. Transition detection logic**
- **Decision:** Require prevCompletedCount !== undefined and < totalCount
- **Rationale:** Prevents false positives on page load and when unchecking tasks
- **Alternative considered:** Simple allTasksComplete check
- **Why chosen:** Precise transition detection, no unwanted celebrations

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 04-02 (Streak Display):**
- ✅ Celebration infrastructure working
- ✅ usePrevious hook available for future transition detection
- ✅ Pattern established for milestone celebrations

**Blockers:** None

**Tech Debt:** None

## Performance Notes

- `usePrevious` hook: Zero performance impact (useRef doesn't trigger rerenders)
- `useEffect` runs only when `justCompletedAll` changes (rare)
- Confetti is GPU-accelerated via canvas-confetti library
- Haptics are non-blocking, fail silently if unsupported

## Files Changed

**Created:**
- `src/lib/hooks.ts` - usePrevious hook utility (34 lines)

**Modified:**
- `src/app/(main)/vandaag/page.tsx` - Added celebration trigger logic (20 lines)

## Commits

- `3c91375`: feat(04-01): add usePrevious hook utility
- `d21421e`: feat(04-01): add all-tasks celebration trigger
