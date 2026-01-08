import { test, expect } from '@playwright/test'

// Fixed test user credentials
const TEST_USER = {
  email: 'test@habitstreak.test',
  password: 'TestPassword123!'
}

test.describe('Theme Debugging', () => {
  test.beforeEach(async ({ page }) => {
    // Login with fixed test user
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // Wait for redirect to main app
    await page.waitForURL('/vandaag', { timeout: 5000 })
  })

  test('Should switch to Pink theme and stay pink', async ({ page }) => {
    // Navigate to settings
    await page.goto('/instellingen')
    await page.waitForLoadState('networkidle')

    // Check initial theme
    const html = page.locator('html')
    const initialClasses = await html.getAttribute('class')
    console.log('Initial HTML classes:', initialClasses)

    // Take screenshot before
    await page.screenshot({ path: 'test-results/01-before-pink.png', fullPage: true })

    // Click the Pink (Roze) button
    console.log('Clicking Pink button...')
    const pinkButton = page.locator('button:has-text("Roze")')
    await pinkButton.click()

    // Wait for state to update
    await page.waitForTimeout(500)

    // Check classes after clicking
    const afterClasses = await html.getAttribute('class')
    console.log('After clicking Pink:', afterClasses)

    // Take screenshot after
    await page.screenshot({ path: 'test-results/02-after-pink.png', fullPage: true })

    // Verify pink is applied
    expect(afterClasses).toContain('pink')
    expect(afterClasses).not.toContain('blue')

    // Verify the button shows as selected
    await expect(pinkButton).toHaveClass(/border-\[#E11D74\]/)

    // Wait a bit more to see if it reverts
    console.log('Waiting to check if theme reverts...')
    await page.waitForTimeout(2000)

    // Check classes again after waiting
    const finalClasses = await html.getAttribute('class')
    console.log('After 2 seconds:', finalClasses)

    // Take final screenshot
    await page.screenshot({ path: 'test-results/03-final-check.png', fullPage: true })

    // Verify it's still pink
    expect(finalClasses).toContain('pink')
    expect(finalClasses).not.toContain('blue')

    console.log('✓ Test passed - Pink theme stayed applied!')
  })

  test('Should switch to Dark mode and stay dark', async ({ page }) => {
    await page.goto('/instellingen')
    await page.waitForLoadState('networkidle')

    const html = page.locator('html')

    // Initial should be light
    const initialClasses = await html.getAttribute('class')
    console.log('Initial:', initialClasses)
    expect(initialClasses).toContain('light')

    // Click Dark button
    const darkButton = page.locator('button:has-text("Donker")')
    await darkButton.click()
    await page.waitForTimeout(500)

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

    // Click Pink
    await page.click('button:has-text("Roze")')
    await page.waitForTimeout(300)

    // Click Dark
    await page.click('button:has-text("Donker")')
    await page.waitForTimeout(500)

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
