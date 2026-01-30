# Phase 15: In-App Install Access - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Logged-in users can install the PWA from inside the app. Install banner appears on main app pages, and a settings card provides a permanent fallback. Reuses Phase 13 infrastructure (PwaInstallProvider) and Phase 14 patterns (InstallBanner, iOS walkthrough).

</domain>

<decisions>
## Implementation Decisions

### Banner placement
- Show on all main pages: Vandaag, Inzichten, Taken, Instellingen
- Floating bottom position (same as landing page banner)
- 2-3 second delay before appearing (let content load first)
- Reuse same InstallBanner component design from Phase 14

### Settings card design
- Position: Between Account and Daily Target sections
- Style: Same as other settings cards (consistent, blends in)
- Content: Title + short description + button
- Platform-specific text: iOS shows "Voeg toe aan beginscherm", Android shows "Installeren"

### Dismissal behavior
- Separate states: Banner dismiss ≠ settings card visibility
- Settings card always visible until app is installed
- Shared banner dismiss: Landing page and in-app banner share the same dismiss state
- When installed (standalone mode): Hide both banner and settings card entirely
- No re-show option: Settings card is the permanent fallback

### User messaging
- In-app banner uses different text than landing page (tailored for logged-in users)
- Value proposition: "Volledige app-ervaring" (full app experience)
- Tone: Playful, matches app's joyful personality
- Settings card description: Benefit-focused ("Open HabitStreak direct vanaf je startscherm")

### Claude's Discretion
- Exact Dutch copy for in-app banner
- Animation timing details
- Settings card icon choice

</decisions>

<specifics>
## Specific Ideas

- Banner should feel like the landing page banner but with messaging that acknowledges the user already knows the app
- Settings card should feel native to the existing settings page — not promotional

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-in-app-install*
*Context gathered: 2026-01-30*
