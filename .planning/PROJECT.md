# HabitStreak UI Refresh

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

### Active

<!-- Next milestone scope — to be defined -->

(None yet — run `/gsd:define-requirements` to scope next milestone)

### Out of Scope

- Sound effects — user preference varies widely; research recommends visual-first
- 365-day milestone celebrations — need users to reach 100 days first
- Achievement badge system — full gamification adds complexity
- Custom Lottie animations — 82KB+ bundle impact; CSS/Motion sufficient
- @tsparticles backgrounds — React 19 compatibility uncertain; CSS approach used instead
- Share cards — social features deferred

## Context

**Current state:** HabitStreak v1.0 ships with complete UI refresh. 5,600 lines of TypeScript/TSX, glassmorphism design system, canvas-confetti integration (~3KB), comprehensive prefers-reduced-motion support.

**Tech stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL.

**v1.0 delivered:** Glassmorphism visual identity, full animation foundation, joyful task completion experience, animated streak displays, dynamic backgrounds, consistent glass styling across all screens.

**Pending observations from v1.0:**
- Streak calculation has edge case with weekend/weekday task mismatches (captured as todo)
- Flame animation could be more visible/bold (captured as todo)

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

---
*Last updated: 2026-01-18 after v1.0 milestone*
