import { defineConfig, devices } from '@playwright/test'

const rawBaseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXTAUTH_URL ??
  'http://localhost:3001'
const baseURL = new URL(rawBaseURL).origin

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: './start-network.sh',
    url: baseURL,
    env: {
      NEXTAUTH_URL: rawBaseURL,
      NEXTAUTH_URL_INTERNAL: rawBaseURL,
    },
    reuseExistingServer: true,
    timeout: 120000,
  },
})
