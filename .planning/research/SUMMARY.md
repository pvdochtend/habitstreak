# Project Research Summary

**Project:** HabitStreak v1.5 Service Worker
**Domain:** Service worker for install-only PWA with app shell caching
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

HabitStreak v1.5 requires a minimal service worker to enable Chromium install prompts (`beforeinstallprompt` event) and provide app shell caching for faster repeat loads. Research strongly recommends a **custom 30-50 line service worker in `public/sw.js`** rather than using Serwist or other libraries. This approach requires zero new dependencies, works seamlessly with the existing standalone Docker output, and directly addresses the goal without unnecessary complexity. The existing `PwaInstallProvider` context provides the ideal integration point for registration.

The primary risk is **users stuck on stale content** due to improper cache invalidation. This is prevented by using network-first strategies for navigation and API routes, implementing versioned caches, and setting no-cache headers on `sw.js` itself. The service worker should explicitly bypass all `/api/*` routes to avoid caching authenticated data. A secondary risk is scope mismatch, which is avoided by placing `sw.js` in `public/` and explicitly registering with `scope: '/'`.

The implementation is straightforward: create a minimal service worker with fetch handler (required for install prompt), add registration code to the existing PWA context provider, configure cache-control headers in `next.config.js`, and optionally add an offline fallback page. The existing Dockerfile already copies `public/` to the standalone output, so no Docker changes are needed. Total estimated effort is 2-4 hours for core functionality.

## Key Findings

### Recommended Stack

Use browser-native Service Worker API with no additional dependencies. Serwist was evaluated but rejected as overkill for this use case: it adds webpack/Turbopack complexity, has reported Next.js 15 compatibility issues, and requires significant configuration for features HabitStreak does not need.

**Core technologies:**
- **public/sw.js**: Static service worker file with fetch handler and cache-first strategy for static assets
- **navigator.serviceWorker.register()**: Registration in existing `PwaInstallProvider` context
- **Cache API**: Browser-native caching for manifest, icons, and static assets

**Why NOT Serwist:**
- Overkill for goal (designed for complex offline-first apps)
- Webpack dependency conflicts with Turbopack
- Reported issues with Next.js 15 (sw.js not generated)
- Configuration overhead not justified for simple use case

### Expected Features

**Must have (table stakes):**
- Service worker registration with fetch handler (required for `beforeinstallprompt`)
- App shell precaching (manifest, icons, core static assets)
- Cache versioning with cleanup on update
- No-cache headers for sw.js file

