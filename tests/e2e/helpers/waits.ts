import { Page, expect } from '@playwright/test'

/**
 * Wait for a specific color theme to be applied to the HTML element
 */
export async function waitForThemeApplied(
  page: Page,
  theme: 'blue' | 'pink',
  timeout: number = 5000
): Promise<void> {
  await expect(page.locator('html')).toHaveClass(new RegExp(theme), { timeout })
}

/**
 * Wait for a specific mode (light/dark) to be applied to the HTML element
 */
export async function waitForModeApplied(
  page: Page,
  mode: 'light' | 'dark',
  timeout: number = 5000
): Promise<void> {
  await expect(page.locator('html')).toHaveClass(new RegExp(mode), { timeout })
}

/**
 * Wait for theme to be initialized (either light or dark class present)
 */
export async function waitForThemeInitialized(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  await page.waitForFunction(
    () => {
      const htmlEl = document.documentElement
      return htmlEl.classList.contains('light') || htmlEl.classList.contains('dark')
    },
    { timeout }
  )
}

/**
 * Wait for a form to be ready (inputs visible and enabled)
 */
export async function waitForFormReady(
  page: Page,
  formSelector: string = 'form'
): Promise<void> {
  const form = page.locator(formSelector)
  await expect(form).toBeVisible()
  await page.waitForLoadState('domcontentloaded')
}

/**
 * Wait for an error message to appear
 */
export async function waitForErrorMessage(
  page: Page,
  message: string | RegExp,
  timeout: number = 5000
): Promise<void> {
  const errorLocator = typeof message === 'string'
    ? page.getByText(message)
    : page.locator(`text=${message}`)
  await expect(errorLocator).toBeVisible({ timeout })
}
