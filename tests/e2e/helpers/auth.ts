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
  const testIp = (page as any).__testIp as string | undefined
  const requestHeaders = testIp ? { 'x-test-ip': testIp } : undefined

  const signupResponse = await page.request.post('/api/auth/signup', {
    data: { email: userEmail, password: userPassword },
    headers: requestHeaders,
  })
  if (!signupResponse.ok()) {
    throw new Error(`Signup failed with status ${signupResponse.status()}`)
  }

  const csrfResponse = await page.request.get('/api/auth/csrf', {
    headers: requestHeaders,
  })
  const csrfData = await csrfResponse.json()

  const loginResponse = await page.request.post('/api/auth/callback/credentials', {
    form: {
      csrfToken: csrfData.csrfToken,
      email: userEmail,
      password: userPassword,
      callbackUrl: '/vandaag',
      json: 'true',
    },
    headers: requestHeaders,
  })

  if (!loginResponse.ok()) {
    throw new Error(`Login failed with status ${loginResponse.status()}`)
  }

  await page.goto('/vandaag')

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
  const testIp = (page as any).__testIp as string | undefined
  const requestHeaders = testIp ? { 'x-test-ip': testIp } : undefined

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

  if (!loginResponse.ok()) {
    throw new Error(`Login failed with status ${loginResponse.status()}`)
  }

  await page.goto('/vandaag')
}

/**
 * Log out the current user
 */
export async function logoutUser(page: Page): Promise<void> {
  await page.goto('/instellingen')
  await page.getByRole('button', { name: 'Uitloggen' }).click()
  await page.waitForURL('/login', { timeout: 10000, waitUntil: 'domcontentloaded' })
}
