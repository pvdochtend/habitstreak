# Domain Pitfalls: PWA Install Prompts

**Domain:** Adding PWA install prompts to existing Next.js 15 PWA
**Researched:** 2026-01-27
**Context:** HabitStreak already has manifest.json and basic PWA setup. Adding install prompt features (banner, iOS walkthrough, settings fallback).

---

## Critical Pitfalls

Mistakes that cause rewrites, broken functionality, or major user experience issues.

### Pitfall 1: beforeinstallprompt Event Timing Race Condition

**What goes wrong:** The `beforeinstallprompt` event fires unpredictably—"usually on page load" but with no guaranteed timing. In Next.js App Router with client-side navigation, your install button component may mount **after** the event has already fired, causing the button to never become functional. The event only fires once per page load.

**Why it happens:**
- Next.js App Router hydration timing varies
- Event fires in global Window scope before components mount
- Developer assumes event will fire after component mounts
- Navigating to install prompt page via `<Link>` means no page reload, so event doesn't fire again

**Consequences:**
- Install button never activates on pages that aren't entry points
- User clicks "Install" button, nothing happens (stored event is null)
- Inconsistent behavior between direct navigation and in-app navigation
- Works in development, breaks after deployment due to timing differences

**Prevention:**
```typescript
// BAD: Event may have already fired
'use client'
export function InstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setPrompt(e)
    })
  }, [])
  // Problem: If event fired before mount, button never activates
}

// GOOD: Global event listener in root layout
// Create global state or context that ALL components can access
// Listen for event in _app or layout that mounts immediately
```

**Best approach:**
1. Add event listener in root layout component (mounts earliest)
2. Store event in global Context or state management
3. All install UI components consume from that global state
4. Place listener before any page-specific components mount

**Detection warning signs:**
- Install button works on landing page but not on /instellingen page
- Button works after page refresh but not after navigation
- `beforeinstallprompt` listener shows in DevTools but prompt is null