**Should have (first differentiators):**
- Custom offline fallback page (branded "you're offline" instead of browser error)
- Stale-while-revalidate for static assets (/_next/static/*, icons)
- Explicit API route bypass (no caching for /api/*)

**Defer (v2+):**
- Update prompt UI ("New version available, tap to refresh")
- Intelligent fallback hierarchy (different fallbacks for pages, images, API)
- Background sync registration (foundation for future offline features)
- Navigation preload (optimization for network-required app)

### Architecture Approach

The service worker integrates with the existing Next.js 15 architecture through a static file in `public/` registered from the existing `PwaInstallProvider` client component. The provider already runs on mount in the root layout, making it the ideal location for service worker registration without adding new components or providers.

**Major components:**
1. **public/sw.js** - Static service worker with install/activate/fetch handlers, ~30-50 lines
2. **PwaInstallProvider modification** - Add registration code to existing useEffect (~10 lines)
3. **next.config.js headers** - Add no-cache headers for /sw.js route

**Caching strategy:**
| Resource Type | Strategy | Rationale |
|---------------|----------|-----------|
| /_next/static/* | Cache-first | Immutable content-hashed files |
| /icons/*, /manifest.json | Cache-first | Rarely change, OK to serve from cache |
| /api/* | Network-only (bypass) | Auth-required, must be fresh |
| Navigation requests | Network-first | Next.js handles RSC payloads |

### Critical Pitfalls

1. **Users stuck on stale content** - Use versioned caches (`habitstreak-v1`), set no-cache headers on sw.js, never use stale-while-revalidate for navigation. Detection: content differs between curl and browser.

2. **Service worker scope mismatch** - Place sw.js in public/ root, explicitly register with `scope: '/'`. Detection: Lighthouse fails "Does not register a service worker that controls page."

3. **Caching API routes** - Explicitly exclude `/api/*` from all caching. Never cache authenticated endpoints. Detection: logout doesn't clear data, different data in incognito.

4. **Standalone output path issues** - Verify Dockerfile copies public/ directory (already done). Test with `npm run build && npm start` before deployment.

5. **skipWaiting causing inconsistency** - Use skipWaiting + clients.claim() for immediate activation, but understand this is safe for install-only PWA with network-first strategies.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Minimal Service Worker

**Rationale:** The service worker is the core deliverable - without it, `beforeinstallprompt` won't fire. Start with minimal viable implementation.

**Delivers:**
- Service worker file with fetch handler
- Registration in PwaInstallProvider
- Cache-control headers in next.config.js
- Chromium install prompts now work

**Addresses features:**
- Service worker registration (table stakes)
- Basic fetch handler (required for install prompt)

**Avoids pitfalls:**
- Scope mismatch (P2) - place in public/, explicit scope
- Cache headers wrong (P10) - set no-cache immediately

**Estimated effort:** 1-2 hours

### Phase 2: App Shell Caching

**Rationale:** Once SW is working, add caching for performance benefit. Keep scope minimal to avoid stale content issues.

**Delivers:**
- Precaching of manifest, icons
- Cache-first strategy for /_next/static/*
- Versioned cache with cleanup
- Explicit API bypass

**Uses stack elements:**
- Cache API for static assets
- Version-based cache names

**Avoids pitfalls:**
- Stale content (P1) - versioned caches, cleanup in activate
- Caching API routes (P5) - explicit bypass for /api/*
- Precaching bloat (P6) - minimal precache list

**Estimated effort:** 1-2 hours

### Phase 3: Offline Fallback (Optional)

**Rationale:** Branded offline experience improves perceived quality. Lower priority since HabitStreak requires network for data.

**Delivers:**
- /offline route with branded page
- Fallback on navigation failure
- App-like offline experience

**Addresses features:**
- Custom offline fallback page (should have)

**Avoids pitfalls:**
- Missing offline fallback (P9)

**Estimated effort:** 1-2 hours

### Phase 4: Verification and Testing

**Rationale:** Service workers are notoriously hard to debug. Dedicated verification phase catches issues before production.

**Delivers:**
- Production build testing (npm run build && npm start)
- Docker build verification
- Lighthouse PWA audit passing
- E2E test for service worker registration

**Avoids pitfalls:**
- Standalone output issues (P3) - verify in production build
- Dev/prod testing gap (P8) - test production build locally

**Estimated effort:** 1 hour

### Phase Ordering Rationale

- **Phase 1 before 2:** Registration must work before caching logic matters
- **Phase 2 before 3:** Caching infrastructure needed before offline page can be precached
- **Phase 3 is optional:** Install prompt works without offline page; can defer if time-constrained
- **Phase 4 last:** Verification happens after all code is written

### Research Flags

Phases with standard patterns (skip research-phase):
- **Phase 1:** Well-documented browser APIs, Next.js official guide available
- **Phase 2:** Standard Cache API patterns, no research needed
- **Phase 3:** Simple Next.js route + precaching
- **Phase 4:** Standard testing patterns

No phases require additional research - service worker implementation is thoroughly documented and HabitStreak's requirements are straightforward.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Next.js docs, verified Serwist issues |
| Features | HIGH | MDN PWA documentation, Chrome developer docs |
| Architecture | HIGH | Existing codebase patterns, verified integration points |
| Pitfalls | HIGH | Multiple sources agree, real-world issue reports |

**Overall confidence:** HIGH

### Gaps to Address

- **iOS service worker quirks:** Research mentions iOS Safari may have specific behaviors. Mitigated by network-first strategy - SW primarily for install prompt on Chromium.
- **Cache size limits:** Mobile browsers have storage quotas. Mitigated by minimal precache list (manifest + icons only, ~50KB total).
- **Testing in production:** Cannot fully test install prompt without HTTPS production deployment. Mitigate with Lighthouse audit in development.

## Sources

### Primary (HIGH confidence)
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) - Official service worker pattern
- [Chrome Installability Criteria](https://developer.chrome.com/blog/update-install-criteria) - Fetch handler requirements
- [MDN Making PWAs Installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) - Manifest requirements
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) - Registration API
- [Chrome Workbox Docs](https://developer.chrome.com/docs/workbox/handling-service-worker-updates) - Update patterns, skipWaiting

### Secondary (MEDIUM confidence)
- [Serwist Getting Started](https://serwist.pages.dev/docs/next/getting-started) - Configuration details (used to evaluate complexity)
- [Next.js Standalone Output](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output) - Public directory handling
- [GitHub Next.js Discussions](https://github.com/vercel/next.js/discussions/52024) - Real-world stale data issues

### Tertiary (LOW confidence)
- [Next.js #73457](https://github.com/vercel/next.js/issues/73457) - Serwist sw.js not created in Next.js 15 (single issue report)
- Community blog posts on service worker development patterns

---
*Research completed: 2026-01-31*
*Ready for roadmap: yes*
