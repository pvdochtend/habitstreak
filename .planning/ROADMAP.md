# Roadmap: HabitStreak

## Milestones

- ✅ **v1.0 UI Refresh** - Phases 1-4 (shipped 2026-01-18) - [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Self-Hosting & Polish** - Phases 5-8 (shipped 2026-01-19) - [Archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Auth.js v5 Migration** - Phase 9 (shipped 2026-01-23) - [Archive](milestones/v1.2-ROADMAP.md)
- 🚧 **v1.3 First Impressions** - Phases 10-12 (in progress)

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

### 🚧 v1.3 First Impressions (In Progress)

**Milestone Goal:** Create an inviting entry experience that showcases HabitStreak's playful personality before users even log in.

#### Phase 10: PWA Icons ✓
**Goal**: Generate complete PWA icon set to fix manifest 404 errors
**Depends on**: Nothing (first phase of v1.3)
**Requirements**: PWA-01, PWA-02, PWA-03
**Success Criteria** (what must be TRUE):
  1. PWA manifest loads without 404 errors in browser console
  2. App can be installed as PWA on Android/Chrome
  3. iOS home screen bookmark shows HabitStreak icon
**Status**: Complete

Plans:
- [x] 10-01: PWA Icon Generation

#### Phase 11: Landing Page ✓
**Goal**: Build landing page with hero, features, CTAs, and phone mockup
**Depends on**: Phase 10
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04, LAND-05, LAND-06, LAND-07
**Success Criteria** (what must be TRUE):
  1. Visitor at `/` sees landing page (not redirected to login)
  2. Visitor sees hero section with Dutch headline and CTA button
  3. Visitor sees phone mockup showing app preview
  4. Visitor sees feature highlights explaining app value
  5. Landing page displays correctly on mobile and desktop
**Status**: Complete

Plans:
- [x] 11-01: Landing Page with Hero, Mockup, and Features

#### Phase 12: Login Page Polish
**Goal**: Add welcoming message and branding to login page
**Depends on**: Phase 11
**Requirements**: LOGIN-01, LOGIN-02, LOGIN-03
**Success Criteria** (what must be TRUE):
  1. User sees welcoming message on login page
  2. User sees HabitStreak branding/logo on login page
  3. Login page visual style matches landing page glassmorphism
**Research**: Unlikely (minor UI adjustments to existing page)
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Visual Foundation | v1.0 | 3/3 | Complete | 2026-01-18 |
| 2. Task Animations | v1.0 | 2/2 | Complete | 2026-01-18 |
| 3. Streak Display | v1.0 | 2/2 | Complete | 2026-01-18 |
| 4. Backgrounds | v1.0 | 2/2 | Complete | 2026-01-18 |
| 5. Docker Foundation | v1.1 | 2/2 | Complete | 2026-01-19 |
| 6. Docker Deployment | v1.1 | 2/2 | Complete | 2026-01-19 |
| 7. Streak Fix | v1.1 | 1/1 | Complete | 2026-01-19 |
| 8. Animation Polish | v1.1 | 1/1 | Complete | 2026-01-19 |
| 9. Auth.js v5 | v1.2 | 2/2 | Complete | 2026-01-23 |
| 10. PWA Icons | v1.3 | 1/1 | Complete | 2026-01-27 |
| 11. Landing Page | v1.3 | 1/1 | Complete | 2026-01-27 |
| 12. Login Polish | v1.3 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-19*
*Last updated: 2026-01-27 after Phase 11 completion*
