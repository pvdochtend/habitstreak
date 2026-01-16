# Project Research Summary

**Project:** HabitStreak UI Refresh
**Domain:** Frontend animation/design for mobile-first habit tracking app
**Researched:** 2026-01-16
**Confidence:** HIGH

## Executive Summary

HabitStreak's UI refresh transforms a functional but dull habit tracking app into a playful, celebratory experience. Research indicates this is a well-understood domain with established best practices—the key differentiator is execution quality, not novel techniques.

**Recommended approach:** CSS-first animations with selective use of Motion (formerly Framer Motion) for complex interactions. Use canvas-confetti for celebrations, respect accessibility with `prefers-reduced-motion` support from day one, and keep all micro-interactions under 300ms.

**Key risk:** Performance on mobile devices. Animation-heavy apps commonly fail here through layout-triggering CSS properties, infinite animation loops, and excessive particle counts. Mitigation is straightforward: only animate `transform` and `opacity`, pause off-screen animations, and reduce particle counts on mobile.

## Key Findings

### Recommended Stack

The modern React animation stack is mature and performant. Motion (Framer Motion rebrand) dominates with 12M+ monthly npm downloads and full React 19/Next.js 15 support.

**Core technologies:**
- **Motion v12.26** — Primary animation library, GPU-accelerated, spring physics, gesture support (~32KB)
- **tw-animate-css** — CSS-first Tailwind animations, replacing deprecated tailwindcss-animate
- **canvas-confetti v1.9.4** — Lightweight celebrations (~6KB), high-performance canvas rendering

**Supporting libraries:**
- **@formkit/auto-animate v0.9** — Zero-config list animations (~2KB), perfect for task lists
- **sonner** — Already included via shadcn/ui for toast notifications

### Expected Features

**Must have (table stakes):**
- Button press feedback (scale down, color change) — users expect instant response
- Smooth page transitions — professional polish
- Loading states with skeleton screens
- `prefers-reduced-motion` support — accessibility requirement, 70M+ people affected

**Should have (competitive):**
- Task completion checkmark animation with confetti burst
- Streak counter animation (number flip, flame icon)
- Milestone celebrations at 7, 30, 100, 365 days
- Haptic feedback on mobile (subtle)

**Defer (v2+):**
- Sound effects (controversial, default OFF)
- Complex Lottie animations (82KB+ bundle impact)
- Full particle backgrounds (@tsparticles React 19 compatibility uncertain)

### Architecture Approach

A layered architecture separates concerns while integrating with HabitStreak's existing theme system:

**Major components:**
1. **Foundation Layer** — CSS variables, keyframes, Tailwind config (already exists)
2. **Animation Layer** — Hooks (`useReducedMotion`), wrapper components, variant configs (new)
3. **Application Layer** — Feature components consuming animations via hooks/classes

**File structure:** Create `src/animations/` with `hooks/`, `components/`, `variants/`, and `config.ts` for centralized animation logic.

### Critical Pitfalls

1. **Animating layout properties** — Using `width`, `height`, `top`, `left` causes 10-30 FPS on mobile. Only animate `transform` and `opacity`.

2. **Ignoring `prefers-reduced-motion`** — 35%+ of adults over 40 have vestibular disorders. Not optional—it's an accessibility and legal requirement.

3. **iOS Safari quirks** — `background-attachment: fixed` disabled, scroll-driven animations unsupported, Low Power Mode throttles everything. Test on real iOS devices.

4. **Celebration fatigue** — Confetti on every task becomes noise. Reserve big celebrations for milestones; use subtle feedback for routine actions.

5. **Bundle bloat** — Full Framer Motion is 34KB. Use LazyMotion (4.6KB) or CSS-first approach where possible.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Animation Foundation
**Rationale:** Establish performance-safe patterns before building features on them
**Delivers:** Animation infrastructure that prevents pitfalls by design
**Addresses:** prefers-reduced-motion support, GPU-accelerated-only utilities, animation timing constants
**Avoids:** Layout-triggering properties, accessibility failures

### Phase 2: Core Micro-interactions
**Rationale:** Button feedback and state transitions are table stakes that make the app feel responsive
**Delivers:** Touch feedback, loading states, page transitions
**Uses:** CSS animations via tw-animate-css, existing Tailwind setup
**Implements:** Animation hooks, wrapper components

### Phase 3: Task Completion Celebrations
**Rationale:** Core UX moment—this is where the "spark of joy" lives
**Delivers:** Checkmark animations, confetti bursts, daily completion celebration
**Uses:** canvas-confetti, Motion for complex sequences
**Avoids:** Celebration fatigue (tiered intensity)

### Phase 4: Streak & Milestone System
**Rationale:** Retention driver—Duolingo found +1.7% 7-day retention from milestone animations
**Delivers:** Streak counter animation, flame icon, milestone celebrations (7/30/100/365 days)
**Implements:** Scaled celebration intensity matching achievement significance

### Phase 5: Polish & Refinement
**Rationale:** Final layer of delight after core experience is solid
**Delivers:** List animations with auto-animate, spring physics refinement, haptic feedback
**Uses:** @formkit/auto-animate, Motion spring configs

### Phase Ordering Rationale

- **Foundation first:** Prevents accumulating technical debt from performance-unsafe patterns
- **Micro-interactions before celebrations:** Table stakes must work before differentiators
- **Celebrations before milestones:** Task completion is more frequent, validates patterns
- **Polish last:** Refinement makes sense only after core experience is proven

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Milestones):** May need visual design exploration for celebration screens, badge system design

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented accessibility and performance patterns
- **Phase 2 (Micro-interactions):** Established CSS animation utilities
- **Phase 3 (Celebrations):** canvas-confetti has excellent docs and examples

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Motion dominates, canvas-confetti proven, React 19 compatibility verified |
| Features | HIGH | Duolingo/Streaks patterns well-documented, clear industry consensus |
| Architecture | HIGH | CSS-first approach standard, layered architecture well-established |
| Pitfalls | HIGH | Post-mortems and MDN/WCAG documentation provide clear guidance |

**Overall confidence:** HIGH

### Gaps to Address

- **Visual design direction:** User wants to see concepts (gradients vs flat vs glassmorphism) before committing. Not covered by technical research—needs design exploration phase.
- **@tsparticles React 19 compatibility:** Uncertain. Test before committing to particle backgrounds.
- **Haptic feedback patterns:** Web Vibration API has inconsistent browser support. Test on target devices.

## Sources

### Primary (HIGH confidence)
- [Motion Official Docs](https://motion.dev/) — Animation library documentation
- [canvas-confetti GitHub](https://github.com/catdad/canvas-confetti) — Confetti implementation
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — Accessibility requirements
- [W3C WCAG 2.3](https://www.w3.org/WAI/WCAG21/Understanding/seizures-and-physical-reactions.html) — Seizure prevention guidelines
- [web.dev Animation Performance](https://web.dev/animations-guide) — GPU acceleration guidance

### Secondary (MEDIUM confidence)
- [Duolingo Streak Milestone Design](https://blog.duolingo.com/streak-milestone-design-animation/) — Celebration patterns
- [Nielsen Norman Group Microinteractions](https://www.nngroup.com/articles/microinteractions/) — UX timing guidelines
- [Josh W. Comeau prefers-reduced-motion](https://www.joshwcomeau.com/react/prefers-reduced-motion/) — React implementation patterns

### Tertiary (LOW confidence)
- @tsparticles React 19 compatibility — needs verification
- Bundle size thresholds — estimates based on project complexity patterns

---
*Research completed: 2026-01-16*
*Ready for roadmap: yes*
