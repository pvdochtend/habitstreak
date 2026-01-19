---
phase: 09-auth-migration
plan: 01
subsystem: auth
tags: [next-auth, auth.js-v5, jwt, credentials-provider, trustHost]

# Dependency graph
requires:
  - phase: 08-docker-compose
    provides: Production deployment configuration
provides:
  - Auth.js v5 package installed (5.0.0-beta.30)
  - Edge-compatible auth.config.ts with trustHost
  - Updated auth.ts with v5 export pattern (handlers, auth, signIn, signOut)
  - v5-compatible TypeScript type declarations
  - Updated environment variable documentation
affects: [09-02-integration, auth, middleware]

# Tech tracking
tech-stack:
  added: [next-auth@5.0.0-beta.30]
  patterns: [Split config pattern (auth.config.ts for edge, auth.ts for full config), trustHost for dynamic URL detection]

key-files:
  created:
    - src/lib/auth.config.ts
  modified:
    - package.json
    - src/lib/auth.ts
    - src/types/next-auth.d.ts
    - .env.production.example

key-decisions:
  - "Use trustHost: true for dynamic URL detection (eliminates need for NEXTAUTH_URL)"
  - "Split configuration: auth.config.ts (edge) + auth.ts (full with DB)"
  - "Preserve all existing rate limiting logic during migration"

patterns-established:
  - "Auth.js v5 export pattern: export { handlers, auth, signIn, signOut }"
  - "Edge-compatible config split: basic config without DB dependencies"
  - "Type augmentation with DefaultSession/DefaultUser/DefaultJWT extension"

# Metrics
duration: 5min
completed: 2026-01-19
---

# Phase 09 Plan 01: Install and Configure Auth.js v5 Summary

**Auth.js v5 installed with trustHost support, split configuration (edge-compatible auth.config.ts + full auth.ts), and updated type declarations**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-19T19:44:08+01:00
- **Completed:** 2026-01-19T19:48:37+01:00
- **Tasks:** 5
- **Files modified:** 5

## Accomplishments
- Upgraded from next-auth v4 to v5 (5.0.0-beta.30)
- Created edge-compatible auth.config.ts with trustHost for dynamic URL detection
- Migrated auth.ts to v5 export pattern while preserving all rate limiting logic
- Updated TypeScript declarations for v5 compatibility
- Updated environment variable documentation (AUTH_SECRET, AUTH_TRUST_HOST)

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade to next-auth@beta** - `027194f` (chore)
2. **Task 2: Create edge-compatible auth.config.ts** - `fa16fcd` (feat)
3. **Task 3: Rewrite auth.ts with v5 export pattern** - `f17f4c4` (feat)
4. **Task 4: Update TypeScript type declarations** - `3c052cd` (feat)
5. **Task 5: Update environment variable documentation** - `769f898` (docs)
6. **TypeScript type fixes** - `2ca0a50` (fix)

## Files Created/Modified
- `package.json` - Upgraded next-auth to v5.0.0-beta.30
- `src/lib/auth.config.ts` - New edge-compatible auth config with trustHost: true
- `src/lib/auth.ts` - Migrated to v5 export pattern (handlers, auth, signIn, signOut)
- `src/types/next-auth.d.ts` - Updated type augmentation for v5 (extends DefaultSession/DefaultUser/DefaultJWT)
- `.env.production.example` - Updated for AUTH_SECRET, AUTH_TRUST_HOST, removed NEXTAUTH_URL requirement

## Decisions Made
- **trustHost: true** - Enables dynamic URL detection from Host header, eliminating need for hardcoded NEXTAUTH_URL. Critical for self-hosting (localhost, IP, domain all work).
- **Split configuration pattern** - auth.config.ts contains edge-compatible config (no DB), auth.ts imports and extends with authorize function requiring database.
- **Preserve rate limiting** - All existing rate limiting logic (IP-based, email-based, account lockout) preserved during migration with only request header access pattern updated.
- **Type assertions for credentials** - Added `as string` casts for credentials.email and credentials.password to satisfy TypeScript strict mode in v5.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added type assertions for credentials properties**
- **Found during:** Task 3 (Rewriting auth.ts with v5 export pattern)
- **Issue:** TypeScript strict mode in Auth.js v5 doesn't automatically narrow credentials type, causing "Property 'toLowerCase' does not exist on type '{}'" errors
- **Fix:** Added `as string` type assertions for credentials.email and credentials.password after runtime validation check
- **Files modified:** src/lib/auth.ts
- **Verification:** TypeScript compilation passes, runtime validation still occurs before type assertions
- **Committed in:** 2ca0a50 (fix commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type assertion required for TypeScript compatibility. No behavior change, runtime validation unchanged.

## Issues Encountered
None - all tasks completed as specified.

## User Setup Required

None - no external service configuration required. However, users will need to:
1. Rename NEXTAUTH_SECRET to AUTH_SECRET in their .env files (or keep NEXTAUTH_SECRET as it's supported as alias)
2. Add AUTH_TRUST_HOST=true to environment variables
3. Accept one-time re-login after deployment (JWT session structure changed)

## Next Phase Readiness
- Auth.js v5 configuration complete
- Ready for integration phase (09-02): Update route handler, middleware, and auth helpers
- Remaining work: Update [...nextauth]/route.ts to use handlers export, migrate middleware to v5 pattern, update auth-helpers.ts to use auth() instead of getServerSession()

---
*Phase: 09-auth-migration*
*Completed: 2026-01-19*
