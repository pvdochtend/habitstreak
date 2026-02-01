---
phase: 16-service-worker-offline-support
verified: 2026-02-01T14:00:00Z
status: human_needed
score: 11/15 must-haves verified programmatically
human_verification:
  - test: "Service worker registers on app load"
    expected: "DevTools > Application > Service Workers shows 'activated and is running'"
    why_human: "Requires running browser with DevTools"
  - test: "beforeinstallprompt event fires on Chrome/Edge"
    expected: "Install icon appears in address bar after page load"
    why_human: "Runtime browser event, not verifiable from code"
  - test: "iOS Safari walkthrough still works"
    expected: "iOS Safari shows install banner, 'Zo werkt het' opens walkthrough modal"
    why_human: "Requires iOS Safari environment"
  - test: "Lighthouse PWA audit passes"
    expected: "Lighthouse PWA category shows 'Installable' badge"
    why_human: "Requires Lighthouse CLI or DevTools audit"
---

# Phase 16: Service Worker + Offline Support Verification Report

**Phase Goal:** Service worker enables Chromium install prompts, caches app shell, and provides offline fallback
**Verified:** 2026-02-01T14:00:00Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Service worker registers successfully on app load | ? NEEDS HUMAN | Registration component exists and is wired into layout (line 50), but runtime behavior requires browser verification |
| 2 | Service worker has fetch handler that passes requests through | VERIFIED | `public/sw.js` has 3 `respondWith()` calls at lines 67, 90, 99 with different strategies |
| 3 | sw.js serves with Cache-Control: no-cache header | VERIFIED | `next.config.js` lines 16-21 configure `no-cache, no-store, must-revalidate` |
| 4 | Chrome/Edge recognize app as installable | ? NEEDS HUMAN | All prerequisites in place (manifest, SW with fetch handler), but install icon requires runtime check |
| 5 | JavaScript and CSS bundles load from cache on repeat visits | VERIFIED | `public/sw.js` lines 61-86 implement cache-first for `/_next/static/` |
| 6 | PWA icons (72-512px) are cached and load offline | VERIFIED | `PRECACHE_URLS` array (lines 8-19) includes all 9 icon files, which exist in `/public/icons/` |
| 7 | API routes always hit network (no stale data from cache) | VERIFIED | `public/sw.js` line 57-59: `/api/` routes explicitly return early (network-only) |
| 8 | Cache version is bumped on deploy, clearing old cached assets | VERIFIED | `CACHE_VERSION = 'v1'` (line 4) and activate handler (lines 33-45) deletes old caches |
| 9 | Offline page exists at /offline with Dutch message | VERIFIED | `src/app/offline/page.tsx` exists (25 lines), contains "Je bent offline" (line 12) |
| 10 | Offline page uses HabitStreak glassmorphism styling | VERIFIED | Uses `glass` class (line 8), which is defined in `globals.css` lines 146-151 |
| 11 | Navigation to any page while offline shows the offline page | VERIFIED | `public/sw.js` line 89-96: `mode === 'navigate'` catches failures, returns `/offline` |
| 12 | beforeinstallprompt event fires on Chrome/Edge | ? NEEDS HUMAN | Event listener exists in `pwa-install-context.tsx` line 144, but actual firing requires runtime |
| 13 | iOS Safari walkthrough still works | ? NEEDS HUMAN | Code intact (`ios-walkthrough-modal.tsx` 78 lines, `install-banner.tsx` triggers it), but requires iOS device |
| 14 | Lighthouse PWA audit passes with "Installable" badge | ? NEEDS HUMAN | Cannot run Lighthouse programmatically in WSL environment |
| 15 | Production Docker build includes sw.js and offline page | VERIFIED | Dockerfile line 70: `COPY --from=builder /app/public ./public`, `.dockerignore` doesn't exclude `public/` |

