# Requirements: HabitStreak UI Refresh

**Defined:** 2026-01-16
**Core Value:** Make every interaction feel rewarding. When users complete a task, build a streak, or open the app, they should feel a spark of joy.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Animation Foundation

- [ ] **ANIM-01**: User sees immediate visual feedback (scale + color) when pressing buttons
- [ ] **ANIM-02**: User sees skeleton loading states while content loads
- [ ] **ANIM-03**: User experiences smooth transitions between pages (fade/slide)
- [ ] **ANIM-04**: User with motion sensitivity sees reduced/no animations (prefers-reduced-motion)

### Task Completion

- [ ] **TASK-01**: User sees animated checkmark when completing a task (draw-on or spring pop)
- [ ] **TASK-02**: User sees color fill effect when task completes
- [ ] **TASK-03**: User sees small particle burst from completed task
- [ ] **TASK-04**: User feels haptic feedback when completing a task (mobile)

### Celebrations

- [ ] **CELEB-01**: User sees small confetti burst when completing a single task
- [ ] **CELEB-02**: User sees large confetti explosion when all daily tasks are completed

### Streak Visuals

- [ ] **STREAK-01**: User sees number flip/roll animation when streak count changes
- [ ] **STREAK-02**: User sees animated flame icon next to active streak

### Visual Identity

- [ ] **VISUAL-01**: User experiences bold, vibrant color palette (enhanced blue/pink)
- [ ] **VISUAL-02**: User sees dynamic animated backgrounds
- [ ] **VISUAL-03**: User experiences consistent playful personality across all screens
- [x] **VISUAL-04**: User reviews visual style concepts before final implementation (gradients vs flat vs glass)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Animation Foundation

- **ANIM-05**: Form validation feedback with shake animation

### Streak Visuals

- **STREAK-03**: Glow pulse effect on streak number
- **STREAK-04**: Flame size grows with streak length

### Milestone Celebrations

- **MILE-01**: User sees special celebration at 7-day streak milestone
- **MILE-02**: User sees full-screen celebration at 30-day streak milestone
- **MILE-03**: User sees extended celebration at 100-day streak milestone
- **MILE-04**: User can share milestone achievement cards

### Sound & Haptics

- **SOUND-01**: User hears optional subtle chime on task completion
- **SOUND-02**: User hears optional fanfare on milestones

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Sound effects | User preference varies widely; research recommends visual-first |
| 365-day milestone | Need users to reach 100 days first; defer to v3+ |
| Achievement badge system | Full gamification adds complexity; keep v1 focused |
| Custom Lottie animations | 82KB+ bundle impact; CSS/Motion sufficient for v1 |
| @tsparticles backgrounds | React 19 compatibility uncertain; use simpler approach |
| Share cards | Social features deferred to v2 |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ANIM-01 | Phase 2 | Pending |
| ANIM-02 | Phase 2 | Pending |
| ANIM-03 | Phase 2 | Pending |
| ANIM-04 | Phase 2 | Pending |
| TASK-01 | Phase 3 | Complete |
| TASK-02 | Phase 3 | Complete |
| TASK-03 | Phase 3 | Complete |
| TASK-04 | Phase 3 | Complete |
| CELEB-01 | Phase 3 | Complete |
| CELEB-02 | Phase 4 | Pending |
| STREAK-01 | Phase 4 | Pending |
| STREAK-02 | Phase 4 | Pending |
| VISUAL-01 | Phase 2 | Pending |
| VISUAL-02 | Phase 5 | Pending |
| VISUAL-03 | Phase 5 | Pending |
| VISUAL-04 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16 ✓
- Unmapped: 0

---
*Requirements defined: 2026-01-16*
*Last updated: 2026-01-17 after Phase 3 completion*
