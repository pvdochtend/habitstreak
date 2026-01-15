import { test, expect } from '../fixtures/test'
import { signupUser, loginUser, generateTestEmail, DEFAULT_PASSWORD } from '../helpers/auth'

test.describe('Signup and Login Flow', () => {
  test('complete user journey: signup and navigation', async ({ page }) => {
    const testEmail = generateTestEmail('journey')
    const testPassword = DEFAULT_PASSWORD

    await signupUser(page, testEmail, testPassword)

    // Should redirect to /vandaag after signup
    await expect(page).toHaveURL('/vandaag', { timeout: 30000 })
    await expect(page.getByRole('heading', { name: 'Vandaag' })).toBeVisible()

    // Navigate to home - should stay on vandaag if authenticated
    await page.goto('/')
    await expect(page).toHaveURL('/vandaag', { timeout: 30000 })
  })

  test('login flow with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Inloggen' })).toBeVisible()

    // Try with non-existent user
    await page.locator('input#email').fill('nonexistent@example.com')
    await page.locator('input#password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Inloggen' }).click()

    // Should show error
    await expect(page.getByText('Ongeldige inloggegevens')).toBeVisible({ timeout: 20000 })
  })

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/vandaag')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('login with existing user succeeds', async ({ page }) => {
    // First create a user
    const { email, password } = await signupUser(page)

    // Logout by going to login page
    await page.context().clearCookies()
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Login with the created user
    await page.locator('input#email').fill(email)
    await page.locator('input#password').fill(password)
    await page.getByRole('button', { name: 'Inloggen' }).click()

    // Should redirect to vandaag
    await expect(page).toHaveURL('/vandaag', { timeout: 30000 })
  })
})
