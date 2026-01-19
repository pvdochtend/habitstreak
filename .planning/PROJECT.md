# HabitStreak

## Current Milestone: v1.2 Auth.js v5 Migration

**Goal:** Migrate from NextAuth v4 to Auth.js v5 to enable dynamic URL detection and future-proof the authentication stack.

**Target features:**
- Auth.js v5 migration with `trustHost` support
- Dynamic URL detection (localhost, IP, domain, reverse proxy — no config changes needed)
- Maintained existing auth functionality (credentials provider, JWT sessions)
- E2E test coverage for multi-URL authentication

**Status:** Ready to define requirements

## What This Is

A playful, energetic redesign of HabitStreak's user interface featuring glassmorphism design, full-energy animations, and celebratory interactions. The app transforms habit tracking from a chore into a joyful experience with confetti bursts, animated checkmarks, flickering streak flames, and dynamic floating backgrounds.

## Core Value

**Make every interaction feel rewarding.** When users complete a task, build a streak, or open the app, they should feel a spark of joy — not just see a checkbox change state.

## Requirements

### Validated

<!-- Existing features — shipped and working -->

- ✓ User authentication (signup, login, sessions) — existing
- ✓ Task management with scheduling presets (ALL_WEEK, WORKWEEK, WEEKEND, CUSTOM) — existing
- ✓ Daily check-ins (mark tasks as done) — existing
- ✓ Streak tracking (current and best streaks) — existing
- ✓ 7-day insights with chart — existing
- ✓ Theme support (blue/pink color schemes, dark mode) — existing
- ✓ Rate limiting and security — existing
- ✓ Mobile-first responsive design — existing
- ✓ Dutch UI text, English code — existing

<!-- v1.0 UI Refresh — shipped 2026-01-18 -->

- ✓ Bold visual identity — glassmorphism with frosted panels and semi-transparent backgrounds — v1.0
- ✓ Vibrant color palette — 94-95% saturation blue/pink colors — v1.0
- ✓ Full-energy animations — particles, confetti, animated backgrounds, micro-interactions — v1.0
- ✓ Celebratory task completion — confetti bursts, animated checkmarks, particle effects, haptic feedback — v1.0
- ✓ Streak milestone celebrations — all-tasks confetti, rolling numbers, flickering flame icons — v1.0
- ✓ Inviting daily overview — glass cards, animated background orbs, smooth page transitions — v1.0
- ✓ Consistent playful personality — unified glassmorphism across all screens — v1.0
- ✓ Visual concept exploration — glassmorphism chosen from three mockups — v1.0

<!-- v1.1 Self-Hosting & Polish — shipped 2026-01-19 -->

- ✓ Docker deployment — Full containerization (351MB image) with PostgreSQL orchestration and Synology NAS documentation — v1.1
- ✓ Streak calculation fix — effectiveTarget formula corrects weekend/weekday task mismatch edge case — v1.1
- ✓ Flame animation visibility — Enhanced glow (50-80% opacity) and eliminated visual blink on completion — v1.1

### Active

<!-- v1.2 Auth.js v5 Migration -->

- [ ] Migrate NextAuth v4 → Auth.js v5
- [ ] Enable `trustHost` for dynamic URL detection
- [ ] Login works on localhost, IP address, domain, and reverse proxy without config changes
- [ ] Existing auth functionality preserved (credentials provider, JWT sessions, user scoping)
- [ ] E2E tests verify multi-URL authentication

### Out of Scope

- Sound effects — user preference varies widely; research recommends visual-first
- 365-day milestone celebrations — need users to reach 100 days first
- Achievement badge system — full gamification adds complexity
- Custom Lottie animations — 82KB+ bundle impact; CSS/Motion sufficient
- @tsparticles backgrounds — React 19 compatibility uncertain; CSS approach used instead
- Share cards — social features deferred
- iOS scroll-to-top fix — deferred to v1.3; tracked in debug session
- Test configuration fixes — deferred to v1.3; low priority (Prisma mock + Playwright config)
- Domain/reverse proxy setup — v1.2 enables capability only; actual setup is deployment task

