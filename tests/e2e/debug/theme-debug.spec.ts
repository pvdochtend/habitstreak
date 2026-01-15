import { test, expect } from '@playwright/test'
import { signupUser } from '../helpers/auth'
import { waitForThemeInitialized } from '../helpers/waits'

// These tests are skipped by default - run with test.only() for debugging
test.describe.skip('Theme Debugging', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    // Create a fresh user for each test run
    await signupUser(page)

    // Navigate to settings and reset theme to Blue Light for consistent starting point
    await page.goto('/instellingen')
    await page.waitForLoadState('networkidle')

    // Reset to Blue Light
    await page.click('button:has-text("Blauw")')
    await expect(page.locator('html')).toHaveClass(/blue/, { timeout: 5000 })
    await page.click('button:has-text("Licht")')
    await expect(page.locator('html')).toHaveClass(/light/, { timeout: 5000 })
  })

  test('Should switch to Pink theme and stay pink', async ({ page }) => {
    // Navigate to settings
    await page.goto('/instellingen')
    await page.waitForLoadState('networkidle')

    // Wait for theme to initialize
    await waitForThemeInitialized(page)

    // Check initial theme
    const html = page.locator('html')
    const initialClasses = await html.getAttribute('class')
    console.log('Initial HTML classes:', initialClasses)

    // Click the Pink (Roze) button
    console.log('Clicking Pink button...')
    const pinkButton = page.locator('button:has-text("Roze")')
    await pinkButton.click()

    // Wait for pink class to be applied
    await expect(html).toHaveClass(/pink/, { timeout: 5000 })

    // Check classes after clicking
    const afterClasses = await html.getAttribute('class')
    console.log('After clicking Pink:', afterClasses)

    // Verify pink is applied
    expect(afterClasses).toContain('pink')
    expect(afterClasses).not.toContain('blue')

    // Wait to see if it reverts (using proper assertion instead of timeout)
    console.log('Verifying theme stays applied...')
    await page.waitForLoadState('networkidle')

    // Check classes again after waiting
    const finalClasses = await html.getAttribute('class')
    console.log('After network idle:', finalClasses)

    // Verify it's still pink
    expect(finalClasses).toContain('pink')
    expect(finalClasses).not.toContain('blue')

    console.log('Test passed - Pink theme stayed applied!')
  })

  test('Should switch to Dark mode and stay dark', async ({ page }) => {
    await page.goto('/instellingen')
    await page.waitForLoadState('networkidle')

    const html = page.locator('html')

    // Wait for theme to initialize
    await waitForThemeInitialized(page)

    // Initial should be light
    const initialClasses = await html.getAttribute('class')
    console.log('Initial:', initialClasses)
    expect(initialClasses).toContain('light')

    // Click Dark button
    const darkButton = page.locator('button:has-text("Donker")')
    await darkButton.click()

    // Wait for dark class to be applied
    await expect(html).toHaveClass(/dark/, { timeout: 5000 })

    // Check dark is applied
    const afterClasses = await html.getAttribute('class')
    console.log('After Dark click:', afterClasses)
    expect(afterClasses).toContain('dark')
    expect(afterClasses).not.toContain('light')

    // Wait and verify it stays dark
    await page.waitForLoadState('networkidle')
    const finalClasses = await html.getAttribute('class')
    console.log('After network idle:', finalClasses)
    expect(finalClasses).toContain('dark')

    console.log('Dark mode stayed applied!')
  })

  test('Should switch to Pink Dark (combo) and stay', async ({ page }) => {
    await page.goto('/instellingen')
    await page.waitForLoadState('networkidle')

    const html = page.locator('html')

    // Wait for theme to initialize
    await waitForThemeInitialized(page)

    // Click Pink
    await page.click('button:has-text("Roze")')
    await expect(html).toHaveClass(/pink/, { timeout: 5000 })

    // Click Dark
    await page.click('button:has-text("Donker")')
    await expect(html).toHaveClass(/dark/, { timeout: 5000 })

    // Check both are applied
    const afterClasses = await html.getAttribute('class')
    console.log('Pink Dark:', afterClasses)
    expect(afterClasses).toContain('pink')
    expect(afterClasses).toContain('dark')

    // Wait and verify
    await page.waitForLoadState('networkidle')
    const finalClasses = await html.getAttribute('class')
    console.log('After network idle:', finalClasses)
    expect(finalClasses).toContain('pink')
    expect(finalClasses).toContain('dark')

    console.log('Pink Dark combo stayed applied!')
  })
})