**Reference:** [Setting up a PWA with install button in Next.js 15](https://gist.github.com/cdnkr/25d3746bdb35767d66c7ae6d26c2ed98), [MDN: beforeinstallprompt event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)

---

### Pitfall 2: iOS Detection False Confidence

**What goes wrong:** Detecting iOS with `window.navigator.standalone` seems straightforward, but produces false negatives in specific scenarios (iPad with "Request Desktop Website", Chrome/Edge on iOS, future iOS updates changing user agent strings). Additionally, the property returns `false` in multiple distinct states: "never installed," "installed but currently in Safari," and "not Safari."

**Why it happens:**
- `window.navigator.standalone` only exists on iOS Safari
- iOS Chrome/Edge use Safari engine but may not expose the property
- iPad users can request desktop site, changing user agent
- No distinction between "not installable" and "already installed but in browser"
- EU regulatory changes (iOS 17.4+) broke PWA functionality in Europe

**Consequences:**
- iOS walkthrough shows to non-iOS users (confusing instructions)
- iOS users don't see walkthrough (detection fails)
- Already-installed users see "Install" prompts in Safari
- Different behavior in EU vs. non-EU regions

**Prevention:**
```typescript
// BAD: Simple iOS detection
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
// Problem: Fails with desktop user agent, doesn't account for Edge cases

// GOOD: Comprehensive detection with fallbacks
function detectIOSInstallState() {
  const ua = navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(ua)
  const isIOSSafari = isIOS && !ua.includes('crios') && !ua.includes('fxios')

  // Standalone detection
  const isStandalone = window.navigator.standalone === true ||
                       window.matchMedia('(display-mode: standalone)').matches

  return {
    isIOS,
    isIOSSafari,
    isStandalone,
    canShowPrompt: isIOSSafari && !isStandalone
  }
}
```

**Additional iOS considerations:**
- **EU region check:** iOS 17.4+ in Europe has PWA functionality disabled
- **Storage separation:** Each iOS PWA installation has isolated localStorage (separate from Safari)
- **No cross-browser sync:** Installing in Safari creates separate session from installed icon

**Detection warning signs:**
- User reports seeing wrong installation instructions
- Analytics show iOS users not seeing prompts
- Test on iPad with "Request Desktop Website" enabled

**Reference:** [PWA iOS Limitations and Safari Support](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide), [iOS PWA Compatibility - firt.dev](https://firt.dev/notes/pwa-ios/)

---

### Pitfall 3: localStorage Persistence for Dismiss State (iOS 7-Day Cap)

**What goes wrong:** Using `localStorage` to track "user dismissed install prompt" works on Android/Desktop but fails on iOS due to aggressive storage eviction. iOS 13.4+ introduced a **7-day cap**: localStorage and IndexedDB are cleared if the PWA isn't used for ~7 days in standalone mode. This means dismissed prompts reappear, creating banner fatigue and user frustration.

**Why it happens:**
- iOS prioritizes storage management over PWA data persistence
- Developers assume localStorage is permanent
- 7-day cap affects ALL storage APIs (localStorage, IndexedDB, Cache)
- Policy applies even to home screen PWAs (not just Safari)
- No way to request persistent storage that bypasses eviction

**Consequences:**
- Install banner reappears after 7 days of inactivity
- User dismisses repeatedly, gets frustrated
- Can't reliably track "never show again" preference
- Different behavior between platforms breaks UX consistency

**Prevention strategies:**

**Option 1: Server-side preference storage (BEST for authenticated apps)**
```typescript
// Store dismissal in database tied to userId
// Requires authentication (HabitStreak has this)
await fetch('/api/user/preferences', {
  method: 'PATCH',
  body: JSON.stringify({ installPromptDismissed: true })
})
```

**Option 2: Cookie-based storage (fallback for localStorage)**
```typescript
// Cookies persist longer on iOS (but not forever)
// Set long expiry, check on each visit
document.cookie = 'installPromptDismissed=true; max-age=31536000; path=/' // 1 year
```

**Option 3: Accept ephemeral dismissal (iOS-specific)**
```typescript
// Document that iOS users may see prompt again after 7 days
// Combine localStorage (for Android/Desktop) + cookies (iOS backup)
const dismissInstallPrompt = () => {
  localStorage.setItem('installPromptDismissed', 'true')
  document.cookie = 'installPromptDismissed=true; max-age=31536000'
}
```

**HabitStreak-specific recommendation:**
Since HabitStreak has authentication, store dismissal state in the database alongside `User` model. This survives iOS storage eviction and works across devices.

**Detection warning signs:**
- QA reports iOS users seeing banner after it was dismissed
- Analytics show iOS users dismissing repeatedly
- Test: Dismiss banner, wait 7+ days without opening app

**Reference:** [Safari iOS PWA Data Persistence Beyond 7 Days](https://developer.apple.com/forums/thread/710157), [Private client-side-only PWAs are hard](https://news.ycombinator.com/item?id=22686602), [PWA iOS Limitations](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)

---

### Pitfall 4: Showing Prompts to Already-Installed Users

**What goes wrong:** On Android, the `beforeinstallprompt` event doesn't fire if the PWA is already installed. But on iOS, there's no way to detect installation from within Safari. This leads to showing "Install HabitStreak" prompts to users who already have the app installed, creating confusion: "I already installed it, why is it asking me again?"

**Why it happens:**
- Android: `beforeinstallprompt` doesn't fire after installation (detection works)
- iOS: No install detection API—Safari and installed PWA have separate storage contexts
- `getInstalledRelatedApps()` API doesn't work on iOS
- Developers assume "no `beforeinstallprompt`" means "already installed" (wrong on iOS)

**Consequences:**
- iOS users see install prompts in Safari even after installing
- Banner shows "Install" to users viewing the installed app in Safari
- User confusion: "Is this a different app?"
- Wasted screen space showing useless prompt

**Prevention strategies:**

**Option 1: Hide prompts in standalone mode (partial solution)**
```typescript
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

if (!isStandalone) {
  // Safe to show install prompt
  // User is in browser, not installed PWA
}
```
**Problem:** This only hides prompt when user opens installed PWA. If they open Safari and navigate to the URL, prompt still shows.

**Option 2: Server-side installation tracking (BEST for HabitStreak)**
```typescript
// After user installs (via appinstalled event), mark in database
window.addEventListener('appinstalled', async () => {
  await fetch('/api/user/preferences', {
    method: 'PATCH',
    body: JSON.stringify({ pwaInstalled: true })
  })
})

// Check on page load
const user = await getCurrentUser()
if (user.pwaInstalled) {
  // Don't show install prompts
}
```

**Option 3: Use display-mode media query for iOS fallback**
```typescript
// Check if running in standalone mode
const isInstalledPWA = window.matchMedia('(display-mode: standalone)').matches

// On iOS, also check deprecated API
if (window.navigator.standalone === true) {
  // Definitely installed
}
```

**Best practice for HabitStreak:**
1. Listen for `appinstalled` event, store in database
2. Check `display-mode: standalone` on each visit
3. Combine both signals to suppress install prompts

**Detection warning signs:**
- User feedback: "Why is it asking me to install when I already did?"
- Analytics show install prompts viewed from standalone mode
- Test: Install PWA, open Safari to same URL—prompt shouldn't show

**Reference:** [PWA Detection - web.dev](https://web.dev/learn/pwa/detection), [How to detect if your PWA is installed](https://ben.page/pwa-detect-installed)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or suboptimal UX but are fixable.

### Pitfall 5: Aggressive Prompt Timing Harms Conversion

**What goes wrong:** Showing install prompts on first visit, during login flow, or before user has experienced value leads to dismissals and lower install rates. Research shows prompts shown too early are dismissed **at 3-5x higher rates** than well-timed prompts. Worse, aggressive prompting trains users to ignore prompts (banner blindness).

**Why it happens:**
- Developer excitement: "Let's get users to install immediately!"
- Misunderstanding of user journey: users need to see value first
- Copying patterns from other apps without understanding timing
- No A/B testing of prompt timing

**Consequences:**
- High dismissal rates (user hasn't seen value yet)
- User annoyance: "I just got here, stop asking me to install"
- Lower eventual install rates (users trained to dismiss)
- Negative first impression

**Prevention—Recommended timing patterns:**

| Timing | Conversion Rate | Best For |
|--------|----------------|----------|
| **First visit** | ❌ 5-10% | Never recommended |
| **After 2+ sessions** | ✅ 20-30% | Most apps |
| **After sign-up** | ✅ 25-35% | Authenticated apps (HabitStreak) |
| **After completing task** | ✅✅ 30-40% | Habit tracking (after first check-in) |
| **After 7-day streak** | ✅✅ 35-45% | High-engagement milestone |

**HabitStreak-specific recommendations:**

```typescript
// GOOD: Show after demonstrating value
const shouldShowInstallPrompt = (user: User) => {
  const conditions = [
    user.sessionCount >= 2,           // Visited at least twice
    user.checkins.length >= 3,        // Completed 3+ check-ins
    !user.pwaInstalled,               // Not already installed
    !user.installPromptDismissed,     // Hasn't dismissed
    daysSinceLastPrompt >= 30,        // Respect dismissal for 30 days
  ]
  return conditions.every(Boolean)
}
```

**Anti-pattern locations to avoid:**
- ❌ Login page (blocks primary action)
- ❌ Landing page on first visit (no value demonstrated)
- ❌ Middle of task creation flow (disruptive)
- ❌ During critical workflows (completing check-in)

**Recommended locations:**
- ✅ After first successful check-in (value demonstrated)
- ✅ On "Inzichten" page after viewing streak (engaged user)
- ✅ In settings page (user-initiated, not disruptive)
- ✅ After 7-day streak achievement (milestone celebration)

**Detection warning signs:**
- Analytics show >70% dismissal rate on prompts
- User feedback mentions "annoying popup"
- Low install conversion despite high prompt impressions

**Reference:** [Patterns for promoting PWA installation - web.dev](https://web.dev/articles/promote-install), [I don't want INSTALL THE PWA spam-prompts everywhere](https://news.ycombinator.com/item?id=34826383)

---

### Pitfall 6: Browser Support Assumptions Break UX

**What goes wrong:** Developer builds install prompt feature assuming `beforeinstallprompt` works everywhere, but the event is **non-standard** and only works in Chromium browsers (Chrome, Edge, Opera). Safari, Firefox, and Safari-based iOS Chrome/Edge never fire the event. Install button remains hidden or broken for 30-40% of users.

**Why it happens:**
- MDN shows "not Baseline" warning, but developers miss it
- Testing only in Chrome during development
- Assuming "PWA support" means "install prompt support"
- Next.js PWA documentation focuses on Chromium

**Consequences:**
- Safari users never see install button
- Firefox users see broken UI (button exists but doesn't work)
- iOS users need manual instructions but aren't shown them
- Accessibility issue: no fallback for non-Chromium browsers

**Browser support breakdown:**

| Browser | beforeinstallprompt | Install Method |
|---------|---------------------|----------------|
| Chrome (Android/Desktop) | ✅ Yes | Native prompt |
| Edge (Android/Desktop) | ✅ Yes | Native prompt |
| Safari (macOS) | ❌ No | Share menu (manual) |
| Safari (iOS) | ❌ No | Share → Add to Home Screen |
| Firefox | ❌ No | No install method |
| Chrome (iOS) | ❌ No | Uses Safari engine, no API |

**Prevention:**

```typescript
'use client'
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | 'unsupported'>()

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios')
    } else if (/android/.test(ua)) {
      setPlatform('android')
    } else {
      setPlatform('desktop')
    }

    // Listen for event (Chromium only)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Show appropriate UI based on platform and API support
  if (platform === 'ios') {
    return <IOSInstallWalkthrough /> // Step-by-step guide
  }

  if (deferredPrompt) {
    return <NativeInstallButton prompt={deferredPrompt} /> // Chromium
  }

  if (platform === 'desktop' || platform === 'android') {
    return <ManualInstallInstructions /> // Fallback
  }

  return null // Unsupported browser
}
```

**HabitStreak-specific approach:**
1. **Chromium (Android/Desktop):** Native `beforeinstallprompt` button
2. **iOS Safari:** Modal with step-by-step walkthrough (share icon → Add to Home Screen)
3. **Settings page:** Always show manual instructions as fallback for all browsers

**Detection warning signs:**
- Safari users report "no install button"
- Analytics show 0% Chromium detection on iOS
- QA testing in Firefox shows missing UI

**Reference:** [Next.js PWA Documentation](https://nextjs.org/docs/app/guides/progressive-web-apps), [MDN: beforeinstallprompt browser compatibility](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)

---

### Pitfall 7: Next.js App Router Hydration Mismatch with display-mode

**What goes wrong:** Using CSS media query `display-mode: standalone` to conditionally render UI causes hydration mismatches. Server renders one state (always "browser mode"), client re-renders different state after detecting standalone mode, causing React hydration errors and flickering UI.

**Why it happens:**
- `window.matchMedia()` only exists on client
- Server-side rendering assumes "browser mode"
- Client detects standalone mode after hydration
- React expects server HTML to match client output

**Consequences:**
- Console errors: "Hydration failed because the initial UI does not match what was rendered on the server"
- Flash of wrong UI (install prompt appears then disappears)
- Potential SEO issues (mismatch warnings)
- Accessibility issues (screen readers announce wrong state)

**Prevention:**

```typescript
// BAD: Immediate check causes hydration mismatch
'use client'
export function InstallPrompt() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  if (isStandalone) return null // ❌ Server renders, client doesn't
  return <InstallBanner />
}

// GOOD: Wait for client-side hydration
'use client'
export function InstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    )
  }, [])

  // Don't render until client-side
  if (!isClient) return null
  if (isStandalone) return null

  return <InstallBanner />
}
```

**Alternative approach (CSS-only, no hydration issue):**
```css
/* Hide install prompt in standalone mode via CSS */
@media (display-mode: standalone) {
  .install-prompt {
    display: none;
  }
}
```

**HabitStreak-specific consideration:**
Since HabitStreak uses Client Components for install prompts, the `useEffect` pattern is required. Combine with `suppressHydrationWarning` if needed on the wrapper div.

**Detection warning signs:**
- React hydration warnings in console
- Install banner flickers on page load
- Different UI in development vs. production

**Reference:** [Next.js 15 App Router: Server and Client Components](https://dev.to/devjordan/nextjs-15-app-router-complete-guide-to-server-and-client-components-5h6k)

---

### Pitfall 8: Service Worker Registration Timing Blocks beforeinstallprompt

**What goes wrong:** If service worker registration happens after the `beforeinstallprompt` event would fire, the event never fires, breaking the install prompt. Common in Next.js PWA setups where service worker registration is deferred or conditional. The installability criteria require an **active** service worker.

**Why it happens:**
- Service worker registration placed in `useEffect` or delayed
- PWA library (next-pwa, Serwist) config issues
- Service worker only registers in production, not development
- Developer tests in dev mode, misses production issues

**Consequences:**
- Install prompt works in development, fails in production
- `beforeinstallprompt` never fires despite valid manifest
- Install button never activates
- Chrome DevTools shows "Service worker: not registered"

**PWA Installability Criteria (must ALL be met):**
1. ✅ Served over HTTPS (or localhost)
2. ✅ Valid `manifest.json` with required fields
3. ✅ **Service worker registered and activated**
4. ✅ User engagement heuristics met (30+ seconds interaction)
5. ✅ Not already installed

**Prevention:**

```typescript
// BAD: Service worker registration after component mount
'use client'
export default function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js') // Too late!
    }
  }, [])
}

// GOOD: Register service worker immediately in entry point
// In public/register-sw.js or app/layout.tsx <script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}
```

**HabitStreak approach (using next-pwa or similar):**
1. Verify service worker config in `next.config.js`
2. Ensure service worker generates in production build
3. Check `public/sw.js` exists after build
4. Use Chrome DevTools → Application → Service Workers to verify registration

**Debugging checklist:**
```bash
# 1. Check service worker generates
npm run build
ls .next/static/sw.js  # or public/sw.js

# 2. Check manifest is valid
curl http://localhost:3000/manifest.json | jq

# 3. Chrome DevTools → Application → Manifest
# Verify all fields present, no errors

# 4. Chrome DevTools → Application → Service Workers
# Status should be "activated and running"
```

**Detection warning signs:**
- DevTools shows "Service worker: not found"
- `beforeinstallprompt` never fires despite valid manifest
- Works on localhost but not after deployment
- Console warning: "Site cannot be installed: no matching service worker detected"

**Reference:** [Making PWAs installable - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [Debug a PWA - Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/debug)

---

## Minor Pitfalls

Mistakes that cause annoyance or poor UX but are easily fixable.

### Pitfall 9: Missing appinstalled Event Tracking

**What goes wrong:** User installs PWA via browser's native UI (bypassing custom button), and the app never knows. Install prompts continue showing, analytics don't capture the install, and server-side install state isn't updated.

**Prevention:**
```typescript
// Listen for browser-initiated installs
window.addEventListener('appinstalled', () => {
  // Update analytics
  gtag('event', 'pwa_install', { method: 'browser_ui' })

  // Update server-side state
  fetch('/api/user/preferences', {
    method: 'PATCH',
    body: JSON.stringify({ pwaInstalled: true })
  })

  // Hide install prompts
  setShowInstallPrompt(false)
})
```

**Reference:** [MDN: appinstalled event](https://developer.mozilla.org/en-US/docs/Web/API/Window/appinstalled_event)

---

### Pitfall 10: iOS Safe Area Insets Break Bottom Banners

**What goes wrong:** Install banners positioned at `bottom: 0` get hidden behind iOS home indicator on iPhone X+ or iPad gestures. User can't interact with banner buttons.

**Prevention:**
```css
.install-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  /* Add safe area inset padding */
  padding-bottom: env(safe-area-inset-bottom);
}
```

**HabitStreak consideration:**
HabitStreak already has `viewportFit: 'cover'` configured, so safe area insets are available. Apply to all fixed bottom UI.

**Reference:** [Make Your PWAs Look Handsome on iOS](https://dev.to/karmasakshi/make-your-pwas-look-handsome-on-ios-1o08), [Next.js safe-area-inset issue](https://github.com/vercel/next.js/discussions/81264)

---

### Pitfall 11: No Fallback for Dismissed beforeinstallprompt

**What goes wrong:** User dismisses the browser's native install prompt (before custom prompt shows), and `beforeinstallprompt` never fires again **for that browser session**. Install button never activates.

**Prevention:**
Always provide manual install instructions in settings, regardless of `beforeinstallprompt` state.

```typescript
// Settings page: ALWAYS show manual instructions
<div>
  <h2>App installeren</h2>
  {deferredPrompt ? (
    <button onClick={() => deferredPrompt.prompt()}>
      Installeer via browser
    </button>
  ) : (
    <ManualInstructions /> // Always available
  )}
</div>
```

---

### Pitfall 12: Testing Only on localhost, Missing HTTPS Issues

**What goes wrong:** PWA installs work on `localhost` during development but fail on staging/production if HTTPS isn't properly configured. `beforeinstallprompt` never fires, service worker fails to register.

**Prevention:**
- Test on real HTTPS domain before launch
- Use ngrok or Cloudflare Tunnel for mobile device testing
- Verify SSL certificate is valid (not self-signed)
- Check mixed content warnings (HTTP resources on HTTPS page)

**Reference:** [Making PWAs installable - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

---

## Phase-Specific Warnings

Pitfalls mapped to HabitStreak milestone phases.

| Phase | Likely Pitfall | Mitigation |
|-------|----------------|------------|
| **Install prompt detection** | Pitfall 1 (timing race condition) | Implement global Context in root layout first |
| **Banner component** | Pitfall 5 (aggressive timing) | Add session/check-in count gating logic |
| **iOS walkthrough** | Pitfall 2 (iOS detection) | Test on iPad with "Request Desktop Website" |
| **Settings fallback** | Pitfall 6 (browser support) | Always show manual instructions regardless of API |
| **Persist dismissal** | Pitfall 3 (localStorage eviction) | Store in database, not localStorage |
| **Standalone detection** | Pitfall 4 (already installed) | Use `appinstalled` event + server state |
| **Production deploy** | Pitfall 8 (service worker timing) | Verify SW registration in Chrome DevTools |
| **iOS testing** | Pitfall 10 (safe area insets) | Test on iPhone 14+ with home indicator |

---

## Recommended Research Flags

Areas where phase-specific research may be needed:

### Phase: iOS Walkthrough Implementation
- **Research needed:** Testing across iOS versions (16, 17, 18)
- **Why:** iOS 17.4 changed PWA behavior in EU region
- **Confidence:** MEDIUM (WebSearch indicates issues, needs verification)

### Phase: Analytics Implementation
- **Research needed:** Tracking `beforeinstallprompt` dismissals vs. installs
- **Why:** Need to measure install funnel conversion
- **Confidence:** HIGH (standard practice, well-documented)

### Phase: Production Deployment
- **Research needed:** Service worker caching strategy
- **Why:** Balance fresh content vs. offline support
- **Confidence:** HIGH (existing patterns in Next.js PWA guides)

---

## Summary for Roadmap Planning

**Critical phase ordering based on pitfall prevention:**

1. **Foundation phase (infrastructure):**
   - Set up global Context for `beforeinstallprompt` (prevents Pitfall 1)
   - Implement standalone mode detection (prevents Pitfall 7 hydration issues)
   - Add `appinstalled` event listener (prevents Pitfall 9)

2. **Detection phase (before any UI):**
   - Browser/platform detection logic (prevents Pitfall 2, 6)
   - Already-installed detection (prevents Pitfall 4)
   - Timing logic for prompt display (prevents Pitfall 5)

3. **UI phase (banners, walkthroughs):**
   - Chromium install button (uses foundation from phase 1)
   - iOS walkthrough modal (uses detection from phase 2)
   - Safe area insets (prevents Pitfall 10)

4. **Persistence phase:**
   - Database schema for dismissal state (prevents Pitfall 3)
   - Server-side install tracking (prevents Pitfall 4)

**Phases least likely to need additional research:**
- Banner component (standard React patterns)
- Settings page fallback (straightforward implementation)

**Phases most likely to need additional research:**
- iOS detection edge cases (EU region, iPadOS variations)
- Service worker configuration (Next.js 15 specific)

---

## Sources

### High Confidence (Official Documentation)
- [MDN: Window.beforeinstallprompt event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)
- [MDN: Trigger installation from your PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)
- [web.dev: Patterns for promoting PWA installation](https://web.dev/articles/promote-install)
- [web.dev: PWA Detection](https://web.dev/learn/pwa/detection)
- [web.dev: Installation prompt](https://web.dev/learn/pwa/installation-prompt)
- [Next.js: Progressive Web Apps Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

### Medium Confidence (Developer Guides, Recent 2026 Sources)
- [Setting up a PWA with install button in Next.js 15 (GitHub Gist)](https://gist.github.com/cdnkr/25d3746bdb35767d66c7ae6d26c2ed98)
- [Progressive Web App (PWA) Setup Guide for Next.js 15 (DEV Community)](https://dev.to/rakibcloud/progressive-web-app-pwa-setup-guide-for-nextjs-15-complete-step-by-step-walkthrough-2b85)
- [How to Implement PWA in Next.js App Router 2026 (Medium)](https://medium.com/@amirjld/how-to-implement-pwa-progressive-web-app-in-next-js-app-router-2026-f25a6797d5e6)
- [PWA iOS Limitations and Safari Support: Complete Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [How to detect if your PWA is installed](https://ben.page/pwa-detect-installed)
- [Make Your PWAs Look Handsome on iOS (DEV Community)](https://dev.to/karmasakshi/make-your-pwas-look-handsome-on-ios-1o08)

### Low Confidence (Community Discussions, Needs Verification)
- [beforeinstallprompt not firing after clearing browser cache - GitHub Issue](https://github.com/shadowwalker/next-pwa/issues/335)
- [Safari iOS PWA Data Persistence Beyond 7 Days - Apple Developer Forums](https://developer.apple.com/forums/thread/710157)
- [Private client-side-only PWAs are hard - Hacker News Discussion](https://news.ycombinator.com/item?id=22686602)
- [I don't want INSTALL THE PWA spam-prompts everywhere - Hacker News](https://news.ycombinator.com/item?id=34826383)
- [next/link break iOS env(safe-area-inset-bottom) - Vercel Discussion](https://github.com/vercel/next.js/discussions/81264)
- [PWA-POLICE/pwa-bugs: List of PWA Bugs and workarounds - GitHub](https://github.com/PWA-POLICE/pwa-bugs)

---

## Confidence Assessment

| Pitfall Category | Confidence | Reasoning |
|------------------|------------|-----------|
| beforeinstallprompt timing | HIGH | Official MDN docs + Next.js community patterns |
| iOS detection | MEDIUM | WebSearch verified with MDN, but edge cases need testing |
| localStorage persistence | HIGH | Official Apple Developer Forums + multiple sources |
| Already-installed detection | HIGH | Official web.dev docs + getInstalledRelatedApps API |
| Prompt timing UX | HIGH | Official web.dev patterns guide |
| Browser support | HIGH | MDN browser compatibility table |
| Hydration issues | HIGH | Next.js 15 official docs + React patterns |
| Service worker timing | HIGH | MDN PWA guides + Microsoft Edge docs |
| iOS safe area insets | MEDIUM | Community solutions, some Next.js specific issues |

**Overall assessment:** Research is comprehensive for standard pitfalls. iOS-specific edge cases (EU region, iPad variations) may need additional validation during implementation phase.
