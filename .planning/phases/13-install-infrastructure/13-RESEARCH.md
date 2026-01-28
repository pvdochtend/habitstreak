# Phase 13: Install Infrastructure - Research

**Researched:** 2026-01-28
**Domain:** PWA Install Prompt Infrastructure, Browser Detection, Storage Persistence
**Confidence:** HIGH

## Summary

This phase establishes the infrastructure for PWA installation prompts: capturing the `beforeinstallprompt` event, detecting platform (iOS Safari vs Chromium), detecting standalone mode (already installed), and persisting dismissal state.

The core challenge is that `beforeinstallprompt` is Chromium-only (Chrome, Edge, Opera) while iOS Safari has no equivalent event. This requires a dual-track approach: Chromium gets native install prompts, iOS gets manual instruction modals. The event must be captured at the root layout level before any page components mount, otherwise the one-time event is lost.

Dismissal persistence requires database storage because iOS Safari evicts localStorage after 7 days of site inactivity. The existing pattern of localStorage-cache + database-sync (used by ThemeProvider) provides the template.

**Primary recommendation:** Create a `PwaInstallProvider` context following the existing `ThemeProvider` pattern, with hooks that abstract platform differences for consuming components.

## Standard Stack

This phase requires zero new dependencies. All functionality uses native browser APIs.

### Core APIs
| API | Purpose | Browser Support |
|-----|---------|-----------------|
| `beforeinstallprompt` event | Capture deferred install prompt | Chromium only |
| `appinstalled` event | Detect successful installation | Chromium only |
| `navigator.standalone` | iOS standalone detection | iOS Safari only |
| `matchMedia('(display-mode: standalone)')` | Cross-platform standalone detection | All modern browsers |
| `navigator.maxTouchPoints` | iPad detection (vs Mac) | All modern browsers |

### Supporting
| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| React Context + Provider | Share PWA state across components | Root-level state management |
| localStorage cache | Fast reads, offline support | Cache dismissal state |
| Database persistence | Survive iOS 7-day eviction | Authoritative dismissal state |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom implementation | `react-pwa-install` npm package | Adds dependency, less control over iOS handling |
| Database persistence | localStorage only | Breaks on iOS after 7 days inactivity |
| Root provider | Per-page hooks | Misses `beforeinstallprompt` event timing |

**Installation:**
No new packages required. Uses existing:
- React (context, hooks)
- Prisma (database persistence)
- Zod (API validation)

## Architecture Patterns

### Recommended Project Structure
```
src/
├── contexts/
│   └── pwa-install-context.tsx   # Provider + context + main hook
├── hooks/
│   └── (hooks inlined in context) # Discretion: keep simple
├── types/
│   └── index.ts                   # Add BeforeInstallPromptEvent interface
└── app/
    ├── layout.tsx                 # Wrap with PwaInstallProvider
    └── api/
        └── user/
            └── route.ts           # Extend PATCH for dismissal fields
```

### Pattern 1: Root Provider for Event Capture
**What:** Attach `beforeinstallprompt` listener at root layout level
**When to use:** Always - this event fires once on page load, before components mount
**Example:**
```typescript
// Source: MDN beforeinstallprompt documentation
// https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event

'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Extend Window interface for TypeScript
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
  interface Navigator {
    standalone?: boolean
  }
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault() // Prevent browser's default install UI
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // ... rest of provider
}
```

### Pattern 2: Platform Detection with iPad Handling
**What:** Detect iOS Safari vs Chromium, handling iPad's "Macintosh" user agent
**When to use:** Determining which install flow to show (native prompt vs manual instructions)
**Example:**
```typescript
// Source: Apple Developer Forums, ScientiaMobile
// https://developer.apple.com/forums/thread/119186

type Platform = 'ios' | 'chromium' | 'unsupported'

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unsupported'

  const ua = navigator.userAgent

  // Check for iOS (iPhone, iPad, iPod)
  // iPad with "Request Desktop Website" reports as Macintosh
  const isIOS = /iPhone|iPod/.test(ua) ||
    (/iPad/.test(ua)) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  if (isIOS) {
    // Must be in Safari for PWA install (other iOS browsers use WebKit but can't install)
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)
    return isSafari ? 'ios' : 'unsupported'
  }

  // Chromium-based browsers support beforeinstallprompt
  // Chrome, Edge, Opera, Samsung Internet
  const isChromium = /Chrome|Chromium|EdgA?\/|OPR\/|SamsungBrowser/.test(ua)
  if (isChromium) return 'chromium'

  return 'unsupported'
}
```

