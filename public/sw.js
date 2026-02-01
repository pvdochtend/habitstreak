// HabitStreak Service Worker
// Enables PWA install prompts (beforeinstallprompt) and provides foundation for caching

const CACHE_VERSION = 'v1'
const CACHE_NAME = `habitstreak-${CACHE_VERSION}`

// Install event - activate immediately
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim()
  )
})

// Fetch handler - required for beforeinstallprompt
// Currently network passthrough, caching added in 16-02
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Network-only for API routes (never cache)
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Default: network passthrough (caching added in 16-02)
  event.respondWith(fetch(event.request))
})
