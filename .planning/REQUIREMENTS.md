# Requirements: HabitStreak v1.5 Service Worker

**Defined:** 2026-01-31
**Core Value:** Make every interaction feel rewarding.

## v1.5 Requirements

Requirements for service worker milestone. Each maps to roadmap phases.

### Service Worker Core

- [ ] **SW-01**: Service worker is registered on app load
- [ ] **SW-02**: Service worker includes fetch handler (enables Chromium install prompts)
- [ ] **SW-03**: sw.js has Cache-Control headers preventing stale service worker

### App Shell Caching

- [ ] **CACHE-01**: Static assets (JS, CSS) are cached for faster repeat loads
- [ ] **CACHE-02**: PWA icons are cached
- [ ] **CACHE-03**: API routes are excluded from caching (network-only)
- [ ] **CACHE-04**: Cached assets use versioned cache names for clean updates

### Offline Experience

- [ ] **OFFLINE-01**: Offline fallback page exists with Dutch message
- [ ] **OFFLINE-02**: Offline page uses HabitStreak branding (glassmorphism, colors)
- [ ] **OFFLINE-03**: Navigation requests show offline page when network unavailable

### Verification

- [ ] **VERIFY-01**: beforeinstallprompt event fires on Chrome/Edge
- [ ] **VERIFY-02**: Existing iOS walkthrough still works (no regression)
- [ ] **VERIFY-03**: Lighthouse PWA audit passes
- [ ] **VERIFY-04**: Production Docker build includes service worker

## Future Requirements

Deferred to later milestones.

### Notifications

- **NOTIF-01**: Push notification support
- **NOTIF-02**: Background sync for offline check-ins

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Offline data sync | HabitStreak requires network for check-ins; complexity not justified |
| Background sync | Low value for daily-use app; users check in when online |
| Push notifications | Separate feature, not related to installability |
| Update prompt UI | Silent updates simpler; new SW activates on next visit |
| Full offline mode | App data must be fresh; offline viewing adds cache invalidation complexity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SW-01 | TBD | Pending |
| SW-02 | TBD | Pending |
| SW-03 | TBD | Pending |
| CACHE-01 | TBD | Pending |
| CACHE-02 | TBD | Pending |
| CACHE-03 | TBD | Pending |
| CACHE-04 | TBD | Pending |
| OFFLINE-01 | TBD | Pending |
| OFFLINE-02 | TBD | Pending |
| OFFLINE-03 | TBD | Pending |
| VERIFY-01 | TBD | Pending |
| VERIFY-02 | TBD | Pending |
| VERIFY-03 | TBD | Pending |
| VERIFY-04 | TBD | Pending |

**Coverage:**
- v1.5 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14 (pending roadmap)

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after initial definition*
