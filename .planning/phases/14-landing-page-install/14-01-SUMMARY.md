---
phase: 14-landing-page-install
plan: 01
subsystem: ui
tags: [pwa, install-banner, ios-walkthrough, landing-page, mobile]

# Dependency graph
requires:
  - phase: 13-install-infrastructure
    provides: PwaInstallProvider context with canInstall, platform, dismiss, triggerInstall
provides:
  - InstallBanner component with platform-specific CTAs
  - IosWalkthroughModal with 3-step Dutch instructions
  - IosShareIcon SVG component
  - Landing page PWA install experience
affects: [15-in-app-install]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Delayed animation with animationDelay inline style"
    - "Platform-specific UI rendering (iOS vs Chromium)"
    - "Walkthrough step component pattern"

key-files:
  created:
    - src/components/pwa/share-icon.tsx
    - src/components/pwa/ios-walkthrough-modal.tsx
    - src/components/pwa/install-banner.tsx
  modified:
    - src/app/page.tsx

key-decisions:
  - "Screen reader only dismiss text on mobile (sr-only sm:not-sr-only)"
  - "2.5s animation delay using inline style instead of custom animation class"
  - "WalkthroughStep internal component for consistent step styling"

patterns-established:
  - "PWA component directory: src/components/pwa/ for install-related UI"
  - "Modal walkthrough pattern: numbered steps with icons and bold keywords"

# Metrics
duration: ~15min
completed: 2026-01-29
---

# Phase 14 Plan 01: Landing Page Install Banner Summary

**PWA install banner with iOS walkthrough modal, platform-specific CTAs, and 2.5s delayed slide-up animation on landing page**

## Performance

- **Duration:** ~15 min (across two agent sessions with checkpoint)
- **Started:** 2026-01-29
- **Completed:** 2026-01-29
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 4

## Accomplishments

- InstallBanner fixed bottom component with glass-subtle styling and slide-up animation
- Platform detection showing "Zo werkt het" on iOS and "Installeren" on Chromium
- IosWalkthroughModal with 3-step Dutch instructions and recognizable icons
- Landing page integration for first-time visitor install discovery

## Task Commits

Each task was committed atomically:

1. **Task 1: Create iOS Walkthrough Modal Components** - `2d42c0d` (feat)
2. **Task 2: Create InstallBanner and Integrate in Landing Page** - `51fc50a` (feat)
3. **Task 3: Human verification checkpoint** - Approved (no commit)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/components/pwa/share-icon.tsx` - iOS SF Symbols share icon SVG
- `src/components/pwa/ios-walkthrough-modal.tsx` - 3-step iOS Add to Home Screen walkthrough
- `src/components/pwa/install-banner.tsx` - Fixed bottom install banner with platform detection
- `src/app/page.tsx` - Landing page with InstallBanner integration

## Decisions Made

- **Screen reader dismiss text:** "Niet nu" text hidden on mobile (sr-only sm:not-sr-only) to save space while keeping X icon visible
- **Animation delay approach:** Used inline style `{ animationDelay: '2.5s', animationFillMode: 'backwards' }` rather than creating new Tailwind animation class
- **Component organization:** Created WalkthroughStep internal component for consistent step rendering with numbered badge, icon, and text

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Desktop Chrome install button:** Banner doesn't appear on desktop Chrome because there's no service worker (beforeinstallprompt doesn't fire). This is expected behavior - a todo was already captured in Phase 13 for adding the service worker later. iOS Safari detection works correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Landing page install experience complete
- Phase 15 can now build in-app install prompt and settings page button
- Service worker addition (captured todo) will enable full Chromium install flow

---
*Phase: 14-landing-page-install*
*Completed: 2026-01-29*
