# Codebase Concerns

**Analysis Date:** 2026-01-15

## Tech Debt

**Type Safety Issues with `as any` Casting:**
- Issue: Unsafe type assertions bypass TypeScript checks
- Files:
  - `src/lib/auth.ts` (line ~31): `getClientIp(req as any)` for NextAuth request
  - `src/app/api/user/route.ts` (line ~95): `const updateData: any = {}`
  - `src/app/api/tasks/[id]/route.ts` (line ~88): `const updateData: any = {}`
- Why: Quick fixes during rapid development; NextAuth types don't match internal types
- Impact: Runtime errors possible if request structure changes; loss of type safety
- Fix approach: Create proper type definitions for NextAuth request; use Partial<T> instead of any

**In-Memory Rate Limiting Not Production-Ready:**
- Issue: Rate limit store uses Map in memory, not shared across serverless instances
- File: `src/lib/rate-limit.ts` (lines 68-79)
- Why: Documented design decision for MVP simplicity
- Impact: Easy to bypass rate limiting by hitting different serverless instances on Vercel
- Fix approach: Migrate to database-backed rate limiting using existing AuthAttempt table, or add Redis

**Fire-and-Forget Database Writes:**
- Issue: Auth audit logging doesn't block on database writes
- File: `src/lib/rate-limit.ts` (lines 249-262)
- Why: Performance optimization to not slow down auth flow
- Impact: Security audit logs may silently fail without alerting
- Fix approach: Add retry mechanism or alert on persistent failures

## Known Bugs

**Theme Persistence Silently Fails:**
- Symptoms: Theme changes appear to work but don't persist across sessions
- Trigger: Database connection issues or API errors during theme save
- File: `src/contexts/theme-context.tsx` (lines 64, 114, 130)
- Workaround: Theme is also stored in localStorage, so works on same device
- Root cause: Failed API calls only console.error, don't notify user

## Security Considerations

**Weak IP Address Fallback:**
- Risk: All users appear as localhost in non-Vercel environments
- File: `src/lib/ip-utils.ts` (line 36)
- Current mitigation: Only affects development environments
- Recommendations: Log warning when IP detection fails; consider environment-specific behavior

**Hardcoded Development Secret Warning:**
- Risk: Development secret in `.env.local` indicates placeholder may be used in production
- File: `.env.local` contains `NEXTAUTH_SECRET="dev-secret-change-in-production-min-32-chars-long"`
- Current mitigation: `.env.local` is gitignored
- Recommendations: Add production deployment check for secret length; document secret rotation

## Performance Bottlenecks

**N+1 Query in Streak Calculation:**
- Problem: For each day in 365-day window, filters all tasks
- File: `src/lib/streak.ts` (lines 64-70)
- Measurement: O(365 * n_tasks) operations
- Cause: `tasks.filter()` called inside loop for each day
- Improvement path: Pre-compute scheduled tasks by day once, then lookup

**Duplicate Task Filtering in Insights:**
- Problem: Same filtering logic repeated in insights API
- Files: `src/lib/streak.ts`, `src/app/api/insights/route.ts` (lines 68-71)
- Measurement: Filtering computed twice for overlapping date ranges
- Cause: No shared cache or computed structure
- Improvement path: Extract to shared utility with memoization

**Missing Database Indexes:**
- Problem: Common query patterns lack optimized indexes
- File: `prisma/schema.prisma`
- Current indexes: `@@index([userId, date])` on CheckIn
- Missing: Index on `(userId, isActive)` for Task queries; index on `taskId` for CheckIn
- Improvement path: Add indexes based on query patterns; monitor slow query logs

## Fragile Areas

**Rate Limit Module Side Effects:**
- File: `src/lib/rate-limit.ts` (lines 88-120)
- Why fragile: `startCleanup()` runs at module load, starts setInterval that runs forever
- Common failures: Memory accumulation in long-running processes; interval not cleared in serverless
- Safe modification: Ensure cleanup interval is cleared; use lazy initialization
- Test coverage: Has unit tests but not for cleanup lifecycle

**Streak Calculation Edge Cases:**
- File: `src/lib/streak.ts`
- Why fragile: Complex business logic with timezone handling and "successful day" definition
- Common failures: Off-by-one errors at timezone boundaries; incorrect handling of days with no scheduled tasks
- Safe modification: Add comprehensive unit tests before changes
- Test coverage: **No unit tests for streak calculation** - critical gap

## Scaling Limits

**In-Memory Rate Limit Store:**
- Current capacity: Single instance only
- Limit: Rate limiting ineffective with multiple serverless instances
- Symptoms at limit: Users can bypass limits by hitting different instances
- Scaling path: Migrate to Redis or database-backed solution

**PostgreSQL Connection Pool:**
- Current capacity: Prisma default connection pooling
- Limit: Connection exhaustion under high load
- Symptoms at limit: Database connection errors
- Scaling path: Configure Prisma connection pool limits; consider PgBouncer

## Dependencies at Risk

**No dependencies currently at risk.**

All major dependencies (Next.js 15, React 19, Prisma 5, NextAuth 4) are actively maintained.

## Missing Critical Features

**Database-Backed Rate Limiting:**
- Problem: In-memory rate limiting doesn't scale
- Current workaround: Works for single instance; audit trail exists in database
- Blocks: Production deployment at scale
- Implementation complexity: Medium - database tables exist, need to query instead of in-memory

**Streak Calculation Unit Tests:**
- Problem: Core business logic has no test coverage
- Current workaround: Manual testing; E2E tests cover happy path
- Blocks: Safe refactoring of streak calculation
- Implementation complexity: Low - pure functions, easy to test

## Test Coverage Gaps

**Streak Calculation:**
- What's not tested: `calculateCurrentStreak()`, `calculateBestStreak()` in `src/lib/streak.ts`
- Risk: Streak bugs go unnoticed; regressions during refactoring
- Priority: High - core business logic
- Difficulty to test: Low - pure functions with clear inputs/outputs

**API Route Error Handling:**
- What's not tested: Error paths in API routes (database failures, validation errors)
- Risk: Error responses may not match expected format
- Priority: Medium
- Difficulty to test: Medium - need to mock Prisma failures

**Theme Context Edge Cases:**
- What's not tested: Failed API calls during theme save, localStorage unavailable
- Risk: Silent failures in theme persistence
- Priority: Low
- Difficulty to test: Medium - need to mock fetch and localStorage

---

*Concerns audit: 2026-01-15*
*Update as issues are fixed or new ones discovered*
