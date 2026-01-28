# Phase 13: Install Infrastructure - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the PWA install prompt infrastructure: browser event capture, platform detection, standalone mode detection, and dismissal persistence. This phase delivers the context provider and hooks that UI phases (14-15) will consume.

No UI components in this phase — purely infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Root Provider Pattern
- PwaInstallProvider context wraps app in `app/layout.tsx`
- Nests inside ThemeProvider (follows existing pattern)
- Event listener captures `beforeinstallprompt` before any page-specific components mount
- Persists across client-side route transitions

### Platform Detection
- Detect three states: iOS Safari, Chromium-based (Chrome/Edge/Opera), already-installed (standalone)
- Use comprehensive detection: user agent + `navigator.standalone` + `display-mode: standalone` media query
- Handle iPad edge case (Request Desktop Website changes user agent)
- Fallback: if detection uncertain, assume installable and provide manual instructions

### Event Capture
- `beforeinstallprompt` listener attached in root layout immediately on mount
- Store event reference in context state (`event.preventDefault()` to defer)
- Event fires once per page load — if missed, lost for session
- Also listen for `appinstalled` event to update state

### Dismissal Persistence
- Database storage for dismissal state (tied to userId)
- localStorage as cache only (iOS evicts after 7 days of inactivity)
- Two database fields on User model: `installPromptDismissed`, `pwaInstalled`
- API endpoint for syncing dismissal state

### Standalone Mode Detection
- Check `display-mode: standalone` media query
- Check `navigator.standalone` (iOS-specific)
- If either true, user already has app installed — hide all install prompts

### Hook Design
- `usePwaInstall` — main hook exposing context (platform, canInstall, triggerInstall, dismiss)
- `useIosDetection` — internal hook for iOS/Safari detection logic
- `useWebInstallPrompt` — internal hook for Chrome/Edge event handling

### TypeScript Types
- Define `BeforeInstallPromptEvent` interface (not in standard lib)
- Define extended `Navigator` interface for `standalone` property
- ~15 lines of type definitions

### Claude's Discretion
- Exact hook file organization (single file vs split)
- Internal implementation details of detection logic
- Error handling patterns
- localStorage key naming

</decisions>

<specifics>
## Specific Ideas

- Follow ThemeProvider pattern in existing codebase (`src/contexts/theme-context.tsx`)
- Provider file location: `src/contexts/pwa-install-context.tsx`
- Hook files location: `src/hooks/use-ios-detection.ts`, `src/hooks/use-web-install-prompt.ts`
- Zero new dependencies — native browser APIs sufficient

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

Research captured comprehensive UI decisions for Phases 14-15:
- Install banner design (Phase 14)
- iOS walkthrough modal (Phase 14)
- Settings page integration (Phase 15)
- In-app banner timing (Phase 15)

</deferred>

---

*Phase: 13-install-infrastructure*
*Context gathered: 2026-01-28*
