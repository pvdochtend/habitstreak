# Animation System Architecture Research

> Research conducted: 2026-01-16
> Domain: Frontend animation/design refresh for HabitStreak
> Stack: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui

## System Overview

```
+------------------------------------------------------------------+
|                        APPLICATION LAYER                          |
|  (Pages, Features - consume animations via hooks/components)      |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      ANIMATION LAYER                              |
|  +------------------+  +------------------+  +------------------+ |
|  | Animation Hooks  |  | Motion Components|  | Animation Config | |
|  | useAnimation     |  | FadeIn, SlideUp  |  | variants.ts      | |
|  | useReducedMotion |  | ScaleIn, etc.    |  | durations.ts     | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      CONTEXT LAYER                                |
|  +------------------+  +------------------+                       |
|  | ThemeProvider    |  | AnimationProvider|                       |
|  | (existing)       |  | (new - optional) |                       |
|  +------------------+  +------------------+                       |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      FOUNDATION LAYER                             |
|  +------------------+  +------------------+  +------------------+ |
|  | CSS Variables    |  | Tailwind Config  |  | Keyframes        | |
|  | (globals.css)    |  | (animations)     |  | (globals.css)    | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
```

**Confidence Level: HIGH** - This layered architecture is well-documented across multiple sources and aligns with React best practices.

## Component Responsibilities

### 1. Foundation Layer (CSS/Tailwind)

**Responsibility:** Define raw animation primitives that are GPU-optimized and theme-aware.

| Component | Purpose | Location |
|-----------|---------|----------|
| CSS Variables | Theme colors, timing functions, durations | `globals.css` |
| Keyframes | Raw @keyframes definitions | `globals.css` |
| Tailwind Config | Animation utility classes | `tailwind.config.ts` |
| tailwindcss-animate | Plugin for entrance/exit animations | `tailwind.config.ts` |

**Current State:** HabitStreak already has this layer well-established with:
- Theme CSS variables (blue/pink, light/dark)
- Custom keyframes (slideUp, fadeIn, scaleIn, checkmark, celebrate, etc.)
- tailwindcss-animate plugin installed

### 2. Context Layer (State Management)

**Responsibility:** Provide global animation settings and theme integration.

| Component | Purpose |
|-----------|---------|
| ThemeProvider | Manages color scheme and dark mode (existing) |
| AnimationProvider (optional) | Manages reduced motion, animation speed preferences |

**Recommendation:** Extend the existing `ThemeProvider` or create a lightweight `AnimationProvider` for:
- Reduced motion preference detection
- Global animation speed settings
- Animation enable/disable toggle

**Confidence Level: MEDIUM** - Creating a separate AnimationProvider adds complexity. For HabitStreak's scale, extending ThemeProvider or using hooks directly may be sufficient.

### 3. Animation Layer (Reusable Logic)

**Responsibility:** Encapsulate animation logic for reuse across components.

| Component | Purpose |
|-----------|---------|
| Animation Hooks | Reusable animation state and controls |
| Motion Components | Pre-built animated wrapper components |
| Animation Config | Centralized variant and timing definitions |

### 4. Application Layer (Features)

**Responsibility:** Consume animations naturally within feature components.

Components in this layer should:
- Import animation hooks or wrapper components
- Apply animation classes via Tailwind
- Not contain raw animation logic

## Recommended Project Structure

```
src/
├── animations/                    # NEW: Animation system
│   ├── hooks/
│   │   ├── index.ts               # Re-exports all hooks
│   │   ├── use-reduced-motion.ts  # Detects prefers-reduced-motion
│   │   ├── use-animation.ts       # General animation state hook
│   │   └── use-stagger.ts         # Staggered list animations
│   │
│   ├── components/
│   │   ├── index.ts               # Re-exports all components
│   │   ├── fade-in.tsx            # Fade entrance animation
│   │   ├── slide-up.tsx           # Slide up entrance animation
│   │   ├── scale-in.tsx           # Scale entrance animation
│   │   ├── stagger-container.tsx  # Parent for staggered children
│   │   └── motion-wrapper.tsx     # Generic animation wrapper
│   │
│   ├── variants/
│   │   ├── index.ts               # Re-exports all variants
│   │   ├── entrance.ts            # Entrance animation variants
│   │   ├── exit.ts                # Exit animation variants
│   │   └── gestures.ts            # Hover, tap, focus variants
│   │
│   └── config.ts                  # Timing constants, easing curves
│
├── components/
│   ├── ui/                        # shadcn/ui components (existing)
│   ├── theme/                     # Theme components (existing)
│   ├── tasks/                     # Task feature components (existing)
│   ├── insights/                  # Insights components (existing)
│   └── navigation/                # Navigation components (existing)
│
├── contexts/
│   └── theme-context.tsx          # Existing theme context
│
└── app/
    └── globals.css                # Keyframes, CSS variables (existing)
```

