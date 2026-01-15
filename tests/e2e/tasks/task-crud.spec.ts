import { test, expect } from '../fixtures/test'
import { signupUser } from '../helpers/auth'

test.describe('Task CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await signupUser(page)
  })

  test('should populate form fields when editing a task', async ({ page }) => {
    // Navigate to tasks page
    await page.goto('/taken')
    await expect(page.locator('h1:has-text("Taken")')).toBeVisible({ timeout: 10000 })

    // Create a new task first
    await page.click('button:has-text("Nieuwe taak")')
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 })

    // Fill in the form
    await page.fill('input#title', 'Test Task for Edit')
    await page.click('button:has-text("Aanmaken")')

    // Wait for dialog to close and task list to update
    await expect(page.locator('input#title')).not.toBeVisible({ timeout: 5000 })

    // Now test editing - find and click the edit button
    const editButton = page.locator('button[title="Bewerken"]').first()
    await expect(editButton).toBeVisible({ timeout: 5000 })
    await editButton.click()

    // Wait for edit form to appear
    await expect(page.locator('h2:has-text("Taak bewerken")')).toBeVisible({ timeout: 5000 })

    // Wait for the form to populate
    const titleInput = page.locator('input#title')
    await expect(titleInput).toBeVisible()

    // Get and verify the title input value
    const titleValue = await titleInput.inputValue()

    // Check if title is populated
    expect(titleValue).not.toBe('')
    expect(titleValue).toBe('Test Task for Edit')
  })

  test('should create a new task successfully', async ({ page }) => {
    await page.goto('/taken')
    await expect(page.locator('h1:has-text("Taken")')).toBeVisible({ timeout: 10000 })

    // Open create task dialog
    await page.click('button:has-text("Nieuwe taak")')
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 })

    // Fill in task details
    await page.fill('input#title', 'New Daily Task')
    await page.click('button:has-text("Aanmaken")')

    // Verify task appears in list
    await expect(page.getByText('New Daily Task')).toBeVisible({ timeout: 5000 })
  })

  test('should delete a task', async ({ page }) => {
    await page.goto('/taken')
    await expect(page.locator('h1:has-text("Taken")')).toBeVisible({ timeout: 10000 })

    // Create a task to delete
    await page.click('button:has-text("Nieuwe taak")')
    await expect(page.locator('input#title')).toBeVisible({ timeout: 5000 })
    await page.fill('input#title', 'Task to Delete')
    await page.click('button:has-text("Aanmaken")')

    // Verify task exists
    await expect(page.getByText('Task to Delete')).toBeVisible({ timeout: 5000 })

    // Accept browser confirm dialog
    page.once('dialog', dialog => dialog.accept())

    // Click delete button
    const deleteButton = page.locator('button[title="Verwijderen"]').first()
    await expect(deleteButton).toBeVisible()
    await deleteButton.click()

    // Verify task is removed
    await expect(page.getByText('Task to Delete')).not.toBeVisible({ timeout: 5000 })
  })
})
