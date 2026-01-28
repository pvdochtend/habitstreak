---
status: resolved
trigger: "Page doesn't scroll to top when navigating between pages on iOS Chrome"
created: 2026-01-27T10:00:00Z
updated: 2026-01-27T12:30:00Z
resolved: 2026-01-27T12:30:00Z
---

# Debug: Scroll to Top Not Working on iOS Navigation

## Current Focus

**RESOLVED** - Fix applied 2026-01-27

Replaced `min-h-screen` with `min-h-svh` in all 4 affected files. Awaiting user verification on Chrome iOS.

## Symptoms

expected: Page scrolls to top when navigating via bottom nav
actual: Page stays at previous scroll position (Chrome iOS only)
errors: None - silent failure
reproduction: 1) Open app on iOS Chrome, 2) Navigate to any page, 3) Scroll down, 4) Tap different nav item, 5) New page loads but scroll position retained
started: Unknown - reported as bug

### Updated Observations (2026-01-27T12:00:00Z)
- Safari iOS: WORKS (regardless of address bar state)
- Chrome iOS: BROKEN (page doesn't scroll to top)
- PWA mode: WORKS
- Chrome iOS address bar is at TOP (doesn't expand/collapse like Safari)

## Eliminated

- hypothesis: Simple window.scrollTo(0,0) on pathname change
  evidence: iOS WebKit ignores or overrides the scroll call
  timestamp: previous session

- hypothesis: onClick handler on Link to scroll before navigation
  evidence: Scroll gets overridden after content loads
  timestamp: previous session

- hypothesis: requestAnimationFrame + multiple scroll methods
  evidence: Did not work on iOS even with rAF timing
  timestamp: previous session

- hypothesis: history.scrollRestoration = 'manual'
  evidence: Still did not work - Next.js App Router handles scroll separately
  timestamp: previous session

- hypothesis: Scroll in PageTransition useEffect
  evidence: Still did not work - iOS overrides it
  timestamp: previous session

## Evidence

- timestamp: 2026-01-27T11:00:00Z
  checked: Research on Next.js App Router scroll restoration
  found: Next.js App Router has built-in scroll restoration. The `scroll` prop on Link defaults to true (scroll to top). Known issues exist with iOS viewport states.
  implication: The issue is iOS WebKit-specific, not a Next.js bug per se

- timestamp: 2026-01-27T11:10:00Z
  checked: GitHub issues vercel/next.js
  found: Issue #45187 and discussions report this exact behavior on iOS Chrome - works well on Safari iOS but fails on Chrome iOS. The issue is related to iOS viewport large/small states.
  implication: Chrome on iOS uses WebKit (Apple requirement), so Safari bugs affect Chrome

- timestamp: 2026-01-27T11:15:00Z
  checked: iOS WebKit scroll behavior research
  found: "scroll-behavior: smooth" in CSS can block programmatic scroll in WebKit 15.4+. The app only has this in @media (prefers-reduced-motion: reduce) block, so this is NOT the cause for normal users.
  implication: Can rule out scroll-behavior CSS conflict

- timestamp: 2026-01-27T11:20:00Z
  checked: Current CSS structure
  found: html { height: 100%; }, body { min-height: 100dvh; }. AnimatedBackground uses fixed positioning. BottomNav uses fixed positioning. Main content area is not in a scrollable container - body is the scroll container.
  implication: Scroll container is correct (body/window), not a nested scrollable div issue

- timestamp: 2026-01-27T11:25:00Z
  checked: iOS viewport state behavior
  found: iOS browsers have two viewport states - "large" (address bar visible/expanded) and "small" (address bar hidden/collapsed). When clicking a link from the bottom of page in "large viewport" state, scroll restoration fails. If user scrolls slightly up first (to trigger small viewport), scroll works correctly.
  implication: This is the ROOT CAUSE - iOS WebKit bug with viewport states

- timestamp: 2026-01-27T11:30:00Z
  checked: Potential workarounds from research
  found: Multiple workarounds exist:
    1. Use setTimeout with delay before scroll
    2. Use requestAnimationFrame with nested requestAnimationFrame
    3. Scroll multiple times with slight delays
    4. Use scrollIntoView on a top element instead of window.scrollTo
    5. Force a tiny scroll first to trigger viewport state change
  implication: Need to test these iOS-specific workarounds

- timestamp: 2026-01-27T12:05:00Z
  checked: User clarified - Safari iOS works, only Chrome iOS broken, PWA works
  found: Previous hypothesis (iOS WebKit viewport state bug) was WRONG. Safari works fine. Chrome iOS specifically is broken. PWA mode (standalone) works.
  implication: This is Chrome iOS-specific, not a general WebKit bug

- timestamp: 2026-01-27T12:10:00Z
  checked: Web research on Chrome iOS scroll-to-top issues
  found: Next.js GitHub discussions (#64435, #28778) identify that `min-h-screen` (100vh) causes this exact issue. The fix is to use `min-h-svh` (100svh - small viewport height) instead. The problem: during navigation in Chrome iOS, there's a moment when DOM changes where the browser calculates scroll position based on large viewport (100vh) vs visible viewport, causing incorrect scroll.
  implication: The root cause is likely `min-h-screen` in layout.tsx

- timestamp: 2026-01-27T12:15:00Z
  checked: Codebase uses of min-h-screen
  found:
    - src/app/(main)/layout.tsx:18 - `<div className="min-h-screen">`
    - src/app/(auth)/login/page.tsx:67 - `<div className="min-h-screen ...">`
    - src/app/(auth)/signup/page.tsx:97 - `<div className="min-h-screen ...">`
    - src/app/page.tsx:18 - `<main className="min-h-screen relative">`
  implication: Multiple files use min-h-screen (100vh) which is the documented cause

- timestamp: 2026-01-27T12:16:00Z
  checked: Why PWA works but browser doesn't
  found: In PWA standalone mode, there's no browser chrome to expand/collapse. The viewport is fixed. So 100vh = actual screen height always. In regular Chrome browser, 100vh may differ from current visible viewport during navigation, causing scroll miscalculation.
  implication: Confirms 100vh is the root cause - PWA has no viewport state changes

## Resolution

root_cause: The `min-h-screen` Tailwind class (= `min-height: 100vh`) on wrapper elements causes scroll-to-top to fail on Chrome iOS. During SPA navigation, there's a moment when the DOM changes where Chrome iOS calculates scroll position based on the "large viewport height" (100vh - with browser chrome hidden) vs the actual visible viewport. This creates a mismatch that prevents scroll-to-top from working correctly.

**Why Safari works but Chrome doesn't:** Safari's scroll restoration has been more thoroughly fixed for viewport height issues. Chrome iOS (despite using WebKit) has its own navigation/scroll handling layer that interacts poorly with 100vh.

**Why PWA works:** In standalone/PWA mode, there's no browser chrome that can expand/collapse, so 100vh = actual screen height always. No viewport state mismatch occurs.

**The fix:** Replace `min-h-screen` with `min-h-svh` (= `min-height: 100svh`). The `svh` unit represents the "small viewport height" - the viewport size when browser chrome is fully visible/expanded. This is a stable value that doesn't change during navigation.

fix: Replace `min-h-screen` with `min-h-svh` in:
  - src/app/(main)/layout.tsx
  - src/app/(auth)/login/page.tsx
  - src/app/(auth)/signup/page.tsx
  - src/app/page.tsx

verification: User testing required on Chrome iOS
files_changed:
  - src/app/(main)/layout.tsx (min-h-screen → min-h-svh)
  - src/app/(auth)/login/page.tsx (min-h-screen → min-h-svh)
  - src/app/(auth)/signup/page.tsx (min-h-screen → min-h-svh)
  - src/app/page.tsx (min-h-screen → min-h-svh)

## Research Summary

### Key Resources
- [Next.js GitHub Issue #45187](https://github.com/vercel/next.js/issues/45187) - Clicking a Link doesn't scroll to top
- [Next.js GitHub Issue #28778](https://github.com/vercel/next.js/issues/28778) - Not scroll to top after changing route
- [Apple Developer Forums](https://developer.apple.com/forums/thread/703294) - Safari JS scroll issues
- [iOS Safari scroll position fix](https://medium.com/@kristiantolleshaugmrch/a-unique-solution-to-ios-safaris-scroll-event-problem-b8e402dacc13)

### Recommended Fix Approaches (in order of preference)

1. **Delayed scroll with requestAnimationFrame chain:**
```tsx
useEffect(() => {
  // iOS needs delay for scroll to work after viewport state change
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
  })
}, [pathname])
```

2. **scrollIntoView on sentinel element:**
```tsx
// Add invisible sentinel at top of page
<div ref={topRef} style={{ height: 0 }} />

// On navigation
topRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
```

3. **Force viewport state change first:**
```tsx
// Tiny scroll to force iOS to recalculate viewport
window.scrollTo(0, 1)
requestAnimationFrame(() => {
  window.scrollTo(0, 0)
})
```

4. **Use behavior: 'instant' instead of 'smooth':**
Safari 15.4+ has issues with `scroll-behavior: smooth` blocking programmatic scroll

### Files to Modify
- `src/components/navigation/bottom-nav.tsx` - Add scroll logic to Link clicks
- OR create new `src/components/scroll-to-top.tsx` - Client component that handles scroll on pathname change
- `src/app/(main)/layout.tsx` - Add sentinel element or scroll component
