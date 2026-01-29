# Phase 14: Landing Page Install Experience - Research

**Researched:** 2026-01-29
**Domain:** PWA Install Banner UI, iOS Walkthrough Modal, Fixed Bottom Banner Animations
**Confidence:** HIGH

## Summary

This phase builds the user-facing install experience for the landing page: a fixed bottom banner that slides in after a short delay, with platform-appropriate actions (native install for Android/Chrome, walkthrough modal for iOS Safari). The infrastructure from Phase 13 (`usePwaInstall` hook) provides all state management - this phase focuses purely on UI components.

The standard approach is a subtle, dismissible fixed banner at the bottom viewport with delayed appearance (2-3 seconds), combined with a modal-based iOS walkthrough that shows recognizable Safari share menu steps. The codebase already has all required building blocks: `tailwindcss-animate` for slide-in animations, `lucide-react` for icons (including `Share` which matches iOS share icon), the existing `Dialog` component for modals, and the glassmorphism utilities for styling.

**Primary recommendation:** Build two components - `InstallBanner` (fixed bottom bar) and `IosWalkthroughModal` (3-step instructional overlay) - both consuming the existing `usePwaInstall` hook. Use delayed CSS animation entry, not JavaScript timeouts, for the banner appearance.

## Standard Stack

This phase requires zero new dependencies. All functionality uses existing codebase tools.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lucide-react` | 0.460.0 | Icons (Share, X, ArrowDown) | Already used throughout app |
| `tailwindcss-animate` | (plugin) | Slide-in animation classes | Already configured in tailwind.config.ts |
| Custom Dialog | N/A | Modal wrapper | Existing component at `src/components/ui/dialog.tsx` |
| usePwaInstall | N/A | PWA state/actions | Phase 13 infrastructure at `src/contexts/pwa-install-context.tsx` |

### Supporting (Already Available)
| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| Glassmorphism utilities | Banner styling | `glass-subtle` for subtle banner |
| Animation classes | Entry/exit effects | `animate-slide-up`, `animate-fade-in` |
| Button component | CTA buttons | Existing shadcn/ui Button |
| `touch-target` class | Touch-friendly sizing | All interactive elements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom banner | `@ideasio/add-to-homescreen-react` | Adds dependency, less control over Dutch text and styling |
| Modal for walkthrough | Bottom sheet | Modal is simpler, already have Dialog component |
| Screenshot images | Illustrated SVG steps | Screenshots more recognizable but larger files |

**Installation:**
No new packages required.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── pwa/
│       ├── install-banner.tsx        # Fixed bottom banner component
│       ├── ios-walkthrough-modal.tsx # iOS instruction modal
│       └── share-icon.tsx            # Custom SVG matching iOS share icon
└── app/
    └── page.tsx                      # Landing page (integrate banner)
```

### Pattern 1: Delayed Banner Entry with CSS Animation
**What:** Banner appears after 2-3 second delay using CSS animation-delay, not JavaScript setTimeout
**When to use:** Entry animations that should respect reduced-motion preferences
**Example:**
```tsx
// Source: Project globals.css animation patterns
'use client'

import { useState, useEffect } from 'react'
import { usePwaInstall } from '@/contexts/pwa-install-context'

export function InstallBanner() {
  const { canInstall, platform, isLoading, isDismissed } = usePwaInstall()
  const [isVisible, setIsVisible] = useState(false)

  // Show banner after mount (CSS handles the delay)
  useEffect(() => {
    if (!isLoading && canInstall && !isDismissed) {
      setIsVisible(true)
    }
  }, [isLoading, canInstall, isDismissed])

  if (!isVisible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up"
      style={{ animationDelay: '2.5s', animationFillMode: 'backwards' }}
    >
      {/* Banner content */}
    </div>
  )
}
```

### Pattern 2: Platform-Conditional Rendering
**What:** Show different CTAs based on platform (iOS vs Chromium)
**When to use:** Any UI that differs by platform
**Example:**
```tsx
// Source: Phase 13 research - platform detection pattern
const { platform, triggerInstall } = usePwaInstall()

{platform === 'chromium' && (
  <Button onClick={handleInstall}>Installeren</Button>
)}

{platform === 'ios' && (
  <Button onClick={() => setShowWalkthrough(true)}>Zo werkt het</Button>
)}
```

### Pattern 3: Modal Walkthrough with Step Visualization
**What:** 3-step visual guide showing iOS Safari share menu process
**When to use:** iOS users who click "Zo werkt het" / "Show me how"
**Example:**
```tsx
// Source: Existing Dialog component pattern
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function IosWalkthroughModal({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>Voeg toe aan beginscherm</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-4">
          <WalkthroughStep number={1} icon={<ShareIcon />}>
            Tik op het <strong>Deel</strong> icoon in Safari
          </WalkthroughStep>
          <WalkthroughStep number={2} icon={<ArrowDown />}>
            Scroll naar beneden in het menu
          </WalkthroughStep>
          <WalkthroughStep number={3} icon={<PlusSquare />}>
            Tik op <strong>Zet op beginscherm</strong>
          </WalkthroughStep>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 4: Safe Area Aware Fixed Positioning
**What:** Account for device notches/home indicators
**When to use:** Any fixed-bottom UI on mobile
**Example:**
```tsx
// Source: Project globals.css safe-area pattern
<div className="fixed bottom-0 left-0 right-0 pb-safe">
  {/* Banner respects iPhone home indicator */}
