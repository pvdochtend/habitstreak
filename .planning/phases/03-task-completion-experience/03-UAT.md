---
status: diagnosed
phase: 03-task-completion-experience
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-01-17T12:00:00Z
updated: 2026-01-17T12:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Checkmark Draw Animation
expected: When completing a task, the checkmark draws in with a smooth stroke animation (not just appearing instantly). The checkmark should "draw" from start to end over ~350ms.
result: pass

### 2. Checkbox Fill with Spring Bounce
expected: When completing a task, the checkbox background fills with a spring bounce effect (scales up slightly past 100% then settles). Creates a satisfying "pop" feeling.
result: issue
reported: "no. The animation is not working fast. But that has probably something to do that the data must be put in the database first, reloaded and then it's displayed"
severity: major

### 3. Task Row Background Transition
expected: When completing a task, the task row has a subtle background color transition (slight color change that fades). Not distracting, just a gentle visual confirmation.
result: issue
reported: "not really"
severity: major

### 4. Animation Sequence Timing
expected: Animations play in sequence: checkbox fills first, then checkmark draws, then background transitions. They should feel coordinated, not chaotic.
result: issue
reported: "It's happening but very shocking.. The fill of the checkbox and the checkmark looks ok. Then indeed the background transitions. so these three are happening"
severity: minor

### 5. Particle Burst on Completion
expected: When completing a task, small particles burst outward from the checkbox in all directions (360° spread). Mix of circles and squares, varying sizes.
result: pass

### 6. Haptic Feedback on Mobile
expected: On a mobile device with vibration support, completing a task triggers a short vibration pattern (quick pulse). Skip if testing on desktop.
result: skipped
reason: Requires Android + Chrome to test (Vibration API not available on desktop/iOS)

### 7. Reduced Motion Preference
expected: With prefers-reduced-motion enabled (browser DevTools → Rendering → Emulate prefers-reduced-motion: reduce), completing a task should NOT show animations or particles. Just the state change.
result: skipped
reason: User requested skip

### 8. Uncomplete Does Not Celebrate
expected: Tapping a completed task to uncomplete it should NOT trigger celebration effects (no particles, no special animations). Only completing triggers celebrations.
result: pass

## Summary

total: 8
passed: 4
issues: 3
pending: 0
skipped: 2

## Gaps

- truth: "Checkbox fills with spring bounce effect immediately on tap"
  status: failed
  reason: "User reported: animation is not working fast. Data must be put in the database first, reloaded and then it's displayed"
  severity: major
  test: 2
  root_cause: "No optimistic UI - task.isCompleted comes from parent props (server state), not local state. Checkbox visual state (checkmark, bg-primary) only updates after API call completes. isAnimating triggers animation classes but the actual visual content waits for props update."
  artifacts:
    - path: "src/components/tasks/today-task-item.tsx"
      issue: "Uses task.isCompleted from props for visual state instead of optimistic local state"
  missing:
    - "Add optimistic local state (e.g., localIsCompleted) that flips immediately on click"
    - "Use localIsCompleted for visual rendering, sync with task.isCompleted on prop change"

- truth: "Task row has subtle background color transition on completion"
  status: failed
  reason: "User reported: not really"
  severity: major
  test: 3
  root_cause: "animate-task-complete animation runs but competes with conditional bg-card/bg-primary/5 classes. The animation keyframes animate FROM card color but the button already has conditional classes setting background. Animation effect is overridden by static classes."
  artifacts:
    - path: "src/components/tasks/today-task-item.tsx"
      issue: "Button has bg-card/bg-primary/5 conditional classes that override animation"
    - path: "src/app/globals.css"
      issue: "taskComplete animation may need !important or different approach"
  missing:
    - "Restructure background handling so animation isn't overridden by conditional classes"
    - "Consider using CSS custom property transition instead of keyframe animation"

- truth: "Animation sequence feels coordinated and smooth, not jarring"
  status: failed
  reason: "User reported: It's happening but very shocking"
  severity: minor
  test: 4
  root_cause: "Disconnect between optimistic animations (particles, haptics fire immediately) and visual state (checkbox/checkmark wait for API). User sees celebration effects before the checkbox visually completes, creating cognitive dissonance. Also, spring bounce cubic-bezier(0.34, 1.56, 0.64, 1) may be too aggressive."
  artifacts:
    - path: "src/components/tasks/today-task-item.tsx"
      issue: "Timing mismatch - celebrations fire optimistically but checkbox waits for API"
    - path: "src/app/globals.css"
      issue: "checkboxFill spring easing may be too bouncy"
  missing:
    - "Align all visual feedback to optimistic state (same root cause as test 2)"
    - "Consider softening spring easing from 1.56 overshoot to 1.2-1.3"
