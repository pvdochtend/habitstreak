# Architecture Research: NextAuth v4 to Auth.js v5 Migration

**Researched:** 2026-01-19
**Domain:** Authentication - NextAuth v4 to Auth.js v5 Migration
**Confidence:** HIGH (Official documentation verified)

## Summary

Auth.js v5 is a major rewrite that centralizes configuration into a single `auth.ts` file that exports `handlers`, `auth`, `signIn`, and `signOut`. The API route becomes a simple re-export of handlers. The key architectural change is moving from `getServerSession(authOptions)` to a universal `auth()` function. For projects using Prisma (which is not edge-compatible), a split configuration pattern is required: `auth.config.ts` for edge-safe config (used by middleware) and `auth.ts` for full config with database adapter.

**Primary recommendation:** Migrate using the split configuration pattern to maintain middleware functionality while keeping Prisma adapter support.

## File Structure Changes

### Current (v4)
```
src/
  lib/
    auth.ts              -- authOptions: NextAuthOptions export
    auth-helpers.ts      -- getCurrentUser, requireAuth, isAuthenticated
  app/
    api/auth/[...nextauth]/route.ts  -- handler = NextAuth(authOptions)
  middleware.ts          -- withAuth from next-auth/middleware
  types/
    next-auth.d.ts       -- Session/JWT type augmentation
```

### Target (v5)
```
src/
  lib/
    auth.config.ts       -- NEW: Edge-compatible config (no adapter)
    auth.ts              -- CHANGED: NextAuth() with adapter, exports {handlers, auth, signIn, signOut}
    auth-helpers.ts      -- CHANGED: Uses auth() instead of getServerSession
  app/
    api/auth/[...nextauth]/route.ts  -- SIMPLIFIED: export { GET, POST } from handlers
  middleware.ts          -- CHANGED: Uses auth from auth.config.ts
  types/
    next-auth.d.ts       -- UPDATED: Module augmentation syntax changes
```

## Configuration Changes

### auth.config.ts (NEW FILE)

Edge-compatible configuration without database adapter. Used by middleware.

```typescript
// src/lib/auth.config.ts
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// Note: This file contains ONLY edge-compatible code
// No Prisma, no bcrypt, no database calls

export default {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize is NOT defined here - it's in auth.ts
      // This allows middleware to work without database access
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    // JWT callback can stay here (edge-compatible)
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    // Session callback can stay here
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    },
    // Authorized callback for middleware route protection
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnProtectedRoute = !nextUrl.pathname.startsWith('/login') &&
                                  !nextUrl.pathname.startsWith('/signup')

      if (isOnProtectedRoute && !isLoggedIn) {
        return false // Redirect to signIn page
      }
      return true
    },
  },
} satisfies NextAuthConfig
```

### auth.ts (Before vs After)

**BEFORE (v4):**
```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: { ... },
      async authorize(credentials, req) {
        // All auth logic here
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login', error: '/login' },
  callbacks: { jwt, session },
  secret: process.env.NEXTAUTH_SECRET,
}
```

**AFTER (v5):**
```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'
import authConfig from './auth.config'
import { AuthUser } from '@/types'
import { getClientIp } from './ip-utils'
import {
  checkRateLimit,
  recordAttempt,
  isAccountLocked,
  lockAccount,
  countRecentFailures,
  RATE_LIMIT_CONFIG,
  DUTCH_ERRORS,
} from './rate-limit'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Override providers to add authorize function (requires database)
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        // Note: 'req' is now 'request' (Request object, not IncomingMessage)
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email en wachtwoord zijn verplicht')
        }

        const email = (credentials.email as string).toLowerCase()

        // Get client IP from request headers
        const clientIp = getClientIp(request)
        const userAgent = request?.headers?.get('user-agent') ?? undefined

        // ... existing rate limiting and auth logic ...
        // (All existing logic preserved, just request object access updated)

        return {
          id: user.id,
          email: user.email,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Note: secret is now AUTH_SECRET (auto-detected from env)
})
```

**Key Changes:**
1. Import `NextAuth` default export (not `NextAuthOptions` type)
2. Export destructured `{ handlers, auth, signIn, signOut }`
3. Spread `authConfig` and override providers with authorize function
4. `authorize(credentials, request)` - second param is now `Request` object
5. Access headers via `request.headers.get()` instead of `req.headers[]`
6. Remove `secret` - now auto-detected as `AUTH_SECRET`

### API Route (Before vs After)

**BEFORE (v4):**
```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

**AFTER (v5):**
```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

**Change:** Route becomes a simple 2-line re-export. All configuration lives in `auth.ts`.

### Middleware (Before vs After)

**BEFORE (v4):**
```typescript
// src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: ['/((?!login|signup|api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
}
```

**AFTER (v5):**
```typescript
// src/middleware.ts
import NextAuth from 'next-auth'
import authConfig from '@/lib/auth.config'

// Use edge-compatible config only (no database adapter)
const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: ['/((?!login|signup|api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
}
```

**Key Changes:**
1. Import `authConfig` instead of full `auth` (edge-compatible)
2. Instantiate new NextAuth with edge config
3. Export `auth` directly as middleware
4. Route protection handled by `callbacks.authorized` in `auth.config.ts`

### auth-helpers.ts (Before vs After)

**BEFORE (v4):**
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return { id: session.user.id, email: session.user.email }
}
```

**AFTER (v5):**
```typescript
import { auth } from './auth'
import { AuthUser } from '@/types'

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return { id: session.user.id, email: session.user.email }
}

