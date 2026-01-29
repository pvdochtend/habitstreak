# Phase 14: Landing Page Install Experience - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

First-time visitors can discover and install the PWA from the landing page. Covers install banner display and iOS walkthrough for adding to home screen. In-app install experience and settings page button are separate phases (Phase 15).

</domain>

<decisions>
## Implementation Decisions

### Banner appearance
- Fixed bottom position — sticky bar at bottom of viewport, always visible
- Subtle and minimal styling — understated, blends in, doesn't compete with hero CTAs
- Appears after short delay (2-3 seconds) — slides in after page load
- X icon plus "Niet nu" text for dismiss button — both visual and text options

### iOS walkthrough
- Screenshot-style visuals — realistic representation of Safari's share menu
- 3 steps: 1. Tap Share 2. Scroll to find option 3. Tap "Zet op beginscherm"
- Closing walkthrough keeps banner visible — only walkthrough dismisses, not the banner

### Dismissal behavior
- Single tap dismisses permanently — no confirmation dialog
- Walkthrough close is separate from banner dismiss — walkthrough can be re-opened from banner

### Claude's Discretion
- Whether to include app icon in banner (text-only vs icon+text)
- Walkthrough presentation format (modal overlay vs bottom sheet)
- Walkthrough step navigation (all visible vs carousel)
- Dismiss animation style (slide down vs fade out)

</decisions>

<specifics>
## Specific Ideas

- Banner should feel like a helpful suggestion, not an intrusive popup
- iOS walkthrough should match what users actually see in Safari — recognizable screenshots
- Dutch text throughout: "Installeer de app", "Niet nu", "Zet op beginscherm"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-landing-page-install*
*Context gathered: 2026-01-29*
