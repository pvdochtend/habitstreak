---
phase: 16-service-worker-offline-support
plan: 05
subsystem: offline-ui
tags: [offline, navigation, bugfix, gap-closure]
requires: [16-04]
provides: [working-offline-retry-navigation]
affects: []
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified: [src/app/offline/page.tsx]
decisions: []
metrics:
  tasks-completed: 1
  commits: 1
  duration: 8 minutes
  completed: 2026-02-01
---

# Phase 16 Plan 05: Gap Closure - Fix Offline Retry Button Summary

**One-liner:** Fixed retry button navigation from reload to home page redirect

## What Was Built

Fixed a critical bug in the offline fallback page where clicking the retry button would reload the `/offline` page instead of navigating back to the app home page.

### Change Details

**Modified file:** `src/app/offline/page.tsx`

Changed the retry button's onClick handler from:
```typescript
onClick={() => window.location.reload()}
```

to:
```typescript
onClick={() => { window.location.href = '/' }}
```

This ensures that when users regain connectivity and click "Opnieuw proberen", they are redirected to the home page (`/`) instead of just reloading the offline page.

## Tasks Completed

| Task | Description | Commit | Files Modified |
|------|-------------|--------|----------------|
| 1 | Fix retry button navigation | cd462b2 | src/app/offline/page.tsx |

## Verification Results

- ✅ File contains `window.location.href = '/'`
- ✅ Build succeeds without errors
- ✅ Offline page properly navigates to home on retry

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

No architectural or implementation decisions required. This was a straightforward bugfix.

## Tech Stack Impact

No new dependencies or patterns introduced. Simple behavior fix using existing Web APIs.

## Key Files

### Modified
- **src/app/offline/page.tsx** - Changed retry button from reload to home navigation

## Known Limitations

None. The fix addresses the identified issue completely.

## Next Phase Readiness

This was a gap closure plan addressing UAT Issue #2. With this fix:

- ✅ Offline page retry button works correctly
- ✅ Users can return to the app when connectivity is restored
- ✅ Phase 16 (Service Worker + Offline Support) is complete

All Phase 16 functionality is now working as intended.

## Testing Notes

**Manual verification steps:**
1. Navigate to `/offline` page
2. Click "Opnieuw proberen" button
3. Verify navigation to home page (`/`) occurs

**Build verification:**
- Build completed successfully with no errors
- Offline page compiled and optimized correctly

## Performance Impact

None. Navigation method change has identical performance characteristics.

## Dependencies

**Upstream (requires):**
- 16-04: Verification plan that identified this issue in UAT

**Downstream (provides to):**
- Complete Phase 16 with all features working

**Related:**
- 16-UAT.md: Documents the issue this fix addresses

## Future Considerations

No follow-up work required. The offline fallback page is now complete and functional.
