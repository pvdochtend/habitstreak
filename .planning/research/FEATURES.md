# Features Research: Auth.js v5 Dynamic URL Detection

**Researched:** 2026-01-19
**Domain:** Authentication / NextAuth.js to Auth.js v5 Migration
**Confidence:** HIGH (verified with official Auth.js documentation)

## Summary

Auth.js v5 introduces automatic host detection that eliminates the strict `NEXTAUTH_URL` requirement from v4. The key feature is `trustHost`, which tells Auth.js to read the incoming request's `Host` header (or `X-Forwarded-Host` behind proxies) to determine the application URL dynamically. This means users can access the app via localhost:3000, 192.168.1.x:3000, or a custom domain without changing any configuration. The only required environment variable is `AUTH_SECRET` - the URL is inferred from each request.

**Primary recommendation:** Migrate to Auth.js v5 with `trustHost: true` in config and `AUTH_TRUST_HOST=true` in environment. Remove `NEXTAUTH_URL` entirely to enable dynamic URL detection.

## Core Feature: trustHost

### What It Does

The `trustHost` configuration option tells Auth.js to derive the application URL from the incoming HTTP request headers instead of requiring a static environment variable. When enabled:

1. Auth.js reads the `Host` header from each incoming request
2. Behind proxies, it reads `X-Forwarded-Host` and `X-Forwarded-Proto` headers
3. It constructs callback URLs, redirect URLs, and session URLs dynamically
4. No hardcoded URL configuration is needed

This is the exact feature that solves HabitStreak's multi-URL access problem.

### How It Works

**Request Flow (Direct Access):**
```
User accesses: http://192.168.1.100:3000/login
                    |
                    v
            Request arrives with:
            Host: 192.168.1.100:3000
                    |
                    v
            Auth.js (trustHost: true)
            Reads Host header -> "192.168.1.100:3000"
                    |
                    v
            Constructs URLs:
            - Callback: http://192.168.1.100:3000/api/auth/callback/credentials
            - Session: http://192.168.1.100:3000/api/auth/session
            - Redirect: http://192.168.1.100:3000/vandaag
```

**Request Flow (Behind Reverse Proxy):**
```
User accesses: https://habits.example.com/login
                    |
                    v
            Reverse Proxy (nginx/traefik)
            Forwards with headers:
            - Host: habits.example.com
            - X-Forwarded-Host: habits.example.com
            - X-Forwarded-Proto: https
                    |
                    v
            Auth.js (trustHost: true)
            Reads X-Forwarded-* headers
                    |
                    v
            Constructs URLs with https://habits.example.com
```

### Configuration

**Option 1: In auth.ts configuration (recommended)**
```typescript
// src/auth.ts (Auth.js v5 format)
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Credentials({ /* ... */ })],
  trustHost: true,  // Enable dynamic URL detection
  // ... rest of config
})
```

**Option 2: Environment variable**
```bash
# .env or .env.production
AUTH_TRUST_HOST=true
```

**Option 3: Both (belt and suspenders)**
```typescript
// auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  // ...
})
```
```bash
# .env.production
AUTH_TRUST_HOST=true
```

**Note:** Auth.js automatically sets `trustHost: true` when it detects Vercel (`VERCEL` env var) or Cloudflare Pages (`CF_PAGES` env var). For self-hosted deployments like Docker, you must set it explicitly.

## URL Detection Behavior

### Without trustHost (v4 behavior)

In NextAuth v4, the URL handling is rigid:

| Aspect | v4 Behavior |
|--------|-------------|
| **URL Source** | Reads from `NEXTAUTH_URL` environment variable only |
| **If Not Set** | Falls back to `http://localhost:3000` or throws warnings |
| **If Mismatched** | Authentication may fail, cookies may not work, redirects break |
| **Multi-URL** | Not supported - must change `NEXTAUTH_URL` for each access method |

**Current HabitStreak Problem:**
- `NEXTAUTH_URL=http://localhost:3000` set
- User accesses via `http://192.168.1.100:3000`
- Callback URLs generated for `localhost:3000`
- Session cookie scoped to `localhost`
- Result: Login appears to work but session not maintained