### Pattern 3: Standalone Mode Detection
**What:** Detect if PWA is already installed and running in standalone mode
**When to use:** Hide install prompts for users who already installed
**Example:**
```typescript
// Source: web.dev PWA Detection
// https://web.dev/learn/pwa/detection

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false

  // iOS Safari
  if (navigator.standalone === true) return true

  // Chromium and other browsers
  if (window.matchMedia('(display-mode: standalone)').matches) return true

  // Also check minimal-ui (some browsers use this)
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return true

  return false
}
```

### Pattern 4: Database + localStorage Hybrid Persistence
**What:** Cache in localStorage for fast reads, sync to database for iOS durability
**When to use:** Any state that must survive iOS's 7-day localStorage eviction
**Example:**
```typescript
// Follow existing ThemeProvider pattern in src/contexts/theme-context.tsx

const STORAGE_KEY = 'habitstreak-pwa-dismissed'

// On mount: check localStorage first, then fetch from database
useEffect(() => {
  const cached = localStorage.getItem(STORAGE_KEY)
  if (cached === 'true') {
    setDismissed(true)
  }

  // Fetch authoritative state from database
  fetch('/api/user')
    .then(res => res.json())
    .then(result => {
      if (result.success && result.data?.installPromptDismissed) {
        setDismissed(true)
        localStorage.setItem(STORAGE_KEY, 'true')
      }
    })
    .catch(console.error)
}, [])

// On dismiss: update localStorage immediately, then sync to database
const dismiss = useCallback(async () => {
  setDismissed(true)
  localStorage.setItem(STORAGE_KEY, 'true')

  try {
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installPromptDismissed: true }),
    })
  } catch (error) {
    console.error('Failed to persist dismissal:', error)
  }
}, [])
```

### Anti-Patterns to Avoid
- **Per-page event listeners:** The `beforeinstallprompt` event fires once on page load. If your listener attaches after the event fires, you miss it permanently for that session.
- **localStorage-only persistence:** iOS Safari evicts localStorage after 7 days of site inactivity. Users who dismiss and don't return for a week will see the prompt again.
- **Synchronous standalone detection:** Always check `isStandalone()` before showing any install UI to avoid prompting users who already installed.
- **Assuming `beforeinstallprompt` fires:** On iOS, unsupported browsers, or already-installed PWAs, this event never fires. Your UI must handle the "no event" case gracefully.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript types for PWA events | Custom type declarations scattered in files | Centralized interface in `src/types/index.ts` | Single source of truth, reusable |
| iOS vs Android detection | Complex regex patterns | Feature detection with `maxTouchPoints` | iPad "Macintosh" UA breaks regex-only approaches |
| Persistence that survives iOS | localStorage only | Database + localStorage cache | iOS 7-day eviction policy |

**Key insight:** The main complexity is handling platform differences and timing. The browser APIs themselves are simple, but the edge cases (iPad UA, iOS Safari-only installs, event timing) require careful handling.

## Common Pitfalls

### Pitfall 1: Missing the `beforeinstallprompt` Event
**What goes wrong:** Install button never appears even though PWA is installable
**Why it happens:** Event listener attached after the event already fired (e.g., in a child component that mounts later)
**How to avoid:** Attach listener in root layout component, before any page routing
**Warning signs:** Event works on full page refresh but not on client-side navigation

### Pitfall 2: iOS Safari Detection False Positives
**What goes wrong:** Chrome on iOS detected as Safari, user sees Safari instructions in Chrome
**Why it happens:** All iOS browsers use WebKit and include "Safari" in user agent
**How to avoid:** Check for CriOS (Chrome), FxiOS (Firefox), OPiOS (Opera), EdgiOS (Edge) in user agent
**Warning signs:** iOS users report wrong instructions for their browser

