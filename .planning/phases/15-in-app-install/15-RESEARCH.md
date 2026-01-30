# Phase 15: In-App Install Access - Research

**Researched:** 2026-01-30
**Domain:** In-App PWA Install Banner, Settings Install Card, Component Reuse Strategy
**Confidence:** HIGH

## Summary

This phase extends the Phase 14 install experience to logged-in users within the main app. The infrastructure is fully established: `usePwaInstall` hook provides platform detection, dismissal state, and install triggers; `InstallBanner` and `IosWalkthroughModal` provide the UI patterns. Phase 15 requires two modifications: (1) adding the install banner to the main app layout and (2) creating a settings card that provides permanent fallback access.

The key insight is that the existing `InstallBanner` component is designed for reuse but may need slight text customization for in-app context. The settings card is a straightforward addition following the existing card pattern in the settings page. The main complexity is z-index coordination with the bottom navigation (z-50) and ensuring the banner appears above content but below the nav.

**Primary recommendation:** Reuse `InstallBanner` directly in the main layout (banner already handles all logic), add a new `InstallSettingsCard` component that bypasses dismissal state and always shows when installation is possible.

## Standard Stack

This phase requires zero new dependencies. All functionality uses existing codebase infrastructure.

### Core (Already Implemented)
| Component/Hook | Location | Purpose | Phase |
|----------------|----------|---------|-------|
| `usePwaInstall` | `src/contexts/pwa-install-context.tsx` | PWA state management (platform, canInstall, triggerInstall, dismiss) | Phase 13 |
| `InstallBanner` | `src/components/pwa/install-banner.tsx` | Fixed bottom install prompt with platform-specific CTAs | Phase 14 |
| `IosWalkthroughModal` | `src/components/pwa/ios-walkthrough-modal.tsx` | iOS Add to Home Screen instructions | Phase 14 |
| `IosShareIcon` | `src/components/pwa/share-icon.tsx` | iOS share icon SVG | Phase 14 |

### Supporting (Already Available)
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `Card`, `CardContent`, `CardHeader`, `CardTitle` | Settings card styling | Settings install card |
| `Button` | Touch-friendly action button | Settings install button |
| `lucide-react` icons (`Download`, `Smartphone`) | Visual cues | Settings card icon |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing `InstallBanner` directly | Creating separate `InAppInstallBanner` | Extra component to maintain; banner already handles all logic |
| Settings card | Bottom sheet | Card pattern matches existing settings page UX |
| Using `canInstall` for settings card | Custom check ignoring dismissal | Settings card should show even after banner dismissed - need different check |

**Installation:**
No new packages required.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── pwa/
│       ├── install-banner.tsx          # Phase 14 (reuse in layout)
│       ├── install-settings-card.tsx   # NEW: Settings page card
│       ├── ios-walkthrough-modal.tsx   # Phase 14 (reuse)
│       └── share-icon.tsx              # Phase 14 (reuse)
└── app/
    └── (main)/
        ├── layout.tsx                  # ADD: InstallBanner integration
        └── instellingen/
            └── page.tsx                # ADD: InstallSettingsCard integration
```

### Pattern 1: Layout-Level Banner Integration
**What:** Add `InstallBanner` to the main layout, positioning it above bottom nav
**When to use:** Making install banner visible across all authenticated pages
**Example:**
```tsx
// src/app/(main)/layout.tsx
import { InstallBanner } from '@/components/pwa/install-banner'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-svh">
      <AnimatedBackground />
      <main className="pb-20 container max-w-2xl mx-auto relative z-10">{children}</main>
      <InstallBanner />  {/* Banner handles own visibility via usePwaInstall */}
      <BottomNav />
    </div>
  )
}
```

### Pattern 2: Settings Card Bypassing Dismissal
**What:** Settings card shows when app is installable, regardless of banner dismissal
**When to use:** Providing permanent install access after banner is dismissed
**Example:**
```tsx
// The hook provides platform and isStandalone but we need to check installability
// independently of isDismissed
const { platform, isStandalone, isLoading, triggerInstall } = usePwaInstall()

// Settings card visible when:
// - Not loading
// - Not already installed (standalone)
// - Platform supports install (ios or chromium)
const showInstallCard = !isLoading && !isStandalone && platform !== 'unsupported'
```

### Pattern 3: Z-Index Coordination
**What:** Layer banner between content and bottom nav
**When to use:** Fixed bottom elements that coexist
**Current z-index map:**
```
z-50: BottomNav, Dialog overlay
z-40: InstallBanner (existing)
z-10: Main content area
-z-10: AnimatedBackground
```

The existing z-40 on InstallBanner already positions it correctly - below BottomNav (z-50) but above content (z-10).

### Pattern 4: Platform-Specific Settings Button Text
**What:** Button text matches platform capability
**When to use:** Showing accurate action to user
**Example:**
```tsx
// Dutch text matching Phase 14 patterns
const buttonText = platform === 'ios'
  ? 'Voeg toe aan beginscherm'  // iOS: Add to home screen
  : 'Installeren'                // Chromium: Install
