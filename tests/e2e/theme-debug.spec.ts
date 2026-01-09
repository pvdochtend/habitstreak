import { test, expect } from '@playwright/test'

// Fixed test user credentials
const TEST_USER = {
  email: 'test@habitstreak.test',
  password: 'TestPassword123!'
}

test.describe.configure({ mode: 'serial' })

test.describe('Theme Debugging', () => {
  test.beforeEach(async ({ page }) => {
    // Login with fixed test user
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)

    // Click submit and wait for navigation (first load can take 2+ minutes)
    await Promise.all([
      page.waitForURL('/vandaag', { timeout: 180000 }), // 3 minutes
      page.click('button[type="submit"]')
    ])

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 60000 })

    // Reset theme to Blue Light for consistent test starting point
    await page.goto('/instellingen')
    await page.waitForLoadState('networkidle')
    await page.click('button:has-text("Blauw")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("Licht")')
    await page.waitForTimeout(500)
  })

  test('Should switch to Pink theme and stay pink', async ({ page }) => {
    // Navigate to settings
    await page.goto('/instellingen')
    await page.waitForLoadState('networkidle')

    // Wait for theme to initialize
    const html = page.locator('html')
    await page.waitForFunction(() => {
      const htmlEl = document.documentElement
      return htmlEl.classList.contains('light') || htmlEl.classList.contains('dark')
    }, { timeout: 10000 })

    // Check initial theme
    const initialClasses = await html.getAttribute('class')
    console.log('Initial HTML classes:', initialClasses)

    // Click the Pink (Roze) button
    console.log('Clicking Pink button...')
    const pinkButton = page.locator('button:has-text("Roze")')
    await pinkButton.click()

    // Wait for pink class to be applied
    await page.waitForFunction(() => {
      return document.documentElement.classList.contains('pink')
    }, { timeout: 5000 })

    // Check classes after clicking
    const afterClasses = await html.getAttribute('class')
    console.log('After clicking Pink:', afterClasses)

    // Verify pink is applied
    expect(afterClasses).toContain('pink')
    expect(afterClasses).not.toContain('blue')

    // Wait to see if it reverts
    console.log('Waiting to check if theme reverts...')
    await page.waitForTimeout(2000)

    // Check classes again after waiting
    const finalClasses = await html.getAttribute('class')
    console.log('After 2 seconds:', finalClasses)

    // Verify it's still pink
    expect(finalClasses).toContain('pink')
    expect(finalClasses).not.toContain('blue')

    console.log('✓ Test passed - Pink theme stayed applied!')
  })

  test('Should switch to Dark mode and stay dark', async ({ page }) => {
    await page.goto('/instellingen')
    await page.waitForLoadState('networkidle')

    const html = page.locator('html')

    // Wait for theme to initialize
    await page.waitForFunction(() => {
      const htmlEl = document.documentElement
      return htmlEl.classList.contains('light') || htmlEl.classList.contains('dark')
    }, { timeout: 10000 })

    // Initial should be light
    const initialClasses = await html.getAttribute('class')
    console.log('Initial:', initialClasses)
    expect(initialClasses).toContain('light')

    // Click Dark button
    const darkButton = page.locator('button:has-text("Donker")')
    await darkButton.click()

    // Wait for dark class to be applied
    await page.waitForFunction(() => {
      return document.documentElement.classList.contains('dark')
    }, { timeout: 5000 })

    // Check dark is applied
    const afterClasses = await html.getAttribute('class')
    console.log('After Dark click:', afterClasses)
    expect(afterClasses).toContain('dark')
    expect(afterClasses).not.toContain('light')

    // Wait and verify it stays dark
    await page.waitForTimeout(2000)
    const finalClasses = await html.getAttribute('class')
    console.log('After 2 seconds:', finalClasses)
    expect(finalClasses).toContain('dark')

    console.log('✓ Dark mode stayed applied!')
  })

  test('Should switch to Pink Dark (combo) and stay', async ({ page }) => {
    await page.goto('/instellingen')
    await page.waitForLoadState('networkidle')

    const html = page.locator('html')

    // Wait for theme to initialize
    await page.waitForFunction(() => {
      const htmlEl = document.documentElement
      return htmlEl.classList.contains('light') || htmlEl.classList.contains('dark')
    }, { timeout: 10000 })

    // Click Pink
    await page.click('button:has-text("Roze")')

    // Wait for pink class to be applied
    await page.waitForFunction(() => {
      return document.documentElement.classList.contains('pink')
    }, { timeout: 5000 })

    // Click Dark
    await page.click('button:has-text("Donker")')

    // Wait for dark class to be applied
    await page.waitForFunction(() => {
      return document.documentElement.classList.contains('dark')
    }, { timeout: 5000 })

    // Check both are applied
    const afterClasses = await html.getAttribute('class')
    console.log('Pink Dark:', afterClasses)
    expect(afterClasses).toContain('pink')
    expect(afterClasses).toContain('dark')

    // Wait and verify
    await page.waitForTimeout(2000)
    const finalClasses = await html.getAttribute('class')
    console.log('After 2 seconds:', finalClasses)
    expect(finalClasses).toContain('pink')
    expect(finalClasses).toContain('dark')

    console.log('✓ Pink Dark combo stayed applied!')
  })
})
