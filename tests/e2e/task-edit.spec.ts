import { test, expect } from '@playwright/test'

test.describe('Task Edit Form', () => {
  test('should populate form fields when editing a task', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testPassword123'

    // Capture console logs
    const consoleLogs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(text)
      if (text.includes('TaskForm') || text.includes('useEffect') || text.includes('Loading task data')) {
        console.log('[BROWSER]:', text)
      }
    })

    // Create a new user via signup
    await page.goto('http://localhost:3001/signup')
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })

    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]:not([id*="confirm"])', testPassword)
    await page.fill('input[type="password"][id*="confirm"]', testPassword)
    await page.click('button[type="submit"]')

    // Wait for navigation to today page after signup
    await page.waitForTimeout(3000)  // Give time for auth to complete
    console.log('Signed up successfully, current URL:', page.url())

    // Navigate to tasks page
    await page.goto('http://localhost:3001/taken')
    await page.waitForSelector('h1:has-text("Taken")', { timeout: 10000 })

    // Create a new task first
    console.log('Creating a new task...')
    await page.click('button:has-text("Nieuwe taak")')
    await page.waitForSelector('input#title', { timeout: 5000 })

    // Fill in the form
    await page.fill('input#title', 'Test Task for Edit')
    await page.click('button:has-text("Aanmaken")')

    // Wait for dialog to close and task list to update
    await page.waitForTimeout(1000)
    console.log('Task created successfully')

    // Now test editing
    console.log('Testing edit functionality...')
    const editButtons = await page.locator('button[title="Bewerken"]').count()
    console.log('Found edit buttons:', editButtons)

    if (editButtons === 0) {
      throw new Error('No edit buttons found after creating task')
    }

    // Click the first edit button
    await page.locator('button[title="Bewerken"]').first().click()

    // Wait for edit form to appear
    await page.waitForSelector('h2:has-text("Taak bewerken")', { timeout: 5000 })
    console.log('Edit dialog opened')

    // Wait a bit for the form to populate
    await page.waitForTimeout(500)

    // Get the title input value
    const titleInput = await page.locator('input#title')
    const titleValue = await titleInput.inputValue()

    console.log('='.repeat(50))
    console.log('TITLE INPUT VALUE:', titleValue)
    console.log('TITLE IS EMPTY:', titleValue === '')
    console.log('EXPECTED VALUE: Test Task for Edit')
    console.log('='.repeat(50))

    // Take a screenshot
    await page.screenshot({ path: './task-edit-screenshot.png', fullPage: true })
    console.log('Screenshot saved to: ./task-edit-screenshot.png')

    // Check if title is populated
    expect(titleValue).not.toBe('')
    expect(titleValue).toBe('Test Task for Edit')
    console.log('SUCCESS: Title field is populated correctly with:', titleValue)
  })
})
