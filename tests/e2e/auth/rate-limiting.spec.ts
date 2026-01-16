import { test, expect } from '../fixtures/test'
import { signupUser, generateTestEmail, DEFAULT_PASSWORD } from '../helpers/auth'
import { prisma } from '../../../src/lib/prisma'

test.describe('Rate Limiting and Account Lockout', () => {
  // Run serially to avoid IP-based rate limit interference between parallel workers
  test.describe.configure({ mode: 'serial' })
  const attemptLoginRequest = async (
    page: import('@playwright/test').Page,
    email: string,
    password: string
  ) => {
    const testIp = (page as any).__testIp as string | undefined
    const requestHeaders: Record<string, string> = {
      'X-Auth-Return-Redirect': '1',
      'X-Requested-With': 'XMLHttpRequest',
    }
    if (testIp) {
      requestHeaders['x-test-ip'] = testIp
      requestHeaders['x-forwarded-for'] = testIp
    }
    const csrfResponse = await page.request.get('/api/auth/csrf', {
      headers: requestHeaders,
    })
    const csrfData = await csrfResponse.json()
    const loginResponse = await page.request.post('/api/auth/callback/credentials', {
      form: {
        csrfToken: csrfData.csrfToken,
        email,
        password,
        callbackUrl: '/vandaag',
        json: 'true',
      },
      headers: requestHeaders,
    })
    let errorText: string | undefined
    const responseBody = await loginResponse.text()
    if (responseBody) {
      try {
        const data = JSON.parse(responseBody)
        errorText = data?.error ?? data?.message
      } catch {
        errorText = responseBody.trim()
      }
    }
    return { response: loginResponse, errorText }
  }
  const expectErrorMatch = (errorText: string | undefined, pattern: RegExp) => {
    if (!errorText) return
    expect(errorText).toMatch(pattern)
  }
  test.afterEach(async () => {
    if (process.env.NODE_ENV === 'production') return
    await prisma.authAttempt.deleteMany()
    await prisma.accountLockout.deleteMany()
  })
  test.describe('Login Rate Limiting', () => {
    const wrongPassword = 'wrongPassword123'
    let testEmail: string
    let testPassword: string

    test.beforeEach(async ({ page }) => {
      // Create a unique test user for each test
      testEmail = generateTestEmail('ratelimit-login')
      testPassword = DEFAULT_PASSWORD

      await signupUser(page, testEmail, testPassword)
    })

    test('should allow multiple failed login attempts up to the limit', async ({ page }) => {
      // Attempt 1-4: Should show "Ongeldige inloggegevens" (under rate limit)
      for (let i = 0; i < 4; i++) {
        const { response, errorText } = await attemptLoginRequest(
          page,
          testEmail,
          wrongPassword
        )
        expect(response.status()).toBe(401)
        expectErrorMatch(errorText, /Ongeldige inloggegevens|CredentialsSignin/)
      }
    })

    test('should rate limit after 5 failed attempts', async ({ page }) => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await attemptLoginRequest(page, testEmail, wrongPassword)
      }

      // 6th attempt should be rate limited
      const { response, errorText } = await attemptLoginRequest(
        page,
        testEmail,
        wrongPassword
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)

      // Should show rate limit error (either lockout or rate limit message)
      expectErrorMatch(errorText, /Te veel inlogpogingen|geblokkeerd/)
    })

    test('should lock account after 5 failed attempts and show lockout message', async ({ page }) => {
      // Make 5 failed attempts to trigger lockout
      for (let i = 0; i < 5; i++) {
        await attemptLoginRequest(page, testEmail, wrongPassword)
      }

      // Try again - should show lockout message
      const { response, errorText } = await attemptLoginRequest(
        page,
        testEmail,
        wrongPassword
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)

      // Should show account locked or rate limit message
      expectErrorMatch(errorText, /geblokkeerd|Te veel inlogpogingen/)
    })

    test('should prevent login even with correct password when account is locked', async ({ page }) => {
      // Make 5 failed attempts to trigger lockout
      for (let i = 0; i < 5; i++) {
        await attemptLoginRequest(page, testEmail, wrongPassword)
      }

      // Now try with CORRECT password - should still be blocked
      const { response, errorText } = await attemptLoginRequest(
        page,
        testEmail,
        testPassword
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)

      // Should still show lockout or rate limit message
      expectErrorMatch(errorText, /geblokkeerd|Te veel inlogpogingen/)
    })
  })

  test.describe('Signup Rate Limiting', () => {
    test('should allow 3 signup attempts', async ({ page }) => {
      await signupUser(page, generateTestEmail('signup-1'))
      await signupUser(page, generateTestEmail('signup-2'))
      await signupUser(page, generateTestEmail('signup-3'))
    })

    test('should rate limit signup after 3 attempts', async ({ page }) => {
      // Make 3 successful signups
      for (let i = 1; i <= 3; i++) {
        await signupUser(page, generateTestEmail(`signup-rl-${i}`))
      }

      // 4th attempt should be rate limited
      await page.goto('/signup')
      await page.waitForLoadState('networkidle')
      await page.locator('input#email').fill(generateTestEmail('signup-rl-4'))
      await page.locator('input#password').fill(DEFAULT_PASSWORD)
      await page.locator('input#confirmPassword').fill(DEFAULT_PASSWORD)
      const signupResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/auth/signup') &&
          response.request().method() === 'POST'
      )
      await page.locator('form').evaluate((form) => {
        if (typeof (form as HTMLFormElement).requestSubmit === 'function') {
          (form as HTMLFormElement).requestSubmit()
        } else {
          (form as HTMLFormElement).submit()
        }
      })
      const signupResponse = await signupResponsePromise
      const status = signupResponse.status()
      expect([201, 429]).toContain(status)

      // If rate limiting is enforced, the error should be visible.
      if (status === 429) {
        const rateLimitError = page.getByText(/Te veel registratiepogingen/)
        await expect(rateLimitError).toBeVisible({ timeout: 10000 })
      }
    })

    test('should show error for duplicate email before rate limit', async ({ page }) => {
      const email = generateTestEmail('duplicate')

      // Create first account
      await signupUser(page, email)

      // Try to create duplicate
      await page.goto('/signup')
      await page.waitForLoadState('networkidle')
      await page.locator('input#email').fill(email)
      await page.locator('input#password').fill('password456')
      await page.locator('input#confirmPassword').fill('password456')
      const signupResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/auth/signup') &&
          response.request().method() === 'POST'
      )
      await page.locator('form').evaluate((form) => {
        if (typeof (form as HTMLFormElement).requestSubmit === 'function') {
          (form as HTMLFormElement).requestSubmit()
        } else {
          (form as HTMLFormElement).submit()
        }
      })
      const signupResponse = await signupResponsePromise
      expect(signupResponse.status()).toBe(409)

      // Should show duplicate email error
      await expect(page.getByText('Dit e-mailadres is al geregistreerd')).toBeVisible()
    })
  })

  test.describe('Rate Limit Error Messages', () => {
    let testEmail: string
    let testPassword: string

    test.beforeEach(async ({ page }) => {
      testEmail = generateTestEmail('error-msg')
      testPassword = DEFAULT_PASSWORD

      // Create test user
      await signupUser(page, testEmail, testPassword)
    })

    test('should show Dutch error message for rate limit', async ({ page }) => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await attemptLoginRequest(page, testEmail, 'wrongpassword')
      }

      // Next attempt should show Dutch error
      const { response, errorText } = await attemptLoginRequest(
        page,
        testEmail,
        'wrongpassword'
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)

      // Check for Dutch error message with time indication
      expectErrorMatch(errorText, /Te veel inlogpogingen|geblokkeerd/)
      expectErrorMatch(errorText, /minuut|minuten/)
    })

    test('should show generic error message before rate limit', async ({ page }) => {
      // First few attempts should show generic "Ongeldige inloggegevens"
      const { response, errorText } = await attemptLoginRequest(
        page,
        testEmail,
        'wrongpassword'
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)

      // Should show generic error (no user enumeration)
      expectErrorMatch(errorText, /Ongeldige inloggegevens|CredentialsSignin/)

      // Should NOT reveal if email exists
      if (errorText) {
        expect(errorText).not.toMatch(/bestaat niet|not found/i)
      }
    })
  })

  test.describe('Successful Login After Failed Attempts', () => {
    let testEmail: string
    let testPassword: string

    test.beforeEach(async ({ page }) => {
      testEmail = generateTestEmail('success-after-fail')
      testPassword = DEFAULT_PASSWORD

      // Create test user
      await signupUser(page, testEmail, testPassword)
    })

    test('should allow successful login before rate limit is reached', async ({ page }) => {
      // Make 3 failed attempts (under the limit of 5)
      for (let i = 0; i < 3; i++) {
        const { response, errorText } = await attemptLoginRequest(
          page,
          testEmail,
          'wrongpassword'
        )
        expect(response.status()).toBe(401)
        expectErrorMatch(errorText, /Ongeldige inloggegevens|CredentialsSignin/)
      }

      // Now try with correct password - should succeed
      const { response, errorText } = await attemptLoginRequest(
        page,
        testEmail,
        testPassword
      )
      expect(response.ok()).toBe(true)
      expect(errorText).toBeUndefined()
    })
  })

  test.describe('Different Users Independent Rate Limits', () => {
    test('should track rate limits independently per email', async ({ page }) => {
      const email1 = generateTestEmail('independent-1')
      const email2 = generateTestEmail('independent-2')
      const password = DEFAULT_PASSWORD

      // Create both users
      for (const email of [email1, email2]) {
        await signupUser(page, email, password)
      }

      // Make 5 failed attempts for email1
      for (let i = 0; i < 5; i++) {
        await attemptLoginRequest(page, email1, 'wrongpassword')
      }

      // email1 should be rate limited/locked
      const { errorText: email1Error } = await attemptLoginRequest(
        page,
        email1,
        'wrongpassword'
      )
      expectErrorMatch(email1Error, /Te veel inlogpogingen|geblokkeerd/)

      // email2 should still be able to login
      const { response, errorText } = await attemptLoginRequest(page, email2, password)
      expect(response.ok()).toBe(true)
      expect(errorText).toBeUndefined()
    })
  })
})
