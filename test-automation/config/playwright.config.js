import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

export default defineConfig({
  testDir: '../suites/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: '../reports/playwright-report' }],
    ['json', { outputFile: '../reports/test-results.json' }],
    ['junit', { outputFile: '../reports/junit.xml' }]
  ],
  
  use: {
    baseURL: process.env.MARKETPLACE_URL || 'http://localhost:5173',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: [
    {
      command: 'cd .. && pnpm dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd ../api && pnpm dev',
      port: 8001,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd ../admin-app && pnpm start',
      port: 8002,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});