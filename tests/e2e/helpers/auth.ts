import { Page } from '@playwright/test'

/**
 * Generate a unique test email address
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}@example.com`
}

/**
 * Default test password that meets validation requirements
 */
export const DEFAULT_PASSWORD = 'TestPassword123!'

/**
 * Sign up a new user and wait for redirect to main app
 */
export async function signupUser(
  page: Page,
  email?: string,
  password?: string
): Promise<{ email: string; password: string }> {
  const userEmail = email ?? generateTestEmail()
  const userPassword = password ?? DEFAULT_PASSWORD

  await page.goto('/signup')
  await page.getByLabel('E-mailadres').fill(userEmail)
  await page.getByLabel('Wachtwoord', { exact: true }).fill(userPassword)
  await page.getByLabel('Bevestig wachtwoord').fill(userPassword)
  await page.getByRole('button', { name: 'Account aanmaken' }).click()
  await page.waitForURL('/vandaag', { timeout: 10000 })

  return { email: userEmail, password: userPassword }
}

/**
 * Log in an existing user and wait for redirect to main app
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('E-mailadres').fill(email)
  await page.getByLabel('Wachtwoord').fill(password)
  await page.getByRole('button', { name: 'Inloggen' }).click()
  await page.waitForURL('/vandaag', { timeout: 10000 })
}

/**
 * Log out the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  await page.goto('/instellingen')
  await page.getByRole('button', { name: 'Uitloggen' }).click()
  await page.waitForURL('/login', { timeout: 10000 })
}
