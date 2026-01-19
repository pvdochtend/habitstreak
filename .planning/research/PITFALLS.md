# Pitfalls Research: NextAuth v4 to Auth.js v5 Migration

**Researched:** 2026-01-19
**Confidence:** HIGH (Official documentation + multiple verified sources)
**Current Version:** next-auth@4.24.11
**Target Version:** next-auth@5.x (Auth.js v5)

## Summary

The migration from NextAuth v4 to Auth.js v5 presents several critical breaking changes that can silently break authentication for existing users. The most dangerous is the **cookie name change** from `next-auth.session-token` to `authjs.session-token`, which will immediately log out all existing users unless mitigated. Additionally, the **JWT encoding changes** (salt was added) mean existing tokens cannot be decoded by v5 without special handling. The project's use of Credentials provider, custom JWT callbacks, and middleware all require updates but are lower risk than the cookie/encoding changes.

**Critical risk:** Without cookie migration, all existing HabitStreak users will be forced to log in again after deployment.

---

## Breaking Changes

### P1: Cookie Name Change Logs Out All Users

**What breaks:** Auth.js v5 renamed the session cookie from `next-auth.session-token` to `authjs.session-token`. Browsers do not rename cookies automatically, so after upgrading, existing users' sessions are no longer recognized. Users are immediately logged out.

