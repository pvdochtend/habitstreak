# Debug: Test Failures - Prisma Mock & Playwright Configuration

## Problem Statement
Two categories of test failures occur when running `npm test`:
1. Rate-limit unit tests fail due to incomplete Prisma mock
2. E2E Playwright tests fail when picked up by Vitest

## Observed Behavior

### Issue 1: Rate-limit Prisma Mock (7 failures)
```
TypeError: prisma.authAttempt.findFirst is not a function
```

**Failing tests:**
- `tests/unit/rate-limit.test.ts` - 7 tests fail
- All failures are in `checkRateLimit` and `resetRateLimit` test suites

**Root cause:** The Prisma mock in the test file doesn't include `findFirst` method for `authAttempt` model.

**Location:** `tests/unit/rate-limit.test.ts` - mock setup around line 10-50

### Issue 2: Playwright Tests in Vitest (5 failures)
```
Error: Playwright Test did not expect test.describe() to be called here.
```

**Failing files:**
- `tests/e2e/auth/rate-limiting.spec.ts`
- `tests/e2e/auth/signup-login.spec.ts`
- `tests/e2e/debug/theme-debug.spec.ts`
- `tests/e2e/settings/theme.spec.ts`
- `tests/e2e/tasks/task-crud.spec.ts`

**Root cause:** Vitest is configured to pick up `.spec.ts` files in `tests/e2e/` directory, but these are Playwright tests that should only run via `npm run test:e2e`.

**Location:** `vitest.config.ts` - test include/exclude patterns

## Impact
- Does not affect production code
- Does not affect v1.1 milestone
- Rate-limit functionality works correctly (tested manually)
- E2E tests work when run via `npm run test:e2e`

## Proposed Fixes

### Fix 1: Update Prisma Mock
Add missing `findFirst` mock to rate-limit tests:

```typescript
// In tests/unit/rate-limit.test.ts mock setup
vi.mock('@/lib/prisma', () => ({
  prisma: {
    authAttempt: {
      count: vi.fn(),
      findFirst: vi.fn(),  // Add this
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    // ... rest of mock
  },
}))
```

### Fix 2: Exclude E2E from Vitest
Update `vitest.config.ts` to exclude e2e directory:

```typescript
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**/*'],  // Add this
  },
})
```

## Test Commands
```bash
# Unit tests only (should pass after fix)
npm test

# E2E tests (separate command, works correctly)
npm run test:e2e
```

## Priority
Low - cosmetic issue, doesn't affect functionality

---
*Created: 2026-01-19*
*Related to: Pre-existing test configuration*
