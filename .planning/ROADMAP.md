# Milestone v1.5: Service Worker

**Status:** Complete
**Phases:** 16
**Total Plans:** 5

## Overview

Complete the PWA foundation with service worker registration, app shell caching, and offline fallback. Service worker enables Chromium install prompts (beforeinstallprompt requires fetch handler), static asset caching improves repeat load performance, and branded offline page provides graceful degradation when network is unavailable.

## Phases

- [x] **Phase 16: Service Worker + Offline Support** - Complete PWA with SW registration, caching, and offline fallback

## Phase Details

### Phase 16: Service Worker + Offline Support

**Goal**: Service worker enables Chromium install prompts, caches app shell, and provides offline fallback
**Depends on**: None
**Requirements**: SW-01, SW-02, SW-03, CACHE-01, CACHE-02, CACHE-03, CACHE-04, OFFLINE-01, OFFLINE-02, OFFLINE-03, VERIFY-01, VERIFY-02, VERIFY-03, VERIFY-04
**Success Criteria** (what must be TRUE):
  1. Service worker registers successfully on app load (visible in DevTools > Application > Service Workers)
  2. Service worker has a fetch handler that passes requests through
  3. sw.js serves with Cache-Control: no-cache header (prevents stale service worker)
  4. Chrome/Edge recognize app as installable (shows install icon in address bar)
  5. JavaScript and CSS bundles load from cache on repeat visits
  6. PWA icons (72-512px) are cached and load offline
  7. API routes always hit network (no stale data from cache)
  8. Cache version is bumped on deploy, clearing old cached assets
  9. Offline page exists at /offline with Dutch message ("Je bent offline")
  10. Offline page uses HabitStreak glassmorphism styling and brand colors
  11. Navigation to any page while offline shows the offline page
  12. beforeinstallprompt event fires on Chrome/Edge desktop and Android
  13. iOS Safari walkthrough still works (no regression)
  14. Lighthouse PWA audit passes with "Installable" badge
  15. Production Docker build includes sw.js and offline page

Plans:
- [x] 16-01: Minimal Service Worker — registration, fetch handler, headers
- [x] 16-02: App Shell Caching — static assets, icons, versioned cache
- [x] 16-03: Offline Fallback Page — Dutch glassmorphism offline page
- [x] 16-04: Verification — Lighthouse audit, platform testing, Docker build
- [x] 16-05: Gap Closure — Retry button navigation fix

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 16. Service Worker + Offline Support | 5/5 | ✓ Complete | 2026-02-01 |

---
*Created: 2026-01-31*
