# Feature Landscape: Service Worker for PWA

**Domain:** Service worker for install-only PWA with app shell caching
**Researched:** 2026-01-31
**Overall Confidence:** HIGH

## Context

HabitStreak is an existing Next.js 15 PWA with:
- Complete web app manifest (`public/manifest.json`)
- PWA install prompts (landing page, in-app, settings)
- iOS visual walkthrough
- Platform detection (iOS Safari vs Chromium)
- Standalone mode detection

**Goal:** Add service worker for app shell caching and faster repeat loads. Network required for data operations (no offline sync needed).

---

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| **Service worker registration** | Required for any service worker functionality to work | Low | None |
| **App shell precaching** | Core shell (HTML, CSS, JS) should load instantly on repeat visits | Medium | Build-time asset list |
| **Custom offline fallback page** | Users expect branded "you're offline" instead of browser error | Low | `/offline` route |
| **Navigation preload** | Prevents service worker startup delay on navigation requests | Low | Browser support check |
| **Cache versioning** | Updates must be delivered; stale caches cause bugs | Medium | Build revision hash |
| **Proper scope configuration** | Service worker must control all app routes | Low | Root-level sw.js |

### Rationale

**Service worker registration:** Without this, nothing else works. Must be properly scoped at root level (`/sw.js`).

**App shell precaching:** This is the primary goal. The app shell (layout, navigation, global CSS/JS) should be cached during service worker install phase. Repeat visits render instantly from cache.

**Custom offline fallback:** When network fails and requested page is not cached, users see a branded offline page instead of browser's generic "No internet" error. Critical for app-like feel.

**Navigation preload:** Modern browsers support this to start network requests in parallel with service worker boot. Without it, every navigation waits for SW to start before fetching. This is especially important since HabitStreak requires network for data.

**Cache versioning:** Without proper versioning, users may be stuck with outdated cached content. Must clean old caches on activation.

**Proper scope:** A common mistake is placing service worker in subdirectory, limiting its control. Must be at root.

---

## Differentiators

Features that provide competitive advantage. Not strictly required, but valuable.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| **Stale-while-revalidate for static assets** | Faster loads + automatic updates for images, fonts | Low | Runtime caching config |
| **Network-first for API routes** | Fresh data when online, graceful degradation when not | Medium | API route patterns |
| **Update prompt for new versions** | Users know when fresh content is available | Medium | SW lifecycle events |
| **Intelligent fallback hierarchy** | Different fallbacks for different content types (pages, images, API) | Medium | Content-type detection |
| **Background sync registration** | Foundation for future offline-first features | Low | Browser support check |

### Rationale

**Stale-while-revalidate:** For static assets (images, fonts, icons), show cached version immediately while fetching fresh version in background. Best of both worlds.

**Network-first for API:** For `/api/*` routes, try network first. If it fails, could show cached data or graceful error. Since HabitStreak requires network, this mainly handles temporary network blips.

**Update prompt:** When a new service worker version is detected, prompt user to reload for latest features. Better than silently updating or leaving users on old versions.

**Intelligent fallbacks:** Instead of one offline page for everything, could show different content: offline page for navigation, placeholder image for images, error response for API.

**Background sync registration:** Even if not used immediately, registering for background sync prepares for future offline-first features like queuing check-ins when offline.

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full offline data sync** | Massive complexity for limited benefit; HabitStreak needs real-time data | Accept network requirement; provide clear offline messaging |
| **Aggressive caching of HTML pages** | Leads to stale content issues; Next.js generates dynamic HTML | Precache app shell only; network-first for page content |
| **Caching API responses long-term** | Data becomes stale; check-ins must be real-time | Network-first for API; short TTL if any caching |
| **Force-activating on major updates** | Can break active sessions if new SW is incompatible | Prompt user to reload instead of `skipWaiting` on breaking changes |
| **Caching auth/session endpoints** | Security risk; stale auth state causes bugs | Explicitly exclude `/api/auth/*` from caching |
| **Custom caching logic from scratch** | Error-prone; edge cases everywhere | Use Serwist/Workbox for production-tested implementations |
| **Caching 4xx/5xx error responses** | Serves stale errors to users | Always check `response.ok` before caching |
| **Registering SW during page load** | Competes with critical rendering resources | Register after `window.load` event |

### Rationale

**No offline data sync:** This would require IndexedDB, sync queues, conflict resolution, and massive complexity. HabitStreak's value is in the streak tracking, which requires real data. An offline check-in that fails to sync could break streaks. Not worth the complexity.

**No aggressive HTML caching:** Next.js pages may contain dynamic data. Caching full HTML leads to stale data showing. The app shell model caches only the static shell; content is fetched fresh.

**No API response caching:** Check-ins, tasks, and insights must reflect real server state. Caching API responses risks showing outdated data.

**No force-activation:** Using `skipWaiting()` without user consent can cause issues if the new SW handles requests differently. Active sessions might break. Better to prompt.

