---
phase: 05-polish-consistency
plan: 03
subsystem: ui
tags: [css, tailwind, bug-fix, gap-closure]

# Dependency graph
requires:
  - phase: 05-polish-consistency
    plan: 01
    provides: AnimatedBackground component with floating gradient orbs
provides:
  - Fixed AnimatedBackground with visible orb colors using inline HSL styles
  - Pattern for avoiding Tailwind JIT purging with dynamic styles
affects: [all authenticated pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Inline HSL styles for dynamic theme colors (avoids Tailwind JIT purging)
    - Comments documenting Tailwind color equivalents for maintainability

key-files:
  created: []
  modified:
    - src/components/backgrounds/animated-background.tsx

key-decisions:
  - "Inline HSL styles over Tailwind classes for dynamic color access"
  - "HSL values mapped to Tailwind color palette for consistency"

patterns-established:
  - "Dynamic colors: Use inline HSL styles when colors are selected at runtime"
  - "Tailwind JIT limitation: Cannot detect class names accessed via object properties"

# Metrics
duration: 5min
completed: 2026-01-18
---

# Phase 5 Plan 3: Background Visibility Gap Closure Summary

**Fixed animated background orbs not visible due to Tailwind JIT purging dynamic color classes**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-18T11:00:00Z
- **Completed:** 2026-01-18T11:05:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Fixed Tailwind JIT purging issue by replacing dynamic class names with inline HSL styles
- Background orbs now visible on all authenticated pages
- Theme switching (blue/pink) and dark mode opacity still work correctly
- No runtime or build errors

## Root Cause

Tailwind CSS JIT compiler cannot detect dynamically accessed class names. The original pattern:

```tsx
const orbColors = {
  blue: { orb1: 'bg-blue-400', ... },
}
className={`... ${colors.orb1} ...`}  // Tailwind can't detect 'bg-blue-400'
```

Tailwind's static analysis sees `colors.orb1` but cannot determine it resolves to `'bg-blue-400'`, so all color classes were purged from the production CSS bundle.

## Solution

Replaced Tailwind classes with inline HSL styles that work at runtime:

```tsx
const orbColors = {
  blue: {
    orb1: 'hsl(217, 91%, 60%)',   // blue-400
    ...
  },
}
style={{ backgroundColor: colors.orb1, opacity: baseOpacity }}
```

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace Tailwind color classes with inline HSL styles** - `393ed1e` (fix)

## Files Created/Modified
- `src/components/backgrounds/animated-background.tsx` - Replaced Tailwind bg-* classes with inline HSL backgroundColor styles

## Decisions Made

**1. Inline HSL styles over Tailwind safelist**
- Rationale: Inline styles are self-contained and work without config changes
- Alternative considered: Adding classes to Tailwind safelist - rejected as requires config changes and is less maintainable

**2. HSL values with Tailwind color comments**
- Rationale: Comments like `// blue-400` preserve knowledge of original color mapping
- Benefit: Easy to verify colors match design system

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - fix applied cleanly, build and lint passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Background visibility gap closed
- UAT issue resolved: users now see animated background orbs
- Ready for remaining polish tasks (flame animation, streak calculation)

---
*Phase: 05-polish-consistency*
*Completed: 2026-01-18*
