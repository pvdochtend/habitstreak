# Phase 16: Service Worker + Offline Support - Research

**Researched:** 2026-01-31
**Domain:** Service Workers, PWA Caching, Offline Fallback
**Confidence:** HIGH

## Summary

This phase implements a service worker to enable Chrome/Edge install prompts and provide offline support. The key insight is that **Chrome still requires a service worker with a functioning fetch handler** for the `beforeinstallprompt` event to fire, even though installation from the browser menu no longer requires one.

The recommended approach is a **manual service worker** (not using next-pwa or Serwist) because:
1. The requirements are minimal (cache static assets, offline fallback)
2. Next-pwa is deprecated/unmaintained
3. Manual implementation provides full control and understanding
4. Avoids build complexity and bundle bloat

**Primary recommendation:** Write a vanilla service worker in `/public/sw.js` with cache-first strategy for static assets and network-first with offline fallback for navigation requests.

## Standard Stack

### Core
| Component | Implementation | Purpose | Why Standard |
|-----------|---------------|---------|--------------|
| Service Worker | Vanilla JS in `/public/sw.js` | Intercept fetch, cache assets | No dependencies, full control |
| Registration | Client component with useEffect | Register SW on app load | Next.js App Router pattern |
| Offline Page | `/app/offline/page.tsx` | Show when network unavailable | Next.js static page generation |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| next.config.js headers | N/A | Set Cache-Control for sw.js | Always - prevents stale SW |
| Chrome DevTools | N/A | Debug SW, test offline | Development/verification |
| Lighthouse | Latest | PWA audit verification | Final verification |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual SW | next-pwa | next-pwa is unmaintained, adds complexity |
| Manual SW | Serwist | Overkill for simple caching, adds build step |
| Manual SW | Workbox | Good for complex caching, overkill here |

**Installation:** None required - vanilla JavaScript only.

## Architecture Patterns

### Recommended Project Structure
```
public/
  sw.js                    # Service worker (vanilla JS)
  offline.html             # Fallback for non-Next.js clients (optional)
  manifest.json            # Already exists
  icons/                   # Already exists
src/
  app/
    offline/
      page.tsx             # Offline fallback page (Dutch)
  components/
    pwa/
      service-worker-registration.tsx  # Client component for SW registration
```

### Pattern 1: Service Worker Registration (Client Component)

**What:** Register service worker on app load using React useEffect
**When to use:** Always - needed to activate the service worker

```typescript
// Source: Next.js App Router pattern for browser APIs
'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope)
        })
        .catch((error) => {
          console.error('SW registration failed:', error)
        })
    }
  }, [])

  return null
}
```

### Pattern 2: Cache-First for Static Assets

**What:** Serve cached static assets (JS, CSS, icons) immediately, never hit network
**When to use:** For immutable Next.js build artifacts in `/_next/static/`

```javascript
// Source: Chrome Workbox documentation, adapted for vanilla JS
const CACHE_NAME = 'habitstreak-v1'
const STATIC_CACHE_URLS = [
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/offline',
]

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Cache-first for static Next.js assets
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone)
          })
          return response
        })
      })
    )
    return
  }
})
```

### Pattern 3: Network-First with Offline Fallback for Navigation

**What:** Try network first for page requests, fallback to offline page on failure
**When to use:** For all navigation requests (HTML pages)

```javascript
// Source: Google Chrome samples - custom offline page
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline')
      })
    )
    return
  }
})
```

### Pattern 4: Network-Only for API Routes

**What:** Never cache API responses, always hit network
**When to use:** For `/api/*` routes to ensure fresh data

```javascript
// Source: PWA best practices - avoid stale data
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Network-only for API routes (no caching)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }
})
```

### Pattern 5: Cache Versioning and Cleanup

**What:** Use versioned cache names, delete old caches on activate
**When to use:** Always - prevents stale cached assets after deployments

```javascript
// Source: MDN Service Worker documentation
const CACHE_VERSION = 'v1'
const CACHE_NAME = `habitstreak-${CACHE_VERSION}`

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('habitstreak-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})
```

### Anti-Patterns to Avoid

