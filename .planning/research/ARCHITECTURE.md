# Architecture Research

**Domain:** Landing pages in Next.js 15 App Router with Auth.js v5
**Researched:** 2026-01-26
**Confidence:** HIGH

## Summary

Landing pages in Next.js 15 should use route groups to separate marketing/public pages from the authenticated app. The standard pattern is a `(marketing)` route group at the root level containing all public pages, with the landing page at `(marketing)/page.tsx` serving as the home route (`/`). This integrates cleanly with existing `(auth)` and `(main)` route groups.

For HabitStreak, the landing page should be a **Server Component using Static Site Generation (SSG)** for optimal SEO and performance. Auth.js v5 middleware handles redirecting authenticated users to `/vandaag` when they visit the landing page.

**Primary recommendation:** Add a `(marketing)` route group with the landing page as a static Server Component. Update middleware to allow public access to `/` and add auth-based redirect logic.

## System Overview

```
                    Request to /
                         |
                         v
              +------------------+
              |   Middleware     |
              | (Auth.js v5)     |
              +------------------+
                    |
        +-----------+-----------+
        |                       |
   Authenticated?           Not Auth?
        |                       |
        v                       v
+---------------+       +------------------+
| Redirect to   |       | (marketing)/     |
| /vandaag      |       | page.tsx         |
+---------------+       | (Static SSG)     |
                        +------------------+
                               |
                               v
                        +------------------+
                        | Landing Page UI  |
                        | (Server Rendered)|
                        +------------------+
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `(marketing)/page.tsx` | Landing page content | Static Server Component (SSG) |
| `(marketing)/layout.tsx` | Marketing layout (no app chrome) | Minimal layout, no bottom nav |
| Middleware | Route protection + auth redirects | Check auth, redirect logged-in users from landing |
| `auth.config.ts` | Define public paths | Add `/` to publicPaths array in `authorized` callback |

## Recommended Project Structure

```
src/app/
├── layout.tsx              # Root layout (unchanged - html/body/ThemeProvider)
├── (marketing)/            # NEW: Public marketing pages
│   ├── layout.tsx          # Marketing layout (optional, for shared header/footer)
│   └── page.tsx            # Landing page at /
├── (auth)/                 # Existing: Auth pages
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (main)/                 # Existing: Protected app pages
│   ├── layout.tsx          # App layout with BottomNav
│   ├── vandaag/page.tsx
│   ├── inzichten/page.tsx
│   ├── taken/page.tsx
│   └── instellingen/page.tsx
└── api/                    # Existing: API routes
```

**DELETE:** `src/app/page.tsx` (current redirect-only page superseded by landing page)

### Structure Rationale

1. **Route groups preserve URL structure**: `(marketing)/page.tsx` serves `/`, not `/marketing/`
2. **Separate layouts per concern**: Marketing pages get marketing layout (header/CTA), app pages keep BottomNav
3. **Minimal disruption**: Existing `(auth)` and `(main)` groups unchanged
4. **Clear boundaries**: Marketing vs app pages obvious from folder structure
5. **Supports future expansion**: `/pricing`, `/features`, `/about` can live in `(marketing)/`

## Architectural Patterns

### Pattern 1: Route Group Separation

**What:** Use parentheses folders to organize routes by concern without affecting URLs.

**When to use:** When you have distinct sections (marketing/app) with different layouts, navigation, and auth requirements.

**Trade-offs:**
- Pro: Clean URL structure, separate layouts, clear organization
- Pro: Different rendering strategies per group (SSG for marketing, dynamic for app)
- Con: Navigating between groups with different root layouts triggers full page reload
- Con: Cannot have same URL path in multiple groups

**HabitStreak application:** `(marketing)` for public pages, `(auth)` for login/signup, `(main)` for authenticated app.

### Pattern 2: Static Landing Page with Auth Redirect

**What:** Landing page is statically generated at build time. Middleware checks auth and redirects logged-in users server-side before the page renders.

**When to use:** When landing page content is the same for all visitors and SEO is important.

**Trade-offs:**
- Pro: Fastest possible load time (pre-rendered at build)
- Pro: Excellent SEO (full HTML available to crawlers)
- Pro: Redirect happens at edge, no flash of landing page for logged-in users
- Con: Cannot personalize landing page content per user
- Con: Middleware redirect adds slight latency for authenticated users

**HabitStreak application:** Landing page is static marketing content. No personalization needed. Authenticated users get redirected before seeing landing page.

### Pattern 3: Server Component with Session Check

**What:** Server Component checks session and conditionally renders or redirects.

**When to use:** When you need to show different content based on auth state within the same page.

**Trade-offs:**
- Pro: Can show personalized content ("Welcome back, [name]")
- Pro: Single page handles both states
- Con: Cannot use SSG (must be dynamic)
- Con: More complex component logic

**HabitStreak application:** NOT recommended for landing page. Use middleware redirect instead for cleaner separation.

## Data Flow

### Request Flow for Unauthenticated Visitor

```
1. User visits /
2. Middleware runs (edge)
   - auth() returns null (no session)
   - authorized() callback checks: / is in publicPaths
   - Returns true, request continues
