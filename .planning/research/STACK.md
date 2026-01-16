# Animation Stack Research - HabitStreak UI Refresh

**Research Date:** January 16, 2026
**Target:** React 19 + Next.js 15 + Tailwind CSS + shadcn/ui
**Goal:** Playful, energetic animations with confetti, particles, and micro-interactions

---

## Core Animation Technologies

### 1. Motion (formerly Framer Motion) - PRIMARY RECOMMENDATION

**Package:** `motion`
**Version:** 12.26.0 (latest stable)
**Confidence:** HIGH

Motion is the recommended core animation library for this project. It's the rebranded and evolved version of Framer Motion, now with full React 19 and Next.js 15 support.

**Key Features:**
- GPU-accelerated animations via Web Animations API (WAAPI)
- Declarative component-based API (`<motion.div>`)
- Built-in gesture support (`whileHover`, `whileTap`, `drag`)
- Layout animations with `layoutId` for shared element transitions
- Scroll-linked animations
- AnimatePresence for enter/exit animations
- Automatic reduced-motion fallbacks (accessibility)

**Installation:**
```bash
npm install motion
```

**Import Pattern (React 19 compatible):**
```typescript
import { motion, AnimatePresence } from "motion/react"
```

**Bundle Size:** ~32KB minified + gzipped (full feature set)

**Why Motion over alternatives:**
- Official React 19 support (version 12.x)
- Built for Next.js App Router (client components)
- 12+ million monthly npm downloads
- Active maintenance by Motion Division
- LazyMotion available for bundle optimization