**Confidence Level: HIGH** - This structure follows the "group by feature" pattern for animations while maintaining colocation with existing code. Sources: [Robin Wieruch](https://www.robinwieruch.de/react-folder-structure/), [Tania Rascia](https://www.taniarascia.com/react-architecture-directory-structure/)

## Architectural Patterns

### Pattern 1: Custom Animation Hooks

**Purpose:** Encapsulate animation state and controls for reuse.

```typescript
// src/animations/hooks/use-reduced-motion.ts
import { useState, useEffect } from 'react'

const QUERY = '(prefers-reduced-motion: no-preference)'

export function useReducedMotion(): boolean {
  // Default to reduced motion on SSR to prevent hydration mismatch
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(QUERY)
    // If query matches, user prefers motion (no-preference)
    setPrefersReducedMotion(!mediaQueryList.matches)

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(!event.matches)
    }

    mediaQueryList.addEventListener('change', listener)
    return () => mediaQueryList.removeEventListener('change', listener)
  }, [])

  return prefersReducedMotion
}
```

**Confidence Level: HIGH** - This pattern is documented by [Josh W. Comeau](https://www.joshwcomeau.com/react/prefers-reduced-motion/) and [Motion docs](https://motion.dev/docs/react-accessibility).

### Pattern 2: Animation Wrapper Components

**Purpose:** Provide consistent animation behavior without Framer Motion dependency (CSS-first approach).

```typescript
// src/animations/components/fade-in.tsx
'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '../hooks/use-reduced-motion'

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: 'none' | 'short' | 'medium' | 'long'
  duration?: 'fast' | 'normal' | 'slow'
}

const delayMap = {
  none: '',
  short: 'animation-delay-100',
  medium: 'animation-delay-200',
  long: 'animation-delay-300',
}

const durationMap = {
  fast: 'duration-150',
  normal: 'duration-300',
  slow: 'duration-500',
}

export function FadeIn({
  children,
  className,
  delay = 'none',
  duration = 'normal',
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={cn(
        'animate-fade-in',
        durationMap[duration],
        delayMap[delay],
        className
      )}
    >
      {children}
    </div>
  )
}
```

**Confidence Level: HIGH** - CSS-first approach is performant and works with existing tailwindcss-animate plugin.

### Pattern 3: Framer Motion Integration (Optional Enhancement)

**Purpose:** For complex animations that CSS cannot handle (exit animations, gestures, layout animations).

```typescript
// src/animations/components/motion-wrapper.tsx (if using Framer Motion)
'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MotionWrapperProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  className?: string
}

export const MotionWrapper = forwardRef<HTMLDivElement, MotionWrapperProps>(
  ({ children, className, ...motionProps }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(className)}
        {...motionProps}
      >
        {children}
      </motion.div>
    )
  }
)

MotionWrapper.displayName = 'MotionWrapper'
```

**For shadcn/ui integration:**

```typescript
// Converting shadcn Button to motion component
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

const MotionButton = motion(Button)

// Usage
<MotionButton
  whileTap={{ scale: 0.98 }}
  whileHover={{ scale: 1.02 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Click me
</MotionButton>
```

**Confidence Level: HIGH** - Documented in [shadcn/ui discussions](https://github.com/shadcn-ui/ui/discussions/1636) and [Medium article](https://medium.com/@colorsong.nabi/building-a-modern-ui-kit-with-tailwind-shadcn-and-framer-motion-f162f6695ce5).

### Pattern 4: Animation Variants Configuration

**Purpose:** Centralize animation definitions for consistency.

```typescript
// src/animations/variants/entrance.ts
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const slideUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
}

// Stagger children
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}
```

```typescript
// src/animations/config.ts
export const ANIMATION_DURATION = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  deliberate: 800,
} as const

export const EASING = {
  // Standard Material Design curves
  standard: [0.4, 0, 0.2, 1],
  enter: [0, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1],
  // Spring-like bounce
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const

// CSS timing function strings
export const CSS_EASING = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const
```

**Confidence Level: HIGH** - Variant pattern is core to Framer Motion and recommended in [Motion docs](https://motion.dev/docs/react-reduce-bundle-size).

### Pattern 5: LazyMotion for Bundle Optimization

**Purpose:** Reduce Framer Motion bundle size from ~34kb to ~4.6kb.

```typescript
// src/animations/providers/lazy-motion-provider.tsx
'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import { ReactNode } from 'react'

interface LazyMotionProviderProps {
  children: ReactNode
}

export function LazyMotionProvider({ children }: LazyMotionProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}
```

```typescript
// Use 'm' instead of 'motion' for tree-shaking
import { m } from 'framer-motion'

// In components
<m.div animate={{ opacity: 1 }} />
```

**Confidence Level: HIGH** - Documented in [Motion bundle size guide](https://motion.dev/docs/react-reduce-bundle-size).

## Data Flow

### Animation Trigger Propagation

```
User Action (click, hover, scroll)
            |
            v
+------------------------+
| Event Handler          |
| (onClick, onHover)     |
+------------------------+
            |
            v
+------------------------+
| Animation Hook/State   |
| (useState, useAnimation)|
+------------------------+
            |
            v
+------------------------+
| Class Toggle or        |
| Motion Props Update    |
+------------------------+
            |
            v
+------------------------+
| CSS Animation OR       |
| Framer Motion Engine   |
+------------------------+
            |
            v
+------------------------+
| GPU-Accelerated        |
| Rendering              |
+------------------------+
```

### Theme-Aware Animation Flow

```
Theme Change (dark mode toggle)
            |
            v
+------------------------+
| ThemeProvider          |
| (updates CSS classes)  |
+------------------------+
            |
            v
+------------------------+
| CSS Variables Updated  |
| (:root, .dark, .pink)  |
+------------------------+
            |
            v
+------------------------+
| Animation Components   |
| (read CSS variables)   |
+------------------------+
            |
            v
+------------------------+
| Colors/Shadows Update  |
| (automatically via CSS)|
+------------------------+
```

**Example: Theme-aware glow animation**

```css
/* In globals.css */
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 0 0 hsl(var(--primary) / 0);
  }
  50% {
    box-shadow: 0 0 20px 5px hsl(var(--primary) / 0.3);
  }
}
```

The `--primary` variable automatically reflects the current theme (blue or pink).

**Confidence Level: HIGH** - CSS custom properties are reactive; animations using them automatically adapt to theme changes.

## Scaling Considerations

### Adding New Animations

1. **Simple animations (entrance, exit):** Add to `globals.css` as keyframes, create utility class
2. **Complex animations (gestures, layout):** Add to `variants/` and create wrapper component
3. **Feature-specific animations:** Colocate with feature in component file

### Performance Monitoring Checklist

- [ ] Use Chrome DevTools Performance panel to verify 60fps
- [ ] Check for layout thrashing (avoid animating width/height/top/left)
- [ ] Verify animations run on compositor thread (transform/opacity only)
- [ ] Test on low-end mobile devices
- [ ] Profile bundle size with `next build && next analyze`

### Bundle Size Strategy

| Animation Count | Recommended Approach |
|-----------------|---------------------|
| < 10 simple | CSS-only (tailwindcss-animate) |
| 10-30 mixed | CSS + selective Framer Motion |
| 30+ complex | LazyMotion with feature splitting |

**For HabitStreak:** Given the mobile-first focus and need for performance, recommend **CSS-first with selective Framer Motion** for complex interactions (exit animations, gestures).

**Confidence Level: MEDIUM** - Bundle size thresholds are estimates based on project complexity.

## Anti-Patterns

### 1. Animating Layout Properties

**Bad:**
```css
@keyframes slideIn {
  from { left: -100px; width: 0; }
  to { left: 0; width: 100%; }
}
```

**Good:**
```css
@keyframes slideIn {
  from { transform: translateX(-100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

**Why:** Layout properties (width, height, top, left) trigger expensive reflows. Transform and opacity are GPU-accelerated.

**Confidence Level: HIGH** - Documented by [web.dev](https://web.dev/animations-guide) and [MDN](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance).

### 2. Overusing will-change

**Bad:**
```css
* {
  will-change: transform, opacity;
}
```

**Good:**
```css
.animate-on-hover:hover {
  will-change: transform;
}

/* Remove after animation */
.animate-on-hover {
  will-change: auto;
}
```

**Why:** `will-change` creates new compositor layers, consuming memory. Use sparingly and only when needed.

**Confidence Level: HIGH** - [MDN documentation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS).

### 3. Ignoring Reduced Motion Preferences

**Bad:**
```typescript
function TaskCard() {
  return (
    <div className="animate-bounce">
      {/* Always bounces, even for users with vestibular disorders */}
    </div>
  )
}
```

**Good:**
```typescript
function TaskCard() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className={prefersReducedMotion ? '' : 'animate-bounce'}>
      {/* Respects user preferences */}
    </div>
  )
}
```

**Or with CSS:**
```css
@media (prefers-reduced-motion: reduce) {
  .animate-bounce {
    animation: none;
  }
}
```

**Why:** ~69 million Americans have vestibular dysfunction. Respecting reduced motion is an accessibility requirement.

**Confidence Level: HIGH** - [Josh W. Comeau](https://www.joshwcomeau.com/react/prefers-reduced-motion/).

### 4. Creating New Layers Unnecessarily in React

**Bad:**
```typescript
function AnimatedList({ items }) {
  return items.map((item, index) => (
    <motion.div
      key={index} // Using index as key
      animate={{ opacity: 1 }}
    >
      {item}
    </motion.div>
  ))
}
```

**Good:**
```typescript
function AnimatedList({ items }) {
  return items.map((item) => (
    <motion.div
      key={item.id} // Stable key
      animate={{ opacity: 1 }}
    >
      {item}
    </motion.div>
  ))
}
```

**Why:** Using array indices as keys causes React to remount components, breaking animation continuity.

**Confidence Level: HIGH** - [React anti-patterns](https://www.perssondennis.com/articles/react-anti-patterns-and-best-practices-dos-and-donts).

### 5. Mixing Animation Logic with Rendering

**Bad:**
```typescript
function TaskCard({ task }) {
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number>()

  const animate = () => {
    // 50 lines of requestAnimationFrame logic...
  }

  return <div onClick={animate}>{task.name}</div>
}
```

**Good:**
```typescript
// Hook handles animation logic
function TaskCard({ task }) {
  const { trigger, className } = useCheckAnimation()

  return (
    <div onClick={trigger} className={className}>
      {task.name}
    </div>
  )
}
```

**Why:** Separation of concerns keeps components focused on rendering.

**Confidence Level: HIGH** - [freeCodeCamp](https://www.freecodecamp.org/news/animating-visibility-with-css-an-example-of-react-hooks/).

### 6. Loading Full Framer Motion When Unnecessary

**Bad:**
```typescript
import { motion, AnimatePresence, useAnimation } from 'framer-motion'

// Only using simple fade animation
<motion.div animate={{ opacity: 1 }} />
```

**Good:**
```typescript
// For simple animations, use CSS
<div className="animate-fade-in" />

// OR use LazyMotion for complex cases
import { LazyMotion, domAnimation, m } from 'framer-motion'

<LazyMotion features={domAnimation}>
  <m.div animate={{ opacity: 1 }} />
</LazyMotion>
```

**Why:** Full `motion` component is ~34kb. LazyMotion with `m` reduces to ~4.6kb.

**Confidence Level: HIGH** - [Motion bundle docs](https://motion.dev/docs/react-lazy-motion).

## Integration Points

### Existing Theme System Integration

HabitStreak's current theme system provides excellent hooks for animation integration:

```typescript
// Current: src/contexts/theme-context.tsx
// Animations can read theme state via useTheme()

// Example: Theme-aware animation speed
function useThemeAnimation() {
  const { darkMode } = useTheme()
  const prefersReducedMotion = useReducedMotion()

  return {
    // Slightly slower animations in dark mode for less jarring transitions
    duration: prefersReducedMotion ? 0 : (darkMode ? 400 : 300),
    enabled: !prefersReducedMotion,
  }
}
```

### CSS Variable Integration

Existing CSS variables can power animations:

```css
/* Already in globals.css - use in animations */
.animate-glow-themed {
  animation: glowThemed 0.8s ease-out;
}

@keyframes glowThemed {
  0%, 100% {
    box-shadow: 0 0 0 0 hsl(var(--primary) / 0);
  }
  50% {
    box-shadow: 0 0 20px 5px hsl(var(--primary) / 0.3);
  }
}
```

### shadcn/ui Component Enhancement

Two approaches for adding animations to existing shadcn/ui components:

**Approach 1: Wrapper Component (Non-invasive)**
```typescript
// src/animations/components/animated-button.tsx
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AnimatedButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        'transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      {...props}
    />
  )
}
```

**Approach 2: Motion Component (For complex animations)**
```typescript
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

const MotionButton = motion(Button)

export function AnimatedButton(props: ButtonProps) {
  return (
    <MotionButton
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    />
  )
}
```

**Confidence Level: HIGH** - Both approaches documented in shadcn/ui discussions.

### Tailwind Config Extension

Add animation utilities to existing config:

```typescript
// tailwind.config.ts (extend existing)
const config: Config = {
  // ... existing config
  theme: {
    extend: {
      // ... existing extensions
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        // Add delays via animation-delay plugin or custom utilities
      },
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
}
```

**Note:** HabitStreak already has `tailwindcss-animate` plugin installed, which provides:
- `animate-in`, `animate-out`
- `fade-in`, `fade-out`
- `slide-in-from-*`, `slide-out-to-*`
- `zoom-in`, `zoom-out`
- Duration and delay utilities

## Sources

### High Confidence Sources
- [Motion (Framer Motion) Accessibility Guide](https://motion.dev/docs/react-accessibility)
- [Motion Performance Documentation](https://motion.dev/docs/performance)
- [Motion LazyMotion Bundle Optimization](https://motion.dev/docs/react-lazy-motion)
- [Josh W. Comeau - Prefers Reduced Motion](https://www.joshwcomeau.com/react/prefers-reduced-motion/)
- [MDN - CSS and JavaScript Animation Performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)
- [web.dev - High-Performance CSS Animations](https://web.dev/animations-guide)
- [shadcn/ui Discussion - Framer Motion Integration](https://github.com/shadcn-ui/ui/discussions/1636)
- [Robin Wieruch - React Folder Structure](https://www.robinwieruch.de/react-folder-structure/)
- [Tailwind CSS Animation Documentation](https://tailwindcss.com/docs/animation)
- [tailwindcss-animate Plugin](https://github.com/jamiebuilds/tailwindcss-animate)

### Medium Confidence Sources
- [freeCodeCamp - React Hooks Animation Components](https://www.freecodecamp.org/news/animating-visibility-with-css-an-example-of-react-hooks/)
- [Medium - Building Custom Animation Hooks](https://medium.com/@ignatovich.dm/building-custom-animation-hooks-in-react-3f37e3f7f3ed)
- [Medium - Modern UI Kit with Tailwind, ShadCN, Framer Motion](https://medium.com/@colorsong.nabi/building-a-modern-ui-kit-with-tailwind-shadcn-and-framer-motion-f162f6695ce5)
- [LogRocket - Advanced Page Transitions Next.js](https://blog.logrocket.com/advanced-page-transitions-next-js-framer-motion/)

### Low Confidence (Unverified/Estimated)
- Bundle size thresholds (< 10, 10-30, 30+ animations) are estimates based on general project complexity patterns
- Animation delay CSS utility class names (animation-delay-100, etc.) assume custom Tailwind plugin or configuration
- Exact memory impact of will-change varies by browser and device

## Recommended Next Steps for HabitStreak

1. **Phase 1 (CSS-First):** Create `src/animations/` folder structure with hooks and config
2. **Phase 2 (Hooks):** Implement `useReducedMotion` hook for accessibility
3. **Phase 3 (Components):** Create wrapper components (FadeIn, SlideUp, etc.)
4. **Phase 4 (Integration):** Add animations to existing task and insights components
5. **Phase 5 (Enhancement):** Add Framer Motion for complex interactions if needed

Given HabitStreak's mobile-first focus, prioritize:
- Performance (CSS-first, GPU-accelerated properties)
- Accessibility (reduced motion support)
- Theme integration (CSS variables)
- Bundle size (avoid Framer Motion if CSS suffices)
