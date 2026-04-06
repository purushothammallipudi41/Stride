/* global process */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'off',
    video: 'off',
    env: {
      VITE_API_URL: 'http://127.0.0.1:3001',
      VITE_AUDIUS_HOST: 'https://api.audius.co'
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run test:start',
    port: 5174,
    timeout: 120000,
    reuseExistingServer: false,
  },
});