- **Caching API responses:** Leads to stale data, users see outdated task completion status
- **Using `skipWaiting()` unconditionally:** Can cause version mismatches between cached assets
- **Forgetting `clients.claim()`:** First page load won't be controlled by service worker
- **Precaching too much:** Increases install time, wastes bandwidth
- **Empty fetch handlers:** Chrome detects and ignores them, `beforeinstallprompt` won't fire

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cache management | Custom cache expiration | Versioned cache names + cleanup on activate | Simple, reliable, matches deployment cycle |
| Offline detection | Custom navigator.onLine polling | Service worker fetch failure handling | More reliable, handles edge cases |
| Asset manifest generation | Manual file list | Precache icons only, runtime cache JS/CSS | Next.js hashes change every build |

**Key insight:** Keep the service worker simple. Complex offline-first data sync is explicitly out of scope. The goal is: (1) enable install prompts, (2) cache static assets, (3) show offline page.

## Common Pitfalls

### Pitfall 1: Service Worker Caching Itself
**What goes wrong:** Browser caches sw.js, updates don't deploy
**Why it happens:** Default caching headers on static files
**How to avoid:** Set `Cache-Control: no-cache, no-store, must-revalidate` for `/sw.js` in next.config.js
**Warning signs:** Changes to service worker don't take effect after deploy

### Pitfall 2: Stale JS/CSS After Deploy
**What goes wrong:** Users see broken UI after deployment
**Why it happens:** Service worker serves old cached JS that references moved/renamed code
**How to avoid:** Use versioned cache names, clean up old caches on activate
**Warning signs:** Console errors about missing chunks, broken interactivity

### Pitfall 3: API Data Cached Incorrectly
**What goes wrong:** Users see stale task lists, check-ins don't persist
**Why it happens:** Fetch handler caches API responses
**How to avoid:** Explicitly exclude `/api/*` from caching (network-only)
**Warning signs:** Data inconsistencies, "completed" tasks show as incomplete

### Pitfall 4: `beforeinstallprompt` Not Firing
**What goes wrong:** No install prompt on Chrome/Edge despite service worker
**Why it happens:** Empty fetch handler, or handler throws errors
**How to avoid:** Ensure fetch handler actually handles requests (not no-op)
**Warning signs:** DevTools shows SW registered but event never fires

### Pitfall 5: Offline Page Not Precached
**What goes wrong:** Network failure shows browser error instead of offline page
**Why it happens:** Offline page wasn't cached during SW install
**How to avoid:** Precache `/offline` URL during install event
**Warning signs:** Test offline mode, see browser "No internet" instead of custom page

### Pitfall 6: Service Worker Scope Issues
**What goes wrong:** SW doesn't control all pages
**Why it happens:** SW registered at wrong path, or start_url outside scope
**How to avoid:** Register SW at root (`/sw.js`), ensure manifest start_url is `/`
**Warning signs:** Some pages don't trigger SW fetch events

## Code Examples

### Complete Service Worker (sw.js)

```javascript
// Source: Chrome samples + MDN + best practices compiled
const CACHE_VERSION = 'v1'
const CACHE_NAME = `habitstreak-${CACHE_VERSION}`

// Pre-cache these during install
const PRECACHE_URLS = [
  '/offline',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
]

// Install: pre-cache offline page and icons
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    })
  )
})

// Activate: clean up old caches, claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('habitstreak-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Fetch: handle requests with appropriate strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Network-only for API routes
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Navigation requests: network-first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline')
      })
    )
    return
  }

  // Static assets: cache-first (runtime caching)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached
        }
        return fetch(event.request).then((response) => {
          // Don't cache non-ok responses
          if (!response || response.status !== 200) {
            return response
          }
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone)
          })
          return response
        })
      })
    )
    return
  }

  // Default: network-first
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request)
    })
  )
})
```

### Service Worker Registration Component

```typescript
// Source: Next.js App Router client component pattern
'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Register on next tick to not block initial render
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        // Log success for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('Service Worker registered:', registration.scope)
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }

    registerSW()
  }, [])

  return null
}
```

### Next.js Config Headers for sw.js

