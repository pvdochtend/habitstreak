---
created: 2026-01-29T15:11
title: Add service worker for PWA installability
area: pwa
files:
  - public/sw.js (to create)
  - public/manifest.json
---

## Problem

Chrome requires a service worker to consider a site installable and fire the `beforeinstallprompt` event. Currently HabitStreak has a valid manifest but no service worker, so:

- Desktop Chrome: Install banner never appears (beforeinstallprompt doesn't fire)
- Mobile Chromium browsers: Same issue

iOS Safari works without a service worker (uses Add to Home Screen via share menu).

## Solution

Add a basic service worker (`public/sw.js`) that:
1. Registers on page load
2. Caches essential assets for offline support
3. Enables Chrome to fire `beforeinstallprompt`

Consider using next-pwa or a minimal custom service worker. The service worker registration should be added to the root layout or a dedicated script.
