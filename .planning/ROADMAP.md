# Roadmap: HabitStreak

## Milestones

- ✅ **v1.0 UI Refresh** - Phases 1-4 (shipped 2026-01-18)
- ✅ **v1.1 Self-Hosting & Polish** - Phases 5-8 (shipped 2026-01-19)
- 🚧 **v1.2 Auth.js v5 Migration** - Phase 9 (in progress)

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

## 🚧 v1.2 Auth.js v5 Migration (In Progress)

**Milestone Goal:** Enable dynamic URL detection so login works on localhost, LAN IPs, and custom domains without config changes.

### Phase 9: Auth.js v5 Migration
**Goal**: Migrate NextAuth v4 to Auth.js v5 with trustHost support
**Depends on**: Phase 8 (v1.1 complete)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, URL-01, URL-02, URL-03, URL-04, URL-05, URL-06
**Success Criteria** (what must be TRUE):
  1. User can log in via localhost:3000 and session persists
  2. User can log in via 127.0.0.1:3000 and session persists
  3. User can log in via LAN IP address and session persists
  4. User can log in via custom domain (if configured) and session persists
  5. All existing auth functionality works (login, logout, protected routes)
**Research**: Complete (see .planning/research/)
**Plans**: 2 plans in 2 waves

Plans:
- [ ] 09-01: Package + Configuration (wave 1)
- [ ] 09-02: Integration + Verification (wave 2)

## Progress

**Execution Order:**
Phases execute in numeric order: 9 → 9.1 (if inserted) → 10

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
| 9. Auth.js v5 | v1.2 | 0/2 | Planned | - |

---
*Roadmap created: 2026-01-19*
*Last updated: 2026-01-19 after phase 9 planning*
