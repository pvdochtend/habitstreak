# Stack Research: Auth.js v5 Migration

**Researched:** 2026-01-19
**Domain:** Authentication - NextAuth v4 to Auth.js v5 Migration
**Confidence:** HIGH (verified via official Auth.js documentation)

## Summary

Auth.js v5 (formerly NextAuth.js v5) is the next major version of the authentication library. The package name remains `next-auth` but is installed with the `@beta` tag. The key benefit for HabitStreak is native `trustHost` support via the `AUTH_TRUST_HOST` environment variable, enabling automatic host detection behind reverse proxies without hardcoding `NEXTAUTH_URL`. The migration is straightforward for Credentials+JWT setups: move configuration to a root `auth.ts` file, update imports from `getServerSession(authOptions)` to the unified `auth()` function, and replace the Prisma adapter package.

**Primary recommendation:** Install `next-auth@beta` and `@auth/prisma-adapter`. The migration requires updating import paths and configuration structure but preserves existing business logic.

## Recommended Packages

### Core

| Package | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| `next-auth` | `@beta` (5.0.0-beta.x) | Core authentication library for Next.js | HIGH - Official docs specify `npm install next-auth@beta` |
| `@auth/prisma-adapter` | Latest | Database adapter for Prisma ORM | HIGH - Replaces deprecated `@next-auth/prisma-adapter` |

### Installation Command

```bash
npm install next-auth@beta @auth/prisma-adapter
npm uninstall @next-auth/prisma-adapter  # If previously installed (HabitStreak does not have this)
```

### What NOT to Install

| Package | Status | Reason |
|---------|--------|--------|
| `@auth/core` | DO NOT INSTALL | Internal dependency; users should never interact with it directly |
| `@next-auth/prisma-adapter` | DEPRECATED | Old scope; replaced by `@auth/prisma-adapter` |

### Version Status Notes

- **Stable v5 not yet released:** As of January 2026, Auth.js v5 remains in beta (v5.0.0-beta.x series)
- **Production-ready:** Despite beta tag, widely used in production; December 2025 articles confirm stability
- **HabitStreak's current stack:** `next-auth@4.24.11` with no separate adapter package (Credentials-only)

## Migration Notes

### Package Changes

| v4 Package | v5 Package | Notes |
|------------|------------|-------|
| `next-auth` | `next-auth@beta` | Same package, beta tag for v5 |
| `@next-auth/prisma-adapter` | `@auth/prisma-adapter` | New scope (HabitStreak doesn't use adapters currently) |

### Import Path Changes

| Context | v4 (Current HabitStreak) | v5 (After Migration) |
|---------|--------------------------|----------------------|
| Config type | `import { NextAuthOptions } from 'next-auth'` | `import { NextAuthConfig } from 'next-auth'` |
| Get session (Server Components) | `import { getServerSession } from 'next-auth'` + `getServerSession(authOptions)` | `import { auth } from '@/auth'` + `auth()` |
| Credentials provider | `import CredentialsProvider from 'next-auth/providers/credentials'` | `import Credentials from 'next-auth/providers/credentials'` |
| Client-side signIn/signOut | `import { signIn, signOut } from 'next-auth/react'` | Same (unchanged) |
| Middleware | `import { withAuth } from 'next-auth/middleware'` | `import { auth } from '@/auth'` (use `auth` as middleware) |

### Type Declaration Changes

| v4 | v5 |
|----|-----|
| `declare module 'next-auth'` | Same |
| `declare module 'next-auth/jwt'` | Same |
| `NextAuthOptions` | `NextAuthConfig` |

### Files That Change

| Current File | Migration Action |
|--------------|------------------|
| `src/lib/auth.ts` | Move to `auth.ts` (project root), change export pattern |
| `src/app/api/auth/[...nextauth]/route.ts` | Simplify to `export { handlers as GET, handlers as POST }` |
| `src/lib/auth-helpers.ts` | Update imports: `auth()` replaces `getServerSession(authOptions)` |
| `src/types/next-auth.d.ts` | Keep, but verify type names still valid |
| `src/middleware.ts` | Update to use `auth` export from `@/auth` |

## Configuration Requirements

### Environment Variables

| Variable | v4 (Current) | v5 (After Migration) | Notes |
|----------|--------------|----------------------|-------|
| `NEXTAUTH_SECRET` | Required | `AUTH_SECRET` (aliased) | Both work; prefer `AUTH_` prefix going forward |
| `NEXTAUTH_URL` | Required for production | `AUTH_URL` (optional) | v5 auto-infers from request headers |
| `AUTH_TRUST_HOST` | N/A | `true` (new) | **KEY BENEFIT**: Enables reverse proxy support without hardcoded URL |

### New Environment Setup

```bash
# .env.local (development)
AUTH_SECRET="your-32-character-secret-here"
# AUTH_URL not needed - auto-detected

# .env.production (production with reverse proxy)
AUTH_SECRET="your-32-character-secret-here"
AUTH_TRUST_HOST=true
# AUTH_URL not needed - reads X-Forwarded-Host header
```

### Generate AUTH_SECRET

```bash
# Generate new secret (recommended to generate fresh for migration)
npx auth secret
# Or manually:
openssl rand -base64 33
```

### Configuration File Structure (v5)

**New file:** `auth.ts` (project root)

```typescript
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

const config: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Your existing authorize logic here
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  trustHost: true, // Enable reverse proxy support
}

export const { auth, handlers, signIn, signOut } = NextAuth(config)
```

**Simplified API route:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### TypeScript Configuration

No changes required to `tsconfig.json`. Ensure path alias `@/auth` resolves to root `auth.ts`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/auth": ["./auth"]  // Add if not using src/auth.ts
    }
  }
}
```

**Alternative:** Place `auth.ts` in `src/` and import as `@/auth` without config changes.

## trustHost Configuration (Primary Migration Goal)

### Why This Matters

HabitStreak's login issue: `NEXTAUTH_URL` must match the exact URL users access the app from. When deployed with Docker/reverse proxy, users may access via:
- `http://localhost:3000` (direct)
- `http://192.168.1.x:3000` (LAN IP)
- `https://habit.example.com` (reverse proxy domain)

