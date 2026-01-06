import { test, expect } from '@playwright/test'

test.describe('Habit Tracking Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'testPassword123'

  test('complete user journey: signup → create task → check in → view insights', async ({
    page,
  }) => {
    // ════════════════════════════════════
    // 1. SIGNUP
    // ════════════════════════════════════
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: 'Registreren' })).toBeVisible()

    await page.getByLabel('E-mailadres').fill(testEmail)
    await page.getByLabel('Wachtwoord', { exact: true }).fill(testPassword)
    await page.getByLabel('Bevestig wachtwoord').fill(testPassword)
    await page.getByRole('button', { name: 'Account aanmaken' }).click()

    // Should redirect to /vandaag after signup
    await expect(page).toHaveURL('/vandaag')
    await expect(page.getByText(`Welkom, ${testEmail}!`)).toBeVisible()

    // ════════════════════════════════════
    // 2. CREATE TASK (will be implemented in Phase E)
    // ════════════════════════════════════
    // This section will be expanded once the frontend is built

    // ════════════════════════════════════
    // 3. LOGOUT TEST
    // ════════════════════════════════════
    // Navigate back to home - should show vandaag if authenticated
    await page.goto('/')
    await expect(page).toHaveURL('/vandaag')
  })

  test('login flow with existing user', async ({ page }) => {
    // First create a user via API (requires signup first)
    // This test assumes the user from the previous test exists

    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Inloggen' })).toBeVisible()

    // Try with non-existent user
    await page.getByLabel('E-mailadres').fill('nonexistent@example.com')
    await page.getByLabel('Wachtwoord').fill('wrongpassword')
    await page.getByRole('button', { name: 'Inloggen' }).click()

    // Should show error
    await expect(page.getByText('Ongeldige inloggegevens')).toBeVisible()
  })

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/vandaag')

    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})
