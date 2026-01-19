# Project Research Summary

**Project:** HabitStreak v1.2 Auth.js v5 Migration
**Domain:** NextAuth v4 → Auth.js v5 Migration
**Researched:** 2026-01-19
**Confidence:** HIGH

## Executive Summary

The Auth.js v5 migration is well-documented with clear upgrade paths. The key benefit for HabitStreak is **`trustHost` support** — enabling dynamic URL detection so login works on localhost, LAN IPs, and custom domains without changing `NEXTAUTH_URL`. The migration involves updating the package (`next-auth@beta`), restructuring the auth configuration, and updating all session access patterns from `getServerSession(authOptions)` to `auth()`.

**Critical decision point:** Cookie name changes (`next-auth.*` → `authjs.*`) and JWT encoding changes will log out all existing users. For a small-user-base self-hosted app, accepting one-time re-login is simpler than implementing cookie migration middleware.

**Migration complexity:** MEDIUM — substantial file changes but patterns are well-documented. No data migration needed (user accounts stay intact, only sessions reset).

## Key Findings

### Recommended Stack (from STACK.md)

| Package | Version | Purpose |
|---------|---------|---------|
| `next-auth` | `@beta` (5.0.0-beta.x) | Core authentication library |
| `@auth/prisma-adapter` | Latest | Prisma ORM adapter (if needed) |

**Installation:** `npm install next-auth@beta`

**Environment Variables:**
- `AUTH_SECRET` — Required (replaces `NEXTAUTH_SECRET`, both work)
- `AUTH_TRUST_HOST=true` — Required for self-hosted deployments
- `AUTH_URL` — Not needed (auto-detected from request headers)

### Core Features (from FEATURES.md)

**trustHost — The Primary Benefit:**
- Auth.js v5 reads `Host` header from each request to construct URLs dynamically
- Behind proxies, reads `X-Forwarded-Host` and `X-Forwarded-Proto`
- Eliminates the hardcoded `NEXTAUTH_URL` requirement
- Works with localhost, LAN IPs, custom domains simultaneously

**Multi-URL Behavior:**
| Scenario | v4 (Current) | v5 with trustHost |
|----------|--------------|-------------------|
| localhost:3000 | Works if URL matches | Works automatically |
| 192.168.1.x:3000 | Fails | Works automatically |
| Custom domain | Fails unless configured | Works automatically |
| Reverse proxy (HTTPS) | Fails | Works (reads X-Forwarded-Proto) |

### Architecture (from ARCHITECTURE.md)

**File Structure Changes:**

| Current Location | New Location | Change |
|------------------|--------------|--------|
| `src/lib/auth.ts` | `src/lib/auth.ts` | Complete rewrite — new export pattern |
| `src/lib/auth-helpers.ts` | `src/lib/auth-helpers.ts` | Update imports — `auth()` replaces `getServerSession` |
| `src/app/api/auth/[...nextauth]/route.ts` | Same | Simplify to 2-line re-export |
| `src/middleware.ts` | Same | Rewrite — use `auth` export |
| N/A | `src/lib/auth.config.ts` | NEW — Edge-compatible config for middleware |

**Key Pattern Changes:**

```typescript
// BEFORE (v4)
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
const session = await getServerSession(authOptions)

// AFTER (v5)
import { auth } from './auth'
const session = await auth()
```

### Critical Pitfalls (from PITFALLS.md)

| Pitfall | Risk | Mitigation |
|---------|------|------------|
| **P1: Cookie name change** | HIGH — All users logged out | Accept re-login or implement migration |
| **P2: JWT encoding change** | HIGH — Old tokens invalid | Accept re-login (simpler for small user base) |
| **P3: `withAuth` removed** | BUILD FAIL | Rewrite middleware |
| **P4: `getServerSession` removed** | BUILD FAIL | Replace with `auth()` |
| **P6: `req` parameter change** | MEDIUM — Rate limiting affected | Investigate alternative approach |

**Recommended approach for HabitStreak:** Accept one-time re-login after migration. The user base is small (self-hosted), and cookie migration adds significant complexity for minimal benefit.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Auth.js v5 Migration

**Rationale:** Single cohesive migration — splitting would leave auth in broken state between phases.

**Delivers:**
- Auth.js v5 with `trustHost` support
- Login works on any URL without config changes
- Existing auth functionality preserved
- Updated middleware and helpers

**Tasks (suggested order):**
1. Install `next-auth@beta` package
2. Create `auth.config.ts` (edge-compatible config)
3. Rewrite `auth.ts` with new export pattern
4. Update API route handler
5. Update middleware
6. Update `auth-helpers.ts`
7. Update environment variables
8. Update type declarations
9. Test all auth flows

**Addresses:**
- Multi-URL login issue (v1.2 core goal)
- Future-proofs auth stack

**Avoids:**
- P1/P2: Accepts re-login (simpler than cookie migration)
- P3: Middleware rewrite included
- P4: getServerSession replacement included

### Phase Ordering Rationale

**Single phase recommended:** Auth migration is atomic — cannot be split without breaking auth. All file changes depend on each other.

**Why not split:**
- Package upgrade breaks existing imports immediately
- Middleware can't work without new config
- API route depends on new exports
- Helpers depend on new `auth()` function

### Research Flags

| Phase | Flag | Reason |
|-------|------|--------|
| Auth Migration | SKIP RESEARCH | Research complete — patterns clear |
| Auth Migration | SPIKE NEEDED | `req` parameter for rate limiting — verify actual v5 behavior |

**Spike details:** Current `authorize` callback uses `req` parameter to extract client IP for rate limiting. v5 changed this pattern. During implementation, verify how to access request headers and update `ip-utils.ts` accordingly.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (packages, versions) | HIGH | Official Auth.js documentation |
| Features (trustHost) | HIGH | Official deployment docs + GitHub issues |
| Architecture (file structure) | HIGH | Official migration guide + examples |
| Pitfalls (breaking changes) | HIGH | Official docs + community verification |
| Rate limiting in v5 | MEDIUM | Needs hands-on verification |

**Overall confidence:** HIGH

### Gaps to Address During Implementation

1. **Rate limiting request access:** Verify how `authorize` callback accesses request headers in v5
2. **Split config necessity:** May not need `auth.config.ts` if not using database adapter
3. **Error message handling:** Dutch error messages may need adjustment for v5 error flow

## Sources

### Primary (HIGH confidence)
- [Auth.js Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Auth.js Upgrade Guide](https://authjs.dev/guides/upgrade-to-v5)
- [Auth.js Edge Compatibility](https://authjs.dev/guides/edge-compatibility)
- [Auth.js Credentials Provider](https://authjs.dev/getting-started/authentication/credentials)
- [Auth.js Next.js Reference](https://authjs.dev/reference/nextjs)

### Secondary (MEDIUM confidence)
- [DEV.to Migration Guide](https://dev.to/acetoolz/nextauthjs-v5-guide-migrating-from-v4-with-real-examples-50ad)
- [Medium: Migration Without Logout](https://medium.com/@sajvanleeuwen/migrating-from-nextauth-v4-to-auth-js-v5-without-logging-out-users-c7ac6bbb0e51)
- [CodeVoweb Next.js 15 + NextAuth v5](https://codevoweb.com/how-to-set-up-next-js-15-with-nextauth-v5/)

---
*Research completed: 2026-01-19*
*Ready for roadmap: yes*
