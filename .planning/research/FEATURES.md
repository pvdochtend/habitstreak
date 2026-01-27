# Feature Landscape: PWA Install Prompts

**Domain:** Progressive Web App installation promotion and guidance
**Researched:** 2026-01-27
**Confidence:** HIGH (verified with Context7, MDN, web.dev official documentation)

## Executive Summary

PWA install prompts require platform-specific implementations due to fundamental differences between Android and iOS. Android supports programmatic `beforeinstallprompt` events enabling custom UI triggers, while iOS requires manual instruction walkthroughs. Best practices emphasize respectful timing (post-engagement), persistent dismissal tracking, and non-disruptive placement. The feature landscape divides into core installation mechanics (table stakes) and enhanced UX patterns (differentiators).

---

## Table Stakes

Features users expect from PWA install prompts. Missing these = broken or frustrating experience.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Dismissible UI** | Users must be able to decline without friction | Low | All prompts need close button with localStorage persistence |
| **Platform Detection** | Different UI for iOS vs Android | Low | Check `BeforeInstallPromptEvent` support + user agent |
| **Android Native Prompt** | Android users expect system install dialog | Medium | Requires `beforeinstallprompt` event capture + `.prompt()` call |
| **iOS Visual Instructions** | iOS lacks programmatic install, needs manual guidance | Medium | Step-by-step with Share icon + "Add to Home Screen" visuals |
| **Persistent Dismissal** | Don't re-show after user dismisses | Low | localStorage flag tracking dismissal state |
| **Touch-Friendly Targets** | Mobile-first requires ≥44px touch targets | Low | WCAG AAA: 44×44px minimum for buttons |
| **Display Mode Detection** | Hide install UI if already installed | Low | CSS media query `display-mode: standalone` |
| **Accessible Markup** | Screen reader support | Low | Semantic HTML (`<button>`, `<dialog>`) + ARIA labels |

---

## Differentiators

Features that set install experiences apart. Not expected, but highly valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Contextual Timing** | Show after engagement signals (login, task completion) | Low | Defer prompt until conversion event vs immediate page load |
| **Value Proposition Copy** | Explain *why* to install before showing prompt | Low | "Access HabitStreak instantly" beats "Install this app" |
| **Multi-Location Availability** | Install option in multiple places (banner, settings, menu) | Low | Increases discoverability without being pushy |
| **Visual Walkthrough Modal** | iOS: Full-screen modal with screenshots of Share button | Medium | More effective than text-only instructions |
| **Animated Instructions** | Highlight Share button location with animation | Medium-High | Attention-grabbing for iOS where button isn't obvious |
| **Snackbar/Toast Pattern** | Temporary, non-blocking notification (4-7 seconds) | Low | Better UX than permanent banner |
| **"Show Me How" Button** | User-initiated instruction trigger | Low | Respectful alternative to auto-showing instructions |
| **Progressive Disclosure** | Banner → Button → Full instructions flow | Medium | Reduces cognitive load |
| **Localization** | Install prompts in user's language | Low-Medium | HabitStreak already uses Dutch UI text |
| **Install Success Feedback** | Confirmation message after successful install | Low | Closes the feedback loop |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in PWA install patterns.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Immediate Page Load Prompt** | Disruptive, no value context established | Wait for engagement signals (2+ visits, login, task complete) |
| **Modal on Every Visit** | Annoying, reduces engagement metrics | Respect dismissal permanently (or until major conversion) |
| **Blocking Critical UI** | Interferes with core user journey | Place prompts outside navigation flow (footer, settings) |
| **No Dismiss Option** | Traps users, feels pushy | Always provide close button with persistent dismissal |
| **Desktop-Focused Install UI** | PWAs are mobile-first | Design for mobile touch, desktop is secondary |
| **Auto-Playing Install Video** | Wastes bandwidth, annoying | Static images with optional "Show Me" trigger |
| **Permission Bundle** | "Install + enable notifications" together | Separate concerns, ask for install first |
| **Fake Install Buttons** | Show install UI when `beforeinstallprompt` hasn't fired | Hide UI until event fires or provide iOS fallback |
| **Generic "Install App" Copy** | Doesn't explain value | "Track habits instantly" or "Open HabitStreak faster" |
| **Non-Semantic HTML** | Breaks keyboard nav and screen readers | Use `<button>`, `<dialog>`, not `<div onclick>` |
| **Prompt on Login Page** | Blocks authentication flow | Place below login form or defer until post-login |

