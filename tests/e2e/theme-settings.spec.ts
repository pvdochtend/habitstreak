import { test, expect } from '@playwright/test'

// Helper to create a test user and login
async function loginAsTestUser(page: any) {
  const timestamp = Date.now()
  const email = `theme-test-${timestamp}@example.com`
  const password = 'TestPassword123!'

  // Sign up
  await page.goto('/signup')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  // Wait for redirect to main app
  await page.waitForURL('/vandaag', { timeout: 10000 })

  return { email, password }
}

test.describe('Theme Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('should display theme controls in settings page', async ({ page }) => {
    // Navigate to settings
    await page.goto('/instellingen')

    // Check that theme card exists
    const themeCard = page.locator('text=Thema')
    await expect(themeCard).toBeVisible()

    // Check color scheme selector
    await expect(page.locator('text=Kleurschema')).toBeVisible()
    await expect(page.locator('button:has-text("Blauw")')).toBeVisible()
    await expect(page.locator('button:has-text("Roze")')).toBeVisible()

    // Check dark mode toggle
    await expect(page.locator('text=Weergave')).toBeVisible()
    await expect(page.locator('button:has-text("Licht")')).toBeVisible()
    await expect(page.locator('button:has-text("Donker")')).toBeVisible()
  })

  test('should default to Blue Light theme', async ({ page }) => {
    await page.goto('/instellingen')

    // Check HTML has correct classes
    const html = page.locator('html')
    await expect(html).toHaveClass(/light/)
    await expect(html).toHaveClass(/blue/)

    // Check Blue button is selected
    const blueButton = page.locator('button:has-text("Blauw")')
    await expect(blueButton).toHaveClass(/border-\[#3B82F6\]/)

    // Check Light button is selected
    const lightButton = page.locator('button:has-text("Licht")')
    await expect(lightButton).toHaveClass(/border-primary/)
  })

  test('should switch to Pink Light theme', async ({ page }) => {
    await page.goto('/instellingen')

    // Click Pink button
    await page.click('button:has-text("Roze")')

    // Wait for theme to apply
    await page.waitForTimeout(500)

    // Check HTML classes updated
    const html = page.locator('html')
    await expect(html).toHaveClass(/light/)
    await expect(html).toHaveClass(/pink/)

    // Check Pink button shows checkmark
    const pinkButton = page.locator('button:has-text("Roze")')
    await expect(pinkButton).toHaveClass(/border-\[#E11D74\]/)

    // Verify checkmark is visible
    const checkmark = pinkButton.locator('svg').last()
    await expect(checkmark).toBeVisible()
  })

  test('should switch to Blue Dark theme', async ({ page }) => {
    await page.goto('/instellingen')

    // Click Dark button
    await page.click('button:has-text("Donker")')

    // Wait for theme to apply
    await page.waitForTimeout(500)

    // Check HTML classes updated
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)
    await expect(html).toHaveClass(/blue/)

    // Check Dark button shows checkmark
    const darkButton = page.locator('button:has-text("Donker")')
    await expect(darkButton).toHaveClass(/border-primary/)
  })

  test('should switch to Pink Dark theme (all 4 combinations)', async ({ page }) => {
    await page.goto('/instellingen')

    // Switch to Pink
    await page.click('button:has-text("Roze")')
    await page.waitForTimeout(300)

    // Switch to Dark
    await page.click('button:has-text("Donker")')
    await page.waitForTimeout(300)

    // Check HTML has both classes
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)
    await expect(html).toHaveClass(/pink/)

    // Both buttons should show as selected
    await expect(page.locator('button:has-text("Roze")')).toHaveClass(/border-\[#E11D74\]/)
    await expect(page.locator('button:has-text("Donker")')).toHaveClass(/border-primary/)
  })

  test('should persist theme after page reload', async ({ page }) => {
    await page.goto('/instellingen')

    // Switch to Pink Dark
    await page.click('button:has-text("Roze")')
    await page.waitForTimeout(300)
    await page.click('button:has-text("Donker")')
    await page.waitForTimeout(500)

    // Reload page
    await page.reload()

    // Wait for theme to initialize
    await page.waitForTimeout(1000)

    // Check theme persisted
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)
    await expect(html).toHaveClass(/pink/)

    // Both buttons should still show as selected
    await expect(page.locator('button:has-text("Roze")')).toHaveClass(/border-\[#E11D74\]/)
    await expect(page.locator('button:has-text("Donker")')).toHaveClass(/border-primary/)
  })

  test('should persist theme across navigation', async ({ page }) => {
    await page.goto('/instellingen')

    // Switch to Pink Dark
    await page.click('button:has-text("Roze")')
    await page.waitForTimeout(300)
    await page.click('button:has-text("Donker")')
    await page.waitForTimeout(500)

    // Navigate to another page
    await page.goto('/vandaag')
    await page.waitForTimeout(500)

    // Check theme still applied
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)
    await expect(html).toHaveClass(/pink/)

    // Navigate back to settings
    await page.goto('/instellingen')

    // Check buttons still show correct selection
    await expect(page.locator('button:has-text("Roze")')).toHaveClass(/border-\[#E11D74\]/)
    await expect(page.locator('button:has-text("Donker")')).toHaveClass(/border-primary/)
  })

  test('should switch theme instantly without reload', async ({ page }) => {
    await page.goto('/instellingen')

    // Record initial HTML classes
    const html = page.locator('html')
    await expect(html).toHaveClass(/light/)

    // Click Dark button
    await page.click('button:has-text("Donker")')

    // Theme should change immediately (within 100ms)
    await page.waitForTimeout(100)
    await expect(html).toHaveClass(/dark/)

    // Click Light button
    await page.click('button:has-text("Licht")')

    // Should switch back immediately
    await page.waitForTimeout(100)
    await expect(html).toHaveClass(/light/)
  })

  test('should update localStorage when theme changes', async ({ page, context }) => {
    await page.goto('/instellingen')

    // Switch to Pink
    await page.click('button:has-text("Roze")')
    await page.waitForTimeout(500)

    // Check localStorage
    const colorScheme = await page.evaluate(() => localStorage.getItem('habitstreak-color-scheme'))
    expect(colorScheme).toBe('pink')

    // Switch to Dark
    await page.click('button:has-text("Donker")')
    await page.waitForTimeout(500)

    // Check localStorage
    const darkMode = await page.evaluate(() => localStorage.getItem('habitstreak-dark-mode'))
    expect(darkMode).toBe('true')
  })

  test('should show checkmark animation when theme is selected', async ({ page }) => {
    await page.goto('/instellingen')

    // Click Pink button
    const pinkButton = page.locator('button:has-text("Roze")')
    await pinkButton.click()

    // Check for checkmark with animation class
    const checkmark = pinkButton.locator('svg').last()
    await expect(checkmark).toBeVisible()

    // Parent div should have animation class
    const checkmarkContainer = pinkButton.locator('div.animate-scale-in')
    await expect(checkmarkContainer).toBeVisible()
  })

  test('should display theme info message', async ({ page }) => {
    await page.goto('/instellingen')

    // Check for info message
    const infoMessage = page.locator('text=Thema wijzigingen worden direct toegepast')
    await expect(infoMessage).toBeVisible()
  })

  test('should have all 4 theme CSS variables defined', async ({ page }) => {
    await page.goto('/instellingen')

    // Test Blue Light (default)
    let primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    })
    expect(primaryColor).toBe('221.2 83.2% 53.3%')

    // Switch to Pink Light
    await page.click('button:has-text("Roze")')
    await page.waitForTimeout(300)

    primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    })
    expect(primaryColor).toBe('336 84% 55%')

    // Switch to Blue Dark
    await page.click('button:has-text("Blauw")')
    await page.waitForTimeout(300)
    await page.click('button:has-text("Donker")')
    await page.waitForTimeout(300)

    primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    })
    expect(primaryColor).toBe('217.2 91.2% 59.8%')

    // Switch to Pink Dark
    await page.click('button:has-text("Roze")')
    await page.waitForTimeout(300)

    primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    })
    expect(primaryColor).toBe('336 80% 65%')
  })

  test('should maintain mobile-optimized touch targets', async ({ page }) => {
    await page.goto('/instellingen')

    // Check color scheme buttons have adequate touch targets (min 44px)
    const blueButton = page.locator('button:has-text("Blauw")')
    const buttonBox = await blueButton.boundingBox()

    expect(buttonBox).not.toBeNull()
    expect(buttonBox!.height).toBeGreaterThanOrEqual(44)
  })
})
