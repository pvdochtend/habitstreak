import { test, expect } from '@playwright/test'
import { signupUser, loginUser, generateTestEmail, DEFAULT_PASSWORD } from '../helpers/auth'

test.describe('Signup and Login Flow', () => {
  test('complete user journey: signup and navigation', async ({ page }) => {
    const testEmail = generateTestEmail('journey')
    const testPassword = DEFAULT_PASSWORD

    // Signup
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: 'Registreren' })).toBeVisible()

    await page.getByLabel('E-mailadres').fill(testEmail)
    await page.getByLabel('Wachtwoord', { exact: true }).fill(testPassword)
    await page.getByLabel('Bevestig wachtwoord').fill(testPassword)
    await page.getByRole('button', { name: 'Account aanmaken' }).click()

    // Should redirect to /vandaag after signup
    await expect(page).toHaveURL('/vandaag')
    await expect(page.getByText(`Welkom, ${testEmail}!`)).toBeVisible()

    // Navigate to home - should stay on vandaag if authenticated
    await page.goto('/')
    await expect(page).toHaveURL('/vandaag')
  })

  test('login flow with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Inloggen' })).toBeVisible()

    // Try with non-existent user
    await page.getByLabel('E-mailadres').fill('nonexistent@example.com')
    await page.getByLabel('Wachtwoord').fill('wrongpassword')
    await page.getByRole('button', { name: 'Inloggen' }).click()

    // Should show error
    await expect(page.getByText('Ongeldige inloggegevens')).toBeVisible()
  })

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/vandaag')

    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('login with existing user succeeds', async ({ page }) => {
    // First create a user
    const { email, password } = await signupUser(page)

    // Logout by going to login page
    await page.goto('/login')

    // Login with the created user
    await page.getByLabel('E-mailadres').fill(email)
    await page.getByLabel('Wachtwoord').fill(password)
    await page.getByRole('button', { name: 'Inloggen' }).click()

    // Should redirect to vandaag
    await expect(page).toHaveURL('/vandaag')
  })
})