```

### Anti-Patterns to Avoid
- **Duplicating banner logic for in-app:** The existing `InstallBanner` already handles all visibility logic via `usePwaInstall` - just render it in the layout
- **Fetching dismissal state for settings card:** Settings card should bypass dismissal entirely and check only platform + standalone status
- **Different z-index for in-app banner:** Using the same z-40 ensures consistent layering
- **Hiding settings card after banner dismissed:** Settings card is the permanent fallback - must stay visible

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Platform detection in settings | Custom UA parsing | `usePwaInstall().platform` | Phase 13 already handles iPad edge cases |
| Standalone mode check | `matchMedia` calls | `usePwaInstall().isStandalone` | Hook normalizes iOS + Chromium detection |
| iOS walkthrough | New modal | `IosWalkthroughModal` | Phase 14 component is complete |
| Install trigger | Manual prompt handling | `usePwaInstall().triggerInstall()` | Hook handles one-time prompt consumption |
| Settings card styling | Custom CSS | Existing `Card` components | Match other settings cards exactly |

**Key insight:** Phase 13-14 did 95% of the work. This phase is primarily integration and one new component.

## Common Pitfalls

### Pitfall 1: Banner Dismissal Hides Settings Card
**What goes wrong:** User dismisses banner, then settings card disappears too
**Why it happens:** Using `canInstall` which factors in `isDismissed`
**How to avoid:** Settings card checks `platform` and `isStandalone` directly, ignoring `isDismissed`
**Warning signs:** Settings card visibility changes when banner is dismissed

### Pitfall 2: Banner Hidden by Bottom Nav
**What goes wrong:** Install banner appears below or under bottom navigation
**Why it happens:** Incorrect z-index or positioning
**How to avoid:** Verify z-40 (banner) < z-50 (nav), use existing `InstallBanner` component unchanged
**Warning signs:** Banner text cut off, buttons non-interactive

### Pitfall 3: Double Banner on Landing After Login
**What goes wrong:** User sees banner on landing page, logs in, sees it again
**Why it happens:** Separate dismissal tracking for landing vs in-app
**How to avoid:** Dismissal is already shared via localStorage key `habitstreak-pwa-dismissed` - no action needed
**Warning signs:** Same user seeing banner twice after dismissing

### Pitfall 4: Settings Card After Installation
**What goes wrong:** User installs app, settings still shows "Install app" card
**Why it happens:** Not checking `isStandalone` before rendering
**How to avoid:** Check `isStandalone` as first condition - when true, card should not render
**Warning signs:** Installed PWA shows install option in settings

### Pitfall 5: Walkthrough Close Treated as Banner Dismiss
**What goes wrong:** User opens iOS walkthrough from settings, closes it, can't reopen
**Why it happens:** Walkthrough close calling `dismiss()` instead of just closing modal
**How to avoid:** Settings card manages its own `showWalkthrough` state, doesn't call `dismiss()`
**Warning signs:** Settings card works once but not twice

### Pitfall 6: Animation Delay Inappropriate for Settings
**What goes wrong:** Settings card slides in with 2.5s delay like banner
**Why it happens:** Copy-pasting banner animation styles
**How to avoid:** Settings card uses page's existing animation pattern (`animate-slide-up` without delay)
**Warning signs:** Settings card appears later than other cards

## Code Examples

Verified patterns from existing codebase:

### InstallSettingsCard Component
```tsx
// src/components/pwa/install-settings-card.tsx
'use client'

import { useState } from 'react'
import { Smartphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePwaInstall } from '@/contexts/pwa-install-context'
import { IosWalkthroughModal } from './ios-walkthrough-modal'

/**
 * Settings page install card - permanent fallback for PWA installation
 * Visible whenever app is installable, regardless of banner dismissal
 */
