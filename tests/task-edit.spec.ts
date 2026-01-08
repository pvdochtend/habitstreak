import { test, expect } from '@playwright/test'

test.describe('Task Edit Form', () => {
  test('should populate form fields when editing a task', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3001')

    // Wait for login page and login
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })

    // Check if we need to login or if already logged in
    const emailInput = await page.$('input[type="email"]')
    if (emailInput) {
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/vandaag', { timeout: 10000 })
    }

    // Navigate to tasks page
    await page.goto('http://localhost:3001/taken')
    await page.waitForSelector('h1:has-text("Taken")', { timeout: 10000 })

    // Wait for tasks to load
    await page.waitForTimeout(2000)

    // Find the first edit button and click it
    const editButton = await page.locator('button[title="Bewerken"]').first()
    await editButton.click()

    // Wait for dialog to open
    await page.waitForSelector('input#title', { timeout: 5000 })

    // Check if the title field is populated
    const titleInput = await page.locator('input#title')
    const titleValue = await titleInput.inputValue()

    console.log('Title input value:', titleValue)

    // The title should not be empty when editing
    expect(titleValue).not.toBe('')
    expect(titleValue.length).toBeGreaterThan(0)

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/edit-form.png', fullPage: true })

    console.log('Test completed - title value is:', titleValue)
  })
})