### With trustHost (v5 behavior)

| Aspect | v5 Behavior with trustHost |
|--------|---------------------------|
| **URL Source** | Reads from `Host` header of each request |
| **If AUTH_URL Not Set** | Works correctly - URL inferred from request |
| **Proxy Support** | Reads `X-Forwarded-Host` and `X-Forwarded-Proto` |
| **Multi-URL** | Fully supported - each request gets correct URL |

**Expected HabitStreak Behavior After Migration:**
- `AUTH_TRUST_HOST=true` set, no `AUTH_URL` needed
- User accesses via `http://192.168.1.100:3000`
- Host header: `192.168.1.100:3000`
- Callback URLs generated for `192.168.1.100:3000`
- Session cookie scoped to `192.168.1.100`
- Result: Login works correctly on any access URL

## Multi-URL Scenarios

| Scenario | v4 Behavior | v5 with trustHost |
|----------|-------------|-------------------|
| **localhost:3000** | Works only if `NEXTAUTH_URL=http://localhost:3000` | Works automatically |
| **127.0.0.1:3000** | Fails if NEXTAUTH_URL is localhost | Works automatically |
| **IP address (LAN)** | Fails unless NEXTAUTH_URL matches exactly | Works automatically |
| **Custom domain** | Fails unless NEXTAUTH_URL matches | Works automatically |
| **Reverse proxy (HTTP)** | Fails - URL mismatch | Works with `AUTH_TRUST_HOST=true` |
| **Reverse proxy (HTTPS)** | Fails - URL and protocol mismatch | Works - reads X-Forwarded-Proto |
| **Multiple domains** | Not supported | Works - each request uses its own Host |

### Detailed Scenario Analysis

**Scenario 1: Development on localhost**
```
Access URL: http://localhost:3000
Host header: localhost:3000
Auth.js constructs: http://localhost:3000/api/auth/*
Cookie domain: localhost
Result: Works
```

**Scenario 2: Access from another device on LAN**
```
Access URL: http://192.168.1.100:3000
Host header: 192.168.1.100:3000
Auth.js constructs: http://192.168.1.100:3000/api/auth/*
Cookie domain: 192.168.1.100
Result: Works
```

**Scenario 3: Custom local domain (via /etc/hosts)**
```
Access URL: http://habitstreak.local:3000
Host header: habitstreak.local:3000
Auth.js constructs: http://habitstreak.local:3000/api/auth/*
Cookie domain: habitstreak.local
Result: Works
```

**Scenario 4: Behind nginx reverse proxy with HTTPS**
```
External URL: https://habits.example.com
nginx config:
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;

Headers received by app:
  Host: habits.example.com
  X-Forwarded-Host: habits.example.com
  X-Forwarded-Proto: https

Auth.js constructs: https://habits.example.com/api/auth/*
Cookie: Secure, domain habits.example.com
Result: Works with secure cookies
```

**Scenario 5: Docker with internal networking**
```
Container internal: http://habitstreak:3000
External access: http://192.168.1.100:3000

With proper Docker networking (host mode or port mapping):
Host header: 192.168.1.100:3000
Auth.js constructs: http://192.168.1.100:3000/api/auth/*
Result: Works
```

## Other Relevant v5 Features

### 1. Simplified Environment Variables

| v4 Variable | v5 Variable | Required? |
|-------------|-------------|-----------|
| `NEXTAUTH_SECRET` | `AUTH_SECRET` | Yes (only required var) |
| `NEXTAUTH_URL` | `AUTH_URL` | No (auto-detected) |
| N/A | `AUTH_TRUST_HOST` | Yes for self-hosted |

**Migration:**
```bash
# Remove or comment out:
# NEXTAUTH_URL=http://localhost:3000

# Rename:
NEXTAUTH_SECRET -> AUTH_SECRET

# Add:
AUTH_TRUST_HOST=true
```

Note: v5 still supports `NEXTAUTH_SECRET` and `NEXTAUTH_URL` as aliases for backward compatibility.

### 2. Automatic Cookie Security

Auth.js v5 automatically configures cookie security based on the detected protocol:

