# Project Research Summary

**Project:** HabitStreak v1.3 First Impressions
**Domain:** Landing pages and PWA enhancement for Next.js 15 apps
**Researched:** 2026-01-26
**Confidence:** HIGH

## Executive Summary

HabitStreak v1.3 aims to create an inviting entry experience with a landing page, PWA icons, and login polish. Research reveals the existing stack (Next.js 15, React 19, Tailwind CSS, shadcn/ui) already provides everything needed — no new framework dependencies required.

The primary technical debt is PWA icons: the manifest.json declares 8 icon sizes but `/public/icons/` only contains a README placeholder, causing 404 errors. This must be fixed before landing page work. The current `"purpose": "any maskable"` pattern is deprecated and should be replaced with separate icon entries.

For the landing page, Next.js 15 App Router with a `(marketing)` route group provides clean separation from auth and app routes. Landing pages are static by default (SSG), giving optimal SEO and performance. Middleware requires updating to allow public access to `/` and redirect authenticated users to `/vandaag`. HabitStreak's glassmorphism design is a competitive differentiator — most habit trackers have utilitarian UIs. Lead with visual appeal.

## Key Findings

### Recommended Stack

No new framework dependencies needed. The existing stack handles everything:

- **Next.js 15.1.3**: SSG for landing page is automatic (no `generateStaticParams` needed)
- **Tailwind CSS 3.4**: Has `backdrop-blur-*` utilities built-in for glassmorphism
- **shadcn/ui**: Reuse Button, Card components for CTAs and feature cards
- **@vite-pwa/assets-generator** (new dev dep): Generate PWA icons from single source image

See [STACK.md](./STACK.md) for full details.

### Expected Features

**Must have (table stakes):**
- Hero section with headline, subheadline, primary CTA, phone mockup
- Feature highlights (3-4 features with icons)
- Secondary CTA at bottom
- Mobile-responsive design
- Fast load time (<3 seconds)

**Should have (competitive):**
- "How It Works" 3-step section
- Visual identity showcase (glassmorphism + animations as differentiator)
- Minimal footer

**Defer (v2+):**
- Interactive demo (HIGH complexity)
- Video walkthrough (production effort)
- Testimonials (no external users for self-hosted app)

**Anti-features (skip entirely):**
- Pricing section (self-hosted, no tiers)
- User count stats (personal app)
- Newsletter signup (not a marketing business)
- Live chat / enterprise features

See [FEATURES.md](./FEATURES.md) for full details.

### Architecture Approach

Use `(marketing)` route group at root level for landing page:

```
src/app/
├── (marketing)/          # NEW: Public marketing pages
│   ├── layout.tsx        # Minimal layout (no app chrome)
│   └── page.tsx          # Landing page at /
├── (auth)/               # Existing: login, signup
├── (main)/               # Existing: protected app
└── api/                  # Existing: API routes
```

**Key patterns:**
1. Landing page is static Server Component (SSG) — no auth checks in component
2. Middleware handles redirect: authenticated users → `/vandaag`
3. Delete current `src/app/page.tsx` (redirect-only) after landing page complete

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details.

### Critical Pitfalls

1. **PWA Icons Not Generated** — manifest.json references files that don't exist. Fix: Generate icons BEFORE adding them to manifest. Use `@vite-pwa/assets-generator`.

2. **"any maskable" Combined Purpose** — Deprecated pattern causes display issues. Fix: Create separate icon entries for `any` and `maskable` purposes.

3. **Middleware Blocking Static Assets** — Current pattern explicitly lists files to exclude. Fix: Use extension-based exclusion pattern for future-proofing.

4. **Route Group Conflicts** — Adding landing page requires middleware update first. Fix: Whitelist `/` in `authorized` callback BEFORE creating landing page.

5. **Glassmorphism Performance** — backdrop-filter is GPU-intensive. Fix: Limit blur to 6-10px, max 2-3 glass elements per viewport, never animate.

