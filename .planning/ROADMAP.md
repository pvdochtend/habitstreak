# Roadmap: HabitStreak

## Milestones

- ✅ **v1.0 UI Refresh** - Phases 1-4 (shipped 2026-01-18) - [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Self-Hosting & Polish** - Phases 5-8 (shipped 2026-01-19) - [Archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Auth.js v5 Migration** - Phase 9 (shipped 2026-01-23) - [Archive](milestones/v1.2-ROADMAP.md)
- ✅ **v1.3 First Impressions** - Phases 10-12 (shipped 2026-01-27) - [Archive](milestones/v1.3-ROADMAP.md)
- 🚧 **v1.4 App Experience** - Phases 13-15 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v1.0 UI Refresh (Phases 1-4) - SHIPPED 2026-01-18</summary>

### Phase 1: Visual Foundation
**Goal**: Establish glassmorphism design system
**Status**: Complete

### Phase 2: Task Completion Animations
**Goal**: Celebratory confetti and animated checkmarks
**Status**: Complete

### Phase 3: Streak Display
**Goal**: Animated flame icons and rolling numbers
**Status**: Complete

### Phase 4: Dynamic Backgrounds
**Goal**: Floating orbs and page transitions
**Status**: Complete

</details>

<details>
<summary>✅ v1.1 Self-Hosting & Polish (Phases 5-8) - SHIPPED 2026-01-19</summary>

### Phase 5: Docker Foundation
**Goal**: Multi-stage Docker build with standalone Next.js
**Status**: Complete

### Phase 6: Docker Deployment
**Goal**: docker-compose orchestration with PostgreSQL
**Status**: Complete

### Phase 7: Streak Calculation Fix
**Goal**: Fix weekend/weekday task mismatch bug
**Status**: Complete

### Phase 8: Animation Polish
**Goal**: Enhanced flame visibility and blink elimination
**Status**: Complete

</details>

<details>
<summary>✅ v1.2 Auth.js v5 Migration (Phase 9) - SHIPPED 2026-01-23</summary>

### Phase 9: Auth.js v5 Migration
**Goal**: Migrate NextAuth v4 to Auth.js v5 with trustHost support
**Status**: Complete

Plans:
- [x] 09-01: Package + Configuration (wave 1)
- [x] 09-02: Integration + Verification (wave 2)

</details>

<details>
<summary>✅ v1.3 First Impressions (Phases 10-12) - SHIPPED 2026-01-27</summary>

### Phase 10: PWA Icons
**Goal**: Generate complete PWA icon set to fix manifest 404 errors
**Status**: Complete

### Phase 11: Landing Page
**Goal**: Build landing page with hero, features, CTAs, and phone mockup
**Status**: Complete

### Phase 12: Login Page Polish
**Goal**: Add welcoming message and branding to login page
**Status**: Complete

</details>

---

## v1.4 App Experience (In Progress)

**Started:** 2026-01-28
**Goal:** Make PWA installation discoverable and easy, especially for iOS users

### Phase 13: Install Infrastructure

**Goal:** Browser events and platform detection work correctly

**Dependencies:** None (foundation phase)

**Requirements:** PLAT-01, PLAT-02, PLAT-03, BANR-05, DISM-01, DISM-02, DISM-03

**Plans:** 2 plans

Plans:
- [x] 13-01-PLAN.md — Schema migration + TypeScript types for PWA tracking
- [x] 13-02-PLAN.md — API endpoints, context provider, and root layout integration

**Success Criteria:**
1. App correctly identifies iOS Safari vs Chromium browsers on all devices ✓
2. App correctly detects when user is viewing in standalone/PWA mode ✓
3. beforeinstallprompt event is captured globally before any component mounts ✓
4. Dismissal state persists across browser sessions permanently ✓
5. Install prompts never show to users who already installed the app ✓

**Status:** Complete

---

### Phase 14: Landing Page Install Experience

**Goal:** First-time visitors can discover and install the PWA

**Dependencies:** Phase 13 (requires context provider and platform detection)

**Requirements:** BANR-01, BANR-03, BANR-04, IOS-01, IOS-02, IOS-03, ANDR-01, ANDR-02

**Plans:** 1 plan

Plans:
- [ ] 14-01-PLAN.md — PWA install banner UI with iOS walkthrough modal

**Success Criteria:**
1. Visitor on Android Chrome sees install banner with native prompt button
2. Visitor on iOS Safari sees install banner with "Show me how" button
3. iOS user clicking "Show me how" sees visual walkthrough with Share icon and step-by-step instructions in Dutch
4. Android user clicking "Install" triggers native browser install dialog
5. User clicking dismiss button permanently hides banner for that device

**Status:** Planned

---

### Phase 15: In-App Install Access

**Goal:** Logged-in users can install from inside the app

**Dependencies:** Phase 13 (requires context provider), Phase 14 (benefits from UI patterns)

**Requirements:** BANR-02, SETT-01, SETT-02, SETT-03

**Success Criteria:**
1. Logged-in user sees install banner on app pages (not just landing page)
2. Settings page shows "Install app" card between Account and Daily Target sections
3. Settings install button works even after banner was dismissed
4. Settings button triggers correct action for user's platform (native prompt for Android, walkthrough for iOS)

**Status:** Pending

---

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 UI Refresh | 1-4 | 9 | Complete | 2026-01-18 |
| v1.1 Self-Hosting | 5-8 | 6 | Complete | 2026-01-19 |
| v1.2 Auth.js v5 | 9 | 2 | Complete | 2026-01-23 |
| v1.3 First Impressions | 10-12 | 3 | Complete | 2026-01-27 |
| v1.4 App Experience | 13-15 | 3 | In Progress | — |

**Next:** Execute Phase 14 (Landing Page Install Experience)

---
*Roadmap created: 2026-01-19*
*Last updated: 2026-01-29 after Phase 14 planning*