| Detected Protocol | Cookie Behavior |
|-------------------|-----------------|
| `http://` | Non-secure cookies (SameSite=Lax) |
| `https://` | Secure cookies (SameSite=Lax, Secure flag) |

This means:
- Local development via HTTP works without configuration
- Production behind HTTPS automatically gets secure cookies
- No need for `useSecureCookies` toggle

### 3. New Configuration Structure

Auth.js v5 uses a different export pattern:

```typescript
// v4 (current HabitStreak)
import NextAuth from "next-auth"
export const authOptions: NextAuthOptions = { ... }
export default NextAuth(authOptions)

// v5 (target)
import NextAuth from "next-auth"
export const { handlers, signIn, signOut, auth } = NextAuth({ ... })
```

The `auth` function replaces `getServerSession(authOptions)` for server-side auth checks.

### 4. Route Handler Migration

```typescript
// v4: src/pages/api/auth/[...nextauth].ts or src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

// v5: src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### 5. Middleware Changes

```typescript
// v4
export { default } from "next-auth/middleware"

// v5
import { auth } from "@/auth"
export default auth
```

## Configuration Needed for Each Scenario

### Minimal Self-Hosted (Docker/VPS)

```typescript
// src/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Credentials({ /* existing logic */ })],
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    /* existing callbacks */
  },
})
```

```bash
# .env.production
AUTH_SECRET=your-32-char-secret-here
AUTH_TRUST_HOST=true
# No AUTH_URL needed!
```

### Behind Reverse Proxy (nginx example)

Same auth.ts as above, plus nginx config:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Force Specific URL (if needed)

If you ever need to force a specific URL (not recommended for HabitStreak's use case):

```bash
# .env.production
AUTH_SECRET=your-secret
AUTH_URL=https://specific-domain.com
AUTH_TRUST_HOST=true
```

## Migration Checklist for HabitStreak

- [ ] Update `next-auth` package to v5 (`npm install next-auth@5`)
- [ ] Rename `src/lib/auth.ts` exports to v5 pattern
- [ ] Add `trustHost: true` to auth config
- [ ] Update environment variables:
  - [ ] `NEXTAUTH_SECRET` -> `AUTH_SECRET` (or keep both for compatibility)
  - [ ] Remove `NEXTAUTH_URL` entirely
  - [ ] Add `AUTH_TRUST_HOST=true`
- [ ] Update route handler in `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Update middleware in `src/middleware.ts`
- [ ] Update auth helpers (`getCurrentUser`, `requireAuth`) to use new `auth()` function
- [ ] Test login from multiple URLs:
  - [ ] localhost:3000
  - [ ] 127.0.0.1:3000
  - [ ] LAN IP address
  - [ ] Custom domain (if configured)

## Sources

### Primary (HIGH confidence)
- [Auth.js Migration Guide](https://authjs.dev/getting-started/migrating-to-v5) - Official v4 to v5 migration documentation
- [Auth.js Deployment Guide](https://authjs.dev/getting-started/deployment) - Official deployment and AUTH_TRUST_HOST documentation
- [Auth.js Next.js Reference](https://authjs.dev/reference/nextjs) - Official Next.js integration reference
- [Auth.js Upgrade Guide](https://authjs.dev/guides/upgrade-to-v5) - Official upgrade guide with environment variable details

### Secondary (MEDIUM confidence)
- [NextAuth.js v5 Guide - DEV Community](https://dev.to/acetoolz/nextauthjs-v5-guide-migrating-from-v4-with-real-examples-50ad) - Community migration examples
- [GitHub Issue #11452](https://github.com/nextauthjs/next-auth/issues/11452) - AUTH_TRUST_HOST implementation details
- [GitHub Issue #8281](https://github.com/nextauthjs/next-auth/issues/8281) - NEXTAUTH_URL handling in v5

### Tertiary (LOW confidence - for known issues)
- [GitHub Discussion #8449](https://github.com/nextauthjs/next-auth/discussions/8449) - Docker internal IP issues and workarounds
- [GitHub Issue #10928](https://github.com/nextauthjs/next-auth/issues/10928) - Redirect URL issues (edge cases)