---

## Feature Dependencies

### Installation Flow Hierarchy

```
Platform Detection
    ↓
├─ Android/Chrome
│   ↓
│   beforeinstallprompt Event Listener
│   ↓
│   Custom Install Trigger Button
│   ↓
│   Native Install Dialog (.prompt())
│
└─ iOS/Safari
    ↓
    Manual Install Instructions
    ↓
    Visual Walkthrough Modal
    ↓
    Step-by-step with Icons/Screenshots
```

### Dismissal & State Management

```
User Dismisses Prompt
    ↓
localStorage.setItem('pwa-dismissed', 'true')
    ↓
Check on Future Visits
    ↓
Only Re-show After Conversion Event
(e.g., user completes 7-day streak)
```

### Multi-Location Pattern

```
Landing Page Banner (new visitors)
    ↓
Post-Login Toast (after first successful login)
    ↓
Settings Page Button (permanent fallback)
```

---

## MVP Recommendation

For HabitStreak's PWA install prompt milestone, prioritize:

### Phase 1: Core Mechanics (Must Have)
1. **Platform detection** - Detect Android vs iOS
2. **Android native prompt** - Capture `beforeinstallprompt`, show custom button
3. **iOS visual instructions** - Modal with Share icon + "Add to Home Screen" graphics
4. **Dismissal persistence** - localStorage tracking, respect user choice
5. **Display mode detection** - Hide install UI if already installed

### Phase 2: Enhanced UX (Should Have)
6. **Snackbar/toast pattern** - Non-blocking, auto-dismissing (5s)
7. **"Show Me How" button** - iOS users trigger instructions manually
8. **Contextual timing** - Show after login (existing users) or on landing page (new visitors)
9. **Settings fallback** - Permanent "Install App" button in settings

### Phase 3: Polish (Nice to Have)
10. **Value proposition copy** - Dutch text explaining benefits
11. **Install success feedback** - Confirmation toast
12. **Multi-location availability** - Landing + post-login + settings

### Explicitly Defer to Post-MVP
- Animated instruction highlights (complex, diminishing returns)
- Video walkthroughs (bandwidth concerns)
- A/B testing install copy variations
- Analytics tracking (install rate, dismissal rate)
- Re-prompting logic after streak milestones

---

## Implementation Complexity Assessment

| Feature Category | Estimated Effort | Risk Level |
|-----------------|------------------|-----------|
| Platform Detection | 2 hours | Low - straightforward user agent + API checks |
| Android Native Prompt | 4 hours | Low - well-documented `beforeinstallprompt` API |
| iOS Visual Instructions | 6 hours | Medium - requires modal design + graphics |
| Dismissal Tracking | 2 hours | Low - simple localStorage operations |
| Toast/Snackbar UI | 3 hours | Low - existing Tailwind animations |
| Settings Page Button | 2 hours | Low - add button + trigger existing logic |
| **Total Estimated** | **~19 hours** | **Overall: Low-Medium** |

---

## Platform-Specific Considerations

### Android/Chrome

**Supported Browsers:**
- Chrome for Android
- Edge for Android
- Samsung Internet (Chromium-based)

**Key Technical Details:**
- `beforeinstallprompt` event fires when PWA meets installability criteria
- Must call `event.preventDefault()` to defer native prompt
- Can only call `prompt()` once per event instance
- Enhanced install dialog if manifest includes `description` + `screenshots`

**Best Practices:**
- Wait for user gesture before calling `.prompt()`
- Track dismissal outcome via `event.outcome` property
- Listen for `appinstalled` event to hide custom UI

### iOS/Safari

**Supported Browsers:**
- Safari (iOS 11.3+)
- Chrome on iOS (iOS 17+ via Share button, but not programmatic)

**Key Technical Details:**
- NO `beforeinstallprompt` support
- Installation only via Safari's Share → "Add to Home Screen"
- Installed PWAs appear in App Library, Spotlight, Siri Suggestions