**Warning signs:**
- After migration deploy, all users report being logged out
- No errors in logs (v5 simply doesn't see the old cookie)
- Login works fine for new sessions, only existing sessions affected

**Prevention:**
Two options exist:

1. **Cookie Migration Middleware (Recommended):** Create middleware that reads the old cookie, decodes with v4 algorithm (no salt), re-encodes with v5 algorithm (with salt), sets new cookie, deletes old cookie. This is complex but preserves sessions.

2. **Keep Old Cookie Name:** Configure v5 to use the old cookie name (`next-auth.session-token`). However, this still requires handling the encoding difference (see P2).

**Test:**
- [ ] Create a test user session with v4 before migration
- [ ] After migration, verify that user remains logged in
- [ ] Verify new logins work correctly
- [ ] Verify cookie name in browser DevTools matches expected

**Phase to address:** First migration task - must be solved before any deployment

---

### P2: JWT Encoding/Decoding Algorithm Changed

**What breaks:** v5 added a salt to the JWT encryption process that v4 did not use. Even if you keep the old cookie name, v5 cannot decode tokens created by v4 because the encryption key derivation changed.

**Warning signs:**
- `auth()` returns `null` despite valid-looking cookies
- "Invalid token" or decryption errors in logs
- Users with old sessions see auth failures

**Prevention:**
- Use secret rotation: Pass an array of secrets where the first successfully decrypts
- Implement custom decode logic that tries v4 algorithm (no salt) first, then v5
- Alternatively, accept that existing sessions will be invalidated (communicate to users)

**Test:**
- [ ] Log out a test user, log back in after migration
- [ ] Verify JWT in cookie can be decoded by calling `auth()`
- [ ] Test with both old and new sessions simultaneously

**Phase to address:** Same task as P1 - cookie/JWT migration is one problem

---

### P3: `withAuth` Middleware Removed

**What breaks:** The project's `src/middleware.ts` uses:
```typescript
import { withAuth } from 'next-auth/middleware'
export default withAuth(...)
```
This import no longer exists in v5. The middleware pattern is completely different.

**Warning signs:**
- Build fails with "Module not found: next-auth/middleware"
- Or: middleware silently doesn't protect routes

**Prevention:**
Replace with the new pattern:
```typescript
// src/middleware.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
})

export const config = {
  matcher: ['/((?!login|signup|api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)']
}
```

**Test:**
- [ ] Access protected route while logged out - should redirect to /login
- [ ] Access protected route while logged in - should work
- [ ] Verify matcher config excludes correct paths

**Phase to address:** Middleware update task

---

### P4: `getServerSession` Replaced by `auth()`

**What breaks:** The project's `src/lib/auth-helpers.ts` uses:
```typescript
import { getServerSession } from 'next-auth'
const session = await getServerSession(authOptions)
```
In v5, this is replaced by a single `auth()` function exported from your config file.

**Warning signs:**
- Build errors: "getServerSession is not exported from next-auth"
- Or runtime: `getServerSession` returns `null` unexpectedly

**Prevention:**
1. Create new `auth.ts` config file that exports `auth` function
2. Replace all `getServerSession(authOptions)` with `auth()`
3. Update `auth-helpers.ts` to import from `@/auth`

Before:
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
const session = await getServerSession(authOptions)
```

After:
```typescript
import { auth } from '@/auth'
const session = await auth()
```

**Test:**
- [ ] All API routes return correct session data
- [ ] `getCurrentUser()` returns user ID correctly
- [ ] `requireAuth()` throws when not authenticated

**Phase to address:** Auth helper refactor task

---

### P5: `NextAuthOptions` Type Renamed to `NextAuthConfig`

**What breaks:** TypeScript compilation fails because `NextAuthOptions` doesn't exist in v5.

**Warning signs:**
- TypeScript error: "Module 'next-auth' has no exported member 'NextAuthOptions'"

**Prevention:**
Change type import:
```typescript
// Before
import { NextAuthOptions } from 'next-auth'
export const authOptions: NextAuthOptions = { ... }

// After
import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
export const { handlers, auth, signIn, signOut } = NextAuth({ ... } satisfies NextAuthConfig)
```

**Test:**
- [ ] `npm run build` completes without TypeScript errors
- [ ] IDE shows no type errors in auth configuration

**Phase to address:** Auth config restructure task

---

### P6: Authorize Callback `req` Parameter Changed

**What breaks:** The project's Credentials provider uses:
```typescript
async authorize(credentials, req) {
  const clientIp = getClientIp(req as any)
  const userAgent = req?.headers?.['user-agent']
  // ... rate limiting logic
}
```
In v5, the `req` parameter format has changed and may not provide headers the same way.

**Warning signs:**
- Rate limiting stops working (always sees same IP)
- User agent logging shows undefined
- Type errors about `req` parameter

**Prevention:**
- Test the new `credentials` object structure in v5
- The request may now be accessed differently: `authorize({ request })` destructured from credentials
- May need to pass IP/user-agent through form data or use different approach

**Test:**
- [ ] Rate limiting still functions after migration
- [ ] Failed login attempts are tracked correctly
- [ ] IP address is correctly detected in logs

**Phase to address:** Credentials provider update task - needs investigation during implementation

---

### P7: Environment Variable Prefix Change

**What breaks:** v5 prefers `AUTH_` prefix over `NEXTAUTH_` prefix. While `NEXTAUTH_SECRET` still works as an alias, future compatibility may require migration.

**Warning signs:**
- Works but logs deprecation warnings
- Documentation references `AUTH_SECRET` causing confusion

**Prevention:**
- Rename `NEXTAUTH_SECRET` to `AUTH_SECRET` in all environments
- Rename `NEXTAUTH_URL` to `AUTH_URL` (note: v5 auto-detects URL from request in most cases)
- Update `.env.local`, `.env.production`, Docker configs, CI/CD variables

**Test:**
- [ ] Remove old `NEXTAUTH_*` variables, verify app still works
- [ ] No deprecation warnings in console

**Phase to address:** Environment update task - can be done alongside or after code changes

---

### P8: Error Handling in Credentials Provider Changed

**What breaks:** In v4, you could throw errors in `authorize()` and access them via `res.error`. In v5, errors are only exposed via URL query parameters (`?error=CredentialsSignin&code=credentials`).

**Warning signs:**
- Login error messages show generic "CredentialsSignin" instead of custom Dutch messages
- Error codes in URL don't match expected values
- Users don't see specific error reasons (locked account, rate limited, etc.)

**Prevention:**
- Extend `CredentialsSignin` error class to customize error codes
- Update login page to read error from URL query params
- Consider using server actions for more control over error responses

```typescript
import { CredentialsSignin } from "next-auth"

class AccountLockedError extends CredentialsSignin {
  code = "account_locked"
}
```

**Test:**
- [ ] Invalid credentials shows appropriate Dutch error message
- [ ] Locked account shows lockout message with remaining time
- [ ] Rate limit errors display correctly

**Phase to address:** Error handling task - important for UX

---

### P9: Adapter Package Name Changed

**What breaks:** If using database adapters in the future, the package scope changed from `@next-auth/*-adapter` to `@auth/*-adapter`.

**Warning signs:**
- Install fails: package not found
- Import errors after upgrade

**Prevention:**
Currently HabitStreak uses JWT sessions without a database session adapter, so this doesn't apply. However, if adding database sessions in future:
```bash
# Old
npm install @next-auth/prisma-adapter

# New
npm install @auth/prisma-adapter
```

**Test:**
- N/A for current JWT-only setup

**Phase to address:** Only if adding database sessions in future

---

## JWT & Session Changes

### Configuration Structure

**v4 (current):**
```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [...],
  callbacks: {
    jwt({ token, user }) { ... },
    session({ session, token }) { ... }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
```

**v5 (target):**
```typescript
// src/auth.ts (root level recommended)
import NextAuth from "next-auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [...],
  callbacks: {
    jwt({ token, user }) { ... },  // Same signature
    session({ session, token }) { ... }  // Same signature
  },
  // secret auto-detected from AUTH_SECRET env var
})
```

### JWT Callback - Minimal Changes

The JWT callback signature remains similar. The project's current callback:
```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id
    token.email = user.email
  }
  return token
}
```
This should work in v5 with no changes to the logic.

### Session Callback - Minimal Changes

The session callback signature remains similar. The project's current callback:
```typescript
async session({ session, token }) {
  if (token && session.user) {
    session.user.id = token.id as string
    session.user.email = token.email as string
  }
  return session
}
```
This should work in v5 with no changes to the logic.

### Key Difference: Encryption

The actual JWT content and callback logic don't change. What changes is how the JWT is encrypted before being stored in the cookie:
- v4: Encrypts without salt
- v5: Encrypts with salt derived from cookie name

This means the same token data, encrypted by v4, cannot be decrypted by v5 without custom handling.

---

## Credentials Provider Changes

### Authorize Function Signature

**v4 (current):**
```typescript
async authorize(credentials, req) {
  // credentials: { email: string, password: string }
  // req: IncomingMessage with headers
}
```

**v5 (target):**
```typescript
async authorize(credentials) {
  // credentials: { email?: string, password?: string }
  // Request access: unclear, may need different approach
}
```

### Impact on HabitStreak

The current implementation heavily uses `req` for:
1. **IP address extraction:** `getClientIp(req)` for rate limiting
2. **User agent logging:** `req.headers['user-agent']` for audit trail

**Mitigation strategies:**

1. **Pass through form data:** Add hidden fields for client IP (detected client-side) - security concern
2. **Use middleware:** Extract IP in middleware, pass via header
3. **Server actions:** Use Next.js server actions which have access to headers()
4. **Accept limitation:** Rate limit by email only, not IP

Recommend: Investigate v5's actual behavior during implementation. May need to refactor rate limiting approach.

---

## Cookie & Security Changes

### Cookie Name

| Version | Cookie Name |
|---------|-------------|
| v4 | `next-auth.session-token` |
| v5 | `authjs.session-token` |

### Cookie Options

v5 provides more consistent cookie security:
- `httpOnly: true` (same)
- `secure: true` in production (same)
- `sameSite: lax` (same)

No changes needed to cookie security settings.

### CSRF Protection

v5 has improved CSRF protection built-in. The project doesn't customize CSRF, so this should be transparent.

---

## Common Migration Mistakes

### 1. Not Testing Cookie Migration
**Mistake:** Deploy without testing existing sessions
**Result:** All users logged out
**Avoid:** Test with real v4 sessions before production deploy

### 2. Forgetting Middleware Update
**Mistake:** Update auth config but not middleware
**Result:** Routes either unprotected or broken
**Avoid:** Update middleware as part of same PR, test thoroughly

### 3. Leaving Old Environment Variables
**Mistake:** Keep `NEXTAUTH_*` vars without adding `AUTH_*`
**Result:** Works now, may break in future v5 updates
**Avoid:** Rename all env vars to `AUTH_*` prefix

### 4. Not Updating Type Imports
**Mistake:** Keep importing `NextAuthOptions`
**Result:** TypeScript errors, but may compile with `any`
**Avoid:** Update all type imports to v5 types

### 5. Assuming `req` Works Same Way
**Mistake:** Keep rate limiting code unchanged
**Result:** IP detection fails, rate limiting broken
**Avoid:** Verify request access pattern in v5 before migration

### 6. Not Testing Error Messages
**Mistake:** Assume error handling unchanged
**Result:** Users see generic errors instead of Dutch messages
**Avoid:** Test all error paths after migration

---

## Testing Checklist

### Pre-Migration (create test data with v4)
- [ ] Create test user account
- [ ] Log in and note session cookie value
- [ ] Record cookie name and format in DevTools

### Post-Migration Core Auth
- [ ] Existing users can log in (if cookie migration implemented)
- [ ] New user registration works
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials fails with Dutch error
- [ ] Logout works and clears session
- [ ] JWT contains user.id (decode and verify)
- [ ] Session exposes user.id via auth()

### Middleware Protection
- [ ] Unauthenticated access to /vandaag redirects to /login
- [ ] Unauthenticated access to /inzichten redirects to /login
- [ ] Unauthenticated access to /taken redirects to /login
- [ ] Authenticated access to all protected routes works
- [ ] /login and /signup accessible without auth
- [ ] /api routes accessible (auth checked in route handlers)
- [ ] Static assets load without auth check

### Rate Limiting (if IP detection preserved)
- [ ] Multiple failed logins trigger rate limit
- [ ] Rate limit message shows in Dutch
- [ ] Account lockout still functions
- [ ] Successful login resets failure count

### Error Messages
- [ ] Invalid credentials shows Dutch error
- [ ] Account locked shows lockout duration
- [ ] Rate limited shows wait time
- [ ] Missing email/password shows validation error

### Session Management
- [ ] Session persists across page navigation
- [ ] Session expires after 30 days
- [ ] getCurrentUser() returns correct user
- [ ] requireAuth() throws for unauthenticated
- [ ] isAuthenticated() returns correct boolean

### API Routes
- [ ] All protected API routes return 401 when unauthenticated
- [ ] All protected API routes work when authenticated
- [ ] User data properly scoped by userId

---

## Sources

### Primary (HIGH confidence)
- [Auth.js Official Migration Guide](https://authjs.dev/getting-started/migrating-to-v5) - Official documentation
- [Auth.js Next.js Reference](https://authjs.dev/reference/nextjs) - API documentation
- [Auth.js Credentials Provider](https://authjs.dev/getting-started/authentication/credentials) - Credentials setup
- [Auth.js Environment Variables](https://authjs.dev/guides/environment-variables) - Env configuration

### Secondary (MEDIUM confidence)
- [GitHub Discussion #8487](https://github.com/nextauthjs/next-auth/discussions/8487) - Community migration experiences
- [GitHub Issue #12167](https://github.com/nextauthjs/next-auth/issues/12167) - Migration tracking issue
- [DEV.to Migration Guide](https://dev.to/acetoolz/nextauthjs-v5-guide-migrating-from-v4-with-real-examples-50ad) - Real-world examples
- [Medium: Migration Without Logout](https://medium.com/@sajvanleeuwen/migrating-from-nextauth-v4-to-auth-js-v5-without-logging-out-users-c7ac6bbb0e51) - Cookie migration approach

### Tertiary (LOW confidence - verify before using)
- Various Stack Overflow answers about specific error handling
- GitHub discussions about `req` parameter changes (needs hands-on verification)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Cookie name change (P1) | HIGH | Documented in official migration guide, confirmed by multiple sources |
| JWT encoding change (P2) | HIGH | Technical deep-dive in Medium article, matches official docs |
| Middleware changes (P3) | HIGH | Clear documentation, code examples in official guide |
| getServerSession replacement (P4) | HIGH | Core v5 feature, extensively documented |
| Type changes (P5) | HIGH | Build will fail if wrong, easy to verify |
| Authorize req parameter (P6) | MEDIUM | Less clear documentation, needs hands-on verification |
| Environment variables (P7) | HIGH | Clearly documented, backward compatible |
| Error handling (P8) | MEDIUM | Community reports vary, some workarounds exist |

---

## Metadata

**Research date:** 2026-01-19
**Valid until:** 2026-04-19 (Auth.js stable, 3-month validity)
**Researcher:** Claude (GSD Research Agent)
**Project:** HabitStreak v1.2 Auth.js v5 Migration
