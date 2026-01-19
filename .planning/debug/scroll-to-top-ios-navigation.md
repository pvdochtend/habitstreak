# Debug: Scroll to Top Not Working on iOS Navigation

## Problem Statement
When navigating between pages using the bottom navigation, the page does not scroll to the top on iOS mobile (Chrome). The page stays at the previous scroll position. This works correctly on desktop.

## Observed Behavior
- User scrolls down on a page (e.g., Inzichten/Insights)
- User taps a different nav item (e.g., Taken/Tasks)
- New page loads with skeleton loader
- After skeleton completes and content renders, **browser restores previous scroll position**
- Title and top content are out of view

## Environment
- Device: iOS mobile
- Browser: Chrome (iOS)
- Framework: Next.js 15 (App Router)
- Navigation: Client-side with `next/link`

## What We've Tried (All Failed)
1. **ScrollToTop component with usePathname**
   - `window.scrollTo(0, 0)` on pathname change
   - Did not work - scroll restoration happens after

2. **onClick handler on Link**
   - Scroll to top on navigation click (before navigation)
   - Did not work - scroll gets overridden after content loads

3. **requestAnimationFrame + multiple scroll methods**
   - Tried `window.scrollTo`, `document.documentElement.scrollTop`, `document.body.scrollTop`
   - Did not work on iOS

4. **history.scrollRestoration = 'manual'**
   - Disabled browser scroll restoration
   - Still did not work - something else is restoring scroll

5. **Scroll in PageTransition useEffect**
   - Scroll when content mounts (after skeleton)
   - Still did not work

## Key Insight
The scroll restoration happens **after the skeleton loader completes**, suggesting:
- It's not just browser scroll restoration (that would happen immediately)
- Something in the React/Next.js render cycle is causing it
- Could be related to how iOS Chrome handles scroll position with dynamic content

## Research Needed
- [ ] How does Next.js App Router handle scroll restoration?
- [ ] Is there a Next.js config option to disable scroll restoration?
- [ ] iOS-specific scroll behavior with fixed position elements (bottom nav)
- [ ] Does the `scroll` prop on `<Link>` work differently on iOS?
- [ ] Are there known issues with iOS Chrome and SPA scroll behavior?
- [ ] Could the PageTransition animation be interfering?
- [ ] Is there a CSS solution (e.g., scroll-behavior, overflow)?

## Current Code Structure
```
Layout (server)
└── BottomNav (client) - fixed position
└── main content area
    └── Page (client)
        ├── Skeleton (while loading)
        └── PageTransition (after load)
            └── Actual content
```

## Files Involved
- `src/components/navigation/bottom-nav.tsx`
- `src/components/ui/page-transition.tsx`
- `src/app/(main)/layout.tsx`
- Individual page files in `src/app/(main)/*/page.tsx`

## Next Steps
1. Research Next.js scroll restoration behavior
2. Test with `scroll={false}` on Link to see if that changes anything
3. Look for iOS-specific solutions in Next.js GitHub issues
4. Consider if this is a Chrome iOS specific bug