**Best Practices:**
- Show step-by-step instructions with visual icons
- Use Share icon graphic (square with upward arrow)
- Provide "Show Me How" button instead of auto-modal
- Detect iOS specifically (not just "no beforeinstallprompt")

### Desktop

**Not a Priority for HabitStreak:**
- PWA is mobile-first habit tracker
- Desktop install prompts are lower priority
- Can reuse Android logic for Chromium desktop browsers

---

## Accessibility Requirements

### WCAG Compliance

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| **2.5.5 Target Size (AAA)** | 44×44px minimum touch targets | All buttons: `min-width: 44px; min-height: 44px` |
| **2.5.8 Target Size (AA)** | 24×24px minimum (WCAG 2.2) | Exceed with 44px standard |
| **1.4.3 Contrast** | 4.5:1 text contrast ratio | Use existing theme colors (already compliant) |
| **2.1.1 Keyboard** | All functionality keyboard accessible | Semantic `<button>` elements auto-support |
| **4.1.2 Name, Role, Value** | ARIA labels for screen readers | `aria-label="Install HabitStreak app"` |

### Mobile Touch Optimization

- **Touch target spacing:** 8px minimum between interactive elements
- **Edge precision:** Avoid placing critical buttons at top/bottom screen edges (lower precision)
- **Thumb zone:** Place primary "Install" button in lower 1/3 of screen (natural thumb reach)

### Keyboard Navigation

- Modal should trap focus (tab loops within dialog)
- ESC key closes modal
- Enter key activates focused button
- Use `<dialog>` element for native focus management

---

## Design Patterns from Real-World PWAs

### Successful Implementations (2026)

**Fodmapedia:**
- Installation right from home page
- Step-by-step instructions tailored to device
- Non-intrusive placement

**Bingo em Casa:**
- Install prompt on login page (below form, not blocking)
- Post-install push notification prompt (separate timing)

**Starbucks PWA:**
- Snackbar pattern after adding item to cart (engagement signal)
- 5-second auto-dismiss with action button

### Common Patterns

| Pattern | Use Case | Timing | Duration |
|---------|----------|--------|----------|
| **Snackbar** | Post-interaction prompt | After engagement action | 4-7 seconds |
| **Banner (dismissible)** | Landing page | On page load | Persistent until dismissed |
| **Modal** | iOS instructions | User clicks "Show Me How" | User-controlled |
| **Menu Item** | Settings page | Permanent fallback | N/A |

---

## Anti-Pattern Case Studies

### What NOT to Do

**❌ Install Prompt on Page Load (Immediate)**
- **Problem:** No context, user hasn't experienced value
- **Result:** High dismissal rate, annoyance
- **Fix:** Wait for 2+ visits or engagement signal

**❌ Non-Dismissible Full-Screen Takeover**
- **Problem:** Blocks access to app, feels coercive
- **Result:** User closes tab entirely
- **Fix:** Always provide close button, non-blocking UI

**❌ Showing Android Prompt on iOS**
- **Problem:** "Install" button does nothing (no API support)
- **Result:** Broken experience, user confusion
- **Fix:** Platform detection → iOS instructions vs Android native

**❌ Combining Install + Push Notifications**
- **Problem:** Double permission request feels aggressive
- **Result:** Users reject both
- **Fix:** Install first, ask for notifications post-install

---

## Testing Strategy

### Functional Testing

| Test Case | Android Expected | iOS Expected |
|-----------|------------------|--------------|
| **First visit** | `beforeinstallprompt` fires, button shows | Instructions available on demand |
| **Click install** | Native dialog appears | Modal with Share instructions |
| **Dismiss prompt** | localStorage set, no re-show | localStorage set, no re-show |
| **Already installed** | Install UI hidden | Install UI hidden |
| **Post-login** | Toast appears (if dismissed earlier) | Toast appears (if dismissed earlier) |

### Cross-Browser Testing

- **Android:** Chrome 120+, Edge, Samsung Internet
- **iOS:** Safari 15+, Chrome on iOS 17+
- **Desktop:** Chrome, Edge (lower priority)

### Accessibility Testing