**Sources:**
- [Motion Official Docs](https://motion.dev/docs/react)
- [Motion Upgrade Guide](https://motion.dev/docs/react-upgrade-guide)
- [Framer Community - React 19 Discussion](https://www.framer.community/c/developers/trying-to-install-framer-motion-in-react-19-next-15)

---

### 2. tw-animate-css - CSS Animation Utilities

**Package:** `tw-animate-css`
**Version:** ~1.x (2.0 upcoming with breaking changes)
**Confidence:** HIGH

The official replacement for `tailwindcss-animate`, adopted by shadcn/ui for Tailwind v4.

**Key Features:**
- CSS-first architecture (no JavaScript plugin)
- Tree-shakable - unused animations excluded from bundle
- Built-in presets: `accordion-down`, `accordion-up`, `caret-blink`
- Utility classes: `animate-in`, `animate-out`, `fade-in`, `zoom-in`, `slide-in-from-*`
- Duration and delay via Tailwind utilities

**Installation:**
```bash
npm install -D tw-animate-css
```

**Usage in globals.css:**
```css
@import "tw-animate-css";
```

**Note:** shadcn/ui deprecated `tailwindcss-animate` in favor of `tw-animate-css` as of March 2025.

**Sources:**
- [tw-animate-css GitHub](https://github.com/Wombosvideo/tw-animate-css)
- [shadcn/ui Tailwind v4 Migration](https://ui.shadcn.com/docs/tailwind-v4)

---

## Supporting Libraries

### 3. canvas-confetti - Celebration Effects

**Package:** `canvas-confetti`
**Version:** 1.9.4 (latest)
**Confidence:** HIGH

Lightweight, performant confetti animation library with no framework dependencies.

**Key Features:**
- Pure canvas-based rendering (high performance)
- Multiple effects: confetti bursts, fireworks, side cannons, stars
- Customizable shapes, colors, physics
- Framework-agnostic (works anywhere)
- Small bundle size

**Installation:**
```bash
npm install canvas-confetti
```

**Basic Usage:**
```typescript
import confetti from 'canvas-confetti';

// Simple burst
confetti();

// Fireworks
confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
});

// Stars
confetti({
  particleCount: 50,
  shapes: ['star'],
  colors: ['FFE400', 'FFBD00', 'E89400']
});
```

**Why canvas-confetti over react-confetti:**
- More customization options
- Better performance (canvas-based)
- No React-specific overhead
- Works with any trigger mechanism

**Sources:**
- [canvas-confetti GitHub](https://github.com/catdad/canvas-confetti)
- [Magic UI Confetti Component](https://magicui.design/docs/components/confetti)

---

### 4. @tsparticles/react - Particle Effects

**Package:** `@tsparticles/react` + `@tsparticles/slim`
**Version:** 3.0.0
**Confidence:** MEDIUM

Feature-rich particle effects library for backgrounds and effects.

**Key Features:**
- Highly customizable particle systems
- Built-in presets: stars, snow, confetti, fireworks, bubbles
- Interactive particles (mouse/touch responsive)
- Multiple shapes and behaviors
- Works with React, Vue, Angular, vanilla JS

**Installation:**
```bash
npm install @tsparticles/react @tsparticles/slim
```

**Bundle Options:**
- `@tsparticles/slim` - Recommended for most use cases (~50KB)
- `@tsparticles/basic` - Minimal features (~30KB)
- `@tsparticles/all` - Full feature set (~100KB+)

**React 19 Compatibility:** UNCERTAIN - Package last updated 2+ years ago. May require `--legacy-peer-deps` flag. Test before committing.

**Alternative:** If compatibility issues arise, use canvas-confetti for celebration effects instead.

**Sources:**
- [tsParticles GitHub](https://github.com/tsparticles/tsparticles)
- [tsParticles React Component](https://github.com/tsparticles/react)

---

### 5. @formkit/auto-animate - Zero-Config Animations

**Package:** `@formkit/auto-animate`
**Version:** 0.9.0
**Confidence:** HIGH

Drop-in animation utility for lists, modals, and dynamic content.

**Key Features:**
- Single line of code to add animations
- Automatic animations for: add, remove, move operations
- Works with any parent element
- Respects `prefers-reduced-motion`
- Tiny bundle size

**Installation:**
```bash
npm install @formkit/auto-animate
```

**React Usage:**
```typescript
import { useAutoAnimate } from '@formkit/auto-animate/react'

function TaskList() {
  const [parent] = useAutoAnimate()
  return <ul ref={parent}>{/* items auto-animate */}</ul>
}
```

**Best For:**
- Task lists (add/remove/reorder)
- Dynamic forms
- Accordion content
- Any list-based UI

**Sources:**
- [AutoAnimate Official](https://auto-animate.formkit.com/)
- [AutoAnimate GitHub](https://github.com/formkit/auto-animate)

---

### 6. Sonner - Toast Notifications

**Package:** `sonner`
**Version:** Latest (check npm)
**Confidence:** HIGH

Already included with shadcn/ui. Beautiful animated toast notifications.

**Key Features:**
- Stacking animation (signature feature)
- Multiple toast types (success, error, warning, info)
- Promise-based toasts
- CSS transitions (interruptible)
- Accessible

**Note:** Already part of shadcn/ui ecosystem. Use `toast()` API for celebrations.

**Sources:**
- [Sonner GitHub](https://github.com/emilkowalski/sonner)
- [shadcn/ui Sonner](https://ui.shadcn.com/docs/components/sonner)

---

## Development Tools

### Animation Debugging

1. **Chrome DevTools Animation Inspector**
   - Inspect running animations
   - Slow down/pause animations
   - View timing curves

2. **Motion DevTools Extension**
   - Visualize Motion animations
   - Edit animation values in real-time

3. **Performance Throttling**
   - Chrome DevTools > Performance > CPU throttling
   - Test animations on simulated mobile devices

### Design Resources

1. **Motion One Playground** - Test animations before implementing
2. **cubic-bezier.com** - Custom easing curve generator
3. **Lottie Files** - Pre-made animations (use sparingly due to bundle size)

---

## Alternatives Considered

### React Spring - NOT RECOMMENDED

**Package:** `react-spring`
**Version:** 9.7.x / 10.x
**Confidence:** MEDIUM

**Why Not:**
- React 19 peer dependency issues (GitHub issue #2341 open)
- Requires `--legacy-peer-deps` workaround
- Steeper learning curve than Motion
- Less documentation for Next.js App Router
- No built-in gesture support

**When to Consider:**
- Physics-heavy animations
- Three.js / React Three Fiber integration
- If team already has React Spring expertise

**Sources:**
- [React Spring React 19 Issue](https://github.com/pmndrs/react-spring/issues/2341)

---

### GSAP (GreenSock) - OPTIONAL ADVANCED

**Package:** `gsap` + `@gsap/react`
**Version:** Latest
**Confidence:** HIGH (for compatibility)

**Why Not Primary:**
- Overkill for most UI animations
- Requires "use client" directive everywhere
- More imperative than declarative
- ScrollTrigger requires careful cleanup in React

**When to Consider:**
- Complex timeline sequences
- Scroll-based storytelling
- Premium animation requirements

**Sources:**
- [GSAP React Guide](https://gsap.com/resources/React/)
- [useGSAP Hook](https://gsap.com/docs/v3/GSAP/gsap.registerPlugin())

---

### Lottie - NOT RECOMMENDED FOR PRIMARY

**Package:** `lottie-react`
**Version:** Latest
**Confidence:** MEDIUM

**Why Not:**
- Large bundle impact (~82KB for lottie-web)
- Animation JSON files can be 1MB+
- SSR issues with Next.js (`document is not defined`)
- Performance concerns on mobile (17 FPS vs 60 FPS for Rive)

**When to Consider:**
- Complex After Effects animations from designers
- One-off celebration animations
- Illustrations that need animation

**Alternative:** Use CSS/Motion for micro-interactions, reserve Lottie for rare complex animations.

**Sources:**
- [Lottie vs Rive Performance](https://www.callstack.com/blog/lottie-vs-rive-optimizing-mobile-app-animation)
- [lottie-react GitHub](https://github.com/LottieFiles/lottie-react)

---

### react-confetti - ALTERNATIVE

**Package:** `react-confetti`
**Version:** Latest
**Confidence:** HIGH

**Why canvas-confetti Instead:**
- canvas-confetti offers more customization
- Better performance characteristics
- Framework-agnostic (easier to test)

**When to Consider:**
- If declarative React props preferred over imperative API
- Full-screen confetti rain effect specifically

---

## What NOT to Use

### 1. tailwindcss-animate
**Reason:** Deprecated by shadcn/ui. Use `tw-animate-css` instead.

### 2. framer-motion (old import)
**Reason:** Use `motion` package with `import from "motion/react"` for React 19 support.

### 3. react-particles-js
**Reason:** Deprecated. Use `@tsparticles/react` instead.

### 4. jQuery animations
**Reason:** Incompatible with React paradigm, performance issues.

### 5. Anime.js
**Reason:** Motion is smaller (1/5th the size) and more React-friendly.

### 6. Heavy Lottie files
**Reason:** Bundle bloat. Use sparingly or consider dotLottie format for 80% size reduction.

---

## Version Compatibility Matrix

| Library | Version | React 19 | Next.js 15 | Tailwind v4 | Confidence |
|---------|---------|----------|------------|-------------|------------|
| motion | 12.26.0 | YES | YES | YES | HIGH |
| tw-animate-css | 1.x | N/A | N/A | YES | HIGH |
| canvas-confetti | 1.9.4 | N/A | N/A | N/A | HIGH |
| @tsparticles/react | 3.0.0 | UNCERTAIN | YES | N/A | MEDIUM |
| @formkit/auto-animate | 0.9.0 | YES | YES | N/A | HIGH |
| sonner | Latest | YES | YES | N/A | HIGH |
| @gsap/react | Latest | YES | YES* | N/A | HIGH |

*GSAP requires "use client" directive in Next.js App Router

---

## Recommended Stack Summary

### Must Have (Install immediately)
```bash
npm install motion canvas-confetti @formkit/auto-animate
npm install -D tw-animate-css
```

### Optional (Add if needed)
```bash
npm install @tsparticles/react @tsparticles/slim  # Particle backgrounds
npm install gsap @gsap/react                       # Advanced scroll/timeline
```

### Already Included (via shadcn/ui)
- `sonner` - Toast animations
- Tailwind CSS transitions/animations

---

## Performance Guidelines

### GPU-Accelerated Properties
Only these properties get GPU acceleration:
- `transform` (translate, scale, rotate, skew)
- `opacity`
- `filter`

### Avoid Animating
- `width`, `height` (causes reflow)
- `top`, `left`, `right`, `bottom` (causes reflow)
- `margin`, `padding` (causes reflow)
- `border-width` (causes repaint)

### Mobile Performance Tips
1. Use `will-change` sparingly (can blow out GPU memory)
2. Test with Chrome DevTools CPU throttling (4x slowdown)
3. Prefer CSS transitions for simple hover states
4. Use Motion's LazyMotion for code splitting
5. Limit concurrent animations to 3-5 elements

### Bundle Size Budget
- Motion: ~32KB (acceptable)
- tsParticles slim: ~50KB (use sparingly)
- canvas-confetti: ~6KB (excellent)
- auto-animate: ~2KB (excellent)
- Lottie: ~82KB + JSON files (avoid unless necessary)

---

## Implementation Priority

1. **Phase 1 - Foundation**
   - Install Motion + tw-animate-css
   - Set up base animation variants
   - Add micro-interactions to buttons/cards

2. **Phase 2 - Celebrations**
   - Integrate canvas-confetti for task completion
   - Add streak milestone celebrations
   - Toast animations for feedback

3. **Phase 3 - Polish**
   - Auto-animate for task lists
   - Page transitions with AnimatePresence
   - Scroll-based animations (if needed)

4. **Phase 4 - Advanced (Optional)**
   - Particle backgrounds with tsParticles
   - Complex sequences with GSAP

---

## Sources Summary

### Official Documentation (HIGH confidence)
- [Motion Official](https://motion.dev/)
- [tw-animate-css GitHub](https://github.com/Wombosvideo/tw-animate-css)
- [canvas-confetti GitHub](https://github.com/catdad/canvas-confetti)
- [AutoAnimate Official](https://auto-animate.formkit.com/)
- [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)
- [GSAP React Docs](https://gsap.com/resources/React/)

### Community/Comparison Articles (MEDIUM confidence)
- [Animating React UIs in 2025](https://hookedonui.com/animating-react-uis-in-2025-framer-motion-12-vs-react-spring-10/)
- [Top React Animation Libraries 2025](https://www.dronahq.com/react-animation-libraries/)
- [Motion vs React Spring Performance](https://reactlibraries.com/blog/framer-motion-vs-motion-one-mobile-animation-performance-in-2025)
- [Web Animation Performance Tier List](https://motion.dev/blog/web-animation-performance-tier-list)

### Performance/Technical (HIGH confidence)
- [MDN CSS/JS Animation Performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)
- [MDN Animation Performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate)
