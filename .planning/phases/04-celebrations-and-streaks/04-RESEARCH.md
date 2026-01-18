# Phase 4: Celebrations & Streaks - Research

**Researched:** 2026-01-17
**Domain:** Animations (number transitions, icon effects, celebration triggers)
**Confidence:** HIGH

## Summary

Phase 4 builds celebration and streak visualization features on top of Phase 3's confetti infrastructure. The key challenge is implementing smooth number roll animations and animated flame icons while maintaining the project's pure-CSS preference and small bundle size.

Research reveals that **pure CSS number rolling animations** using `translateY` transforms are the standard approach for streak counters - they require no library, perform excellently on mobile, and integrate with `prefers-reduced-motion`. For flame animations, **CSS keyframe animations with transform/opacity** (not filters) deliver smooth 60fps performance without GPU overhead.

The all-tasks-done celebration should trigger client-side using derived state comparison, building on the existing optimistic UI pattern from Phase 3.

**Primary recommendation:** Use pure CSS for both number rolling and flame animations - no additional libraries needed. The existing `canvas-confetti` handles the explosion effect.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| canvas-confetti | ^1.9.4 | Large confetti explosion | Already integrated, `fireAllTasksConfetti()` ready |
| Tailwind CSS | ^3.4.17 | Animation utilities | Project standard, custom keyframes in globals.css |
| Lucide React | ^0.460.0 | Flame icon base | Already using `<Flame>` in streak-card.tsx |

### Supporting (No Install Needed)
| Technology | Purpose | When to Use |
|------------|---------|-------------|
| CSS @keyframes | Number rolling, flame flicker | All animations |
| CSS custom properties | Dynamic animation delays | Staggered sequences |
| usePrevious hook | Detect streak changes | Trigger animation on increase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure CSS rolling | react-slot-counter (~10KB) | Adds dependency, pure CSS is lighter and sufficient for single-digit changes |
| Pure CSS flame | Lottie animation | 50KB+ for player, overkill for simple icon |
| Framer Motion | Full animation library | 32KB, already have CSS animations working well |
| @property CSS counter | CSS counter() | @property has limited browser support (Chrome/Edge only), translateY works everywhere |

**Installation:**
```bash
# No new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── insights/
│       ├── streak-card.tsx          # Enhance existing (add AnimatedStreakNumber, AnimatedFlame)
│       └── animated-streak-number.tsx # New: Pure CSS digit roller
│       └── animated-flame.tsx        # New: CSS flame animation
├── lib/
│   └── confetti.ts                  # Already has fireAllTasksConfetti()
└── app/globals.css                  # Add @keyframes for roll + flame
```

### Pattern 1: Pure CSS Number Rolling

**What:** Stack digits 0-9 vertically, translate to show current digit
**When to use:** Displaying streak count with roll animation on change
**Example:**
```tsx
// AnimatedStreakNumber component
interface AnimatedStreakNumberProps {
  value: number;
  previousValue?: number;
}

export function AnimatedStreakNumber({ value, previousValue }: AnimatedStreakNumberProps) {
  const shouldAnimate = previousValue !== undefined && value !== previousValue;

  return (
    <div className="relative h-[1em] overflow-hidden">
      <div
        className={cn(
          "flex flex-col transition-transform duration-500",
          shouldAnimate && "ease-out"
        )}
        style={{ transform: `translateY(-${value * 1}em)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <span key={digit} className="h-[1em] leading-none">{digit}</span>
        ))}
      </div>
    </div>
  );
}
```

**CSS (globals.css):**
```css
@keyframes digitRoll {
  from { transform: translateY(var(--from-offset)); }
  to { transform: translateY(var(--to-offset)); }
}

.animate-digit-roll {
  animation: digitRoll 0.6s cubic-bezier(0.34, 1.25, 0.64, 1) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .animate-digit-roll {
    animation: none !important;
    transform: translateY(var(--to-offset)) !important;
  }
}
```

### Pattern 2: CSS Flame Animation

**What:** Animate Lucide Flame icon with scale/opacity flicker
**When to use:** Active streak indicator (streak > 0)
**Example:**
```tsx
// AnimatedFlame component
interface AnimatedFlameProps {
  isActive: boolean;
  className?: string;
}

