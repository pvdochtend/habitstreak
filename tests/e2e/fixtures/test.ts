import { test as base, expect, Page } from '@playwright/test'
import { signupUser, generateTestEmail, DEFAULT_PASSWORD } from '../helpers/auth'

function generateTestIp(): string {
  const randomOctet = () => Math.floor(Math.random() * 254) + 1
  return `10.${randomOctet()}.${randomOctet()}.${randomOctet()}`
}

/**
 * Test user credentials type
 */
export interface TestUser {
  email: string
  password: string
}

/**
 * Extended test fixtures with authentication support
 */
export const test = base.extend<{
  testUser: TestUser
  authenticatedPage: Page
  testIp: string
}>({
  /**
   * Provides a unique test IP per test to avoid shared rate limits
   */
  testIp: async ({}, use) => {
    await use(generateTestIp())
  },

  /**
   * Inject a test IP header for all requests from this page
   */
  page: async ({ page, testIp }, use) => {
    await page.context().setExtraHTTPHeaders({
      'x-test-ip': testIp,
      'x-forwarded-for': testIp,
    })
    ;(page as any).__testIp = testIp
    const originalGoto = page.goto.bind(page)
    ;(page as Page).goto = ((url: string, options: Parameters<Page['goto']>[1] = {}) => {
      return originalGoto(url, { waitUntil: 'domcontentloaded', ...options })
    }) as Page['goto']
    await use(page)
  },

  /**
   * Provides unique test user credentials for each test
   */
  testUser: async ({}, use) => {
    await use({
      email: generateTestEmail(),
      password: DEFAULT_PASSWORD,
    })
  },

  /**
   * Provides a page that's already authenticated with a fresh user
   */
  authenticatedPage: async ({ page, testUser }, use) => {
    await signupUser(page, testUser.email, testUser.password)
    await use(page)
  },
})

export { expect }
