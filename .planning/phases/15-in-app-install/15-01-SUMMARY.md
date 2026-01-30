---
phase: 15-in-app-install
plan: 01
subsystem: pwa
tags: [pwa, install-banner, settings, mobile]

dependency_graph:
  requires:
    - 14-01 # Landing page install banner (components: InstallBanner, IosWalkthroughModal)
    - 13-02 # PWA install context and provider
  provides:
    - In-app InstallBanner on main pages (authenticated users)
    - InstallSettingsCard component (permanent install fallback)
    - Settings page install integration
  affects: []

tech_stack:
  added: []
  patterns:
    - "Render client component in server layout (InstallBanner in main layout)"
    - "Bypass parent context flags (InstallSettingsCard ignores isDismissed)"

key_files:
  created:
    - src/components/pwa/install-settings-card.tsx
  modified:
    - src/app/(main)/layout.tsx
    - src/app/(main)/instellingen/page.tsx

decisions:
  - id: "bypass-dismissed"
    choice: "InstallSettingsCard ignores isDismissed, uses direct platform/isStandalone checks"
    rationale: "Settings card is permanent fallback - users who dismissed banner should still have install access"
  - id: "own-walkthrough-state"
    choice: "InstallSettingsCard manages own showWalkthrough state instead of calling dismiss()"
    rationale: "Prevents settings card from triggering dismissal state that would affect future banner visibility"

metrics:
  duration: "24 min"
  completed: "2026-01-30"
---

# Phase 15 Plan 01: In-App Install Banner & Settings Card Summary

**One-liner:** Added PWA install access for logged-in users via in-app banner on main pages and permanent settings card that bypasses banner dismissal.

## What Was Built

### Task 1: InstallBanner in Main Layout
- Imported `InstallBanner` from `@/components/pwa/install-banner`
- Positioned between `</main>` and `<BottomNav />` in main layout
- Banner appears on all authenticated pages: /vandaag, /inzichten, /taken, /instellingen
- Existing z-index layering preserved (banner z-40, BottomNav z-50)

### Task 2: InstallSettingsCard Component
Created new client component (`src/components/pwa/install-settings-card.tsx`):
- **Visibility logic:** Shows when `!isLoading && !isStandalone && platform !== 'unsupported'`
- **Bypasses dismissal:** Does NOT check `isDismissed` or `canInstall`
- **Platform-specific button text:**
  - iOS: "Voeg toe aan beginscherm"
  - Chromium: "Installeren"
- **Own walkthrough state:** Manages `showWalkthrough` without calling `dismiss()`
- **Consistent styling:** Uses `glass animate-slide-up hover-lift shadow-sm` matching other settings cards
- **Icon:** Smartphone icon from lucide-react

### Task 3: Settings Page Integration
- Imported `InstallSettingsCard` component
- Positioned between Account card and Daily Target card
- Component handles own visibility (returns null when not applicable)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Bypass isDismissed | InstallSettingsCard checks only platform and isStandalone | Settings card provides permanent fallback for users who dismissed banner |
| Own walkthrough state | Component manages own showWalkthrough state | Prevents settings card from triggering dismissal that affects banner |
| Server→Client render | InstallBanner in server layout | Next.js supports rendering client components from server components |

## Files Changed

| File | Change |
|------|--------|
| `src/app/(main)/layout.tsx` | Added InstallBanner import and render |
| `src/components/pwa/install-settings-card.tsx` | Created new component (74 lines) |
| `src/app/(main)/instellingen/page.tsx` | Added InstallSettingsCard between Account and Daily Target |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| d372f51 | feat | add InstallBanner to main layout |
| 09731ff | feat | create InstallSettingsCard component |
| 0bc06fb | feat | integrate InstallSettingsCard into settings page |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] TypeScript compilation succeeds (npx tsc --noEmit)
- [x] Key link: layout.tsx imports InstallBanner
- [x] Key link: install-settings-card.tsx uses usePwaInstall
- [x] Key link: instellingen/page.tsx imports InstallSettingsCard
- [x] InstallSettingsCard is 74 lines (meets minimum 30)

## Success Criteria Met

1. **BANR-02:** Logged-in users see install banner on main app pages via InstallBanner in main layout
2. **SETT-01:** Settings page shows install card between Account and Daily Target
3. **SETT-02:** Settings install button works after banner dismissed (bypasses isDismissed)
4. **SETT-03:** Button triggers platform-appropriate action (iOS walkthrough or Chromium prompt)

## Next Phase Readiness

Phase 15 complete. All PWA install access points implemented:
- Landing page banner (Phase 14)
- In-app banner for authenticated users (this plan)
- Settings card as permanent fallback (this plan)

No blockers. v1.4 App Experience milestone ready for completion.