// requireAuth and isAuthenticated remain the same structure
// (they call getCurrentUser internally)
```

**Key Change:** Replace `getServerSession(authOptions)` with `auth()`. No parameters needed.

### Type Declarations (Before vs After)

**BEFORE (v4):**
```typescript
// src/types/next-auth.d.ts
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: { id: string; email: string }
  }
  interface User {
    id: string
    email: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
  }
}
```

**AFTER (v5):**
```typescript
// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    email: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    email: string
  }
}
```

**Change:** Extend default types instead of replacing. Import base types from `next-auth`.

## Environment Variables

**BEFORE:**
```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

**AFTER:**
```env
AUTH_SECRET=your-secret-key
AUTH_URL=http://localhost:3000   # Optional - auto-detected
AUTH_TRUST_HOST=true             # Required if behind proxy
```

**Migration commands:**
```bash
sed -i 's/NEXTAUTH_SECRET/AUTH_SECRET/g' .env.local
sed -i 's/NEXTAUTH_URL/AUTH_URL/g' .env.local
```

## Package Changes

**BEFORE:**
```json
{
  "next-auth": "^4.x.x"
}
```

**AFTER:**
```json
{
  "next-auth": "^5.0.0-beta.25"
}
```

**Installation:**
```bash
npm uninstall next-auth
npm install next-auth@beta
```

Note: As of January 2026, Auth.js v5 is still in beta. Check for stable release.

## Migration Order

Execute in this sequence to maintain a working auth system throughout migration:

### Phase 1: Package and Environment
1. **Update package.json** - Install `next-auth@beta`
2. **Update environment variables** - `NEXTAUTH_SECRET` to `AUTH_SECRET`
3. **Run tests** - Verify nothing breaks from package update alone

### Phase 2: Configuration Files
4. **Create auth.config.ts** - New edge-compatible config file
5. **Update auth.ts** - New NextAuth() export pattern with providers override
6. **Update types** - `next-auth.d.ts` type augmentation

### Phase 3: Integration Points
7. **Update API route** - Simplify to handlers re-export
8. **Update middleware** - Use auth from auth.config.ts
9. **Update auth-helpers.ts** - Replace getServerSession with auth()

### Phase 4: Verification
10. **Update ip-utils.ts** - Adjust for Request object (headers.get())
11. **Test all auth flows** - Login, logout, session persistence
12. **Test middleware** - Protected route redirects
13. **Test session access** - Server components, API routes

## Integration Points

### Session Access Patterns

| Location | v4 Pattern | v5 Pattern |
|----------|------------|------------|
| Server Component | `getServerSession(authOptions)` | `auth()` |
| API Route | `getServerSession(authOptions)` | `auth()` |
| Client Component | `useSession()` | `useSession()` (unchanged) |
| Middleware | `withAuth` callback | `callbacks.authorized` |

### Request Object Changes

The `authorize` function signature changes:

```typescript
// v4: req is IncomingMessage-like
async authorize(credentials, req) {
  const ip = req?.headers?.['x-forwarded-for']
  const ua = req?.headers?.['user-agent']
}

// v5: request is standard Request object
async authorize(credentials, request) {
  const ip = request?.headers?.get('x-forwarded-for')
  const ua = request?.headers?.get('user-agent')
}
```

**Impact on ip-utils.ts:** The `getClientIp` function needs updating to handle `Request` object:

```typescript
// Update signature
export function getClientIp(request: Request | undefined): string {
  if (!request) return 'unknown'

  // v5: Use headers.get() method
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}
```

### Cookie Name Change

**Critical:** Session cookie name changes from `next-auth.session-token` to `authjs.session-token`.

**Impact:** All existing users will be logged out on migration. This is expected behavior. Consider:
- Communicating maintenance/re-login requirement to users
- Or implementing cookie migration script (advanced)

### Middleware Limitations with Split Config

When using the split configuration pattern (required for Prisma):

**What middleware CAN do:**
- Check if user has valid session token
- Redirect unauthenticated users to login
- Bump session cookie expiry

**What middleware CANNOT do:**
- Access user details from database
- Perform role-based authorization
- Make database queries

**Mitigation:** Implement authorization checks in Server Components/API routes, not middleware.

## Sources

### Primary (HIGH confidence)
- [Official Migration Guide](https://authjs.dev/getting-started/migrating-to-v5) - Complete v4 to v5 migration documentation
- [Auth.js Next.js Reference](https://authjs.dev/reference/nextjs) - API reference for handlers, auth, signIn, signOut
- [Edge Compatibility Guide](https://authjs.dev/guides/edge-compatibility) - Split configuration pattern for Prisma
- [Credentials Provider](https://authjs.dev/getting-started/authentication/credentials) - Authorize function and error handling

### Secondary (MEDIUM confidence)
- [DEV.to Migration Guide](https://dev.to/acetoolz/nextauthjs-v5-guide-migrating-from-v4-with-real-examples-50ad) - Real-world migration examples
- [Medium: Auth.js v5 Setup](https://javascript.plainenglish.io/step-by-step-guide-integrate-nextauth-v5-beta-with-credentials-jwt-sessions-into-next-js-2a9182504c85) - JWT sessions with credentials
- [Medium: Migrating Without Logging Out Users](https://medium.com/@sajvanleeuwen/migrating-from-nextauth-v4-to-auth-js-v5-without-logging-out-users-c7ac6bbb0e51) - Cookie migration strategies

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| File structure | HIGH | Official documentation verified |
| Configuration pattern | HIGH | Official edge compatibility guide |
| API changes | HIGH | Official migration guide + reference |
| Middleware changes | HIGH | Official documentation |
| Cookie name change | HIGH | Multiple sources confirm |
| Request object changes | MEDIUM | Inferred from v5 types, verify during implementation |

**Research date:** 2026-01-19
**Valid until:** 30 days (Auth.js v5 still in beta, may have updates)