- Keyboard navigation (Tab, Enter, ESC)
- Screen reader (VoiceOver on iOS, TalkBack on Android)
- Touch target sizes (manual measurement)
- Color contrast (automated tools)

---

## Sources

### Official Documentation (HIGH Confidence)
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN: Trigger installation from your PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)
- [MDN: PWA Best Practices](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices)
- [web.dev: Installation prompt](https://web.dev/learn/pwa/installation-prompt)
- [web.dev: Patterns for promoting PWA installation](https://web.dev/articles/promote-install)
- [Chrome Developers: Changes to A2HS behavior](https://developer.chrome.com/blog/a2hs-updates)

### WCAG Standards (HIGH Confidence)
- [W3C: Success Criterion 2.5.5: Target Size (AAA)](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [W3C: Success Criterion 2.5.8: Target Size Minimum (AA)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)
- [Smashing Magazine: Accessible Target Sizes Cheatsheet](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)

### Implementation Examples (MEDIUM Confidence)
- [GitHub: khmyznikov/pwa-install](https://github.com/khmyznikov/pwa-install) - Web component library
- [Progressier: PWA Examples 2026](https://progressier.com/pwa-examples-you-can-learn-from)
- [SimiCart: PWA Add to Home Screen Guide](https://simicart.com/blog/pwa-add-to-home-screen/)

### Community Resources (MEDIUM Confidence)
- [What PWA Can Do Today: Installation](https://whatpwacando.today/installation/)
- [love2dev: beforeinstallprompt Guide](https://love2dev.com/blog/beforeinstallprompt/)
- [Progressier: In-App PWA Promotion Patterns](https://progressier.com/features/in-app-pwa-promotion)

---

## Research Notes

### Verification Status

- ✅ **Android `beforeinstallprompt` API:** Verified via MDN and web.dev official docs
- ✅ **iOS manual installation requirement:** Verified via MDN and Chrome Developers blog
- ✅ **WCAG target size requirements:** Verified via W3C official specifications
- ✅ **Best practice patterns:** Cross-verified across MDN, web.dev, and community implementations

### Open Questions for Implementation

1. **Timing Logic:** Should post-login toast show immediately or after N seconds delay?
2. **Re-prompt Strategy:** Should we re-prompt after 7-day streak milestone, or never?
3. **Analytics:** Do we track install attempts/success rates in this milestone or defer?
4. **iOS Graphics:** Use custom illustrations or standard iOS Share icon SVG?

### Assumptions

- HabitStreak manifest already meets PWA installability criteria (manifest.json, service worker, HTTPS)
- Existing Dutch localization infrastructure can be reused for install prompt text
- `.touch-target` class already implements 44px minimum (per CLAUDE.md)
- Tailwind animations (`animate-fade-in`, `animate-slide-up`) can be reused

### Confidence Assessment

| Research Area | Confidence | Rationale |
|--------------|------------|-----------|
| Android Implementation | HIGH | Official MDN/web.dev docs, well-established API |
| iOS Implementation | HIGH | Official docs confirm manual-only approach |
| Accessibility Standards | HIGH | W3C WCAG specifications, not interpretive |
| UX Best Practices | MEDIUM-HIGH | Consensus across multiple authoritative sources |
| Design Patterns | MEDIUM | Based on real-world examples, but subjective |
| Complexity Estimates | MEDIUM | Based on similar feature complexity in HabitStreak |

---

## Conclusion

PWA install prompts are a **well-established pattern with clear platform requirements**. The feature set divides cleanly into Android's programmatic approach and iOS's manual instruction approach. Implementation complexity is LOW-MEDIUM for core features, with the primary challenge being iOS instructional design (requires visual assets).

**Key Success Factors:**
1. Respect user agency (dismissible, non-blocking)
2. Provide clear value proposition (why install?)
3. Platform-appropriate UX (native dialog vs instructions)
4. Accessible implementation (WCAG AAA target sizes)

**Recommended MVP Scope:** Core mechanics (Android native + iOS instructions + dismissal tracking) achievable in ~15-20 hours. Enhanced UX patterns (snackbar, multi-location, polish) add another ~10 hours.

**Risk Assessment:** LOW overall risk. Well-documented APIs, established patterns, no novel technical challenges. Primary dependency is iOS visual asset creation (design time).
