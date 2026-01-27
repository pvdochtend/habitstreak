# Architecture Patterns: PWA Install Prompts

**Domain:** PWA install prompts in Next.js 15 App Router
**Researched:** 2026-01-27
**Confidence:** HIGH (Context7 + official docs + verified web sources)

## Executive Summary

PWA install prompts integrate with Next.js 15 App Router through a **three-layer architecture**: context provider at root layout, platform-specific hooks for detection logic, and presentation components that render conditionally based on platform and dismissal state. The architecture must handle cross-platform differences (Chrome/Edge `beforeinstallprompt` vs iOS manual instructions), persist dismissal state via localStorage, and maintain event references across client-side route transitions.

## Recommended Architecture

```
Root Layout (app/layout.tsx)
├── ThemeProvider (existing)
└── PwaInstallProvider (NEW)
    ├── beforeinstallprompt event listener
    ├── iOS detection logic
    ├── Dismissal state (localStorage)
    └── Installation state tracking

Route Groups (consume context)
├── Landing Page (/)
│   └── InstallPrompt component (banner/hero)
├── (main) - Protected routes
│   └── InstallPrompt component (banner variant)
└── Settings (/instellingen)
    └── InstallButton component (card variant)
```

### Why This Architecture?

1. **Root provider persists across routes**: Event listener survives client-side navigation
2. **Context avoids prop drilling**: Multiple route groups access shared state
3. **Platform-specific hooks**: Separates concerns (Chrome vs iOS detection)
4. **localStorage for dismissal**: Simple, reliable persistence without database overhead
5. **Presentation components**: UI variants (banner, button) consume same context

## Component Boundaries

### New Components Required

| Component | Location | Responsibility | Type |
|-----------|----------|---------------|------|
| **PwaInstallProvider** | `src/contexts/pwa-install-context.tsx` | Event listener, state management, localStorage | Context Provider |
| **usePwaInstall** | `src/contexts/pwa-install-context.tsx` | Hook to consume context | React Hook |
| **InstallPromptBanner** | `src/components/pwa/install-prompt-banner.tsx` | Banner UI for landing/in-app | Client Component |
| **InstallButton** | `src/components/pwa/install-button.tsx` | Button UI for settings page | Client Component |
| **useIosDetection** | `src/hooks/use-ios-detection.ts` | iOS/Safari standalone mode detection | React Hook |
| **useWebInstallPrompt** | `src/hooks/use-web-install-prompt.ts` | Chrome/Edge beforeinstallprompt handling | React Hook |

### Modified Components

| Component | Location | Changes Required | Complexity |
|-----------|----------|------------------|------------|
| **RootLayout** | `src/app/layout.tsx` | Wrap children with PwaInstallProvider | Low |
| **HomePage** | `src/app/page.tsx` | Add InstallPromptBanner component | Low |
| **InstellingenPage** | `src/app/(main)/instellingen/page.tsx` | Add InstallButton to existing cards | Low |
| **(main)/layout** | `src/app/(main)/layout.tsx` | Optionally add InstallPromptBanner | Low |

## Integration Points with Existing Architecture

### 1. ThemeProvider Pattern (Reference)

**Existing implementation** in `src/contexts/theme-context.tsx` provides the architectural blueprint:

```typescript
// Root layout (app/layout.tsx)
export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        <ThemeProvider>           {/* Existing */}
          <PwaInstallProvider>    {/* NEW - nest inside ThemeProvider */}
            {children}
          </PwaInstallProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Why nest inside ThemeProvider?** ThemeProvider fetches user data from `/api/user` - PwaInstallProvider may want to sync dismissal state to database in future (currently localStorage-only).

### 2. Route Group Structure

HabitStreak has three route groups:

```
app/
├── page.tsx                    → Landing page (unauthenticated)
├── (auth)/                     → Login/signup (no install prompt)
│   ├── login/
│   └── signup/
└── (main)/                     → Protected app (authenticated)
    ├── layout.tsx              → BottomNav wrapper
    ├── vandaag/
    ├── inzichten/
    ├── taken/
    └── instellingen/           → Settings page
