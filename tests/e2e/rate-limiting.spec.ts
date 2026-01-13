import { test, expect } from '@playwright/test'

test.describe('Rate Limiting and Account Lockout', () => {
  // Use unique emails for each test to avoid conflicts
  const timestamp = Date.now()

  test.describe('Login Rate Limiting', () => {
    const testEmail = `ratelimit-login-${timestamp}@example.com`
    const testPassword = 'correctPassword123'
    const wrongPassword = 'wrongPassword123'

    test.beforeEach(async ({ page }) => {
      // Create a test user first
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

        // Wait a bit between attempts
        await page.waitForTimeout(100)
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
        await page.waitForTimeout(100)
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
        await page.waitForTimeout(100)
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
      const email1 = `signup-test-1-${timestamp}@example.com`
      await page.getByLabel('E-mailadres').fill(email1)
      await page.getByLabel('Wachtwoord', { exact: true }).fill('password123')
      await page.getByLabel('Bevestig wachtwoord').fill('password123')
      await page.getByRole('button', { name: 'Account aanmaken' }).click()
      await expect(page).toHaveURL('/vandaag')

      // Attempt 2
      await page.goto('/signup')
      const email2 = `signup-test-2-${timestamp}@example.com`
      await page.getByLabel('E-mailadres').fill(email2)
      await page.getByLabel('Wachtwoord', { exact: true }).fill('password123')
      await page.getByLabel('Bevestig wachtwoord').fill('password123')
      await page.getByRole('button', { name: 'Account aanmaken' }).click()
      await expect(page).toHaveURL('/vandaag')

      // Attempt 3
      await page.goto('/signup')
      const email3 = `signup-test-3-${timestamp}@example.com`
      await page.getByLabel('E-mailadres').fill(email3)
      await page.getByLabel('Wachtwoord', { exact: true }).fill('password123')
      await page.getByLabel('Bevestig wachtwoord').fill('password123')
      await page.getByRole('button', { name: 'Account aanmaken' }).click()
      await expect(page).toHaveURL('/vandaag')
    })

    test('should rate limit signup after 3 attempts', async ({ page }) => {
      // Make 3 successful signups
      for (let i = 1; i <= 3; i++) {
        await page.goto('/signup')
        const email = `signup-ratelimit-${timestamp}-${i}@example.com`
        await page.getByLabel('E-mailadres').fill(email)
        await page.getByLabel('Wachtwoord', { exact: true }).fill('password123')
        await page.getByLabel('Bevestig wachtwoord').fill('password123')
        await page.getByRole('button', { name: 'Account aanmaken' }).click()
        await expect(page).toHaveURL('/vandaag')
        await page.waitForTimeout(100)
      }

      // 4th attempt should be rate limited
      await page.goto('/signup')
      const email4 = `signup-ratelimit-${timestamp}-4@example.com`
      await page.getByLabel('E-mailadres').fill(email4)
      await page.getByLabel('Wachtwoord', { exact: true }).fill('password123')
      await page.getByLabel('Bevestig wachtwoord').fill('password123')
      await page.getByRole('button', { name: 'Account aanmaken' }).click()

      // Should show rate limit error
      const rateLimitError = page.getByText(/Te veel registratiepogingen/)
      await expect(rateLimitError).toBeVisible({ timeout: 10000 })
    })

    test('should show error for duplicate email before rate limit', async ({ page }) => {
      const email = `duplicate-test-${timestamp}@example.com`

      // Create first account
      await page.goto('/signup')
      await page.getByLabel('E-mailadres').fill(email)
      await page.getByLabel('Wachtwoord', { exact: true }).fill('password123')
      await page.getByLabel('Bevestig wachtwoord').fill('password123')
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
    const testEmail = `error-messages-${timestamp}@example.com`
    const testPassword = 'password123'

    test.beforeEach(async ({ page }) => {
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
        await page.waitForTimeout(100)
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
    const testEmail = `success-after-fail-${timestamp}@example.com`
    const testPassword = 'correctPassword123'

    test.beforeEach(async ({ page }) => {
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
        await page.waitForTimeout(100)
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
      const email1 = `independent-1-${timestamp}@example.com`
      const email2 = `independent-2-${timestamp}@example.com`
      const password = 'password123'

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
        await page.waitForTimeout(100)
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
