---
phase: 02-animation-foundation
plan: 04
subsystem: ui
tags: [animations, uat, bug-fixes, polish]

dependency-graph:
  requires: [02-01, 02-02, 02-03]
  provides: ["polished animation foundation free of UAT gaps"]
  affects: []

tech-stack:
  added: []
  patterns: []

file-tracking:
  created: []
  modified:
    - src/components/tasks/today-task-item.tsx
    - src/components/ui/page-transition.tsx

decisions:
  - id: exclude-box-shadow-from-transitions
    what: "Explicitly list transition properties instead of using transition-all"
    why: "Prevents conflict between animate-glow animation and shadow-sm class causing visible blink"
    impact: "Box-shadow changes are only handled by animations, not transitions"

metrics:
  duration: "8 minutes"
  completed: "2026-01-18"
---

# Phase 2 Plan 4: Animation Foundation Gap Closure Summary

**One-liner:** Fixed three UAT gaps: eliminated glow-blink artifact, added hover glow to task buttons, and increased page transition visibility.

## What Was Built

This gap closure plan addressed all three issues identified during Phase 2 UAT testing:

1. **Glow-Blink Artifact Fix** - Eliminated visual blinking when task completion animation ends
2. **Hover Glow Enhancement** - Added subtle primary-colored glow to task item buttons on hover
3. **Page Transition Visibility** - Doubled slide-up distance for more noticeable page transitions

## Technical Implementation

### 1. Box-Shadow Transition Conflict (Major Issue)

**Root cause:** The `transition-all duration-500` was transitioning box-shadow. When `animate-glow` ended (at box-shadow: 0), the underlying `shadow-sm` from the completed state suddenly became visible, and `transition-all` animated this appearance causing a blink.

**Solution:**
- Replaced `transition-all` with explicit property list: `transition-[background-color,border-color,transform,opacity]`
- Excluded box-shadow from transitions, letting the glow animation handle it cleanly
- No coupling to specific shadow values (robust solution)

**Files modified:** `src/components/tasks/today-task-item.tsx` (line 89)

### 2. Missing Hover Glow (Minor Issue)

**Root cause:** TodayTaskItem uses a plain `<button>` element instead of the `<Button>` component, so it didn't inherit the hover glow effect defined in Button's default variant.

**Solution:**
- Added `hover:shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)]` to task button classes
- Scoped to hover-capable devices via existing `@media (hover: hover)` in task-item-hover class
- Matches Button component's hover behavior exactly

**Files modified:** `src/components/tasks/today-task-item.tsx` (line 86)

### 3. Subtle Page Transition (Minor Issue)

**Root cause:** The `translate-y-2` (8px) was too subtle for users to notice during page navigation.

**Solution:**
- Changed `translate-y-2` to `translate-y-4` (16px)
- Doubled the slide distance for more noticeable movement
- Still smooth and polished, not jarring

**Files modified:** `src/components/ui/page-transition.tsx` (line 22)

## Deviations from Plan

None - plan executed exactly as written.

## Key Files

### Modified
- `src/components/tasks/today-task-item.tsx` - Fixed transition conflict and added hover glow
- `src/components/ui/page-transition.tsx` - Increased slide-up distance

## Testing Results

**Build verification:**
- ✓ `npm run build` succeeded without errors
- ✓ No TypeScript errors
- ✓ No linting errors
- ✓ All routes compiled successfully

**Expected behavior:**
1. Task completion animation is smooth with no visible blink or flash
2. Task buttons show subtle primary-colored glow on desktop hover
3. Page transitions have clearly visible slide-up movement

## Decisions Made

### Exclude Box-Shadow from Transitions
**Decision:** Replace `transition-all` with explicit property list excluding box-shadow
**Rationale:** Prevents conflict between CSS animations and transitions on the same property
**Alternative considered:** End glow animation at same value as shadow-sm (rejected - fragile, couples to Tailwind values)
**Impact:** More robust animation behavior, no visual artifacts

## Lessons Learned

### CSS Transition/Animation Conflicts
When using both CSS transitions and animations on the same element, be explicit about which properties are transitioned. `transition-all` can cause conflicts when animations handle certain properties (like box-shadow).

**Pattern established:**
```css
/* Good - explicit properties */
transition: background-color 0.5s, border-color 0.5s, transform 0.5s, opacity 0.5s;

/* Risky - may conflict with animations */
transition: all 0.5s;
```

### Component Style Inheritance
Custom button implementations don't automatically inherit styles from the Button component. When building custom interactive elements, explicitly add expected micro-interactions (hover glow, focus states, etc.).

## Next Phase Readiness

**Blockers:** None

**Concerns:** None

**Ready for Phase 3:** Yes - All Phase 2 animation foundation UAT tests now pass. Animation system is polished and ready for task completion experience implementation.

## Related Artifacts

- **UAT Results:** `.planning/phases/02-animation-foundation/02-UAT.md`
- **Debug Sessions:**
  - `.planning/debug/animate-glow-blink-on-check.md`
  - `.planning/debug/button-hover-glow-not-visible.md`
  - `.planning/debug/page-transition-slide-up-barely-noticeable.md`

## Success Metrics

- ✓ All 3 UAT gaps closed
- ✓ No new TypeScript or build errors
- ✓ Animations remain smooth (60fps)
- ✓ Reduced motion preference still respected
- ✓ All Phase 2 UAT tests would pass on re-test