</div>
```

### Anti-Patterns to Avoid
- **JavaScript setTimeout for entry delay:** Doesn't respect prefers-reduced-motion; use CSS animation-delay instead
- **Checking canInstall on every render:** The hook handles this; trust the hook state
- **Hardcoding platform detection in components:** Use the hook's `platform` value
- **Separate dismiss state:** Hook manages `isDismissed`; don't duplicate
- **Showing banner while loading:** Check `isLoading` before showing any install UI

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| iOS share icon | Custom SVG guessing | `Share` from lucide-react OR custom SVG matching SF Symbols | Lucide's Share is close; can also inline exact SVG |
| Modal overlay | Custom portal/backdrop | Existing Dialog component | Already handles accessibility, animations, backdrop |
| Slide-up animation | Custom keyframes | Existing `animate-slide-up` class | Already defined in globals.css |
| Dismissal persistence | localStorage calls | `usePwaInstall().dismiss()` | Hook handles localStorage + database sync |
| Platform detection | User agent parsing | `usePwaInstall().platform` | Hook already handles iPad edge cases |

**Key insight:** Phase 13 did the hard work. This phase is pure UI composition using existing infrastructure and components.

## Common Pitfalls

### Pitfall 1: Banner Showing Before Hook Initializes
**What goes wrong:** Banner flashes then disappears, or shows wrong platform UI
**Why it happens:** Rendering before `isLoading` is false
**How to avoid:** Always check `if (isLoading) return null` or equivalent
**Warning signs:** Banner blinks on page load, platform shows as 'unsupported' briefly

### Pitfall 2: Animation Not Working on First Visit
**What goes wrong:** Banner appears instantly without slide animation
**Why it happens:** Component mounts after CSS animation would have started
**How to avoid:** Use `animationFillMode: 'backwards'` with `animationDelay`
**Warning signs:** Animation works on hot reload but not on fresh page load

### Pitfall 3: Safe Area Not Respected
**What goes wrong:** Banner content hidden behind iPhone home indicator
**Why it happens:** Not using `pb-safe` or `env(safe-area-inset-bottom)`
**How to avoid:** Add `pb-safe` class to fixed bottom container
**Warning signs:** Content cut off on notched iPhones

### Pitfall 4: Walkthrough Closes Banner Accidentally
**What goes wrong:** User opens walkthrough, closes it, banner is gone
**Why it happens:** Treating walkthrough close as banner dismiss
**How to avoid:** Separate state: `showWalkthrough` (local) vs `isDismissed` (hook)
**Warning signs:** Users report can't re-open walkthrough

### Pitfall 5: Z-Index Conflicts
**What goes wrong:** Banner appears under other fixed elements or modals
**Why it happens:** Not coordinating z-index with other fixed elements
**How to avoid:** Use z-40 for banner (below Dialog's z-50)
**Warning signs:** Banner disappears when other UI appears

### Pitfall 6: Touch Targets Too Small
**What goes wrong:** Users have trouble tapping dismiss or install buttons
**Why it happens:** Not using `touch-target` class or min-44px sizing
**How to avoid:** Apply `touch-target` class to all buttons in banner
**Warning signs:** Users complain about tapping wrong button

## Code Examples

Verified patterns from existing codebase and official sources:

### Complete InstallBanner Component Structure
```tsx
// Source: Pattern composition from existing codebase components
'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePwaInstall } from '@/contexts/pwa-install-context'
import { IosWalkthroughModal } from './ios-walkthrough-modal'