export function InstallSettingsCard() {
  const { platform, isStandalone, isLoading, triggerInstall } = usePwaInstall()
  const [showWalkthrough, setShowWalkthrough] = useState(false)

  // Don't show if loading, already installed, or unsupported platform
  if (isLoading || isStandalone || platform === 'unsupported') {
    return null
  }

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowWalkthrough(true)
    } else {
      await triggerInstall()
      // Result handling optional - component stays visible until standalone
    }
  }

  return (
    <>
      <Card className="glass animate-slide-up hover-lift shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle>Installeer de app</CardTitle>
          </div>
          <CardDescription>
            Open HabitStreak direct vanaf je startscherm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleInstall}
            className="w-full touch-target"
          >
            {platform === 'ios' ? 'Voeg toe aan beginscherm' : 'Installeren'}
          </Button>
        </CardContent>
      </Card>

      <IosWalkthroughModal
        open={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
      />
    </>
  )
}
```

### Settings Page Integration
```tsx
// src/app/(main)/instellingen/page.tsx - relevant section
// Position: Between Account and Daily Target cards

{/* ... Theme Settings Card ... */}

{/* Account Info Card */}
<Card className="glass animate-slide-up hover-lift shadow-sm">
  {/* ... existing content ... */}
</Card>

{/* Install App Card - shows when app is installable */}
<InstallSettingsCard />

{/* Daily Target Settings Card */}
<Card className="glass animate-slide-up hover-lift shadow-sm">
  {/* ... existing content ... */}
</Card>
```

### Main Layout Integration
```tsx
// src/app/(main)/layout.tsx
import { getCurrentUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/navigation/bottom-nav'
import { AnimatedBackground } from '@/components/backgrounds/animated-background'
import { InstallBanner } from '@/components/pwa/install-banner'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-svh">
      <AnimatedBackground />
      <main className="pb-20 container max-w-2xl mx-auto relative z-10">{children}</main>
      <InstallBanner />
      <BottomNav />
    </div>
  )
}
```

### Banner Text Customization (Optional Enhancement)
If different text is desired for in-app banner vs landing page:
```tsx
// Option 1: Pass a variant prop to InstallBanner
<InstallBanner variant="in-app" />

// Option 2: Keep same text (simpler, current recommendation)
// Landing page: "Installeer de app" / "Voeg toe aan je beginscherm"
// In-app: Same - consistent messaging, already tailored for logged-in users
```

The current banner text ("Installeer de app") works well for both contexts. The Phase 15 CONTEXT.md mentions "different text for logged-in users" as Claude's discretion, but the existing text is already appropriate for logged-in users who haven't installed.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate install prompt per page | Layout-level banner (one instance) | React best practice | Single source of truth, no flash |
| Settings link opens external page | In-page button with modal | UX standard 2024+ | Better conversion, keeps user in app |
| Banner only way to install | Banner + persistent settings option | PWA UX patterns | Recovery after accidental dismiss |

**Current best practices (2025-2026):**
- One install banner in layout, not per-page
- Persistent install access in settings
- Platform-appropriate triggers (native prompt vs walkthrough)
- Hide all install UI when already in standalone mode

## Open Questions

Things that couldn't be fully resolved:

1. **Banner Animation Delay for In-App**
   - What we know: Landing page uses 2.5s delay to let content load first
   - What's unclear: Whether in-app pages need same delay (content loads differently)
   - Recommendation: Keep same delay - consistency, and delay prevents "flash" if checking dismissed state

2. **Banner Text Differentiation**
   - What we know: CONTEXT.md mentions "different text for logged-in users"
   - What's unclear: What specific wording change would improve conversion
   - Recommendation: Current text already good; change only if user feedback indicates confusion

3. **Settings Card Icon**
   - What we know: CONTEXT.md marks icon choice as Claude's discretion
   - What's unclear: Whether `Smartphone` or `Download` better communicates action
   - Recommendation: Use `Smartphone` - matches "app" messaging, `Download` implies file download

## Sources

### Primary (HIGH confidence)
- **Phase 13 RESEARCH.md** - `usePwaInstall` hook API, platform detection logic
- **Phase 14 RESEARCH.md** - `InstallBanner` patterns, iOS walkthrough implementation
- **Phase 14-01 SUMMARY.md** - Final implementation details, component locations
- **Existing codebase** - `src/contexts/pwa-install-context.tsx`, `src/components/pwa/*`, `src/app/(main)/instellingen/page.tsx`

### Secondary (MEDIUM confidence)
- **CONTEXT.md decisions** - Banner placement, settings card design, dismissal behavior

### Tertiary (LOW confidence)
- None - all findings verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all tools verified in codebase
- Architecture: HIGH - Patterns directly from Phase 13-14 implementations
- Settings card: HIGH - Follows existing settings page Card pattern exactly
- Pitfalls: HIGH - Derived from Phase 13-14 research + codebase inspection

**Research date:** 2026-01-30
**Valid until:** 90 days (all patterns use stable existing infrastructure)