```javascript
// Source: Chrome best practices for service worker caching
// next.config.js
module.exports = {
  // ... existing config
  async headers() {
    return [
      // ... existing headers
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
    ]
  },
}
```

### Offline Page (Dutch)

```typescript
// Source: HabitStreak design patterns
// src/app/offline/page.tsx
import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 max-w-sm text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">Je bent offline</h1>
        <p className="text-muted-foreground">
          Controleer je internetverbinding en probeer het opnieuw.
        </p>
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SW required for install | SW optional for menu install | Chrome 108 (2022) | Install prompts still need fetch handler |
| Max 24h SW cache | Browser ignores HTTP cache by default | Chrome 68 (2018) | Still set no-cache for safety |
| next-pwa library | Deprecated, use manual SW or Serwist | 2023+ | Avoid next-pwa |
| Workbox required | Vanilla JS sufficient for basic PWAs | Always | Workbox adds complexity |
| Service worker required for Lighthouse PWA | PWA category deprecated | Lighthouse 11+ | Focus on functionality |

**Deprecated/outdated:**
- `next-pwa`: No longer maintained, compatibility issues with Next.js 13+
- Lighthouse PWA category: Being removed, service worker not strictly required for installability
- `sw-precache`/`sw-toolbox`: Replaced by Workbox, but Workbox is overkill for simple cases

## Open Questions

1. **Navigation preload support**
   - What we know: Can improve performance for navigation requests
   - What's unclear: Whether it's needed for this simple use case
   - Recommendation: Skip for MVP, add later if navigation feels slow

2. **Build-time precache manifest**
   - What we know: Serwist/Workbox can generate lists of assets to precache
   - What's unclear: Whether it's worth the build complexity
   - Recommendation: Skip for MVP, runtime cache JS/CSS instead of precaching

## Sources

### Primary (HIGH confidence)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) - Core patterns
- [Chrome DevTools PWA Docs](https://developer.chrome.com/docs/devtools/progressive-web-apps) - Debugging
- [Chrome Install Criteria Update](https://developer.chrome.com/blog/update-install-criteria) - Fetch handler requirement clarification
- [Google Chrome Offline Sample](https://googlechrome.github.io/samples/service-worker/custom-offline-page/) - Official offline fallback pattern

### Secondary (MEDIUM confidence)
- [web.dev Install Criteria](https://web.dev/articles/install-criteria) - Manifest requirements
- [Workbox Caching Strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview/) - Strategy patterns (adapted for vanilla JS)
- [Next.js Discussions #82498](https://github.com/vercel/next.js/discussions/82498) - Offline-first Next.js 15 patterns

### Tertiary (LOW confidence)
- [LogRocket Next.js Service Workers](https://blog.logrocket.com/implementing-service-workers-next-js/) - Registration patterns (blog post)
- [Medium: Adding PWA to Next.js](https://medium.com/@issam.ahw/navigating-the-complexity-adding-pwa-to-next-js-without-third-party-libraries-abefe83bf093) - Manual SW approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on official Chrome/MDN documentation
- Architecture: HIGH - Based on established patterns and official samples
- Pitfalls: HIGH - Well-documented in official resources and community experience
- Cache strategies: HIGH - Chrome Workbox docs, adapted to vanilla JS

**Research date:** 2026-01-31
**Valid until:** 90 days (service worker APIs are stable, Chrome criteria may evolve)

## Key Verification Checklist for Implementation

- [ ] Service worker registers on app load (DevTools > Application > Service Workers)
- [ ] Fetch handler exists and handles requests (not empty/no-op)
- [ ] sw.js served with no-cache headers
- [ ] beforeinstallprompt event fires (Chromium browsers)
- [ ] Static assets (_next/static/*) cached and served from cache
- [ ] PWA icons cached
- [ ] API routes bypass cache (network-only)
- [ ] Cache version bumps on deploy
- [ ] Offline page at /offline with Dutch message
- [ ] Offline page uses glassmorphism styling
- [ ] Navigation while offline shows offline page
- [ ] iOS Safari walkthrough still works (no regression)
- [ ] Lighthouse PWA audit passes (or shows expected deprecation)
- [ ] Production Docker build includes sw.js