**No auth caching:** Never cache auth-related endpoints. Stale auth tokens, session data, or login states cause security issues and confusing bugs.

**Use Serwist/Workbox:** Rolling custom service worker caching is a known source of bugs. These libraries handle edge cases (stream cloning, cache errors, update cycles) that are easy to get wrong.

---

## Feature Dependencies

```
Service Worker Registration (required first)
    |
    +-- App Shell Precaching
    |       |
    |       +-- Cache Versioning (cleanup on update)
    |       |
    |       +-- Custom Offline Page (precached fallback)
    |
    +-- Navigation Preload (parallel with SW boot)
    |
    +-- Runtime Caching Strategies
            |
            +-- Stale-while-revalidate (static assets)
            |
            +-- Network-first (API routes)
            |
            +-- Fallback hierarchy (different content types)

Update Prompt
    |
    +-- Requires SW lifecycle event handling
    +-- Depends on workbox-window or similar

Background Sync (future foundation)
    |
    +-- Requires service worker active
    +-- Browser capability check
```

---

## MVP Recommendation

For MVP (install-only + app shell caching), prioritize:

### Must Have (Table Stakes)
1. **Service worker registration** - Foundation for everything
2. **App shell precaching** - Core value proposition (faster repeat loads)
3. **Custom offline fallback page** - Branded offline experience
4. **Cache versioning with cleanup** - Ensures updates are delivered
5. **Navigation preload** - Performance for network-required app

### Should Have (First Differentiators)
6. **Stale-while-revalidate for static assets** - Easy win for performance
7. **Explicit API route bypass** - No caching for `/api/*` initially

### Defer to Post-MVP
- **Update prompt UI** - Can use simple page reload initially
- **Intelligent fallback hierarchy** - One offline page is sufficient
- **Background sync registration** - Future feature, not needed now
- **Network-first API caching** - Adds complexity; simpler to bypass API entirely

---

## Implementation Notes

### Library Choice: Serwist

Serwist is the maintained successor to `next-pwa` and Workbox for Next.js. It provides:
- Build-time precache manifest generation
- Runtime caching strategies
- Next.js App Router compatibility
- TypeScript support

**Installation:**
```bash
npm i @serwist/next && npm i -D serwist
```

### Existing Infrastructure

HabitStreak already has:
- `public/manifest.json` with icons, shortcuts, display settings
- Next.js metadata integration
- Platform detection for install prompts

**What needs to be added:**
- Serwist configuration in `next.config.js`
- Service worker source file (`src/app/sw.ts`)
- Offline fallback page (`src/app/~offline/page.tsx`)
- TypeScript configuration updates
- Service worker registration (handled by Serwist)

### Caching Strategy Summary

| Resource Type | Strategy | Cache Name | TTL |
|---------------|----------|------------|-----|
| App shell (HTML, CSS, JS) | Precache | `precache-v1` | Until new SW version |
| Static assets (images, fonts) | Stale-while-revalidate | `static-assets` | 30 days |
| API routes | Network-only (no cache) | N/A | N/A |
| Auth routes | Network-only (no cache) | N/A | N/A |
| Other pages | Network-first, offline fallback | N/A | N/A |

---

## Complexity Assessment

| Phase | Features | Estimated Effort |
|-------|----------|------------------|
| Phase 1: Basic SW | Registration, precaching, offline page | 2-4 hours |
| Phase 2: Runtime caching | Static asset caching, API bypass | 1-2 hours |
| Phase 3: Polish | Update prompt, testing, edge cases | 2-4 hours |

**Total estimated effort:** 5-10 hours for complete implementation

---

## Sources

### HIGH Confidence (Official Documentation)
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN: Best practices for PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices)
- [Chrome Developers: App Shell Model](https://developer.chrome.com/docs/workbox/app-shell-model/)
- [Serwist: Getting Started with Next.js](https://serwist.pages.dev/docs/next/getting-started)

### MEDIUM Confidence (Verified with Official Sources)
- [Service Worker Lifecycle](https://felixgerschau.com/service-worker-lifecycle-update/)
- [Handling Service Worker Updates (Workbox)](https://developer.chrome.com/docs/workbox/handling-service-worker-updates)
- [Service Worker Pitfalls and Best Practices](https://www.thecodeship.com/web-development/guide-service-worker-pitfalls-best-practices/)

### LOW Confidence (WebSearch Only, Needs Validation)
- PWA Builder blog statistics on service worker adoption
- Community patterns for Next.js 15 service worker integration

---

## Open Questions

1. **Service worker testing strategy** - How to effectively test service worker behavior in development vs production?
2. **Cache size limits** - What storage quota constraints apply on mobile browsers?
3. **iOS-specific behavior** - Are there iOS Safari service worker quirks to handle?

These should be addressed during implementation research or phase-specific investigation.
