# Project Research Summary

**Project:** HabitStreak v1.4 App Experience - PWA Install Prompts
**Domain:** Progressive Web App installation promotion and user guidance
**Researched:** 2026-01-27
**Confidence:** HIGH

## Executive Summary

PWA install prompts require platform-specific implementations due to fundamental differences between Android/Chrome and iOS/Safari. Android supports programmatic `beforeinstallprompt` events enabling custom UI triggers and native install dialogs, while iOS requires manual instruction walkthroughs teaching users to add via Safari's Share menu. The good news: **no new dependencies are needed**—native browser APIs and existing React patterns are sufficient.

The recommended approach uses a **three-layer architecture**: root provider capturing browser events at layout level, platform-specific detection hooks separating Chrome vs iOS logic, and presentation components rendering conditionally based on platform and dismissal state. This architecture survives Next.js App Router client-side navigation and avoids timing race conditions that plague component-level event listeners.

The key risk is **timing and state management**. The `beforeinstallprompt` event fires once per page load at unpredictable timing—if your component isn't mounted yet, you've lost the event. Additionally, iOS localStorage has a 7-day eviction policy, requiring database storage for dismissal state. Prevention requires: (1) global event listener in root layout, (2) database persistence for dismissal preferences, (3) comprehensive platform detection with fallbacks, and (4) respect for standalone mode to avoid showing prompts to already-installed users.

## Key Findings

### Recommended Stack

**No new dependencies required.** Native browser APIs (`beforeinstallprompt`, `window.navigator.standalone`, `window.matchMedia`) provide all functionality needed. Third-party libraries like `react-pwa-install` (unmaintained since 2020), `pwa-install` web component (100KB+), and `next-pwa` (broken in Next.js 15 with Turbopack) add unnecessary bundle size for marginal developer experience improvements.

**Core technologies:**
- **Next.js 15 App Router**: Client Components for event listeners, Server Components for layout — existing framework handles PWA patterns
- **React 19**: `useEffect` and `useState` sufficient for event handling and state management — no additional state libraries needed
- **Custom hooks**: `usePWAInstall` hook (~1KB) replaces 20KB library dependencies — full control over timing and UX
- **TypeScript**: Custom type definitions for non-standard APIs (`BeforeInstallPromptEvent`, `Navigator.standalone`) — ~15 lines, compile-time only
- **Existing UI components**: Tailwind glassmorphism, shadcn/ui Dialog, Lucide icons already installed — no new UI libraries

**Total bundle impact: ~3KB** (vs. 100KB+ with libraries)

### Expected Features

PWA install prompts divide into core installation mechanics (table stakes) and enhanced UX patterns (differentiators).

**Must have (table stakes):**
- **Platform detection** — Detect Android vs iOS vs already-installed to show appropriate UI
- **Android native prompt** — Capture `beforeinstallprompt` event, show custom button, trigger native dialog
- **iOS visual instructions** — Modal with step-by-step walkthrough (Share icon → "Add to Home Screen")
- **Dismissible UI** — All prompts need close button with persistent dismissal tracking
- **Display mode detection** — Hide install UI if app already installed (standalone mode)
- **Touch-friendly targets** — Mobile-first requires ≥44px touch targets (WCAG AAA compliance)

**Should have (competitive):**
- **Contextual timing** — Show after engagement signals (login, task completion) rather than immediate page load
- **Multi-location availability** — Install option in landing page, post-login, and settings (increases discoverability)
- **"Show Me How" button** — User-initiated instruction trigger (respectful alternative to auto-modal on iOS)
- **Value proposition copy** — Explain *why* to install before showing prompt ("Access instantly" beats "Install app")
- **Install success feedback** — Confirmation message after successful install (closes feedback loop)

**Defer (v2+):**
- **Animated instructions** — Highlight Share button location with animation (complex, diminishing returns)
- **A/B testing install copy** — Variant testing for conversion optimization
- **Re-prompting logic** — Show again after streak milestones (needs careful UX design)
- **Analytics tracking** — Install rate measurement (separate concern from core functionality)

### Architecture Approach

PWA install prompts integrate with Next.js 15 App Router through a **root provider pattern at the layout level**. A `PwaInstallProvider` context wraps the app in `app/layout.tsx`, capturing the `beforeinstallprompt` event before any page-specific components mount. This provider persists across client-side route transitions, solving the critical timing race condition where the event fires before components are ready.

