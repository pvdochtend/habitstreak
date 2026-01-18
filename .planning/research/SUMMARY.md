# Project Research Summary

**Project:** HabitStreak v1.1 Self-Hosting & Polish
**Domain:** Next.js Docker Deployment + Streak Calculation + CSS Animation
**Researched:** 2026-01-18
**Confidence:** HIGH

## Executive Summary

HabitStreak v1.1 targets three distinct areas: Docker deployment for Synology NAS self-hosting, a streak calculation bug fix, and CSS animation visibility improvements. Research reveals all three areas have well-documented patterns and pitfalls.

**Docker deployment** follows established patterns: multi-stage Dockerfile with `output: 'standalone'`, `node:22-alpine` base image, PostgreSQL in docker-compose with health checks, and Prisma migrations at container startup. The stack is mature with high confidence recommendations.

**Streak calculation** bug is identified: when `scheduledCount < dailyTarget` (e.g., weekend with 2 ALL_WEEK tasks but dailyTarget=3), users fail days even after completing all scheduled tasks. The fix is `effectiveTarget = Math.min(dailyTarget, scheduledCount)`. The existing skip logic for zero scheduled days is already correct.

**Flame animation visibility** requires increasing shadow opacity from 30% to 50%+, avoiding `drop-shadow` filter (Safari bugs), and ensuring no `shadow-sm` class conflicts with animation end state (documented blink bug).

## Key Findings

### Recommended Stack (Docker)

Docker deployment is well-established for Next.js + Prisma + PostgreSQL.

**Core technologies:**
- `node:22-alpine`: Active LTS since Oct 2024, ~153MB, optimal for Next.js 15
- `postgres:16-alpine`: Matches existing dev setup, proven stable, ~82MB
- `output: 'standalone'` in next.config.js: Reduces image from 1GB+ to ~200MB

**Critical patterns:**
- Multi-stage Dockerfile (4 stages: base, deps, builder, runner)
- Run `prisma migrate deploy` at container startup (not build time)
- Use Docker service name `postgres` in DATABASE_URL (not localhost)
- Health checks on both services with `depends_on: condition: service_healthy`

### Streak Calculation Fix

**Root cause identified:** Current algorithm evaluates `completedCount >= dailyTarget` without considering when fewer tasks are scheduled than the target.

**Scenario that fails:**
- Saturday with 2 ALL_WEEK tasks (WORKWEEK tasks not scheduled)
- dailyTarget = 3
- User completes both tasks
- Current: `2 >= 3` = FAIL (streak broken)
- Fixed: `2 >= min(3, 2)` = SUCCESS

**The fix (one line change):**
```typescript
// Current
const isSuccessful = completedCount >= dailyTarget

// Fixed
const effectiveTarget = Math.min(dailyTarget, scheduledCount)
const isSuccessful = completedCount >= effectiveTarget
```

### Animation Visibility

**Current issue:** Flame glow uses `rgba(249, 115, 22, 0.3)` — only 30% opacity, barely visible on mobile in daylight.

**Recommendations:**
- Increase opacity to 0.5-0.6
- Replace `drop-shadow` filter with `box-shadow` (Safari compatibility)
- Fix documented blink bug: remove `shadow-sm` class during animation
- Keep all animation changes within existing reduced-motion media query

### Critical Pitfalls

Top pitfalls to avoid in implementation:

1. **Missing `output: 'standalone'`** — Current next.config.js lacks this. Image will be 1GB+ without it.
2. **DATABASE_URL at build time** — Prisma needs a dummy URL during `next build` to parse schema.
3. **Container uses localhost** — DATABASE_URL must use service name `postgres`, not `localhost`.
4. **dailyTarget > scheduledCount** — The main streak bug. Fix with `Math.min()`.
5. **Shadow opacity too low** — 30% is invisible. Use 50%+ for visibility.
6. **`shadow-sm` conflicts with animation** — Causes visual blink at animation end.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Docker Deployment
**Rationale:** Self-contained deliverable, well-documented patterns, prerequisite for self-hosting goal
**Delivers:** Dockerfile, docker-compose.prod.yml, health endpoint, deployment docs
**Addresses:** Self-hosting on Synology NAS
**Avoids:** Pitfalls D1-D8 (standalone output, Prisma generation, migrations, health checks)

