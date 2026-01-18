---
status: complete
phase: 04-celebrations-and-streaks
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md]
started: 2026-01-18T08:30:00Z
updated: 2026-01-18T08:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. All Tasks Done Celebration
expected: When completing the last remaining task for the day, a large confetti explosion fires from screen center (80 particles, 100° spread). Should NOT fire on earlier task completions.
result: pass

### 2. No Celebration on Page Load
expected: If you refresh the page when all tasks are already complete, NO celebration should fire. The confetti only triggers on the transition from incomplete to all-complete.
result: pass

### 3. Re-celebration on Uncheck/Recheck
expected: If you uncheck a completed task and then recheck it (making all tasks complete again), the celebration SHOULD fire again — it detects the transition each time.
result: pass

### 4. Streak Number Rolling Animation
expected: On the Inzichten (Insights) page, when your streak count increases, the number should "roll" vertically to the new value (digits slide up smoothly over ~500ms). This may require completing tasks on consecutive days to observe.
result: skipped
reason: Streak doesn't change when unchecking/checking tasks on the same day - requires consecutive days to test

### 5. Flame Icon Flickers When Active
expected: On Inzichten page, when current streak is greater than 0, the flame icon next to the streak should flicker with a subtle animation (scale/rotate/opacity changes creating a "living flame" effect).
result: issue
reported: "yes, but it's almost not visible. Should be bolder, more visible in my opinion"
severity: cosmetic

### 6. Flame Icon Static When Inactive
expected: On Inzichten page, when current streak is 0, the flame icon should appear static (gray, no animation).
result: pass

### 7. Reduced Motion Disables Animations
expected: With prefers-reduced-motion enabled (browser DevTools → Rendering → Emulate prefers-reduced-motion: reduce), the streak number should NOT roll and the flame should NOT flicker. Values update instantly without animation.
result: skipped
reason: User couldn't find DevTools option to enable reduced motion

## Summary

total: 7
passed: 4
issues: 1
pending: 0
skipped: 2

## Gaps

- truth: "Flame icon flickers with visible animation when streak is active"
  status: failed
  reason: "User reported: yes, but it's almost not visible. Should be bolder, more visible in my opinion"
  severity: cosmetic
  test: 5
  artifacts: []
  missing: []
