# Project Milestones: HabitStreak

## v1.4 App Experience (Shipped: 2026-01-31)

**Delivered:** Made PWA installation discoverable and easy with install banners, iOS visual walkthrough, and settings fallback.

**Phases completed:** 13-15 (4 plans total)

**Key accomplishments:**

- PWA install infrastructure — Context provider with platform detection (iOS Safari vs Chromium), beforeinstallprompt capture, and standalone mode detection
- Landing page install banner — First-time visitors see install prompt with platform-specific CTA and 2.5s delayed slide-up animation
- iOS visual walkthrough — 3-step Dutch instructions modal with Share icon for Add to Home Screen
- In-app install banner — Logged-in users see install prompt on all main app pages
- Settings install card — Permanent fallback that works even after banner dismissal
- Persistent dismissal — localStorage-based per-device storage with database backup

**Stats:**

- 33 files created/modified
- +3,814 lines (6,629 total TypeScript/TSX)
- 3 phases, 4 plans
- 3 days (2026-01-28 → 2026-01-30)

**Git range:** `docs(13)` → `docs(15)`

**What's next:** To be determined — service worker for full Chromium install support, or new features

---

## v1.3 First Impressions (Shipped: 2026-01-27)

**Delivered:** Inviting entry experience with glassmorphism landing page, phone mockup, feature highlights, and polished auth pages with branding.

**Phases completed:** 10-12 (3 plans total)

**Key accomplishments:**

- Complete PWA icon set - Generated 9 icons (72-512px) from favicon.svg, fixed manifest 404 errors
- Glassmorphism landing page - Hero section with Dutch headline, subheadline, and CTAs
- Phone mockup preview - Stylized Today view showing tasks and progress bar
- Feature highlights - 4 cards explaining tracking, streaks, insights, and mobile-first design
- Auth page polish - Added animated backgrounds, flame branding, welcoming messages to login/signup
- Visual continuity - All entry points share consistent glassmorphism aesthetic

**Stats:**

- 30 files created/modified
- +1,357 lines (6,048 total TypeScript/TSX)
- 3 phases, 3 plans
- 1 day (entire milestone completed 2026-01-27)

**Git range:** `feat(10-01)` → `feat(12-01)`

**What's next:** To be determined — consider iOS scroll-to-top fix, streak freezes, or additional polish

---

## v1.2 Auth.js v5 Migration (Shipped: 2026-01-23)

**Delivered:** Enabled dynamic URL detection for self-hosting, allowing login on localhost, IP addresses, and custom domains without configuration changes.

**Phases completed:** 9 (2 plans total)

**Key accomplishments:**

- Migrated NextAuth v4 → Auth.js v5 - Upgraded to v5.0.0-beta.30 with split configuration pattern (edge-compatible auth.config.ts + full auth.ts)
- Dynamic URL detection enabled - Configured trustHost: true, eliminating need for hardcoded NEXTAUTH_URL
- Complete v5 integration - Updated API routes, middleware, and auth helpers to use v5 patterns (handlers export, auth() function, NextAuth(authConfig))
- Multi-URL authentication verified - Tested and confirmed login works on localhost:3000, 127.0.0.1:3000, and LAN IP 192.168.0.3:3000 with session persistence
- Zero-regression migration - Preserved all existing auth functionality including rate limiting, credential validation, and protected route handling

**Stats:**

- 18 files modified (+563 insertions / -411 deletions)
- 5,676 lines of TypeScript/TSX total
- 1 phase, 2 plans, 8 tasks
- 17 days from start to ship (2026-01-06 → 2026-01-23)

**Git range:** `027194f` (chore: upgrade to next-auth@beta) → `2dace40` (docs: complete Integration plan)

**What's next:** To be determined in next milestone planning

---

## v1.1 Self-Hosting & Polish (Shipped: 2026-01-19)

**Delivered:** Enabled self-hosting via Docker while fixing critical streak calculation bug and enhancing flame animation visibility.

**Phases completed:** 6-8 (5 plans total)

**Key accomplishments:**

- Self-hosting capability via Docker - Full containerization with multi-stage Dockerfile (351MB), PostgreSQL orchestration, health checks, and comprehensive Synology NAS deployment documentation
- Correct streak calculation - Fixed critical bug where weekends with weekday-only tasks incorrectly broke streaks using effectiveTarget formula
- Enhanced flame animations - Increased visibility (50-80% opacity, 4-10px blur) and eliminated visual blink on task completion
- Production-ready deployment - End-to-end tested Docker setup with automated migrations, health monitoring, and both GUI/CLI deployment paths
- Test coverage for edge cases - 13 unit tests covering WORKWEEK/WEEKEND/ALL_WEEK schedule preset combinations

**Stats:**

- 23 files created/modified
- +1,580 insertions / -44 deletions
- 3 phases, 5 plans
- 1-2 days from start to ship (2026-01-18 → 2026-01-19)

**Git range:** `4969344` (feat(06-01)) → `13c17f5` (feat(08-01))

**What's next:** To be determined in next milestone planning

---

## v1.0 UI Refresh (Shipped: 2026-01-18)

**Delivered:** Transformed HabitStreak from a functional but dull habit tracker into a playful, celebratory experience with glassmorphism design, animated interactions, and full accessibility support.

**Phases completed:** 1-5 (16 plans total)

**Key accomplishments:**

- Glassmorphism visual direction - User-chosen glass aesthetic with frosted panels and semi-transparent backgrounds
- Full animation foundation - Button feedback, shimmer skeletons, page transitions, all respecting prefers-reduced-motion
- Joyful task completion - Confetti bursts, animated checkmarks, particle effects, and haptic feedback
- Animated streak display - Rolling number animation (0-99) with flickering flame icon for active streaks
- Dynamic animated backgrounds - Floating gradient orbs with theme-aware colors
- Consistent glass styling - All Card components unified with glassmorphism effect across every screen

**Stats:**

- 77 files created/modified
- ~5,600 lines of TypeScript/TSX
- 5 phases, 16 plans
- 3 days from start to ship (2026-01-16 → 2026-01-18)

**Git range:** `feat(01-01)` → `docs(02)`

**What's next:** To be determined in next milestone planning

---
