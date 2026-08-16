import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config for the NEP Programme Advisory Mapping SPA.
 *
 * Prerequisites (see docs/E2E_TESTING.md): the Laravel API must already be
 * running and seeded (`php artisan serve` + `php artisan db:seed`) — this
 * config only boots the Vite dev server for the frontend, since the API
 * lives in a separate repository/process this project can't start for you.
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Serial by default: `php artisan serve` (Laravel's built-in dev server)
  // is single-threaded, and this suite measurably slows down and
  // intermittently fails under 2+ concurrent workers hitting it — not a bug
  // in the app, just more load than that server is meant to handle. A CI
  // environment fronted by php-fpm/nginx or Octane can safely raise this;
  // see docs/E2E_TESTING.md.
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [['html', { outputFolder: 'playwright-report', open: 'never' }], ['github'], ['list']]
    : [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  outputDir: 'tests/e2e/.artifacts',

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      testMatch: /specs\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev -- --port=5173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