3. (marketing)/page.tsx serves (from static cache)
4. User sees landing page
5. User clicks "Aan de slag" (CTA)
6. Navigates to /signup
```

### Request Flow for Authenticated User

```
1. User visits /
2. Middleware runs (edge)
   - auth() returns session
   - Custom middleware logic: user IS authenticated + path IS /
   - Returns Response.redirect('/vandaag')
3. Browser redirects to /vandaag
4. (main)/vandaag/page.tsx serves
5. User sees today's tasks (never saw landing page)
```

### Auth State Reading Options

| Location | Method | Use Case |
|----------|--------|----------|
| Middleware | `req.auth` | Route protection, redirects |
| Server Component | `await auth()` | Conditional rendering |
| Client Component | `useSession()` | Dynamic UI updates |
| API Route | `await auth()` | Request authorization |

**Landing page recommendation:** Middleware handles redirect. Landing page itself does NOT check auth (pure static content).

## Integration Points

### Middleware Changes

Current middleware (`src/middleware.ts`):
```typescript
// Protect all routes except /login, /signup, /api, static files
export const config = {
  matcher: [
    '/((?!login|signup|api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)',
  ],
}
```

**Required change:** Add `/` to excluded paths OR update matcher:

**Option A: Update matcher to exclude root path**
```typescript
export const config = {
  matcher: [
    // Exclude: /, /login, /signup, /api, static files
    '/((?!login|signup|api|_next/static|_next/image|favicon.ico|manifest.json|icons)(?!$).*)',
  ],
}
```

**Option B: Wrap middleware with custom logic (RECOMMENDED)**
```typescript
import NextAuth from 'next-auth'
import authConfig from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Redirect authenticated users from landing page to app
  if (isLoggedIn && pathname === '/') {
    return Response.redirect(new URL('/vandaag', req.nextUrl.origin))
  }

  // Allow request to continue (authorized callback handles protection)
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)',
  ],
}
```

### Auth Config Changes

Current `authorized` callback in `src/lib/auth.config.ts`:
```typescript
authorized({ auth, request: { nextUrl } }) {
  const isLoggedIn = !!auth?.user
  const publicPaths = ['/login', '/signup']
  const isPublicPath = publicPaths.some(path =>
    nextUrl.pathname.startsWith(path)
  )

  if (!isLoggedIn && !isPublicPath) {
    return false // Redirect to signIn
  }
  return true
}
```

**Required change:** Add `/` (exact match) to public paths:
```typescript
authorized({ auth, request: { nextUrl } }) {
  const isLoggedIn = !!auth?.user
  const publicPaths = ['/login', '/signup']
  const isPublicPath = publicPaths.some(path =>
    nextUrl.pathname.startsWith(path)
  )
  const isLandingPage = nextUrl.pathname === '/'

  if (!isLoggedIn && !isPublicPath && !isLandingPage) {
    return false // Redirect to signIn
  }
  return true
}
```

### Shared Components

Components that can be shared between landing page and app:

| Component | Location | Shareable? | Notes |
|-----------|----------|------------|-------|
| Button | `components/ui/button.tsx` | YES | Same styling for CTAs |
| Card | `components/ui/card.tsx` | YES | Feature cards on landing |
| AnimatedBackground | `components/backgrounds/` | MAYBE | Consider landing-specific variant |
| ThemeProvider | `contexts/theme-context` | YES | Already in root layout |

**New components for landing page:**

| Component | Purpose | Location |
|-----------|---------|----------|
| `Hero` | Hero section with headline + CTA | `components/marketing/hero.tsx` |
| `Features` | Feature grid/list | `components/marketing/features.tsx` |
| `Testimonials` | Social proof (if applicable) | `components/marketing/testimonials.tsx` |
| `MarketingNav` | Top navigation for marketing pages | `components/marketing/nav.tsx` |
| `Footer` | Marketing footer | `components/marketing/footer.tsx` |

## Build Order Implications

### Phase Dependencies

1. **Middleware update FIRST**: Must allow public access to `/` before landing page works
2. **Landing page route group SECOND**: Create `(marketing)/page.tsx`
3. **Landing page content THIRD**: Build out hero, features, CTA sections
4. **Delete old redirect page LAST**: Remove `src/app/page.tsx` after landing page complete

### Build/Deploy Considerations

- Landing page uses SSG: Rebuilt at deploy time only
- No runtime dependencies for landing page (no database, no auth check)
- Marketing content changes require redeploy

### Performance Characteristics

| Page Type | Rendering | Cache | TTFB |
|-----------|-----------|-------|------|
| Landing (/) | SSG | CDN edge | ~50ms |
| Auth (/login) | Client Component | None | ~100ms |
| App (/vandaag) | Dynamic SSR | None | ~200ms |

## Anti-Patterns to Avoid

### 1. Checking Auth in Landing Page Component

**Wrong:**
```typescript
// (marketing)/page.tsx
export default async function LandingPage() {
  const user = await getCurrentUser()
  if (user) redirect('/vandaag')  // BAD: Should be in middleware
  return <LandingContent />
}
```

**Right:** Handle redirect in middleware. Landing page is pure static content.

### 2. Using Client Component for Landing Page

**Wrong:**
```typescript
'use client'
export default function LandingPage() {
  // Loses SSG benefits, worse SEO, slower load
}
```

**Right:** Server Component (or implicitly static). Only use Client Components for interactive elements (e.g., animated demo).

### 3. Creating Landing Page in Root Without Route Group

**Wrong:**
```
src/app/
├── page.tsx          # Landing page here
├── (auth)/
├── (main)/
```

**Right:** Use `(marketing)` route group for future expansion (pricing, about, etc.).

## Sources

### Primary (HIGH confidence)
- [Next.js Route Groups Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-groups) - Official route groups guide
- [Auth.js Protecting Routes](https://authjs.dev/getting-started/session-management/protecting) - Middleware protection patterns

### Secondary (MEDIUM confidence)
- [Next.js App Router Project Structure](https://makerkit.dev/blog/tutorials/nextjs-app-router-project-structure) - Marketing/app separation patterns
- [Next.js SEO Rendering Strategies](https://nextjs.org/learn/seo/rendering-strategies) - SSG for landing pages
- [Maximizing Next.js 15 SSR for SEO](https://www.wisp.blog/blog/maximizing-nextjs-15-ssr-for-seo-and-beyond-when-to-use-it) - SSG vs SSR decision factors

### Existing Codebase (verified)
- `src/middleware.ts` - Current matcher pattern
- `src/lib/auth.config.ts` - Current authorized callback
- `src/app/(main)/layout.tsx` - App layout pattern
- `src/lib/auth-helpers.ts` - Auth utility functions
