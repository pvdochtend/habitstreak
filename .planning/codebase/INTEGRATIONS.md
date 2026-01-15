# External Integrations

**Analysis Date:** 2026-01-15

## APIs & External Services

**Payment Processing:**
- Not implemented

**Email/SMS:**
- Not implemented

**External APIs:**
- Not implemented

**Note:** This is a self-contained application with zero external third-party API dependencies. All functionality is custom-implemented.

## Data Storage

**Databases:**
- PostgreSQL 16 - Primary relational database
  - Connection: `DATABASE_URL` environment variable
  - Client: Prisma ORM 5.22.0 - `src/lib/prisma.ts`
  - Migrations: `prisma/migrations/`
  - Docker: `postgres:16-alpine` image - `docker-compose.yml`

**File Storage:**
- Not implemented (no user uploads)

**Caching:**
- In-memory rate limit store - `src/lib/rate-limit.ts`
- localStorage for theme preferences (client-side)
- No Redis or external cache service

## Authentication & Identity

**Auth Provider:**
- NextAuth.js 4.24.11 with Credentials Provider - `src/lib/auth.ts`
  - Implementation: Custom email/password authentication
  - Token storage: httpOnly cookies (JWT)
  - Session management: 30-day JWT expiry

**OAuth Integrations:**
- None configured

**Security Features:**
- Rate limiting: Email-based (5/15min), IP-based (15/15min) - `src/lib/rate-limit.ts`
- Account lockout: 5 failed attempts trigger 15-minute lockout
- Password hashing: bcrypt with 12 rounds
- Audit trail: `AuthAttempt`, `AccountLockout` tables - `prisma/schema.prisma`

## Monitoring & Observability

**Error Tracking:**
- Not implemented (no Sentry, Datadog, etc.)

**Analytics:**
- Not implemented (no Google Analytics, Mixpanel, etc.)

**Logs:**
- Console.log/error only (stdout/stderr)
- No external logging service

## CI/CD & Deployment

**Hosting:**
- Vercel (target platform)
  - Deployment: Automatic on main branch push
  - Environment vars: Configured in Vercel dashboard

**CI Pipeline:**
- Not configured (no GitHub Actions workflows)

## Environment Configuration

**Development:**
- Required env vars: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- Optional: `RATE_LIMITING_ENABLED` (defaults to true)
- Secrets location: `.env.local` (gitignored)
- Mock services: Local PostgreSQL via Docker

**Staging:**
- Not configured

**Production:**
- Secrets management: Vercel environment variables
- Database: Production PostgreSQL instance
- Timezone: `TZ=Europe/Amsterdam` (hardcoded in app logic)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2026-01-15*
*Update when adding/removing external services*