**v4 Problem:** Must hardcode one URL; others fail with CSRF/session issues.

**v5 Solution:** `AUTH_TRUST_HOST=true` reads `X-Forwarded-Host` header dynamically.

### Configuration Options

```typescript
// Option 1: Environment variable (recommended)
// .env
AUTH_TRUST_HOST=true

// Option 2: Config file
export const { auth, handlers } = NextAuth({
  // ...providers, callbacks, etc.
  trustHost: true,
})
```

### Reverse Proxy Requirements

Ensure reverse proxy forwards these headers:

```nginx
# Nginx example
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## What NOT to Use

### Deprecated Patterns

| Pattern | Status | Replacement |
|---------|--------|-------------|
| `getServerSession(authOptions)` | Deprecated | `auth()` from `@/auth` |
| `import { ... } from 'next-auth/next'` | Removed | `import { auth } from '@/auth'` |
| `import { withAuth } from 'next-auth/middleware'` | Removed | Use `auth` export as middleware |
| `@next-auth/*-adapter` packages | Deprecated | Use `@auth/*-adapter` packages |
| OAuth 1.0 providers | Removed | Use OAuth 2.0 equivalents |

### Common Wrong Choices

| Mistake | Why It's Wrong | Correct Approach |
|---------|----------------|------------------|
| Installing `@auth/core` directly | Internal package; not for direct use | Only install `next-auth@beta` |
| Using `next-auth` (no tag) | Gets v4.24.x, not v5 | Use `next-auth@beta` explicitly |
| Keeping `authOptions` export pattern | v5 doesn't pass config around | Export `auth, handlers, signIn, signOut` from config file |
| Setting `AUTH_TRUST_HOST=false` | String "false" evaluates to truthy | Omit variable entirely to disable |

### Cookie Name Change

**Note:** Cookie prefix changes from `next-auth` to `authjs`. Existing sessions will be invalidated on migration - users will need to log in again.

## Edge Runtime Considerations

HabitStreak uses Prisma which has edge runtime support as of v5.12.0. However, since HabitStreak uses JWT strategy (not database sessions), edge compatibility is not a concern for the auth middleware.

For Credentials provider with JWT strategy:
- No database adapter needed for session storage
- Middleware can run at edge without issues
- `authorize()` callback runs in Node.js runtime (API route)

## Breaking Changes Summary

| Change | Impact on HabitStreak | Action Required |
|--------|----------------------|-----------------|
| OAuth 1.0 removed | None (Credentials only) | None |
| Minimum Next.js 14.0 | Compatible (v15.1.3) | None |
| Cookie prefix `next-auth` -> `authjs` | Users logged out | Accept; users re-login once |
| `NextAuthOptions` -> `NextAuthConfig` | Type imports | Update type imports |
| Config export pattern | Major refactor | Move config, change exports |

## Sources

### Primary (HIGH confidence)
- [Auth.js Migration Guide](https://authjs.dev/getting-started/migrating-to-v5) - Official v4 to v5 migration documentation
- [Auth.js Installation](https://authjs.dev/getting-started/installation) - Package installation guide
- [Auth.js Credentials Provider](https://authjs.dev/getting-started/authentication/credentials) - Credentials setup guide
- [Auth.js Deployment](https://authjs.dev/getting-started/deployment) - trustHost and environment variables
- [Auth.js Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma) - Prisma adapter configuration

### Secondary (MEDIUM confidence)
- [DEV.to Migration Guide](https://dev.to/acetoolz/nextauthjs-v5-guide-migrating-from-v4-with-real-examples-50ad) - Community migration examples
- [CodeVoweb Next.js 15 + NextAuth v5 Guide](https://codevoweb.com/how-to-set-up-next-js-15-with-nextauth-v5/) - Next.js 15 specific setup

### Tertiary (LOW confidence)
- Various GitHub discussions on trustHost issues - Confirm configuration patterns work in practice

## Metadata

**Confidence breakdown:**
- Core packages: HIGH - Official Auth.js documentation
- Import paths: HIGH - Official migration guide
- trustHost configuration: HIGH - Official deployment docs + GitHub issue confirmations
- Cookie name change: MEDIUM - Mentioned in migration guide, needs testing

**Research date:** 2026-01-19
**Valid until:** Estimated 60 days (until stable v5 release may change patterns)
