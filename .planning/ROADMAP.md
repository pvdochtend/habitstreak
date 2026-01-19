# Roadmap: HabitStreak v1.1

## Overview

HabitStreak v1.1 delivers self-hosting capability via Docker, fixes the streak calculation edge case with weekend/weekday tasks, and polishes the flame animation visibility. Three focused phases enable incremental deployment: Docker infrastructure first (unblocks self-hosting), then streak logic fix (core functionality), and finally visual polish (user delight).

## Milestones

- ✅ **v1.0 MVP** - Phases 1-5 (shipped 2026-01-18)
- 🚧 **v1.1 Self-Hosting & Polish** - Phases 6-8 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 6: Docker Deployment** - Full containerization for Synology NAS self-hosting
- [x] **Phase 7: Streak Calculation Fix** - Correct weekend/weekday task mismatch bug
- [ ] **Phase 8: Animation Polish** - Improve flame visibility and fix blink bug

## Phase Details

### Phase 6: Docker Deployment
**Goal**: App runs in Docker containers for self-hosting
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: DOCKER-01, DOCKER-02, DOCKER-03, DOCKER-04, DOCKER-05, DOCKER-06
**Success Criteria** (what must be TRUE):
  1. Docker image builds under 300MB with `docker build`
  2. `docker-compose up` starts both app and PostgreSQL
  3. App health endpoint responds at `/api/health`
  4. Prisma migrations run automatically at container startup
  5. User can deploy on Synology NAS following documented steps
**Research**: Unlikely (research already completed, patterns documented in SUMMARY.md)
**Plans**: 3 plans in 3 waves

Plans:
- [ ] 06-01: Foundation (standalone config, health endpoint, .dockerignore) — Wave 1
- [ ] 06-02: Docker Files (Dockerfile, docker-compose, env template) — Wave 2
- [ ] 06-03: Verification & Docs (local test, Synology docs) — Wave 3 [checkpoint]

### Phase 7: Streak Calculation Fix
**Goal**: Streaks calculate correctly when scheduledCount < dailyTarget
**Depends on**: Phase 6 (can be developed independently but Docker enables testing)
**Requirements**: STREAK-01, STREAK-02, STREAK-03, STREAK-04
**Success Criteria** (what must be TRUE):
  1. User with 2 ALL_WEEK tasks and dailyTarget=3 succeeds on Saturday after completing both
  2. Current streak doesn't break on weekends when fewer tasks scheduled than target
  3. Best streak calculation uses same effectiveTarget logic
  4. Unit tests verify WORKWEEK/WEEKEND edge cases
**Research**: Unlikely (algorithm clear from research)
**Plans**: TBD

Plans:
- [x] 07-01: Streak Calculation Fix (TDD) — Wave 1

### Phase 8: Animation Polish
**Goal**: Flame animation is clearly visible on mobile
**Depends on**: Phase 7 (can be developed independently)
**Requirements**: ANIM-01, ANIM-02, ANIM-03
**Success Criteria** (what must be TRUE):
  1. Flame glow is visible in daylight on mobile screens
  2. Animation completes without visual blink/glitch
  3. Users with prefers-reduced-motion see static flame (no animation)
**Research**: Unlikely (existing debug files document issues)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 6. Docker Deployment | 3/3 | Complete | 2026-01-19 |
| 7. Streak Calculation Fix | 1/1 | Complete | 2026-01-19 |
| 8. Animation Polish | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-18*
*v1.1 milestone: 3 phases, 13 requirements*