```

**Install prompt placement:**

| Route | Prompt Type | Variant | When to Show |
|-------|-------------|---------|--------------|
| `/` (landing) | Banner | Hero/top | Always (unless dismissed forever) |
| `(main)/*` | Banner | Sticky top | Post-login, after engagement signal |
| `/instellingen` | Button | Card | Always available, respects dismissal |

### 3. Settings Page Integration

Current settings page structure (CardContent sections):

```
1. Theme Settings (Color + Dark Mode) - Existing
2. Account Info - Existing
3. Daily Target - Existing
4. PWA Install - NEW CARD (insert between Account and Daily Target)
5. Logout - Existing
```

**Visual pattern to follow:** Settings page uses Card components with:
- `glass` className for glassmorphism effect
- `animate-slide-up` for page transitions
- `hover-lift` for interaction feedback
- `touch-target` for 44px minimum touch area

## Data Flow Architecture

### 1. Chrome/Edge Flow (beforeinstallprompt)

```mermaid
Browser fires event
    ↓
PwaInstallProvider captures event
    ↓
event.preventDefault() + store in state
    ↓
Context provides { prompt, canInstall: true }
    ↓
Component renders "Install" UI
    ↓
User clicks "Install"
    ↓
deferredPrompt.prompt() called
    ↓
Browser shows native dialog
    ↓
User accepts/dismisses
    ↓
Update state + localStorage
```

### 2. iOS Flow (Manual Instructions)

```mermaid
useIosDetection hook runs
    ↓
Check: navigator.userAgent + navigator.standalone
    ↓
Context provides { isIos: true, isStandalone: false }
    ↓
Component renders instructional UI
    ↓
User manually adds via Safari share menu
    ↓
(App opens in standalone mode on next visit)
```

### 3. Dismissal Flow (Cross-Platform)

```mermaid
User clicks "Dismiss" or "Not Now"
    ↓
Context updates state
    ↓
localStorage.setItem('habitstreak-pwa-dismissed', timestamp)
    ↓
Banner hidden immediately
    ↓
Banner never shows again (dismissed forever)
```

## State Management Pattern

### Context State Shape

```typescript
interface PwaInstallContextValue {
  // Chrome/Edge
  deferredPrompt: BeforeInstallPromptEvent | null
  canInstall: boolean

  // iOS
  isIos: boolean
  isStandalone: boolean

  // Dismissal
  isDismissed: boolean
  dismissedAt: string | null

  // Actions
  promptInstall: () => Promise<void>
  dismiss: () => void

  // Loading
  isLoading: boolean
}
```

### localStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `habitstreak-pwa-dismissed` | ISO timestamp | When user permanently dismissed prompt |

**Why not store in database?**
- Dismissal is device-specific (user may want app on phone but not desktop)
- localStorage available immediately (no async fetch)
- Reduces database writes for non-critical preference
- Matches industry pattern (most PWAs use localStorage for dismissal)

## Platform Detection Logic

### iOS Detection Utility (`src/hooks/use-ios-detection.ts`)

```typescript
// Based on verified 2026 patterns
function useIosDetection() {
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check user agent (iOS devices)
    const ua = navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(ua)

    // Check standalone mode (added to home screen)
    const standalone = 'standalone' in navigator &&
                      (navigator as any).standalone === true

    setIsIos(iosDevice)
    setIsStandalone(standalone)
  }, [])

  return { isIos, isStandalone, showIosPrompt: isIos && !isStandalone }
}
```

**iOS 26 Note:** Apple freezes User-Agent string at version 18.6, but detection still works (we only check device type, not OS version).

### Cross-Platform Display Mode Detection

```typescript
// Detects if already installed (Chrome, Edge, Safari)
function useIsInstalled() {
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Standard display-mode media query
    const standalone = window.matchMedia('(display-mode: standalone)').matches

    // iOS-specific standalone
    const iosStandalone = 'standalone' in navigator &&
                         (navigator as any).standalone

    setIsInstalled(standalone || iosStandalone)
  }, [])

  return isInstalled
}
```

## Architecture Patterns to Follow

### Pattern 1: Event Listener in Root Provider

**What:** Capture `beforeinstallprompt` at highest level (root layout)

**Why:**
- Event only fires once per page load
- Must survive client-side route transitions
- Root provider never unmounts during navigation

**Implementation:**

```typescript
// src/contexts/pwa-install-context.tsx
export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault() // Prevent browser's default install UI
      setDeferredPrompt(e) // Store for later use
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // ... rest of context
}
```

### Pattern 2: Conditional Rendering by Platform

**What:** Render different UI based on browser capabilities

**Implementation:**

```typescript
// src/components/pwa/install-prompt-banner.tsx
export function InstallPromptBanner() {
  const { canInstall, isIos, isStandalone, isDismissed } = usePwaInstall()

  // Don't show if dismissed or already installed
  if (isDismissed || isStandalone) return null

  // Chrome/Edge: Native prompt available
  if (canInstall) {
    return <ChromeInstallBanner />
  }

  // iOS: Show manual instructions
  if (isIos) {
    return <IosInstallBanner />
  }

  // Unsupported browser: hide prompt
  return null
}
```

### Pattern 3: localStorage for Persistent Dismissal

**What:** Track dismissal without database writes

**Implementation:**

```typescript
const DISMISSED_KEY = 'habitstreak-pwa-dismissed'

function usePwaDismissal() {
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    setIsDismissed(dismissed !== null)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString())
    setIsDismissed(true)
  }

  return { isDismissed, dismiss }
}
```

### Pattern 4: Engagement-Based Timing

**What:** Don't show install prompt immediately on landing page

**When to show:**
- Landing page: Immediately (marketing context)
- In-app: After login + 30 seconds dwell time OR after completing first task
- Settings: Always available (user-initiated)

**Implementation:**

```typescript
// In-app timing logic
function useInAppInstallTiming() {
  const [shouldShow, setShouldShow] = useState(false)
  const { isDismissed } = usePwaInstall()

  useEffect(() => {
    if (isDismissed) return

    // Show after 30 seconds
    const timer = setTimeout(() => setShouldShow(true), 30000)

    return () => clearTimeout(timer)
  }, [isDismissed])

  return shouldShow
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Installing Event Listener in Page Components

**Problem:** Event listener removed on route change, event lost

**Why bad:** `beforeinstallprompt` fires once on page load - if listener not attached immediately, event never captured

**Instead:** Install listener in root provider that never unmounts

### Anti-Pattern 2: Blocking Important UI

**Problem:** Install banner covers critical navigation or CTAs

**Why bad:** Reduces conversion, annoys users, negative engagement metrics

**Instead:**
- Landing page: Below hero, above features
- In-app: Sticky top banner, easily dismissible
- Never block bottom navigation

### Anti-Pattern 3: Showing Prompt Too Aggressively

**Problem:** Prompt appears immediately on every page load

**Why bad:** Users not engaged yet, increases dismissal rate, feels spammy

**Instead:**
- Landing page: OK to show immediately (marketing context)
- In-app: Wait for engagement signal (time on page, task completion)
- Settings: User-initiated, always available

### Anti-Pattern 4: Not Respecting Dismissal

**Problem:** User dismisses banner, but it reappears later

**Why bad:** Ignores user preference, creates dark pattern, reduces trust

**Instead:** Dismissal = permanent (forever), never show again

### Anti-Pattern 5: Calling prompt() Multiple Times

**Problem:** Attempting to reuse same `BeforeInstallPromptEvent` instance

**Why bad:** `prompt()` can only be called once per event - subsequent calls fail silently

**Instead:** After calling `prompt()`, wait for next `beforeinstallprompt` event (requires page reload)

### Anti-Pattern 6: Using User Agent for Feature Detection

**Problem:** Parsing user agent string to determine browser capabilities

**Why bad:** iOS 26 freezes UA string, easy to mis-parse, fragile

**Instead:** Use feature detection (`'standalone' in navigator`, `matchMedia`, event availability)

## Build Order Recommendations

### Phase 1: Core Infrastructure (Foundation)

**Goal:** Context provider with platform detection

**Tasks:**
1. Create `PwaInstallProvider` context
2. Implement iOS detection hook (`useIosDetection`)
3. Implement `beforeinstallprompt` event listener
4. Add dismissal state management (localStorage)
5. Integrate provider into root layout
6. Write unit tests for detection logic

**Dependencies:** None
**Estimated complexity:** Medium
**Rationale:** Foundation layer must be solid before building UI

### Phase 2: Settings Page Integration (Low-Hanging Fruit)

**Goal:** Install button in settings page

**Tasks:**
1. Create `InstallButton` component (Card variant)
2. Consume `usePwaInstall` hook
3. Add to settings page between Account and Daily Target cards
4. Handle button states (installable, iOS, already installed)
5. Write E2E test for settings flow

**Dependencies:** Phase 1
**Estimated complexity:** Low
**Rationale:**
- Settings page isolated from landing/in-app flows
- User-initiated action (less timing complexity)
- Good testing ground for context integration

### Phase 3: Landing Page Integration (High Visibility)

**Goal:** Install banner on landing page

**Tasks:**
1. Create `InstallPromptBanner` component (Hero variant)
2. Add to landing page below hero, above PhoneMockup
3. Style to match existing glassmorphism design
4. Handle dismissal with animation
5. Test on mobile devices (iOS + Android Chrome)

**Dependencies:** Phase 2
**Estimated complexity:** Medium
**Rationale:**
- High-impact feature for conversion
- Landing page is simpler (no auth considerations)
- Build confidence before in-app integration

### Phase 4: In-App Integration (Complex Timing)

**Goal:** Install banner in protected routes

**Tasks:**
1. Add engagement-based timing logic
2. Integrate banner into `(main)/layout.tsx`
3. Handle route transitions gracefully
4. Test dismissal persistence across navigation
5. Add analytics tracking (optional)

**Dependencies:** Phase 3
**Estimated complexity:** High
**Rationale:**
- Most complex timing requirements
- Must not disrupt existing UX
- Benefits from learnings in Phases 2-3

## Cross-Route State Persistence Strategy

### Challenge

Next.js App Router uses client-side navigation - layouts persist, but page components remount. Install prompt state must survive route changes.

### Solution: Root Provider + Context

```
RootLayout (persists)
  └── PwaInstallProvider (persists)
        └── Event listener (persists)
        └── State (persists)
              ↓
        Route changes happen
              ↓
        Page components remount
              ↓
        usePwaInstall() hook reconnects to same context
              ↓
        State remains intact
```

**Why this works:**
- Root layout never unmounts during navigation
- Context provider remains mounted
- Event listener stays attached
- State persists in provider
- New page components consume existing context

### Verification Points

| Scenario | Expected Behavior |
|----------|------------------|
| Navigate / → /vandaag | Banner state persists |
| Navigate /vandaag → /instellingen | Button shows same state |
| User dismisses on / → Navigate to /vandaag | Dismissal respected |
| User installs from settings → Navigate to / | No banner shown |

## Testing Strategy

### Unit Tests (Vitest)

**File:** `tests/unit/pwa-install.test.ts`

```typescript
describe('PwaInstallContext', () => {
  test('captures beforeinstallprompt event')
  test('respects localStorage dismissal')
  test('iOS detection logic')
  test('prompt() can only be called once')
})
```

### E2E Tests (Playwright)

**File:** `tests/e2e/pwa-install.spec.ts`

```typescript
test('install button visible in settings', async ({ page }) => {
  await page.goto('/login')
  await loginFlow(page)
  await page.goto('/instellingen')

  const installButton = page.locator('button:has-text("Installeer app")')
  await expect(installButton).toBeVisible()
})

test('dismissal persists across routes', async ({ page }) => {
  await page.goto('/')

  const banner = page.locator('[data-testid="install-banner"]')
  await expect(banner).toBeVisible()

  await page.click('button:has-text("Niet nu")')
  await expect(banner).not.toBeVisible()

  // Navigate to different route
  await page.goto('/login')
  await loginFlow(page)
  await page.goto('/vandaag')

  // Banner should not reappear
  await expect(banner).not.toBeVisible()
})
```

## Security Considerations

### 1. Content Security Policy

**Current CSP:** Not explicitly set (Next.js defaults)

**PWA Install Considerations:**
- `beforeinstallprompt` event is standard DOM API (no CSP implications)
- localStorage access is same-origin (secure)
- No external scripts required

**Recommendation:** No CSP changes needed

### 2. localStorage Security

**Risk:** XSS attacks could manipulate dismissal state

**Mitigation:**
- localStorage key uses consistent prefix (`habitstreak-`)
- No sensitive data stored (only dismissal timestamp)
- Worst case: User sees prompt again (minor UX issue, not security breach)

**Verdict:** Low risk, acceptable trade-off

### 3. Event Handler Injection

**Risk:** Malicious code could intercept `beforeinstallprompt` event

**Mitigation:**
- Event listener installed in root layout (first to run)
- `event.preventDefault()` called immediately
- No external event handling libraries

**Verdict:** Standard browser API usage, low risk

## Performance Considerations

### Bundle Size Impact

| Addition | Estimated Size | Justification |
|----------|---------------|---------------|
| PwaInstallProvider | ~2KB | Context + hooks |
| InstallPromptBanner | ~3KB | UI components |
| InstallButton | ~1KB | Button variant |
| useIosDetection | ~0.5KB | Detection logic |
| **Total** | **~6.5KB** | Minimal impact |

**Recommendation:** No code splitting needed (small enough for main bundle)

### Runtime Performance

**Event listener overhead:** Negligible (one-time setup in root layout)

**localStorage access:** Synchronous but fast (~0.1ms)

**Re-renders:** Context updates trigger re-renders only in consuming components (banner, button) - not entire app

**Recommendation:** No performance optimizations needed

## Browser Compatibility Matrix

| Browser | beforeinstallprompt | Manual Instructions | Recommended UI |
|---------|---------------------|---------------------|----------------|
| Chrome 90+ (Android) | Yes | N/A | Native prompt button |
| Edge 90+ (Android) | Yes | N/A | Native prompt button |
| Samsung Internet | Yes | N/A | Native prompt button |
| Safari iOS 14+ | No | Yes | Instructional banner |
| Chrome iOS | No | Yes | Instructional banner (opens in Safari) |
| Firefox | No | No | Hide prompt |
| Safari macOS | No | No | Hide prompt |

**Detection Strategy:**
1. Check for `beforeinstallprompt` event → Show native prompt button
2. Check for iOS user agent → Show manual instructions
3. Otherwise → Hide prompt entirely

## Scalability Considerations

### Future Enhancements (Not in Scope)

| Enhancement | Complexity | Benefit |
|-------------|-----------|---------|
| Analytics tracking | Low | Measure conversion rate |
| Dismissal cooldown (show again after 30 days) | Medium | Re-engage users |
| Database sync for dismissal | Medium | Cross-device preference |
| A/B test prompt variants | High | Optimize conversion |
| Smart timing based on engagement | High | Better conversion rate |

### Extension Points

**Hook architecture supports:**
- Additional platform detection (Samsung Internet, Opera)
- Custom timing logic (engagement-based)
- Analytics integration (track prompt shows, dismissals, installs)
- Variant testing (different UI designs)

## Sources

### High Confidence (Official Documentation)

- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) - Official Next.js 15 PWA patterns
- [MDN: Trigger Install Prompt](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt) - Official beforeinstallprompt API
- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) - Context provider patterns
- [MDN: Making PWAs Installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) - Installability criteria

### Medium Confidence (Community Best Practices)

- [Setting up a PWA in Next.js 15 (GitHub Gist)](https://gist.github.com/cdnkr/25d3746bdb35767d66c7ae6d26c2ed98) - Component structure examples
- [web.dev: Installation Prompt](https://web.dev/learn/pwa/installation-prompt) - Timing and UX patterns
- [web.dev: Promote Install](https://web.dev/articles/promote-install) - Anti-patterns and best practices
- [Wick Technology: PWA Install with React Hooks](https://blog.wick.technology/pwa-install-prompt/) - Hook architecture patterns
- [MagicBell: PWA iOS Limitations](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) - iOS detection strategies

### Technical References

- [GitHub: iOS Safari Standalone Detection](https://gist.github.com/seckie/4158884) - navigator.standalone pattern
- [Next.js: Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) - Layout pattern guidance
- [Vercel: React Context with Next.js](https://vercel.com/kb/guide/react-context-state-management-nextjs) - Provider nesting pattern

## Architectural Decision Records

### ADR 1: Root Provider vs Page-Level State

**Decision:** Use root provider (PwaInstallProvider)

**Rationale:**
- `beforeinstallprompt` fires once per page load
- Must survive client-side route transitions
- Multiple components need access (landing, in-app, settings)

**Alternatives considered:**
- Page-level state: Loses event on navigation
- Global variable: Not reactive, no React integration
- Zustand/Redux: Overkill for single feature

### ADR 2: localStorage vs Database for Dismissal

**Decision:** Use localStorage only

**Rationale:**
- Dismissal is device-specific preference
- Immediate availability (no async fetch)
- Reduces database writes
- Matches industry standard pattern

**Alternatives considered:**
- Database: Cross-device sync, but adds complexity
- Session storage: Loses dismissal on tab close
- Cookie: Unnecessary server round-trip

### ADR 3: Separate iOS and Chrome Hooks

**Decision:** Create `useIosDetection` and `useWebInstallPrompt` separately

**Rationale:**
- Different detection mechanisms (user agent vs event)
- Different UI requirements (instructions vs button)
- Easier to test in isolation
- Clear separation of concerns

**Alternatives considered:**
- Single `usePwaInstall` hook: Too complex, harder to test
- No hooks, inline logic: Less reusable, harder to maintain

### ADR 4: Dismissal Forever vs Cooldown Period

**Decision:** Dismissal is permanent (forever)

**Rationale:**
- Respects user preference
- Avoids "nagging" UX
- Settings page always available for user-initiated install
- Matches user expectation ("Not Now" means "never")

**Alternatives considered:**
- 30-day cooldown: Could be seen as disrespecting choice
- Per-session dismissal: Too aggressive (shows every visit)

### ADR 5: Landing Page vs In-App First

**Decision:** Build in order: Settings → Landing → In-App

**Rationale:**
- Settings simplest (no timing complexity)
- Landing high impact but moderate complexity
- In-app most complex (engagement timing)

**Alternatives considered:**
- All at once: Higher risk, harder to test
- In-app first: Most complex, delays value delivery
