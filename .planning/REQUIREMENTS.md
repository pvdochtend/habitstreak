# Requirements: HabitStreak v1.4

**Defined:** 2026-01-27
**Core Value:** Make every interaction feel rewarding

## v1.4 Requirements

Requirements for App Experience milestone. Each maps to roadmap phases.

### Platform Detection

- [ ] **PLAT-01**: App detects iOS Safari vs Chromium browsers
- [ ] **PLAT-02**: App detects standalone/PWA mode (already installed)
- [ ] **PLAT-03**: App captures beforeinstallprompt event globally (prevents timing race)

### Install Banner

- [ ] **BANR-01**: Landing page shows install banner for non-installed visitors
- [ ] **BANR-02**: In-app pages show install banner for logged-in users
- [ ] **BANR-03**: Banner displays platform-appropriate messaging (iOS vs Android)
- [ ] **BANR-04**: Banner has dismiss button that hides permanently
- [ ] **BANR-05**: Banner hidden when app already installed (standalone mode)

### iOS Walkthrough

- [ ] **IOS-01**: "Show me how" button opens visual walkthrough modal
- [ ] **IOS-02**: Walkthrough shows step-by-step iOS Add to Home Screen process
- [ ] **IOS-03**: Walkthrough uses Dutch text consistent with app

### Android Install

- [ ] **ANDR-01**: Install button triggers native beforeinstallprompt dialog
- [ ] **ANDR-02**: Install button disabled/hidden if prompt not available

### Dismissal Persistence

- [ ] **DISM-01**: Dismissed state stored in localStorage
- [ ] **DISM-02**: Dismissal persists across sessions permanently
- [ ] **DISM-03**: Dismissal is per-device (not per-user)

### Settings Fallback

- [ ] **SETT-01**: Settings page shows "Install app" button
- [ ] **SETT-02**: Settings button available even after banner dismissed
- [ ] **SETT-03**: Settings button triggers platform-appropriate action (prompt or walkthrough)

## Future Requirements

Deferred to later milestones.

### Analytics

- **ANAL-01**: Track install prompt impressions
- **ANAL-02**: Track install success rate
- **ANAL-03**: Track dismissal rate

### Enhanced UX

- **ENH-01**: Re-prompt after streak milestones (for dismissed users)
- **ENH-02**: Install success celebration animation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Push notifications prompt | Separate concern, high complexity |
| Install analytics | No analytics infrastructure yet |
| Re-prompting dismissed users | User requested permanent dismissal |
| Custom install success screen | Native browser handles this |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 13 | Complete |
| PLAT-02 | Phase 13 | Complete |
| PLAT-03 | Phase 13 | Complete |
| BANR-01 | Phase 14 | Pending |
| BANR-02 | Phase 15 | Pending |
| BANR-03 | Phase 14 | Pending |
| BANR-04 | Phase 14 | Pending |
| BANR-05 | Phase 13 | Complete |
| IOS-01 | Phase 14 | Pending |
| IOS-02 | Phase 14 | Pending |
| IOS-03 | Phase 14 | Pending |
| ANDR-01 | Phase 14 | Pending |
| ANDR-02 | Phase 14 | Pending |
| DISM-01 | Phase 13 | Complete |
| DISM-02 | Phase 13 | Complete |
| DISM-03 | Phase 13 | Complete |
| SETT-01 | Phase 15 | Pending |
| SETT-02 | Phase 15 | Pending |
| SETT-03 | Phase 15 | Pending |

**Coverage:**
- v1.4 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-27*
*Last updated: 2026-01-28 after Phase 13 completion*