See [PITFALLS.md](./PITFALLS.md) for full details.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: PWA Icons
**Rationale:** Unblocks manifest errors, required before any public-facing work
**Delivers:** Complete icon set (192x192, 512x512 for any/maskable), apple-touch-icon
**Addresses:** PWA install capability, console 404 errors
**Avoids:** Pitfalls #1, #2, #6 (icons not generated, any maskable, apple icon)

### Phase 2: Landing Page Foundation
**Rationale:** Must update middleware before adding public routes
**Delivers:** `(marketing)` route group, middleware updates, basic landing page structure
**Uses:** Next.js route groups, Auth.js middleware patterns
**Avoids:** Pitfall #3, #4 (middleware blocking, route conflicts)

### Phase 3: Landing Page Content
**Rationale:** Content depends on route structure being correct
**Delivers:** Hero section, feature highlights, CTAs, phone mockup
**Implements:** Table stakes features from FEATURES.md
**Avoids:** Pitfall #5 (first impression UX failures)

### Phase 4: Login Page Polish
**Rationale:** Final polish after main landing page complete
**Delivers:** Welcoming message, branding consistency, improved flow from landing
**Uses:** Existing glassmorphism design system

### Phase Ordering Rationale

- **PWA icons first**: Fixing manifest errors should precede any public launch — visitors shouldn't see 404s in console
- **Foundation before content**: Middleware and route structure must work before building landing page UI
- **Landing before login polish**: Login page improvements are lower priority than the main entry experience
- **No parallelization**: Each phase depends on the previous (icons → routes → content → polish)

### Research Flags

Phases with standard patterns (skip research-phase):
- **Phase 1 (PWA Icons):** Well-documented, `@vite-pwa/assets-generator` CLI handles everything
- **Phase 2 (Foundation):** Standard Next.js patterns, documented in ARCHITECTURE.md
- **Phase 3 (Landing Content):** Copy/design decisions, not technical research
- **Phase 4 (Login Polish):** Minor UI adjustments, no research needed

No phases require additional research — all patterns are well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified existing deps handle all requirements |
| Features | HIGH | Consistent patterns across competitor analysis |
| Architecture | HIGH | Official Next.js docs + existing codebase patterns |
| Pitfalls | HIGH | Verified against actual project code + official docs |

**Overall confidence:** HIGH

### Gaps to Address

- **Dutch copywriting**: Headlines like "Bouw gewoontes die blijven" need native speaker review for natural phrasing
- **Phone mockup creation**: Will need to capture real app screenshots and create device frame — tooling TBD
- **OG image design**: Need to create 1200x630 Open Graph image for social sharing
- **Logo source file**: Need high-quality SVG or 512x512+ PNG for PWA icon generation

## Sources

### Primary (HIGH confidence)
- [Next.js App Icons Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons)
- [Next.js Route Groups Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Auth.js Protecting Routes](https://authjs.dev/getting-started/session-management/protecting)
- [@vite-pwa/assets-generator CLI](https://vite-pwa-org.netlify.app/assets-generator/cli)
- [Tailwind CSS Backdrop Blur](https://tailwindcss.com/docs/backdrop-filter-blur)

### Secondary (MEDIUM confidence)
- [Todoist Landing Page](https://todoist.com) — Competitor analysis
- [Notion Landing Page](https://notion.com) — Competitor analysis
- [Clerk: Skip Middleware for Static Files](https://clerk.com/blog/skip-nextjs-middleware-static-and-public-files)
- [Dev.to: Why PWA icons shouldn't use "any maskable"](https://dev.to/progressier/why-a-pwa-app-icon-shouldnt-have-a-purpose-set-to-any-maskable-4c78)

### Verified from Project
- `package.json` — Current dependency versions
- `public/manifest.json` — PWA manifest structure (has 404 errors)
- `public/icons/README.md` — Confirms icons not generated
- `src/middleware.ts` — Current matcher pattern
- `src/lib/auth.config.ts` — Current authorized callback
- `src/app/globals.css` — Existing glassmorphism utilities

---
*Research completed: 2026-01-26*
*Ready for roadmap: yes*
