import { test, expect } from '@playwright/test'
import { signupUser, generateTestEmail, DEFAULT_PASSWORD } from '../helpers/auth'

test.describe('Rate Limiting and Account Lockout', () => {
  // Run serially to avoid IP-based rate limit interference between parallel workers
  test.describe.configure({ mode: 'serial' })
  test.describe('Login Rate Limiting', () => {
    const wrongPassword = 'wrongPassword123'
    let testEmail: string
    let testPassword: string

    test.beforeEach(async ({ page }) => {
      // Create a unique test user for each test
      testEmail = generateTestEmail('ratelimit-login')
      testPassword = DEFAULT_PASSWORD

      await page.goto('/signup')
      await page.getByLabel('E-mailadres').fill(testEmail)
      await page.getByLabel('Wachtwoord', { exact: true }).fill(testPassword)
      await page.getByLabel('Bevestig wachtwoord').fill(testPassword)
      await page.getByRole('button', { name: 'Account aanmaken' }).click()

      // Wait for successful signup and redirect
      await expect(page).toHaveURL('/vandaag')

      // Logout to test login flow
      await page.goto('/login')
    })

    test('should allow multiple failed login attempts up to the limit', async ({ page }) => {
      // Attempt 1-4: Should show "Ongeldige inloggegevens" (under rate limit)
      for (let i = 0; i < 4; i++) {
        await page.getByLabel('E-mailadres').fill(testEmail)
        await page.getByLabel('Wachtwoord').fill(wrongPassword)
        await page.getByRole('button', { name: 'Inloggen' }).click()

        // Should show invalid credentials error
        await expect(page.getByText('Ongeldige inloggegevens')).toBeVisible()
      }
    })

    test('should rate limit after 5 failed attempts', async ({ page }) => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await page.getByLabel('E-mailadres').fill(testEmail)
        await page.getByLabel('Wachtwoord').fill(wrongPassword)
        await page.getByRole('button', { name: 'Inloggen' }).click()
        await page.waitForLoadState('networkidle')
      }

      // 6th attempt should be rate limited
      await page.getByLabel('E-mailadres').fill(testEmail)
      await page.getByLabel('Wachtwoord').fill(wrongPassword)
      await page.getByRole('button', { name: 'Inloggen' }).click()

      // Should show rate limit error (either lockout or rate limit message)
      const rateLimitError = page.getByText(/Te veel inlogpogingen|geblokkeerd/)
      await expect(rateLimitError).toBeVisible({ timeout: 10000 })
    })

    test('should lock account after 5 failed attempts and show lockout message', async ({ page }) => {
      // Make 5 failed attempts to trigger lockout
      for (let i = 0; i < 5; i++) {
        await page.getByLabel('E-mailadres').fill(testEmail)
        await page.getByLabel('Wachtwoord').fill(wrongPassword)
        await page.getByRole('button', { name: 'Inloggen' }).click()
        await page.waitForLoadState('networkidle')
      }

      // Try again - should show lockout message
      await page.getByLabel('E-mailadres').fill(testEmail)
      await page.getByLabel('Wachtwoord').fill(wrongPassword)
      await page.getByRole('button', { name: 'Inloggen' }).click()

      // Should show account locked message in Dutch
      const lockoutMessage = page.getByText(/geblokkeerd/)
      await expect(lockoutMessage).toBeVisible({ timeout: 10000 })
    })

    test('should prevent login even with correct password when account is locked', async ({ page }) => {
      // Make 5 failed attempts to trigger lockout
      for (let i = 0; i < 5; i++) {
        await page.getByLabel('E-mailadres').fill(testEmail)
        await page.getByLabel('Wachtwoord').fill(wrongPassword)
        await page.getByRole('button', { name: 'Inloggen' }).click()
        await page.waitForLoadState('networkidle')
      }

      // Now try with CORRECT password - should still be blocked
      await page.getByLabel('E-mailadres').fill(testEmail)
      await page.getByLabel('Wachtwoord').fill(testPassword)
      await page.getByRole('button', { name: 'Inloggen' }).click()

      // Should still show lockout message
      const lockoutMessage = page.getByText(/geblokkeerd/)
      await expect(lockoutMessage).toBeVisible({ timeout: 10000 })

      // Should NOT redirect to /vandaag
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Signup Rate Limiting', () => {
    test('should allow 3 signup attempts', async ({ page }) => {
      // Attempt 1
      await page.goto('/signup')
      await page.getByLabel('E-mailadres').fill(generateTestEmail('signup-1'))
      await page.getByLabel('Wachtwoord', { exact: true }).fill(DEFAULT_PASSWORD)
      await page.getByLabel('Bevestig wachtwoord').fill(DEFAULT_PASSWORD)
      await page.getByRole('button', { name: 'Account aanmaken' }).click()
      await expect(page).toHaveURL('/vandaag')

      // Attempt 2
      await page.goto('/signup')
      await page.getByLabel('E-mailadres').fill(generateTestEmail('signup-2'))
      await page.getByLabel('Wachtwoord', { exact: true }).fill(DEFAULT_PASSWORD)
      await page.getByLabel('Bevestig wachtwoord').fill(DEFAULT_PASSWORD)
      await page.getByRole('button', { name: 'Account aanmaken' }).click()
      await expect(page).toHaveURL('/vandaag')

      // Attempt 3
      await page.goto('/signup')
      await page.getByLabel('E-mailadres').fill(generateTestEmail('signup-3'))
      await page.getByLabel('Wachtwoord', { exact: true }).fill(DEFAULT_PASSWORD)
      await page.getByLabel('Bevestig wachtwoord').fill(DEFAULT_PASSWORD)
      await page.getByRole('button', { name: 'Account aanmaken' }).click()
      await expect(page).toHaveURL('/vandaag')
    })

    test('should rate limit signup after 3 attempts', async ({ page }) => {
      // Make 3 successful signups
      for (let i = 1; i <= 3; i++) {
        await page.goto('/signup')
        await page.getByLabel('E-mailadres').fill(generateTestEmail(`signup-rl-${i}`))
        await page.getByLabel('Wachtwoord', { exact: true }).fill(DEFAULT_PASSWORD)
        await page.getByLabel('Bevestig wachtwoord').fill(DEFAULT_PASSWORD)
        await page.getByRole('button', { name: 'Account aanmaken' }).click()
        await expect(page).toHaveURL('/vandaag')
      }

      // 4th attempt should be rate limited
      await page.goto('/signup')
      await page.getByLabel('E-mailadres').fill(generateTestEmail('signup-rl-4'))
      await page.getByLabel('Wachtwoord', { exact: true }).fill(DEFAULT_PASSWORD)
      await page.getByLabel('Bevestig wachtwoord').fill(DEFAULT_PASSWORD)
      await page.getByRole('button', { name: 'Account aanmaken' }).click()

      // Should show rate limit error
      const rateLimitError = page.getByText(/Te veel registratiepogingen/)
      await expect(rateLimitError).toBeVisible({ timeout: 10000 })
    })

    test('should show error for duplicate email before rate limit', async ({ page }) => {
      const email = generateTestEmail('duplicate')

      // Create first account
      await page.goto('/signup')
      await page.getByLabel('E-mailadres').fill(email)
      await page.getByLabel('Wachtwoord', { exact: true }).fill(DEFAULT_PASSWORD)
      await page.getByLabel('Bevestig wachtwoord').fill(DEFAULT_PASSWORD)
      await page.getByRole('button', { name: 'Account aanmaken' }).click()
      await expect(page).toHaveURL('/vandaag')

      // Try to create duplicate
      await page.goto('/signup')
      await page.getByLabel('E-mailadres').fill(email)
      await page.getByLabel('Wachtwoord', { exact: true }).fill('password456')
      await page.getByLabel('Bevestig wachtwoord').fill('password456')
      await page.getByRole('button', { name: 'Account aanmaken' }).click()

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
      await page.goto('/signup')
      await page.getByLabel('E-mailadres').fill(testEmail)
      await page.getByLabel('Wachtwoord', { exact: true }).fill(testPassword)
      await page.getByLabel('Bevestig wachtwoord').fill(testPassword)
      await page.getByRole('button', { name: 'Account aanmaken' }).click()
      await expect(page).toHaveURL('/vandaag')
      await page.goto('/login')
    })

    test('should show Dutch error message for rate limit', async ({ page }) => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await page.getByLabel('E-mailadres').fill(testEmail)
        await page.getByLabel('Wachtwoord').fill('wrongpassword')
        await page.getByRole('button', { name: 'Inloggen' }).click()
        await page.waitForLoadState('networkidle')
      }

      // Next attempt should show Dutch error
      await page.getByLabel('E-mailadres').fill(testEmail)
      await page.getByLabel('Wachtwoord').fill('wrongpassword')
      await page.getByRole('button', { name: 'Inloggen' }).click()

      // Check for Dutch error message with time indication
      const errorText = page.getByText(/Te veel inlogpogingen|geblokkeerd/)
      await expect(errorText).toBeVisible()

      // Should contain "minuten" or "minuut"
      const errorWithTime = page.getByText(/minuut/)
      await expect(errorWithTime).toBeVisible()
    })

    test('should show generic error message before rate limit', async ({ page }) => {
      // First few attempts should show generic "Ongeldige inloggegevens"
      await page.getByLabel('E-mailadres').fill(testEmail)
      await page.getByLabel('Wachtwoord').fill('wrongpassword')
      await page.getByRole('button', { name: 'Inloggen' }).click()

      // Should show generic error (no user enumeration)
      await expect(page.getByText('Ongeldige inloggegevens')).toBeVisible()

      // Should NOT reveal if email exists
      await expect(page.getByText(/bestaat niet|not found/i)).not.toBeVisible()
    })
  })

  test.describe('Successful Login After Failed Attempts', () => {
    let testEmail: string
    let testPassword: string

    test.beforeEach(async ({ page }) => {
      testEmail = generateTestEmail('success-after-fail')
      testPassword = DEFAULT_PASSWORD

      // Create test user
      await page.goto('/signup')
      await page.getByLabel('E-mailadres').fill(testEmail)
      await page.getByLabel('Wachtwoord', { exact: true }).fill(testPassword)
      await page.getByLabel('Bevestig wachtwoord').fill(testPassword)
      await page.getByRole('button', { name: 'Account aanmaken' }).click()
      await expect(page).toHaveURL('/vandaag')
      await page.goto('/login')
    })

    test('should allow successful login before rate limit is reached', async ({ page }) => {
      // Make 3 failed attempts (under the limit of 5)
      for (let i = 0; i < 3; i++) {
        await page.getByLabel('E-mailadres').fill(testEmail)
        await page.getByLabel('Wachtwoord').fill('wrongpassword')
        await page.getByRole('button', { name: 'Inloggen' }).click()
        await expect(page.getByText('Ongeldige inloggegevens')).toBeVisible()
      }

      // Now try with correct password - should succeed
      await page.getByLabel('E-mailadres').fill(testEmail)
      await page.getByLabel('Wachtwoord').fill(testPassword)
      await page.getByRole('button', { name: 'Inloggen' }).click()

      // Should successfully log in
      await expect(page).toHaveURL('/vandaag')
      await expect(page.getByText(`Welkom, ${testEmail}!`)).toBeVisible()
    })
  })

  test.describe('Different Users Independent Rate Limits', () => {
    test('should track rate limits independently per email', async ({ page }) => {
      const email1 = generateTestEmail('independent-1')
      const email2 = generateTestEmail('independent-2')
      const password = DEFAULT_PASSWORD

      // Create both users
      for (const email of [email1, email2]) {
        await page.goto('/signup')
        await page.getByLabel('E-mailadres').fill(email)
        await page.getByLabel('Wachtwoord', { exact: true }).fill(password)
        await page.getByLabel('Bevestig wachtwoord').fill(password)
        await page.getByRole('button', { name: 'Account aanmaken' }).click()
        await expect(page).toHaveURL('/vandaag')
      }

      await page.goto('/login')

      // Make 5 failed attempts for email1
      for (let i = 0; i < 5; i++) {
        await page.getByLabel('E-mailadres').fill(email1)
        await page.getByLabel('Wachtwoord').fill('wrongpassword')
        await page.getByRole('button', { name: 'Inloggen' }).click()
        await page.waitForLoadState('networkidle')
      }

      // email1 should be rate limited/locked
      await page.getByLabel('E-mailadres').fill(email1)
      await page.getByLabel('Wachtwoord').fill('wrongpassword')
      await page.getByRole('button', { name: 'Inloggen' }).click()
      const email1Error = page.getByText(/Te veel inlogpogingen|geblokkeerd/)
      await expect(email1Error).toBeVisible()

      // email2 should still be able to login
      await page.getByLabel('E-mailadres').fill(email2)
      await page.getByLabel('Wachtwoord').fill(password)
      await page.getByRole('button', { name: 'Inloggen' }).click()

      // Should successfully log in
      await expect(page).toHaveURL('/vandaag')
    })
  })
})
