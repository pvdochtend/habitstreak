# Testing Patterns

**Analysis Date:** 2026-01-15

## Test Framework

**Runner:**
- Vitest 2.1.8 - Unit tests
- Config: `vitest.config.ts` in project root

**Assertion Library:**
- Vitest built-in expect
- Matchers: `toBe`, `toEqual`, `toThrow`, `toHaveBeenCalledWith`, `toBeVisible`

**Run Commands:**
```bash
npm test                              # Run all unit tests
npm test -- --watch                   # Watch mode
npm test -- dates.test.ts             # Single file
npm run test:e2e                      # Run E2E tests
npm run test:e2e:ui                   # E2E tests in UI mode
```

## Test File Organization

**Location:**
- Unit tests: `tests/unit/*.test.ts`
- E2E tests: `tests/e2e/**/*.spec.ts`
- E2E fixtures: `tests/e2e/fixtures/test.ts`
- E2E helpers: `tests/e2e/helpers/`

**Naming:**
- Unit tests: `[module-name].test.ts`
- E2E tests: `[feature-name].spec.ts`

**Structure:**
```
tests/
├── unit/
│   ├── dates.test.ts          # Date utilities
│   ├── schedule.test.ts       # Scheduling logic
│   ├── auth.test.ts           # Authentication
│   └── rate-limit.test.ts     # Rate limiting
└── e2e/
    ├── auth/
    │   ├── signup-login.spec.ts
    │   └── rate-limiting.spec.ts
    ├── tasks/
    │   └── task-crud.spec.ts
    ├── settings/
    │   └── theme.spec.ts
    ├── fixtures/
    │   └── test.ts            # Custom fixtures
    └── helpers/
        ├── index.ts           # Re-exports
        ├── auth.ts            # Auth helpers
        ├── navigation.ts      # Navigation helpers
        └── waits.ts           # Wait utilities
```

## Test Structure

**Unit Test Pattern:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('ModuleName', () => {
  describe('functionName', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should handle valid input', () => {
      // arrange
      const input = createTestInput()

      // act
      const result = functionName(input)

      // assert
      expect(result).toEqual(expectedOutput)
    })

    it('should throw on invalid input', () => {
      expect(() => functionName(null)).toThrow('Error message')
    })
  })
})
```

**E2E Test Pattern:**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should complete user journey', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: 'Registreren' })).toBeVisible()

    await page.fill('[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    await page.waitForURL('/vandaag')
  })
})
```

**Patterns:**
- Use `beforeEach` for per-test setup
- Use `afterEach` to restore mocks: `vi.restoreAllMocks()`
- Arrange/Act/Assert structure
- One assertion focus per test (multiple expects OK)

## Mocking

**Framework:**
- Vitest built-in mocking (`vi`)
- Module mocking via `vi.mock()` at top of test file

**Patterns:**
```typescript
import { vi } from 'vitest'
import { prisma } from '@/lib/prisma'

// Mock module
vi.mock('@/lib/prisma', () => ({
  prisma: {
    authAttempt: {
      create: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
    },
    accountLockout: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Use in test
it('should check account lockout', async () => {
  vi.mocked(prisma.accountLockout.findUnique).mockResolvedValue(null)

  const result = await isAccountLocked('test@example.com')

  expect(result.isLocked).toBe(false)
  expect(prisma.accountLockout.findUnique).toHaveBeenCalledWith({
    where: { email: 'test@example.com' },
  })
})
```

**What to Mock:**
- Database operations (Prisma)
- External API calls
- Time/dates when testing time-sensitive logic

**What NOT to Mock:**
- Pure functions (dates, schedule calculations)
- Internal utilities
- TypeScript types

## Fixtures and Factories

**E2E Test Fixtures (`tests/e2e/fixtures/test.ts`):**
```typescript
import { test as base, Page } from '@playwright/test'
import { generateTestEmail, signupUser, DEFAULT_PASSWORD } from '../helpers'

type TestUser = { email: string; password: string }

export const test = base.extend<{
  testUser: TestUser
  authenticatedPage: Page
}>({
  testUser: async ({}, use) => {
    await use({
      email: generateTestEmail(),
      password: DEFAULT_PASSWORD,
    })
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    await signupUser(page, testUser.email, testUser.password)
    await use(page)
  },
})
```

**Test Helpers (`tests/e2e/helpers/auth.ts`):**
```typescript
export const DEFAULT_PASSWORD = 'TestPassword123!'

export function generateTestEmail(prefix = 'test'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `${prefix}-${timestamp}-${random}@test.com`
}

export async function signupUser(
  page: Page,
  email?: string,
  password?: string
): Promise<{ email: string; password: string }> {
  const userEmail = email ?? generateTestEmail()
  const userPassword = password ?? DEFAULT_PASSWORD

  await page.goto('/signup')
  await page.getByLabel('E-mailadres').fill(userEmail)
  await page.getByLabel('Wachtwoord').fill(userPassword)
  await page.getByLabel('Bevestig wachtwoord').fill(userPassword)
  await page.getByRole('button', { name: 'Account aanmaken' }).click()
  await page.waitForURL('/vandaag', { timeout: 10000 })

  return { email: userEmail, password: userPassword }
}
```

**Location:**
- Factory functions: In test file or `tests/e2e/helpers/`
- Shared fixtures: `tests/e2e/fixtures/test.ts`

## Coverage

**Requirements:**
- No enforced coverage target
- Focus on critical paths (auth, streaks, scheduling)

**Configuration:**
- Vitest coverage via c8 (built-in)
- Not explicitly configured

**View Coverage:**
```bash
npm test -- --coverage
```

## Test Types

**Unit Tests:**
- Test single function in isolation
- Mock all external dependencies (Prisma)
- Fast: each test <100ms
- Examples: `dates.test.ts`, `schedule.test.ts`, `rate-limit.test.ts`

**E2E Tests:**
- Test full user flows
- Real browser (Playwright with Pixel 5 device)
- Mobile-first testing
- Examples: `signup-login.spec.ts`, `task-crud.spec.ts`

## Common Patterns

**Async Testing:**
```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction()
  expect(result).toBe('expected')
})
```

**Error Testing:**
```typescript
it('should throw on invalid input', () => {
  expect(() => parse(null)).toThrow('Cannot parse null')
})

// Async error
it('should reject on failure', async () => {
  await expect(asyncCall()).rejects.toThrow('error message')
})
```

**Playwright Assertions:**
```typescript
// Visibility
await expect(page.getByText('Registreren')).toBeVisible()
await expect(page.getByText('Error')).not.toBeVisible()

// Navigation
await page.waitForURL('/vandaag', { timeout: 10000 })

// Form interaction
await page.getByLabel('E-mailadres').fill('test@example.com')
await page.getByRole('button', { name: 'Account aanmaken' }).click()
```

**Snapshot Testing:**
- Not used in this codebase
- Prefer explicit assertions for clarity

## E2E Configuration

**Playwright Config (`playwright.config.ts`):**
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: './start-network.sh',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120000,
  },
})
```

**Key Settings:**
- Mobile-first: Tests run on Pixel 5 device emulation
- Base URL: `http://localhost:3001`
- Web server auto-starts before tests
- HTML reporter for test results

---

*Testing analysis: 2026-01-15*
*Update when test patterns change*