### Pitfall 3: iPad Detected as Mac
**What goes wrong:** iPad users see "desktop not supported" message
**Why it happens:** iPad Safari with "Request Desktop Website" (default since iPadOS 13) reports `Macintosh` in user agent
**How to avoid:** Use `navigator.maxTouchPoints > 1` combined with `navigator.platform === 'MacIntel'`
**Warning signs:** iPad users report being told the app isn't supported

### Pitfall 4: Dismissal State Lost on iOS
**What goes wrong:** Users who dismissed the prompt weeks ago see it again
**Why it happens:** iOS Safari evicts localStorage after 7 days of site inactivity
**How to avoid:** Store authoritative state in database, use localStorage only as cache
**Warning signs:** iOS-only complaints about "annoying popup keeps coming back"

### Pitfall 5: Prompt Shown to Already-Installed Users
**What goes wrong:** Users who installed the PWA still see install prompts
**Why it happens:** Not checking standalone mode before showing UI
**How to avoid:** Check `isStandalone()` before any install UI renders
**Warning signs:** Users complain about install prompts inside the installed app

### Pitfall 6: Event Used Multiple Times
**What goes wrong:** Second install attempt silently fails
**Why it happens:** `prompt()` can only be called once per `BeforeInstallPromptEvent` instance
**How to avoid:** Clear the stored event after calling `prompt()`, handle rejection
**Warning signs:** Install button works first time but not on retry

## Code Examples

Verified patterns from official sources:

### Complete TypeScript Interface for PWA Events
```typescript
// Source: MDN BeforeInstallPromptEvent
// https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<{
    outcome: 'accepted' | 'dismissed'
  }>
}

// Extend global types
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
    appinstalled: Event
  }
  interface Navigator {
    standalone?: boolean  // iOS-specific
  }
}
```

### Triggering the Install Prompt
```typescript
// Source: MDN Trigger Install Prompt
// https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt

const triggerInstall = async () => {
  if (!deferredPrompt) {
    console.warn('No deferred prompt available')
    return { outcome: 'dismissed' as const }
  }

  const result = await deferredPrompt.prompt()
  console.log(`Install prompt result: ${result.outcome}`)

  // Clear the prompt - can only be used once
  setDeferredPrompt(null)

  return result
}
```

### Listening for Successful Installation
```typescript
// Source: web.dev PWA Detection
// https://web.dev/learn/pwa/detection

useEffect(() => {
  const handleInstalled = () => {
    console.log('PWA installed successfully')
    setIsInstalled(true)
    setDeferredPrompt(null) // Clear prompt

    // Optionally sync to database
    fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pwaInstalled: true }),
    }).catch(console.error)
  }

  window.addEventListener('appinstalled', handleInstalled)
  return () => window.removeEventListener('appinstalled', handleInstalled)
}, [])
```

### Complete Platform Detection Function
```typescript
// Sources: MDN, Apple Developer Forums, web.dev
// Combined from multiple authoritative sources

export type PwaPlatform = 'ios' | 'chromium' | 'unsupported'

export function detectPwaPlatform(): PwaPlatform {
  if (typeof window === 'undefined') return 'unsupported'

  const ua = navigator.userAgent

  // iOS detection (including iPad with desktop UA)
  const isIPhone = /iPhone|iPod/.test(ua)
  const isIPad = /iPad/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isIOS = isIPhone || isIPad

  if (isIOS) {
    // Check if Safari (other iOS browsers can't install PWAs)
    const isSafari = /Safari/.test(ua) &&
      !/CriOS/.test(ua) &&  // Chrome on iOS
      !/FxiOS/.test(ua) &&  // Firefox on iOS
      !/OPiOS/.test(ua) &&  // Opera on iOS
      !/EdgiOS/.test(ua)    // Edge on iOS

    return isSafari ? 'ios' : 'unsupported'
  }

  // Chromium-based browsers (support beforeinstallprompt)
  const isChromium =
    /Chrome/.test(ua) ||
    /Chromium/.test(ua) ||
    /Edg/.test(ua) ||      // Edge (desktop)
    /EdgA/.test(ua) ||     // Edge (Android)
    /OPR/.test(ua) ||      // Opera
    /SamsungBrowser/.test(ua)

  if (isChromium && !/Safari/.test(ua) === false) {
    // Chrome includes both "Chrome" and "Safari" in UA
    return 'chromium'
  }

  // Firefox, Safari desktop, etc. - no install prompt support
  return 'unsupported'
}
```