**Major components:**
1. **PwaInstallProvider (context)** — Event listener registration, platform detection, dismissal state via localStorage + database sync, standalone mode detection
2. **InstallPromptBanner (UI)** — Conditionally renders Chrome native button or iOS instructions based on platform detection, respects dismissal state
3. **InstallButton (settings)** — Permanent fallback in settings page, always available regardless of banner dismissal
4. **useIosDetection (hook)** — User agent detection + `navigator.standalone` check, handles iPad edge cases
5. **useWebInstallPrompt (hook)** — Chrome/Edge `beforeinstallprompt` capture and `.prompt()` trigger logic

**Data flow:** Browser fires event → Provider captures in root layout → State stored in context → Multiple components consume context → User action triggers install → Database updated → UI hidden.

**Integration points:** Settings page adds InstallButton card between Account and Daily Target sections. Landing page adds InstallPromptBanner below hero. Protected routes optionally show post-login banner after 30-second dwell time.

### Critical Pitfalls

1. **beforeinstallprompt timing race condition** — Event fires once per page load before components mount. If listener isn't attached in root layout, event is lost forever for that session. Prevention: Install event listener in `app/layout.tsx` provider that mounts immediately and never unmounts during navigation.

2. **iOS detection false confidence** — Simple user agent check fails on iPad with "Request Desktop Website" and doesn't distinguish "not installed" from "installed but viewing in Safari". Prevention: Combine user agent detection, `navigator.standalone` check, and `display-mode: standalone` media query for comprehensive detection.

3. **localStorage persistence for dismissal (iOS 7-day cap)** — iOS evicts localStorage after 7 days of PWA inactivity, causing dismissed prompts to reappear. Prevention: Store dismissal state in database tied to userId (HabitStreak has authentication), use localStorage as cache only.

4. **Showing prompts to already-installed users** — No reliable iOS detection for "installed via Safari but now viewing in Safari again". Android `beforeinstallprompt` doesn't fire after install, but iOS has no equivalent. Prevention: Listen for `appinstalled` event, store in database, check `display-mode: standalone` media query.

5. **Aggressive prompt timing harms conversion** — Showing install prompts on first visit or during critical flows leads to 3-5x higher dismissal rates. Prevention: Show after engagement signals (login, first task completion, 2+ visits), never block primary user journeys.

## Implications for Roadmap

Based on research, suggested phase structure emphasizes **foundation before features** to avoid timing race conditions and hydration issues.