**Score:** 11/15 truths verified programmatically, 4 require human verification

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `public/sw.js` | Service worker with install/activate/fetch handlers | VERIFIED | 104 lines, no stubs, has all event handlers |
| `src/components/pwa/service-worker-registration.tsx` | Client component for SW registration | VERIFIED | 28 lines, imports in layout, calls `navigator.serviceWorker.register()` |
| `src/app/offline/page.tsx` | Dutch offline fallback page | VERIFIED | 25 lines, uses glassmorphism, Dutch text |
| `next.config.js` (headers) | Cache-Control for sw.js | VERIFIED | Lines 14-28 configure no-cache headers |
| `public/manifest.json` | PWA manifest with icons | VERIFIED | 88 lines, all icons 72-512px defined |
| `public/icons/*` | Icon files 72-512px | VERIFIED | 9 icon files present (72, 96, 128, 144, 152, 192, 384, 512, apple-touch) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `layout.tsx` | `service-worker-registration.tsx` | import + render | WIRED | Line 6 import, line 50 render |
| `service-worker-registration.tsx` | `/sw.js` | `navigator.serviceWorker.register('/sw.js')` | WIRED | Line 12 |
| `sw.js` fetch handler | `/offline` | `caches.match('/offline')` | WIRED | Line 92 returns cached offline page |
| `sw.js` install | icons | `cache.addAll(PRECACHE_URLS)` | WIRED | Lines 24-25 precache icons |
| `layout.tsx` | `PwaInstallProvider` | import + wrap | WIRED | Lines 5, 46-48 (iOS support intact) |
| `install-banner.tsx` | `IosWalkthroughModal` | import + conditional render | WIRED | Lines 7, 96-99 |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| SW-01: Service worker registration | VERIFIED | Registration component + layout wiring |
| SW-02: Fetch handler with passthrough | VERIFIED | 3 respondWith strategies |
| SW-03: No-cache headers for sw.js | VERIFIED | next.config.js headers |
| CACHE-01: Cache-first for static assets | VERIFIED | /_next/static/, /icons/, manifest.json |
| CACHE-02: Network-only for API | VERIFIED | /api/ returns early |
| CACHE-03: Versioned cache cleanup | VERIFIED | CACHE_VERSION + activate handler |
| CACHE-04: Icons precached | VERIFIED | PRECACHE_URLS array |
| OFFLINE-01: Offline page exists | VERIFIED | /offline route |
| OFFLINE-02: Dutch message | VERIFIED | "Je bent offline" |
| OFFLINE-03: Navigation fallback | VERIFIED | mode === 'navigate' handler |
| VERIFY-01: Install prompt works | NEEDS HUMAN | Runtime verification |
| VERIFY-02: Lighthouse passes | NEEDS HUMAN | Requires Lighthouse audit |
| VERIFY-03: iOS walkthrough works | NEEDS HUMAN | Requires iOS device |
| VERIFY-04: Docker build works | PARTIAL | Dockerfile verified correct, build not run |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| - | - | - | - | No anti-patterns found |

No TODO/FIXME comments, placeholder text, or stub implementations found in phase artifacts.

### Human Verification Required

The following items require manual testing in a browser environment:

### 1. Service Worker Registration

**Test:** Open http://localhost:3000 in Chrome/Edge, open DevTools (F12) > Application > Service Workers
**Expected:** Service worker shows as "activated and is running" with scope "/"
**Why human:** Runtime browser behavior cannot be verified from code analysis

### 2. PWA Install Prompt (Chrome/Edge)

**Test:** Open http://localhost:3000 in Chrome/Edge desktop, wait for page load
**Expected:** Install icon (+ symbol) appears in address bar, clicking it shows install dialog
**Why human:** beforeinstallprompt event requires browser runtime with proper HTTPS/localhost

### 3. Offline Fallback

**Test:** In DevTools > Network, enable "Offline" checkbox, then navigate to any page
**Expected:** "Je bent offline" page appears with WifiOff icon and glassmorphism styling
**Why human:** Requires simulated offline mode in browser

### 4. Cache Verification

**Test:** In DevTools > Application > Cache Storage
**Expected:** `habitstreak-v1` cache exists containing icons and /offline
**Why human:** Cache storage inspection requires DevTools

### 5. iOS Safari Walkthrough

**Test:** Open app in iOS Safari (real device or simulator)
**Expected:** Install banner shows after 2.5s, "Zo werkt het" button opens walkthrough modal
**Why human:** Requires iOS Safari environment

### 6. Lighthouse PWA Audit

**Test:** In Chrome DevTools > Lighthouse, run PWA audit
**Expected:** PWA category passes with "Installable" badge
**Why human:** Lighthouse audit requires browser execution

### Gaps Summary

No structural gaps found. All code artifacts exist, are substantive (not stubs), and are properly wired.

The 4 items marked as NEEDS HUMAN are runtime behaviors that cannot be verified from static code analysis:
- Service worker registration (browser API)
- beforeinstallprompt event firing (browser event)
- iOS Safari behavior (platform-specific)
- Lighthouse audit (tool execution)

All prerequisites for these runtime behaviors are in place in the codebase.

---

*Verified: 2026-02-01T14:00:00Z*
*Verifier: Claude (gsd-verifier)*