export function InstallBanner() {
  const { canInstall, platform, isLoading, triggerInstall, dismiss } = usePwaInstall()
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isLoading && canInstall) {
      setIsVisible(true)
    }
  }, [isLoading, canInstall])

  if (!isVisible) return null

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowWalkthrough(true)
    } else {
      const result = await triggerInstall()
      if (result?.outcome === 'accepted') {
        setIsVisible(false)
      }
    }
  }

  const handleDismiss = async () => {
    setIsVisible(false)
    await dismiss()
  }

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-safe animate-slide-up"
        style={{ animationDelay: '2.5s', animationFillMode: 'backwards' }}
      >
        <div className="glass-subtle rounded-lg p-4 flex items-center gap-4 max-w-lg mx-auto">
          <div className="flex-1">
            <p className="text-sm font-medium">Installeer de app</p>
            <p className="text-xs text-muted-foreground">
              {platform === 'ios'
                ? 'Voeg toe aan je beginscherm'
                : 'Snelle toegang vanaf je beginscherm'}
            </p>
          </div>

          <Button size="sm" onClick={handleInstall} className="touch-target">
            {platform === 'ios' ? 'Zo werkt het' : 'Installeren'}
          </Button>

          <button
            onClick={handleDismiss}
            className="touch-target flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="text-xs">Niet nu</span>
          </button>
        </div>
      </div>

      <IosWalkthroughModal
        open={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
      />
    </>
  )
}
```

### iOS Share Icon (Matching SF Symbols)
```tsx
// Source: Apple SF Symbols "square.and.arrow.up"
// Custom SVG matching iOS share icon appearance
export function IosShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Arrow pointing up */}
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      {/* Rounded rectangle (open top) */}
      <path d="M5 10v9a2 2 0 002 2h10a2 2 0 002-2v-9" />
    </svg>
  )
}
```

### Walkthrough Step Component
```tsx
// Source: Pattern from existing card/step UI in codebase
interface WalkthroughStepProps {
  number: number
  icon: React.ReactNode
  children: React.ReactNode
}

function WalkthroughStep({ number, icon, children }: WalkthroughStepProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 text-primary">{icon}</div>
        </div>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}
```

### Landing Page Integration
```tsx
// Source: Existing src/app/page.tsx pattern
import { InstallBanner } from '@/components/pwa/install-banner'

export default async function HomePage() {
  const user = await getCurrentUser()
  if (user) redirect('/vandaag')

  return (
    <main className="min-h-svh relative">
      <AnimatedBackground />
      <div className="flex flex-col items-center gap-16 ...">
        <HeroSection />
        <PhoneMockup />
        <FeatureHighlights />
      </div>
      {/* Banner appears at bottom, delay handled by CSS */}
      <InstallBanner />
    </main>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JavaScript timeout for delays | CSS `animation-delay` + `fillMode: backwards` | Best practice | Respects prefers-reduced-motion |
| Intrusive full-screen modals | Subtle fixed banners | UX best practice 2023+ | Higher conversion, less annoyance |
| Generic share icon | Platform-accurate icons | iOS user expectations | Recognition improves follow-through |
| Text-only instructions | Visual step-by-step | UX research | 85%+ completion rates (per add-to-homescreen libraries) |

**Current best practices (2025-2026):**
- Delay banner appearance (2-4 seconds after page load)
- Position at bottom, not top (less intrusive)
- Make dismissible with permanent preference
- Platform-specific messaging and actions
- Visual walkthroughs for manual processes (iOS)

## Open Questions

Things that couldn't be fully resolved:

1. **Screenshot Images vs Illustrated Steps**
   - What we know: Screenshots are most recognizable; illustrations scale better
   - What's unclear: Whether simplified SVG illustrations are sufficient for user recognition
   - Recommendation: Start with illustrated icons (Share, arrow, plus-square); can add screenshots later if conversion is low

2. **iOS 26 "Open as Web App" Default**
   - What we know: iOS 26 makes "Open as Web App" the default for all sites added to home screen
   - What's unclear: Whether walkthrough needs to update for new iOS dialog appearance
   - Recommendation: Test on iOS 26 device; current 3-step flow should still work

3. **Banner Reappearance Strategy**
   - What we know: Dismissal is permanent (per Phase 13/14 context)
   - What's unclear: Whether there should be a way to re-show (e.g., in settings)
   - Recommendation: Phase 15 (in-app install) can provide alternative access

## Sources

### Primary (HIGH confidence)
- [web.dev: Patterns for promoting PWA installation](https://web.dev/articles/promote-install) - Banner placement, timing, design patterns
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) - Technical requirements
- Phase 13 RESEARCH.md - Infrastructure patterns, `usePwaInstall` hook API
- Existing codebase: `src/contexts/pwa-install-context.tsx`, `src/components/ui/dialog.tsx`, `src/app/globals.css`

### Secondary (MEDIUM confidence)
- [Flowbite: Sticky Banner](https://flowbite.com/docs/components/banner/) - Bottom banner positioning pattern
- [Lucide Icons: Share](https://lucide.dev/icons/share-2) - iOS share icon equivalent
- [philfung/add-to-homescreen](https://github.com/philfung/add-to-homescreen) - Walkthrough UI patterns (85% conversion rate claim)
- [MacRumors: iOS 26 Add Web App](https://www.macrumors.com/how-to/save-safari-bookmark-web-app-iphone-home-screen/) - iOS 26 changes

### Tertiary (LOW confidence)
- Various PWA blog posts on install banner timing - Consensus on 2-4 second delay

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all tools verified in codebase
- Architecture: HIGH - Patterns directly from existing components and Phase 13
- Pitfalls: HIGH - Derived from Phase 13 research + standard PWA development issues
- iOS walkthrough visuals: MEDIUM - Icon approach verified, screenshot approach untested

**Research date:** 2026-01-29
**Valid until:** 90 days (UI patterns stable, iOS 26 changes noted)
