---
status: testing
phase: 16-service-worker-offline-support
source: [16-01-SUMMARY.md, 16-02-SUMMARY.md, 16-03-SUMMARY.md, 16-04-SUMMARY.md]
started: 2026-02-01T12:35:00Z
updated: 2026-02-01T12:35:00Z
---

## Current Test

number: 1
name: Service Worker Registration
expected: |
  Open http://localhost:3000 in Chrome/Edge. Open DevTools (F12) > Application > Service Workers.
  You should see a service worker "sw.js" with status "activated and is running".
awaiting: user response

## Tests

### 1. Service Worker Registration
expected: DevTools > Application > Service Workers shows sw.js activated and running
result: [pending]

### 2. Browser Install Prompt Available
expected: Chrome/Edge shows install icon in address bar (or menu > "Install HabitStreak")
result: [pending]

### 3. Static Assets Cached
expected: DevTools > Application > Cache Storage shows "habitstreak-v1" cache with icons and static assets
result: [pending]

### 4. Repeat Load Uses Cache
expected: Reload page. DevTools > Network shows static assets with "(ServiceWorker)" in Size column
result: [pending]

### 5. API Routes Not Cached
expected: Navigate around the app. DevTools > Network shows API calls have actual sizes (not cached)
result: [pending]

### 6. Offline Page Displays
expected: DevTools > Network > check "Offline". Navigate to any page. You see "Je bent offline" page with HabitStreak styling and WifiOff icon
result: [pending]

### 7. Retry Button Works
expected: While on offline page, uncheck "Offline" in DevTools, then click "Opnieuw proberen". App reloads successfully
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
