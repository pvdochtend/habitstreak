# Technology Stack — PWA Install Prompts

**Project:** HabitStreak
**Focus:** PWA install prompt experience
**Researched:** 2026-01-27

## Executive Summary

**No new dependencies required.** PWA install prompts can be implemented with native browser APIs and existing Next.js 15/React 19 stack. Custom React hooks and TypeScript types are the only additions needed.

**Key principle:** Keep it lightweight. The install prompt is a progressive enhancement, not a core dependency.

---

## Recommended Stack Changes

### Zero New Dependencies ✅

**Rationale:** Native browser APIs (`beforeinstallprompt`, `window.navigator.standalone`) provide all functionality needed. Third-party libraries add unnecessary bundle size for marginal DX improvements.

| Category | Current | Change | Rationale |
|----------|---------|--------|-----------|
| Framework | Next.js 15 | **No change** | App Router supports Client Components for event listeners |
| React | React 19 | **No change** | `useEffect` and `useState` sufficient for event handling |
| TypeScript | TypeScript 5.7.2 | **No change** | Custom type definitions for non-standard APIs |
| UI | Tailwind + shadcn/ui | **No change** | Existing glassmorphism components for prompt UI |

---

## Implementation Approach

### 1. Browser Detection (Zero Dependencies)

**What:** Detect iOS Safari vs Chromium browsers to show appropriate install UX.

**Implementation:**
```typescript
// No library needed — use native APIs
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isInStandaloneMode = window.navigator.standalone === true;
const isChromium = 'BeforeInstallPromptEvent' in window;
```

**Why not use a library:**
- Detection logic is 3 lines of code
- No maintenance burden from external dependency
- Libraries like `react-device-detect` add 50KB+ for unused features

