import { existsSync } from 'node:fs'
import { chromium, defineConfig, devices } from '@playwright/test'

const chromeWindows = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const chromiumPlaywright = chromium.executablePath()
const executavelLocal = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (existsSync(chromiumPlaywright) ? chromiumPlaywright : undefined) ||
  (process.platform === 'win32' && existsSync(chromeWindows) ? chromeWindows : undefined)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 90_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    launchOptions: executavelLocal ? { executablePath: executavelLocal } : undefined,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: process.env.CI
      ? 'npm run preview -- --host 127.0.0.1 --port 4173'
      : 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
