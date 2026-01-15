import { test as base, expect, Page } from '@playwright/test'
import { signupUser, generateTestEmail, DEFAULT_PASSWORD } from '../helpers/auth'

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
}>({
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