**Sources:**
- [Detection | web.dev](https://web.dev/learn/pwa/detection)
- [PWA iOS Limitations](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)

---

### 2. Install Prompt Handling (Custom Hook)

**What:** Listen for `beforeinstallprompt` event (Chromium) and trigger install dialog.

**Implementation:** Custom React hook in project code.

```typescript
// src/hooks/usePWAInstall.ts
'use client'
import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return outcome === 'accepted'
  }

  return { canInstall: !!deferredPrompt, promptInstall }
}
```

**Why not use `react-pwa-install`:**
- Last updated **5 years ago** (2020) — unmaintained
- Adds 20KB for functionality we can write in 30 lines
- Doesn't support React 19 hooks patterns
- Custom hook gives full control over UX timing

**Why not use `pwa-install-handler`:**
- Generic API doesn't integrate well with React state
- Forces imperative patterns instead of declarative hooks
- No TypeScript types included
- 15KB dependency for 3 functions

**Sources:**
- [react-pwa-install - npm](https://www.npmjs.com/package/react-pwa-install)
- [React Hook for Add to Homescreen](https://gist.github.com/rikukissa/cb291a4a82caa670d2e0547c520eae53)
- [Setting up a PWA with install button in Next.js 15](https://gist.github.com/cdnkr/25d3746bdb35767d66c7ae6d26c2ed98)

---

### 3. TypeScript Types (Custom Definitions)

**What:** Type definitions for non-standard browser APIs.

**Implementation:** Add to `src/types/pwa.d.ts`:

```typescript
// src/types/pwa.d.ts
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface Navigator {
  standalone?: boolean
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent
}
```

**Why not use `@types/pwa`:**
- Package doesn't exist for these non-standard APIs
- TypeScript DOM lib excludes experimental features intentionally
- Custom types are 15 lines and fully controlled

**Sources:**
- [BeforeInstallPromptEvent - MDN](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
- [Mastering beforeinstallprompt in TypeScript](https://www.xjavascript.com/blog/beforeinstallprompt-typescript/)

---

### 4. iOS Install Instructions (Pure UI)

**What:** Show manual "Add to Home Screen" instructions for iOS Safari users.

**Implementation:** Use existing shadcn/ui components with glassmorphism styles.

**Component structure:**
```
<Dialog> (shadcn/ui)
  └─ <GlassCard> (existing)
      └─ iOS instruction steps with icons
```

**No new dependencies needed:**
- Lucide React icons (already installed) for Safari share icon
- Tailwind animations (already configured) for step-by-step reveal
- Dialog component (shadcn/ui already used throughout app)

**Why not use `pwa-install` web component:**
- Adds 100KB+ web component polyfills
- Doesn't match existing glassmorphism design
- Forces generic UI instead of branded experience
- Not React-native (mixing paradigms)

**Sources:**
- [iOS Safari PWA Install Instructions](https://brainhub.eu/library/pwa-on-ios)
- [iPhone iOS PWA Strategies](https://scandiweb.com/blog/pwa-ios-strategies/)

---

## Browser Compatibility Matrix

| Feature | Chrome/Edge | Safari iOS | Safari Desktop | Firefox | Implementation |
|---------|-------------|------------|----------------|---------|----------------|
| `beforeinstallprompt` | ✅ Yes | ❌ No | ❌ No | ❌ No | Custom hook |
| `navigator.standalone` | ❌ No | ✅ Yes | ❌ No | ❌ No | Direct check |
| Manual install | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Always available |
| Install banner | ✅ Auto | ❌ Manual | ❌ Manual | ❌ Manual | Conditional UI |

**Implementation strategy:**
1. **Chromium browsers:** Show install button using `beforeinstallprompt`
2. **iOS Safari:** Show manual instruction dialog
3. **Already installed:** Hide all install prompts (check `navigator.standalone` or `matchMedia('(display-mode: standalone)')`)
4. **Other browsers:** Hide install UI gracefully (no error state)

**Sources:**
- [Window: beforeinstallprompt event - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)
- [Installation | web.dev](https://web.dev/learn/pwa/installation)

---

## Alternatives Considered & Rejected

### ❌ next-pwa Package

**Why considered:** Popular PWA plugin for Next.js.

**Why rejected:**
- **Broken in Next.js 15 with Turbopack** (incompatible webpack dependency)
- HabitStreak already has manifest.json and service worker
- Only needed for build-time service worker generation (not install prompts)
- Would add complexity without solving the prompt UX problem

**Sources:**
- [next-pwa - npm](https://www.npmjs.com/package/next-pwa)
- [Progressive Web App Setup Guide for Next.js 15](https://dev.to/rakibcloud/progressive-web-app-pwa-setup-guide-for-nextjs-15-complete-step-by-step-walkthrough-2b85)

---

### ❌ react-pwa-install (v1.0.12)

**Why considered:** React-specific install prompt library.

**Why rejected:**
- **Last updated 5 years ago** (circa 2020-2021)
- Doesn't support React 19 or Next.js 15 patterns
- Only 1 dependent package in npm registry (no community)
- Custom hook is simpler and more maintainable

**Sources:**
- [react-pwa-install - npm](https://www.npmjs.com/package/react-pwa-install)

---

### ❌ @dotmind/react-use-pwa

**Why considered:** Modern React hooks for PWA features.

**Why rejected:**
- Adds features beyond install prompt (offline detection, app size)
- Increases bundle size for unused functionality
- Install prompt implementation is identical to custom hook
- No integration advantage with Next.js 15

**Sources:**
- [react-use-pwa - GitHub](https://github.com/dotmind/react-use-pwa)

---

### ❌ pwa-install Web Component (PWABuilder)

**Why considered:** Official Microsoft PWABuilder project component.

**Why rejected:**
- **100KB+ size** for web component polyfills
- Forces web component paradigm in React app
- Generic UI doesn't match HabitStreak's glassmorphism design
- iOS instructions UI is basic/unbranded
- Mixing React and web components increases complexity

**Sources:**
- [pwa-install - GitHub](https://github.com/pwa-builder/pwa-install)

---

## Integration Points with Existing Stack

### Next.js 15 App Router

**Client Component pattern:**
```typescript
// app/components/InstallPrompt.tsx
'use client'  // Required for browser event listeners

import { usePWAInstall } from '@/hooks/usePWAInstall'

export function InstallPrompt() {
  const { canInstall, promptInstall } = usePWAInstall()
  // ... component logic
}
```

**Why this works:**
- Server Components (default) render layout/static content
- Install button is Client Component (progressive enhancement)
- Event listeners only run in browser (no SSR issues)
- Zero impact on initial page load (lazy loaded)

**Sources:**
- [Getting Started: Server and Client Components - Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Tips, Good Practices, and Pitfalls with Next.js 15](https://www.staytuneed.com/blog/tips-good-practices-and-pitfalls-with-next-js-15)

---

### Tailwind CSS + Glassmorphism

**Existing design tokens apply:**
```tsx
<div className="backdrop-blur-xl bg-white/10 border border-white/20">
  {/* Install prompt content */}
</div>
```

**No new styles needed:**
- Glassmorphism classes already defined globally
- Animations (`animate-fade-in`, `animate-slide-up`) already configured
- Touch targets (`.touch-target`) already standardized
- Color system (`primary`, `muted`, etc.) already established

---

### shadcn/ui Components

**Reuse existing components:**
- `<Dialog>` for iOS instruction modal
- `<Button>` for install trigger
- `<Card>` base for glassmorphic containers
- Icons from `lucide-react` (already installed)

**No new UI library needed.**

---

## What NOT to Add

### ❌ Service Worker Libraries (Workbox, etc.)

**Why NOT needed:**
- HabitStreak already has service worker from v1.3
- Install prompts are independent of service worker implementation
- Would add 50KB+ for no install prompt benefit

---

### ❌ Analytics Libraries for Install Tracking

**Why defer:**
- Can track with existing console.log for MVP
- Analytics integration is separate concern
- Add later if install conversion data needed
- Don't couple install UX to analytics dependency

---

### ❌ Polyfills for `beforeinstallprompt`

**Why NOT needed:**
- Non-Chromium browsers don't support this API (by design)
- No polyfill can add functionality Safari doesn't implement
- Graceful degradation (hide button) is the correct pattern
- Polyfill would add false capability detection

---

## Installation Steps

**NO npm install required.**

### 1. Add TypeScript Types

```bash
# Create type definitions file
touch src/types/pwa.d.ts
```

**Content:** See "TypeScript Types" section above.

---

### 2. Create Custom Hook

```bash
# Create hooks directory if needed
mkdir -p src/hooks
touch src/hooks/usePWAInstall.ts
```

**Content:** See "Install Prompt Handling" section above.

---

### 3. Verify Existing Dependencies

```bash
# Ensure all required packages already installed
npm list react react-dom next lucide-react
```

**Expected:** All found (already in package.json).

---

## Configuration Notes

### Manifest.json (Already Configured ✅)

Current configuration supports install prompts:
- `start_url: "/"` — Entry point defined
- `display: "fullscreen"` — Standalone mode preference
- `icons` array with 72px-512px — All required sizes present
- `theme_color` and `background_color` — Branding set

**No changes needed.**

---

### Meta Tags (Verify in `layout.tsx`)

Required for iOS Safari install:
```tsx
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="HabitStreak" />
```

**Action:** Verify these exist (likely added in v1.3 PWA work).

---

## Performance Considerations

### Bundle Size Impact

| Addition | Size | Impact |
|----------|------|--------|
| Custom hook | ~1KB | Negligible |
| TypeScript types | 0KB (compile-time only) | None |
| iOS instruction component | ~2KB | Negligible |
| **Total** | **~3KB** | **<0.1% of typical Next.js bundle** |

**Comparison to libraries:**
- `react-pwa-install`: ~20KB (7x larger)
- `pwa-install` web component: ~100KB (33x larger)
- Custom implementation: **~3KB** ✅

---

### Runtime Performance

**Event listener overhead:**
- Single `beforeinstallprompt` listener per session
- Fires once at page load (Chromium only)
- No polling, no intervals, no background work
- **Negligible performance impact**

**iOS detection:**
- One-time regex check on mount
- Cached in component state
- **<1ms execution time**

---

## Security Considerations

### No Third-Party Code Execution

**Benefit:** Zero dependencies means zero supply chain attack surface for install prompts.

**Alternative risk:** If using `react-pwa-install` (unmaintained), vulnerable to dependency hijacking.

---

### User Consent Required

**Browser enforcement:**
- `beforeinstallprompt` only fires if user hasn't dismissed
- `prompt()` requires user gesture (can't auto-trigger)
- iOS install is always manual (Safari menu)

**Implementation respects browser controls** (no dark patterns possible).

---

## Testing Strategy

### Unit Tests (Vitest)

Mock browser APIs:
```typescript
// usePWAInstall.test.ts
describe('usePWAInstall', () => {
  it('captures beforeinstallprompt event', () => {
    const mockEvent = new Event('beforeinstallprompt')
    // ... test logic
  })
})
```

---

### E2E Tests (Playwright)

**Chromium-specific:**
```typescript
test('shows install button on Chromium', async ({ page }) => {
  await page.goto('/')
  // Playwright runs in Chromium — event should fire
  await expect(page.getByRole('button', { name: /installeer/i })).toBeVisible()
})
```

**iOS Safari simulation:**
```typescript
test('shows iOS instructions on Safari', async ({ page }) => {
  await page.setUserAgent('iPhone...')
  // Test iOS-specific UI
})
```

---

## Deployment Checklist

- [x] Manifest.json with all required fields (already exists)
- [x] PWA icons 72px-512px (already generated in v1.3)
- [ ] Add `pwa.d.ts` type definitions
- [ ] Create `usePWAInstall.ts` custom hook
- [ ] Build install button component
- [ ] Build iOS instruction modal
- [ ] Test on Chrome Android (beforeinstallprompt)
- [ ] Test on iPhone Safari (manual instructions)
- [ ] Verify standalone mode detection
- [ ] Test install flow end-to-end

---

## Future Extensibility

### If Analytics Needed Later

```typescript
// Easy to add tracking without changing hook
const handleInstall = async () => {
  const accepted = await promptInstall()

  // Add analytics here
  if (accepted) {
    analytics.track('pwa_installed')
  }
}
```

**No library dependency needed now.**

---

### If A/B Testing Install Messaging

Current implementation supports easy variant testing:
```tsx
const installMessage = variant === 'A'
  ? 'Installeer de app'
  : 'Voeg toe aan startscherm'
```

**Custom hook doesn't constrain UX experiments.**

---

## Sources Summary

**Official Documentation:**
- [BeforeInstallPromptEvent - MDN](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
- [Window: beforeinstallprompt event - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)
- [Trigger installation from your PWA - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)
- [Guides: PWAs - Next.js](https://nextjs.org/docs/app/guides/progressive-web-apps)

**Implementation Guides:**
- [Setting up a PWA with install button in Next.js 15 - GitHub Gist](https://gist.github.com/cdnkr/25d3746bdb35767d66c7ae6d26c2ed98)
- [Progressive Web App Setup Guide for Next.js 15 - DEV](https://dev.to/rakibcloud/progressive-web-app-pwa-setup-guide-for-nextjs-15-complete-step-by-step-walkthrough-2b85)
- [React Hook for Add to Homescreen - GitHub Gist](https://gist.github.com/rikukissa/cb291a4a82caa670d2e0547c520eae53)

**iOS-Specific:**
- [PWA on iOS - Current Status & Limitations](https://brainhub.eu/library/pwa-on-ios)
- [PWA iOS Limitations and Safari Support](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Detection | web.dev](https://web.dev/learn/pwa/detection)
- [iPhone iOS PWA Strategies](https://scandiweb.com/blog/pwa-ios-strategies/)

**Libraries Evaluated (Not Used):**
- [react-pwa-install - npm](https://www.npmjs.com/package/react-pwa-install)
- [react-use-pwa - GitHub](https://github.com/dotmind/react-use-pwa)
- [pwa-install-handler - npm](https://www.npmjs.com/package/pwa-install-handler)
- [pwa-install - GitHub (PWABuilder)](https://github.com/pwa-builder/pwa-install)
- [next-pwa - npm](https://www.npmjs.com/package/next-pwa)

**TypeScript Patterns:**
- [Mastering beforeinstallprompt in TypeScript](https://www.xjavascript.com/blog/beforeinstallprompt-typescript/)

**Best Practices:**
- [Installation | web.dev](https://web.dev/learn/pwa/installation)
- [Tips, Good Practices, and Pitfalls with Next.js 15](https://www.staytuneed.com/blog/tips-good-practices-and-pitfalls-with-next-js-15)
- [Getting Started: Server and Client Components - Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components)

---

## Confidence Assessment

| Aspect | Level | Rationale |
|--------|-------|-----------|
| Browser APIs | **HIGH** | MDN official docs + web.dev Google standards |
| Next.js 15 Integration | **HIGH** | Official Next.js docs + verified 2026 guides |
| iOS Detection | **HIGH** | Multiple authoritative sources confirm `navigator.standalone` |
| TypeScript Patterns | **MEDIUM** | Community patterns (no official TS types for non-standard API) |
| Library Evaluation | **HIGH** | npm registry data + package maintenance history verified |

**Overall: HIGH confidence** — Implementation approach is well-documented and aligns with 2026 best practices.