### Phase 1: Context Infrastructure (Foundation)
**Rationale:** Must establish global event listener and platform detection before building any UI. The `beforeinstallprompt` event timing race condition (Pitfall #1) makes this non-negotiable—components can't capture events that fired before they mounted.

**Delivers:**
- `PwaInstallProvider` context in root layout
- `useIosDetection` hook with comprehensive platform detection
- `useWebInstallPrompt` hook for Chrome/Edge event capture
- Dismissal state management with localStorage + database schema
- `appinstalled` event listener for tracking successful installs
- TypeScript type definitions for non-standard browser APIs

**Addresses features:**
- Platform detection (table stakes)
- Display mode detection (table stakes)

**Avoids pitfalls:**
- Pitfall #1: Timing race condition (root provider solution)
- Pitfall #7: Hydration mismatch (client-side detection in useEffect)
- Pitfall #9: Missing appinstalled tracking (listener setup)

**Research needed:** Standard React patterns, no additional research required.

### Phase 2: Settings Page Integration (Low-Hanging Fruit)
**Rationale:** Settings page is isolated from landing/in-app flows, making it ideal for testing context integration without complex timing logic. User-initiated action reduces UX risk.

**Delivers:**
- `InstallButton` component (Card variant matching existing settings design)
- Integration between Account and Daily Target cards
- Manual install instructions as fallback (works regardless of API support)
- Database migration for `installPromptDismissed` and `pwaInstalled` fields on User model

**Addresses features:**
- Multi-location availability (should have)
- "Show Me How" button pattern for iOS (should have)

**Avoids pitfalls:**
- Pitfall #6: Browser support assumptions (manual instructions always available)
- Pitfall #11: No fallback for dismissed prompt (settings always accessible)

**Research needed:** None (straightforward React component + Prisma schema addition).

### Phase 3: Landing Page Banner (High Visibility)
**Rationale:** High-impact conversion point for new users. Landing page is simpler than in-app integration (no auth considerations, immediate display acceptable in marketing context).

**Delivers:**
- `InstallPromptBanner` component (Hero variant with glassmorphism)
- Placement below hero section, above PhoneMockup component
- Platform-specific rendering (Chrome native button vs iOS instructions)
- Dismissal animation with localStorage persistence
- iOS walkthrough modal with Share icon graphics

**Addresses features:**
- Android native prompt (table stakes)
- iOS visual instructions (table stakes)
- Dismissible UI (table stakes)
- Value proposition copy (should have)

**Avoids pitfalls:**
- Pitfall #2: iOS detection (uses comprehensive hook from Phase 1)
- Pitfall #4: Already-installed users (checks standalone mode)
- Pitfall #10: Safe area insets (uses `env(safe-area-inset-bottom)`)

**Research needed:** None (UI implementation using existing components).

### Phase 4: In-App Banner (Complex Timing)
**Rationale:** Most complex timing requirements—must show after engagement without disrupting workflows. Benefits from learnings in Phases 2-3.

**Delivers:**
- Post-login banner in `(main)/layout.tsx`
- Engagement-based timing (30-second dwell OR first task completion)
- Route transition state persistence
- Multi-dismissal handling across navigation

**Addresses features:**
- Contextual timing (should have)
- Multi-location availability (should have - completes landing + settings + in-app)

**Avoids pitfalls:**
- Pitfall #5: Aggressive timing (waits for engagement signals)
- Pitfall #3: localStorage eviction (uses database from Phase 2)

**Research needed:** None (timing logic straightforward, state already managed in Phase 1).

### Phase 5: Polish & Testing
**Rationale:** End-to-end validation across platforms and edge cases identified in research.

**Delivers:**
- Install success feedback (confirmation toast)
- Cross-browser testing (Chrome Android, Safari iOS 15+, iPad edge cases)
- Accessibility audit (keyboard navigation, screen readers, touch targets)
- iOS safe area inset verification on iPhone 14+
- Service worker registration verification in production

**Addresses features:**
- Install success feedback (should have)
- Touch-friendly targets (table stakes - verification)
- Accessible markup (table stakes - verification)

**Avoids pitfalls:**
- Pitfall #8: Service worker timing (verification checklist)
- Pitfall #12: HTTPS testing (staging environment validation)

**Research needed:** None (testing standard practices).

### Phase Ordering Rationale

- **Foundation first** prevents timing race conditions and hydration issues that would require rewrites if UI built first
- **Settings before landing** provides safe testing ground for context integration without high-visibility risk
- **Landing before in-app** delivers conversion value earlier while deferring complex timing logic
- **Polish phase separate** allows incremental delivery of core functionality while scheduling comprehensive testing

**Dependencies identified:**
- All UI phases depend on Phase 1 context infrastructure (global event listener)
- Phase 3 and 4 benefit from Phase 2 learnings (context consumption patterns)
- Phase 5 validates assumptions from Phases 1-4 (detection logic, timing behavior)

**Groupings based on architecture:**
- Phase 1: Infrastructure layer (context + hooks)
- Phase 2-4: Presentation layer (components consuming context)
- Phase 5: Validation layer (testing + edge cases)

### Research Flags

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1 (Context Infrastructure):** Well-documented React Context patterns, MDN official browser API docs
- **Phase 2 (Settings Page):** Straightforward component integration, standard Prisma schema addition
- **Phase 3 (Landing Page Banner):** Standard UI implementation, existing glassmorphism components
- **Phase 4 (In-App Banner):** Timing logic is simple (setTimeout/event listeners), state already managed
- **Phase 5 (Polish & Testing):** Standard testing practices, established accessibility guidelines

**No phases require additional research.** All patterns are well-documented in official sources (MDN, web.dev, Next.js docs). iOS edge cases and browser compatibility are comprehensively covered in PITFALLS.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | MDN official docs + web.dev Google standards, Next.js 15 official guides verified for 2026 |
| Features | **HIGH** | Verified with official MDN PWA guides, web.dev patterns, WCAG standards |
| Architecture | **HIGH** | Next.js App Router patterns from official docs, React Context established pattern |
| Pitfalls | **HIGH** | Official documentation sources (MDN, Apple Developer Forums), multiple corroborating sources |

**Overall confidence:** **HIGH**

All recommendations based on official documentation from MDN, web.dev, Next.js, and WCAG standards. Community sources (GitHub gists, DEV articles) used only to validate patterns already documented in official sources. No reliance on outdated libraries or unmaintained packages.

### Gaps to Address

**iOS 17.4 EU region PWA limitations:** Research indicates iOS 17.4+ in Europe has PWA functionality disabled due to regulatory compliance. This may affect installation in EU markets.

- **Impact:** Potentially affects European users (exact scope unclear from sources)
- **Mitigation during implementation:** Test on iOS devices with EU region settings, provide clear error messaging if installation unavailable, maintain manual bookmark instructions as fallback
- **Validation needed:** Real-device testing on iOS 17.4+ with European region settings

**iPad edge cases:** iPad with "Request Desktop Website" enabled changes user agent and may affect detection logic.

- **Impact:** iOS detection may fail for iPad users requesting desktop sites
- **Mitigation during implementation:** Test detection logic on iPad with desktop mode, provide manual instructions in settings as fallback regardless of detection
- **Validation needed:** QA testing on iPad Pro with "Request Desktop Website" toggle

**iOS localStorage eviction timing:** Apple Developer Forums indicate 7-day cap, but exact conditions (app must not be opened for 7 days) need validation.

- **Impact:** Dismissed prompts may reappear on iOS after inactivity period
- **Mitigation during implementation:** Use database storage for dismissal state (already planned for Phase 2), localStorage only as cache
- **Validation needed:** Long-term QA testing (dismiss prompt, don't open app for 7+ days, verify behavior)

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN: Trigger installation from your PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)
- [MDN: BeforeInstallPromptEvent](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
- [web.dev: Installation prompt](https://web.dev/learn/pwa/installation-prompt)
- [web.dev: Patterns for promoting PWA installation](https://web.dev/articles/promote-install)
- [web.dev: PWA Detection](https://web.dev/learn/pwa/detection)
- [Next.js: Progressive Web Apps Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [W3C: WCAG 2.5.5 Target Size (AAA)](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [W3C: WCAG 2.5.8 Target Size Minimum (AA)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)

### Secondary (MEDIUM confidence)

**Implementation Guides:**
- [Setting up a PWA with install button in Next.js 15 (GitHub Gist)](https://gist.github.com/cdnkr/25d3746bdb35767d66c7ae6d26c2ed98) — Component structure examples
- [Progressive Web App Setup Guide for Next.js 15 (DEV)](https://dev.to/rakibcloud/progressive-web-app-pwa-setup-guide-for-nextjs-15-complete-step-by-step-walkthrough-2b85) — 2026 setup patterns
- [React Hook for Add to Homescreen (GitHub Gist)](https://gist.github.com/rikukissa/cb291a4a82caa670d2e0547c520eae53) — Custom hook patterns

**iOS-Specific:**
- [PWA iOS Limitations and Safari Support](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — Comprehensive iOS limitations guide
- [PWA on iOS - Current Status & Limitations](https://brainhub.eu/library/pwa-on-ios) — iOS installation patterns
- [How to detect if your PWA is installed](https://ben.page/pwa-detect-installed) — Detection strategies

**Best Practices:**
- [Tips, Good Practices, and Pitfalls with Next.js 15](https://www.staytuneed.com/blog/tips-good-practices-and-pitfalls-with-next-js-15) — Next.js 15 patterns
- [Smashing Magazine: Accessible Target Sizes Cheatsheet](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/) — Touch target sizing

### Tertiary (LOW confidence - needs validation)

**Community Discussions:**
- [Safari iOS PWA Data Persistence Beyond 7 Days (Apple Developer Forums)](https://developer.apple.com/forums/thread/710157) — iOS storage eviction timing
- [Private client-side-only PWAs are hard (Hacker News)](https://news.ycombinator.com/item?id=22686602) — iOS localStorage limitations discussion
- [next/link break iOS env(safe-area-inset-bottom) (Vercel Discussion)](https://github.com/vercel/next.js/discussions/81264) — iOS safe area issues with Next.js

---
*Research completed: 2026-01-27*
*Ready for roadmap: yes*