export function AnimatedFlame({ isActive, className }: AnimatedFlameProps) {
  return (
    <div className={cn(
      "relative",
      isActive && "animate-flame-glow"
    )}>
      <Flame
        className={cn(
          "h-6 w-6",
          isActive && "animate-flame-flicker text-orange-500",
          !isActive && "text-muted-foreground",
          className
        )}
        strokeWidth={2.5}
      />
    </div>
  );
}
```

**CSS (globals.css):**
```css
@keyframes flameFlicker {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  25% {
    transform: scale(1.05) rotate(-2deg);
    opacity: 0.9;
  }
  50% {
    transform: scale(0.98) rotate(1deg);
    opacity: 1;
  }
  75% {
    transform: scale(1.02) rotate(-1deg);
    opacity: 0.95;
  }
}

@keyframes flameGlow {
  0%, 100% {
    filter: drop-shadow(0 0 2px rgba(249, 115, 22, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 6px rgba(249, 115, 22, 0.5));
  }
}

.animate-flame-flicker {
  animation: flameFlicker 1.5s ease-in-out infinite;
  transform-origin: bottom center;
}

.animate-flame-glow {
  animation: flameGlow 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-flame-flicker,
  .animate-flame-glow {
    animation: none !important;
  }
}
```

### Pattern 3: All-Tasks Celebration Trigger

**What:** Detect when all tasks complete, fire confetti once
**When to use:** VandaagPage when completedCount reaches totalCount
**Example:**
```tsx
// usePrevious hook (add to src/lib/hooks.ts or inline)
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// In VandaagPage component
const prevCompletedCount = usePrevious(data?.completedCount);
const allTasksComplete = data && data.totalCount > 0 && data.completedCount === data.totalCount;
const justCompletedAll = allTasksComplete &&
  prevCompletedCount !== undefined &&
  prevCompletedCount < data.totalCount;

useEffect(() => {
  if (justCompletedAll) {
    fireAllTasksConfetti();
    triggerHaptic('success');
  }
}, [justCompletedAll]);
```

### Anti-Patterns to Avoid
- **Using filter: blur() for flame:** Causes performance issues on mobile, use drop-shadow sparingly instead
- **Animating with @property counter():** Limited browser support (Chrome only), translateY works everywhere
- **Triggering celebration in task item:** Leads to multiple celebrations per task, detect at page level
- **Re-triggering on every render:** Use usePrevious to only fire when transition happens

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Large confetti explosion | Custom particle system | `fireAllTasksConfetti()` | Already implemented, GPU-accelerated, respects reduced motion |
| Haptic feedback | Custom vibration API | `triggerHaptic('success')` | Already abstracted in src/lib/haptics.ts |
| Animation sequencing | Complex state machine | CSS animation-delay | Browser handles timing, simpler code |
| Previous value tracking | Manual ref management | usePrevious hook pattern | Standard React pattern, few lines of code |

**Key insight:** Phase 3 already built the celebration infrastructure. Phase 4 adds the trigger conditions and streak visualizations, not new celebration mechanisms.

## Common Pitfalls

### Pitfall 1: Multiple Celebration Triggers
**What goes wrong:** Confetti fires multiple times or on page refresh
**Why it happens:** Derived "allComplete" state is true on mount if data loads complete
**How to avoid:** Use usePrevious to detect transition from incomplete to complete, not just state
**Warning signs:** Confetti on page load, confetti on tab switch

### Pitfall 2: Number Animation on Every Digit
**What goes wrong:** Complex multi-digit roller for values like "1" or "7"
**Why it happens:** Over-engineering for streak values that rarely exceed double digits
**How to avoid:** Start with single/double digit support (0-99), expand only if needed
**Warning signs:** Handling thousands separators for a streak counter

### Pitfall 3: Filter-Based Flame Animation
**What goes wrong:** Janky animation, battery drain, dropped frames on mobile
**Why it happens:** filter: blur() is expensive even when GPU-accelerated
**How to avoid:** Use transform + opacity only, drop-shadow is lighter than blur
**Warning signs:** Animation stutters on iPhone Safari

### Pitfall 4: Animation Without Reduced Motion
**What goes wrong:** Accessibility failure, vestibular disorder triggers
**Why it happens:** Forgetting to add @media query for each new animation
**How to avoid:** Always add prefers-reduced-motion block alongside new keyframes
**Warning signs:** Animations still running with "Reduce motion" enabled in OS

### Pitfall 5: Stale Closure in Celebration Effect
**What goes wrong:** Celebration fires with old data values
**Why it happens:** useEffect closure captures stale state
**How to avoid:** Include all dependencies, or use useEffectEvent (React 19)
**Warning signs:** Wrong streak number displayed, celebration timing off

## Code Examples

Verified patterns from official sources:

### CSS Number Rolling (Transform-based)
```css
/* Source: CSS-Tricks, SitePoint, CodePen patterns */
.digit-roller {
  height: 1em;
  overflow: hidden;
  line-height: 1;
}

.digit-stack {
  display: flex;
  flex-direction: column;
  transition: transform 0.6s cubic-bezier(0.34, 1.25, 0.64, 1);
}

.digit-stack span {
  height: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### CSS Flame Flicker (Performance-Optimized)
```css
/* Source: Subframe, SitePoint "Playing with Fire" */
@keyframes flameFlicker {
  0%, 100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  33% {
    transform: scale(1.02, 1.04) translateY(-1px);
    opacity: 0.95;
  }
  66% {
    transform: scale(0.98, 1.01) translateY(0);
    opacity: 1;
  }
}

.flame-icon {
  animation: flameFlicker 1.2s ease-in-out infinite;
  transform-origin: 50% 100%; /* Anchor at bottom */
}
```

### usePrevious Hook (React Pattern)
```typescript
// Source: developerway.com, React docs discussion
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<{ value: T; prev: T | undefined }>({
    value,
    prev: undefined,
  });

  const current = ref.current.value;

  if (value !== current) {
    ref.current = {
      value,
      prev: current,
    };
  }

  return ref.current.prev;
}
```

### Staggered Animation with CSS Variables
```css
/* Source: CSS-Tricks "Different Approaches for Creating a Staggered Animation" */
.staggered-item {
  animation: fadeSlideUp 0.4s ease-out forwards;
  animation-delay: calc(var(--animation-order, 0) * 100ms);
  opacity: 0;
}

@keyframes fadeSlideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## State of the Art (2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @property CSS counters | Transform-based rolling | 2024 (browser support) | @property still Chrome-only, transform universal |
| filter: blur for effects | transform + opacity | 2023 (perf awareness) | Much better mobile performance |
| GSAP for simple animations | CSS keyframes | 2022+ | No library needed for basic effects |
| framer-motion for everything | CSS + minimal JS | 2024+ | Bundle size consciousness |

**Current tools to consider:**
- Motion (formerly Framer Motion): AnimateNumber at 2.5KB for complex number animations if pure CSS insufficient
- react-slot-counter: If multi-digit slot machine effect needed, but pure CSS covers our use case

**Deprecated/outdated:**
- Odometer.js: Unmaintained since 2019, though pattern still valid
- jQuery animation plugins: Replaced by CSS and modern React patterns

## Open Questions

Things that couldn't be fully resolved:

1. **Multi-digit number rolling for large streaks**
   - What we know: Simple 0-99 range covered by pure CSS approach
   - What's unclear: If user reaches 100+ day streak, should each digit roll independently?
   - Recommendation: Start with 0-99 support, treat 100+ as edge case for later

2. **Celebration sound effect**
   - What we know: Requirements mention confetti, not sound
   - What's unclear: Should celebration include optional sound?
   - Recommendation: Skip for Phase 4, add in Phase 5 if desired

3. **Streak animation on insights page load**
   - What we know: Number rolling works on value change
   - What's unclear: Should number roll from 0 to current value on first load?
   - Recommendation: Initial load shows static value, animate only on change

## Sources

### Primary (HIGH confidence)
- CSS-Tricks: Animating Number Counters - https://css-tricks.com/animating-number-counters/
- CSS-Tricks: Staggered Animation Approaches - https://css-tricks.com/different-approaches-for-creating-a-staggered-animation/
- MDN: prefers-reduced-motion - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- developerway.com: usePrevious hook - https://www.developerway.com/posts/implementing-advanced-use-previous-hook
- React docs: useMemo and useEffect patterns - https://react.dev/reference/react/useMemo

### Secondary (MEDIUM confidence)
- SitePoint: Playing with Fire CSS Animation - https://www.sitepoint.com/playing-with-fire-organic-css3-animation/
- Chrome Developers: Animated blur performance - https://developer.chrome.com/blog/animated-blur
- BuildUI: Animated Counter Recipe - https://buildui.com/recipes/animated-counter
- Josh Collinsworth: CSS transitions tips - https://joshcollinsworth.com/blog/great-transitions

### Tertiary (LOW confidence)
- Various CodePen examples for visual reference (patterns verified against primary sources)
- WebSearch results for ecosystem discovery (claims verified with official sources)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, builds on existing Phase 3 work
- Architecture: HIGH - Pure CSS patterns well-documented, usePrevious is standard React
- Pitfalls: HIGH - Performance issues with filters well-documented, accessibility requirements clear
- Code examples: HIGH - All verified against CSS-Tricks, MDN, or React docs

**Research date:** 2026-01-17
**Valid until:** 2026-03-17 (CSS animation patterns are stable, 60 days validity)
