import { defineConfig, devices } from '@playwright/test';

/**
 * Local dev: start both servers manually before running `npm run test:e2e`.
 *   Terminal 1 — cd travel-planner && source .venv/bin/activate && uvicorn app.main:app --reload
 *   Terminal 2 — cd travel-planner/ui && npm run dev
 *
 * CI: the workflow installs deps and starts both servers automatically
 *   via the webServer config below (reuseExistingServer: false when CI=true).
 */
export default defineConfig({
  testDir: './e2e',

  // Run tests sequentially — shared backend state means parallel runs collide.
  fullyParallel: false,
  workers: 1,

  // Fail fast in CI; allow re-runs locally.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    // ── Backend ──────────────────────────────────────────────────────────────
    // Only started by Playwright in CI. Locally, reuse the already-running server.
    {
      command: 'uvicorn app.main:app --host 127.0.0.1 --port 8000',
      url: 'http://127.0.0.1:8000/docs',
      reuseExistingServer: !process.env.CI,
      cwd: '..',
      env: {
        DATABASE_URL: 'sqlite+pysqlite:///./e2e_test.db',
        JWT_SECRET: 'e2e-test-secret-not-for-production',
        JWT_ALG: 'HS256',
        ACCESS_TOKEN_EXPIRE_MINUTES: '60',
        OLLAMA_BASE_URL: 'http://localhost:11434',
        OLLAMA_MODEL: 'llama3',
        OLLAMA_TIMEOUT_SECONDS: '30',
      },
    },
    // ── Frontend ─────────────────────────────────────────────────────────────
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