## Context

**Current state:** HabitStreak v1.1 ships with Docker self-hosting, streak fix, and animation polish. 5,692 lines of TypeScript/TSX, production-ready Docker deployment (351MB image), comprehensive unit tests for streak logic.

**Tech stack:** Next.js 15 (standalone output), React 19, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, Docker.

**v1.0 delivered (2026-01-18):** Glassmorphism visual identity, full animation foundation, joyful task completion experience, animated streak displays, dynamic backgrounds, consistent glass styling across all screens.

**v1.1 delivered (2026-01-19):** Docker containerization with multi-stage builds, PostgreSQL orchestration, Synology NAS deployment guide (both GUI/CLI paths), fixed streak calculation with isDaySuccessful() pure function, enhanced flame visibility, eliminated animation blink bug.

**Known issues:**
- iOS scroll-to-top on navigation (tracked in `.planning/debug/scroll-to-top-ios-navigation.md`) — deferred to v1.3
- Login IP address issue — resolved; solution is Auth.js v5 migration (this milestone)

**v1.2 context:**
- NextAuth v4.24.11 chosen in initial commit (Jan 6, 2026) before formal planning
- v4 lacks `trustHost` feature (Auth.js v5 only), preventing dynamic URL detection
- Current workaround: set NEXTAUTH_URL manually to match access method
- Migration will enable login on localhost/IP/domain/reverse proxy without config changes

## Constraints

- **Tech stack**: Must use existing stack (React, Tailwind, shadcn/ui base) — no new frameworks
- **Performance**: Animations must be smooth on mobile (GPU-accelerated, no jank)
- **Existing functionality**: All current features must continue working — no regressions
- **Color foundation**: Keep blue/pink as core palette — enhance, don't replace
- **Accessibility**: All animations respect prefers-reduced-motion

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep blue/pink palette | User wants evolution not revolution; existing brand recognition | ✓ Good — 94-95% saturation achieved |
| Explore multiple visual styles | User wants to see concepts before committing | ✓ Good — glassmorphism chosen |
| Full-energy animations | User explicitly chose maximum motion/delight | ✓ Good — confetti, particles, flames implemented |
| Visual direction: Glassmorphism | User reviewed gradient, flat, and glass mockups; chose glass for its modern depth | ✓ Good — unified across all screens |
| Pure CSS animations over libraries | Keeps bundle small, GPU-accelerated | ✓ Good — only canvas-confetti added (~3KB) |
| canvas-confetti for celebrations | Realistic physics, GPU-accelerated, lightweight | ✓ Good — satisfying task completion feel |
| Optimistic UI for task completion | Instant visual feedback before server confirms | ✓ Good — eliminates perceived latency |
| Per-digit number rolling | Independent tens/ones animation for smoother visuals | ✓ Good — professional polish |
| Three-tier float timing (25s/18s/12s) | Prevents synchronized orb movement | ✓ Good — organic background feel |
| Inline HSL for dynamic colors | Avoids Tailwind JIT purging dynamic classes | ✓ Good — fixes background visibility |
| Next.js standalone output for Docker | Reduces image from 1GB+ to 351MB | ✓ Good — enables practical self-hosting |
| isDaySuccessful() pure function | Single source of truth for streak logic | ✓ Good — testable and consistent |
| effectiveTarget formula | min(dailyTarget, scheduledCount) allows success on low-scheduled days | ✓ Good — fixes critical streak bug |
| Portal-based dialog rendering | Bypasses PageTransition transform constraints | ✓ Good — fixes positioning issues |
| Animation-only-on-mount pattern | hasMounted ref prevents re-trigger on data refresh | ✓ Good — eliminates visual blink |

---
*Last updated: 2026-01-19 after starting v1.2 milestone*