### Database Schema Addition
```prisma
// Addition to prisma/schema.prisma User model

model User {
  // ... existing fields ...

  // PWA install tracking
  installPromptDismissed  Boolean  @default(false) @map("install_prompt_dismissed")
  pwaInstalled            Boolean  @default(false) @map("pwa_installed")
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Regex-only iPad detection | `maxTouchPoints` feature detection | iPadOS 13 (2019) | iPad reports as Mac |
| `navigator.standalone` only | Combined with `display-mode` media query | Safari 17+ | Cross-platform detection |
| localStorage persistence | Database + localStorage cache | iOS 13.4 (2020) | 7-day eviction policy |
| Inline type assertions | Proper TypeScript interfaces | Ongoing | Type safety, IDE support |

**Deprecated/outdated:**
- User agent parsing for iPad: Unreliable since iPadOS 13 defaults to desktop UA
- `navigator.standalone` as sole detection: Works on iOS but not other platforms
- localStorage for long-term persistence on iOS: Data evicted after 7 days inactivity

## Open Questions

Things that couldn't be fully resolved:

1. **EU Browser Engine Choice**
   - What we know: iOS 17.4+ allows alternative browser engines in EU
   - What's unclear: Do non-WebKit iOS browsers support PWA installation?
   - Recommendation: Treat as edge case, fall back to "unsupported" platform

2. **Storage API Persistence Guarantees**
   - What we know: `navigator.storage.persist()` can request persistent storage
   - What's unclear: Whether Safari grants persistence to PWAs consistently
   - Recommendation: Use database as authoritative source regardless

3. **Timing of `beforeinstallprompt` on Slow Networks**
   - What we know: Event fires "usually on page load" but timing not guaranteed
   - What's unclear: Exact conditions that delay or prevent the event
   - Recommendation: Design UI to work gracefully without the event

## Sources

### Primary (HIGH confidence)
- [MDN: BeforeInstallPromptEvent](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent) - Interface definition, methods, properties
- [MDN: beforeinstallprompt event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event) - Event timing, cancellation behavior
- [MDN: Trigger install prompt](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt) - Complete implementation guide
- [web.dev: PWA Detection](https://web.dev/learn/pwa/detection) - Display mode detection, appinstalled event
- [WebKit Blog: Storage Policy Updates](https://webkit.org/blog/14403/updates-to-storage-policy/) - iOS eviction policy, persistence API

### Secondary (MEDIUM confidence)
- [Apple Developer Forums: iPadOS User Agent](https://developer.apple.com/forums/thread/119186) - iPad Macintosh UA behavior
- [firt.dev: PWA iOS](https://firt.dev/notes/pwa-ios/) - iOS PWA limitations and support matrix
- [GitHub Gist: React PWA Hook](https://gist.github.com/rikukissa/cb291a4a82caa670d2e0547c520eae53) - React context provider pattern

### Tertiary (LOW confidence)
- Various blog posts on iOS Safari detection - Patterns vary, some outdated
- npm packages (react-pwa-install, etc.) - Reference only, not using

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native browser APIs well-documented
- Architecture: HIGH - Follows existing ThemeProvider pattern in codebase
- Pitfalls: HIGH - Well-documented across MDN, web.dev, WebKit blog
- iOS edge cases: MEDIUM - iPad detection verified but EU browser engines unclear

**Research date:** 2026-01-28
**Valid until:** 60 days (browser APIs stable, iOS policy changes rare)
