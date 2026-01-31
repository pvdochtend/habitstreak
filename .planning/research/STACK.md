# Technology Stack: Service Worker for HabitStreak PWA

**Project:** HabitStreak Service Worker Implementation
**Researched:** 2026-01-31
**Goal:** Enable `beforeinstallprompt` event and app shell caching in existing Next.js 15 PWA

## Executive Summary

**Recommendation: Use a custom minimal service worker (no library)**

For HabitStreak's specific goal—enabling the `beforeinstallprompt` event and caching static assets—a custom 30-line service worker is the right choice. Serwist adds unnecessary complexity for this use case.

### Why NOT Serwist

| Factor | Impact |
|--------|--------|
| Overkill for goal | Serwist is designed for complex offline-first apps. HabitStreak only needs install prompt + asset caching |
| Webpack dependency | `@serwist/next` requires webpack; conflicts with Turbopack in dev |
| Build complexity | Adds TypeScript service worker compilation, manifest injection |
| Next.js 15 issues | Reported issues with sw.js not being generated in Next.js 15 ([GitHub #73457](https://github.com/vercel/next.js/issues/73457)) |
| Config overhead | Requires next.config.js wrapper, tsconfig changes, gitignore changes |

### Why Custom Service Worker

| Factor | Benefit |
|--------|---------|
| Minimal scope | 30-50 lines of JavaScript, easy to understand and maintain |
| No dependencies | Zero new packages to install or update |
| Direct control | Know exactly what's cached and how |
| Standalone compatible | Works with `output: 'standalone'` without issues |
| Official pattern | Next.js docs show manual `public/sw.js` approach |

## Recommended Stack Additions

### Core: Zero New Dependencies

No new npm packages required. Use browser-native Service Worker API.

### Implementation Files

| File | Purpose |
|------|---------|
| `public/sw.js` | Minimal service worker with fetch handler and cache-first strategy |
| Registration in layout | Client-side registration using `navigator.serviceWorker.register()` |

### Service Worker Strategy

**Goal-aligned minimal implementation:**

1. **Fetch handler** - Required for `beforeinstallprompt` to fire (Chrome requirement)
2. **Cache-first for static assets** - Cache `/_next/static/*`, icons, manifest
3. **Network-first for API/pages** - Don't cache dynamic content
4. **Version-based cache busting** - Simple cache name with version string

## Detailed Comparison: Serwist vs Custom

### Serwist (@serwist/next)

**Latest version:** 9.5.0 (published late January 2026)

**Packages required:**
```bash
npm i @serwist/next && npm i -D serwist
# OR for Turbopack:
npm i -D @serwist/turbopack esbuild serwist
```

**Configuration required:**
1. Wrap `next.config.js` with `withSerwistInit`
2. Create `app/sw.ts` with Serwist initialization
3. Update `tsconfig.json` to add `"@serwist/next/typings"` and `"webworker"` lib
4. Update `.gitignore` to exclude generated files
5. For Turbopack: Create route handler at `app/serwist/[path]/route.ts`

**Pros:**
- Automatic precache manifest generation
- Built-in cache strategies
- TypeScript support
- Handles cache versioning automatically

**Cons:**
- 2 new dependencies (production + dev)
- Webpack-based (conflicts with Turbopack dev server)
- Reported Next.js 15 compatibility issues
- Complex configuration for simple use case
- Turbopack version requires additional esbuild dependency

**Verdict:** Overkill. Use when building offline-first app with complex caching needs.

### Custom Service Worker (Recommended)

**Packages required:** None

**Configuration required:**
1. Create `public/sw.js` (30-50 lines)
2. Add registration code to layout (10 lines)
3. Add cache-control header for `/sw.js` in `next.config.js`

**Pros:**
- Zero dependencies
- Full control over caching behavior
- Works with both webpack and Turbopack
- Compatible with `output: 'standalone'`
- Easy to understand and debug
- Next.js official documentation pattern

**Cons:**
- Manual cache versioning (update version string on deploy)
- No automatic precache manifest (must list assets manually OR use cache-on-first-fetch)
- No TypeScript (plain JavaScript in public/)

**Verdict:** Perfect fit for HabitStreak's requirements.

### next-pwa (shadowwalker/next-pwa)

**Status:** Not recommended. Last updated 2+ years ago, not maintained for Next.js 15.

### @ducanh2912/next-pwa

**Status:** Actively recommends migrating to Serwist. Not a long-term solution.

## Implementation Specification

### Minimal Service Worker (public/sw.js)

```javascript
const CACHE_NAME = 'habitstreak-v1';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install: pre-cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-first for dynamic
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache-first for static assets
  if (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Network-first for everything else (don't block, just pass through)
  event.respondWith(fetch(event.request));
});
```

### Registration Code

Add to a client component that loads on all pages:

```typescript
// In useEffect or component initialization
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none'
  });
}
```

### next.config.js Header Addition

```javascript
headers: async () => [
  // ... existing headers
  {
    source: '/sw.js',
    headers: [
      { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
      { key: 'Content-Type', value: 'application/javascript; charset=utf-8' }
    ]
  }
]
```

## Chrome Installability Requirements (Verified)

For `beforeinstallprompt` to fire, Chrome requires:

| Requirement | HabitStreak Status |
|-------------|-------------------|
| Valid manifest with name/short_name | Done (manifest.json) |
| Icons (192px + 512px) | Done (8 icon sizes) |
| start_url | Done ("/") |
| display: standalone/fullscreen | Done ("fullscreen") |
| HTTPS | Done (production) |
| Service worker with fetch handler | **Missing - to implement** |

**Source:** [Chrome Developer Docs](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest)

**Note:** As of Chrome 108 (mobile) and 112 (desktop), the service worker is no longer required for menu-based installation. However, the `beforeinstallprompt` event (for custom install buttons) still requires a fetch handler.

## Docker/Standalone Considerations

The custom service worker approach works seamlessly with `output: 'standalone'`:

1. `public/sw.js` is copied to `.next/standalone/public/` during build
2. No build-time service worker generation needed
3. No additional Docker configuration required
4. Works with existing Dockerfile

**No changes to Docker setup required.**

## Alternatives Considered

### 1. Wait for Chrome to Remove Fetch Handler Requirement

Chrome is "working to incorporate new signals" for the install prompt. However:
- No timeline provided
- Current behavior still requires fetch handler
- Not actionable today

**Verdict:** Not viable.

### 2. Use Workbox Directly (without Serwist/next-pwa)

Could use `workbox-webpack-plugin` directly, but:
- Still requires webpack plugin integration
- More complex than custom SW for this use case
- Adds dependency for marginal benefit

**Verdict:** Unnecessary complexity.

### 3. Use @serwist/turbopack

Newer Turbopack-compatible version, but:
- Requires esbuild as additional dependency
- Creates route handler (`app/serwist/[path]/route.ts`)
- Still overkill for simple caching

**Verdict:** Consider only if HabitStreak needs complex offline features later.

## Final Recommendation

```
+---------------------------+------------------+
|  Approach                 |  Recommendation  |
+---------------------------+------------------+
|  Custom service worker    |  USE THIS        |
|  Serwist                  |  Skip            |
|  next-pwa                 |  Deprecated      |
|  @ducanh2912/next-pwa     |  Skip            |
|  Workbox direct           |  Skip            |
+---------------------------+------------------+
```

**Implementation effort:** ~1 hour
- Create `public/sw.js` (30 lines)
- Add registration to layout
- Add header to next.config.js
- Test in Chrome DevTools

**Zero new dependencies. Maximum simplicity. Goal achieved.**

## Sources

### Official Documentation
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) - Official service worker pattern
- [Chrome Installability Criteria](https://developer.chrome.com/blog/update-install-criteria) - Fetch handler requirements
- [MDN Making PWAs Installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) - Manifest requirements

### Library Documentation
- [Serwist Getting Started](https://serwist.pages.dev/docs/next/getting-started) - Configuration details
- [Serwist Turbopack Guide](https://serwist.pages.dev/docs/next/turbo) - Turbopack-specific setup

### Package Information
- [serwist npm](https://www.npmjs.com/package/serwist) - Version 9.5.0, published January 2026
- [@serwist/next npm](https://www.npmjs.com/package/@serwist/next) - Version 9.5.0
- [@serwist/turbopack npm](https://www.npmjs.com/package/@serwist/turbopack) - Version 9.5.0

### Issue Tracking
- [Next.js #73457](https://github.com/vercel/next.js/issues/73457) - Serwist sw.js not created in Next.js 15
