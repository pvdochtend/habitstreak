---
status: diagnosed
phase: 16-service-worker-offline-support
source: [16-01-SUMMARY.md, 16-02-SUMMARY.md, 16-03-SUMMARY.md, 16-04-SUMMARY.md]
started: 2026-02-01T12:35:00Z
updated: 2026-02-01T12:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Service Worker Registration
expected: DevTools > Application > Service Workers shows sw.js activated and running
result: pass

### 2. Browser Install Prompt Available
expected: Chrome/Edge shows install icon in address bar (or menu > "Install HabitStreak")
result: pass

### 3. Static Assets Cached
expected: DevTools > Application > Cache Storage shows "habitstreak-v1" cache with icons and static assets
result: pass

### 4. Repeat Load Uses Cache
expected: Reload page. DevTools > Network shows static assets with "(ServiceWorker)" in Size column
result: pass

### 5. API Routes Not Cached
expected: Navigate around the app. DevTools > Network shows API calls have actual sizes (not cached)
result: pass

### 6. Offline Page Displays
expected: DevTools > Network > check "Offline". Navigate to any page. You see "Je bent offline" page with HabitStreak styling and WifiOff icon
result: pass

### 7. Retry Button Works
expected: While on offline page, uncheck "Offline" in DevTools, then click "Opnieuw proberen". App reloads successfully
result: issue
reported: "No. Clicking on 'opnieuw proberen' after putting it in 'online' mode. Only Refresh of the page (F5) will fix it."
severity: major

## Summary

total: 7
passed: 6
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Retry button reloads app when back online"
  status: failed
  reason: "User reported: Clicking on 'opnieuw proberen' after putting it in 'online' mode does nothing. Only Refresh of the page (F5) will fix it."
  severity: major
  test: 7
  root_cause: "window.location.reload() reloads /offline page itself, not original destination. Service worker fallback changes URL to /offline, so reload just reloads the offline page."
  artifacts:
    - path: "src/app/offline/page.tsx"
      issue: "Line 17: onClick={() => window.location.reload()} reloads /offline instead of navigating to app"
  missing:
    - "Change window.location.reload() to window.location.href = '/' to navigate to home page"
  debug_session: "direct-diagnosis"