**Tasks:**
1. Add `output: 'standalone'` to next.config.js
2. Create `/api/health` endpoint
3. Create `.dockerignore`
4. Create multi-stage Dockerfile
5. Create docker-compose.prod.yml with PostgreSQL
6. Create .env.production.example template
7. Test locally with docker-compose
8. Document Synology deployment steps

### Phase 2: Streak Calculation Fix
**Rationale:** Small, focused bug fix with clear solution from research
**Delivers:** Fixed streak calculation, unit tests for edge cases
**Addresses:** Weekend/weekday task mismatch bug
**Avoids:** Pitfalls S1, S5 (variable schedule semantics, daily target mismatch)

**Tasks:**
1. Add unit tests for WORKWEEK/WEEKEND edge cases
2. Fix `calculateCurrentStreak` with effectiveTarget
3. Fix `calculateBestStreak` with same pattern
4. Verify timezone handling (TZ=Europe/Amsterdam)
5. Test DST edge cases

### Phase 3: Flame Animation Polish
**Rationale:** Visual improvement, existing debug research available
**Delivers:** More visible flame animation, fixed blink bug
**Addresses:** "Flame animation not visible enough" feedback
**Avoids:** Pitfalls A1-A6 (Safari bugs, opacity, shadow conflicts)

**Tasks:**
1. Increase flame glow opacity from 30% to 50%
2. Replace `drop-shadow` with `box-shadow` if needed
3. Fix animate-glow blink bug (shadow-sm conflict)
4. Verify prefers-reduced-motion support
5. Test on iOS Safari

### Phase Ordering Rationale

- **Docker first:** Enables deployment/testing workflow. No dependencies on other features.
- **Streak fix second:** Can be developed and tested locally or in Docker. Clear specification from research.
- **Animation last:** Purely visual polish. Lowest priority, can be tested in any environment.

### Research Flags

Phases that may need deeper research during planning:
- **Phase 1 (Docker):** Synology-specific reverse proxy configuration if HTTPS needed — not deeply researched

Phases with standard patterns (skip research-phase):
- **Phase 2 (Streak):** Algorithm is clear, implementation is straightforward
- **Phase 3 (Animation):** Existing debug files document the issues

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (Docker) | HIGH | Official Next.js and Prisma documentation |
| Architecture (Docker) | HIGH | Multi-stage pattern is well-established |
| Features (Streak) | HIGH | Bug identified, fix verified against industry patterns |
| Pitfalls (Docker) | HIGH | Well-documented in official sources |
| Pitfalls (Streak) | MEDIUM | Based on code analysis, needs test verification |
| Pitfalls (Animation) | HIGH | Documented in project debug files + MDN |

**Overall confidence:** HIGH

### Gaps to Address

- **Synology reverse proxy:** HTTPS termination not deeply researched. Handle during implementation if needed.
- **Target Synology model:** Need to confirm CPU architecture (amd64 assumed for Plus series).
- **Streak freeze feature:** Schema has `streakFreezes` field but implementation deferred (out of scope for v1.1).

## Sources

### Primary (HIGH confidence)
- [Next.js Official Docker Example](https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/docker)
- [Habitica Wiki - Streaks](https://habitica.fandom.com/wiki/Streaks)
- [Loop Habit Tracker Source](https://github.com/iSoron/uhabits)

### Secondary (MEDIUM confidence)
- [Marius Hosting - Synology Docker Guides](https://mariushosting.com/category/synology-docker/)
- [Trophy - How to Build Streaks](https://trophy.so/blog/how-to-build-a-streaks-feature)
- [Josh Comeau - Designing Shadows](https://www.joshwcomeau.com/css/designing-shadows/)

### Tertiary (LOW confidence)
- Project debug files: `.planning/debug/*.md` — local analysis, high relevance but untested fixes

---
*Research completed: 2026-01-18*
*Ready for roadmap: yes*
