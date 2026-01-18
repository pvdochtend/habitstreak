# Roadmap: HabitStreak UI Refresh

## Overview

Transform HabitStreak from a functional but dull habit tracker into a playful, celebratory experience. Starting with visual direction exploration, then building performance-safe animation infrastructure, followed by rewarding task completion interactions, streak celebrations, and finally polishing the entire experience to feel consistently fun.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Visual Identity Exploration** - Establish visual direction through design concepts
- [x] **Phase 2: Animation Foundation** - Performance-safe animation infrastructure with accessibility
- [x] **Phase 3: Task Completion Experience** - Rewarding task check-in interactions
- [x] **Phase 4: Celebrations & Streaks** - Full celebration system and streak visualizations
- [ ] **Phase 5: Polish & Consistency** - Unified playful personality across all screens

## Phase Details

### Phase 1: Visual Identity Exploration
**Goal**: Establish visual direction through design concepts before committing to implementation
**Depends on**: Nothing (first phase)
**Requirements**: VISUAL-04
**Success Criteria** (what must be TRUE):
  1. User can review 2-3 visual concept mockups/screenshots
  2. Design direction decision is documented in PROJECT.md
**Research**: Unlikely (design exploration, not technical)
**Plans**: TBD

Plans:
- [x] 01-01: Create visual concept mockups for user review (glassmorphism chosen)

### Phase 2: Animation Foundation
**Goal**: Performance-safe animation infrastructure with accessibility support
**Depends on**: Phase 1 (visual direction informs color choices)
**Requirements**: ANIM-01, ANIM-02, ANIM-03, ANIM-04, VISUAL-01
**Success Criteria** (what must be TRUE):
  1. User sees instant visual feedback when pressing buttons
  2. User sees skeleton loading states while content loads
  3. User sees smooth transitions between pages
  4. User with motion sensitivity sees reduced/no animations
  5. User experiences bolder, more vibrant blue/pink colors
**Research**: Unlikely (well-documented accessibility and performance patterns)
**Plans**: TBD

Plans:
- [x] 02-01: Color & glass foundation (vibrant palette, glassmorphism utilities)
- [x] 02-02: Animation feedback & transitions (button feedback, shimmer skeletons, page transitions)
- [x] 02-03: Motion sensitivity & verification (prefers-reduced-motion, visual checkpoint)

### Phase 3: Task Completion Experience
**Goal**: Rewarding task check-in interactions that spark joy
**Depends on**: Phase 2 (uses animation foundation)
**Requirements**: TASK-01, TASK-02, TASK-03, TASK-04, CELEB-01
**Success Criteria** (what must be TRUE):
  1. User sees animated checkmark when completing a task
  2. User sees color fill effect on task completion
  3. User sees particle burst from completed task
  4. User feels haptic feedback on mobile
  5. User sees small confetti burst when completing a task
**Research**: Unlikely (canvas-confetti has excellent docs and examples)
**Plans**: TBD

Plans:
- [x] 03-01: Implement checkmark animation and color fill
- [x] 03-02: Add particle burst and haptic feedback
- [x] 03-03: Integrate small confetti on task completion
- [x] 03-04: Implement optimistic UI for instant feedback
- [x] 03-05: Fix mobile touch state issues

### Phase 4: Celebrations & Streaks
**Goal**: Full celebration system and streak visualizations
**Depends on**: Phase 3 (builds on celebration patterns)
**Requirements**: CELEB-02, STREAK-01, STREAK-02
**Success Criteria** (what must be TRUE):
  1. User sees large confetti explosion when all daily tasks are completed
  2. User sees number flip animation when streak count changes
  3. User sees animated flame icon next to active streak
**Research**: Unlikely (established animation patterns)
**Plans**: TBD

Plans:
- [x] 04-01: Implement all-tasks-done celebration
- [x] 04-02: Add streak counter animation and flame icon

### Phase 5: Polish & Consistency
**Goal**: Unified playful personality across all screens
**Depends on**: Phase 4 (final polish after core features)
**Requirements**: VISUAL-02, VISUAL-03
**Success Criteria** (what must be TRUE):
  1. User sees dynamic animated backgrounds
  2. User experiences consistent playful personality across all screens
**Research**: Likely (dynamic backgrounds approach needs validation)
**Research topics**: @tsparticles React 19 compatibility, simpler CSS/canvas alternatives for backgrounds
**Plans**: TBD

Plans:
- [ ] 05-01: Implement animated background component (CSS floating orbs)
- [ ] 05-02: Visual consistency audit and targeted fixes + verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Visual Identity Exploration | 1/1 | Complete | 2026-01-16 |
| 2. Animation Foundation | 3/3 | Complete | 2026-01-16 |
| 3. Task Completion Experience | 5/5 | Complete | 2026-01-17 |
| 4. Celebrations & Streaks | 2/2 | Complete | 2026-01-17 |
| 5. Polish & Consistency | 0/2 | Not started | - |
