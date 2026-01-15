# HabitStreak UI Refresh

## What This Is

A playful, energetic redesign of HabitStreak's user interface. The app already works — authentication, task scheduling, check-ins, streaks, and insights are all functional. This project transforms the visual experience from boring and generic to bold, fun, and memorable. Habit tracking should feel like a celebration, not a chore.

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

### Active

<!-- UI refresh scope — building toward these -->

- [ ] Bold visual identity — unique, memorable look that stands out from generic apps
- [ ] Vibrant color palette — bolder, more saturated blue/pink that pops
- [ ] Full-energy animations — particle effects, dynamic backgrounds, satisfying micro-interactions
- [ ] Celebratory task completion — tapping a task should feel rewarding (confetti, bounce, etc.)
- [ ] Streak milestone celebrations — hitting streak milestones should feel like achievements
- [ ] Inviting daily overview — opening the app should feel welcoming and show progress beautifully
- [ ] Consistent playful personality — the whole experience should feel fun, not just isolated moments
- [ ] Visual concept exploration — design options to review before committing to a specific style

### Out of Scope

- New features (no new functionality, focus is purely visual) — keep scope tight
- Backend changes (existing APIs work fine) — this is a frontend project
- Accessibility overhaul (maintain current accessibility, don't regress) — not a redesign of a11y
- Complete rebrand (keeping blue/pink identity) — evolution, not revolution

## Context

**Current state:** HabitStreak is a functional mobile-first habit tracking app built with Next.js 15, React 19, TypeScript, Tailwind CSS, and shadcn/ui components. The UI works but feels dull, static, and generic — "it looks like every other app."

**User's vision:** Playful & fun personality. The app should feel like a game, not a chore. Bold visual identity with strong colors. Full-energy animations — particle effects, dynamic backgrounds, wow on every tap.

**Existing theme system:** The app has blue/pink color schemes and dark mode support via CSS variables and React context. This infrastructure can be leveraged for the refresh.

**Style direction:** User wants to see visual concepts (gradients vs flat vs glassmorphism) before committing. Colors should stay blue/pink but become more vibrant and saturated.

## Constraints

- **Tech stack**: Must use existing stack (React, Tailwind, shadcn/ui base) — no new frameworks
- **Performance**: Animations must be smooth on mobile (GPU-accelerated, no jank)
- **Existing functionality**: All current features must continue working — no regressions
- **Color foundation**: Keep blue/pink as core palette — enhance, don't replace

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep blue/pink palette | User wants evolution not revolution; existing brand recognition | — Pending |
| Explore multiple visual styles | User wants to see concepts before committing | — Pending |
| Full-energy animations | User explicitly chose maximum motion/delight | — Pending |

---
*Last updated: 2026-01-15 after initialization*
