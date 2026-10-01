import { defineConfig } from '@playwright/test';

// Manager e2e smoke (checklist-2 §11). Expects the dev UI on 4200 and the
// backend on 8085 (see document/manager-checklist-2.md and .claude/memory.md §5).
//   npm run e2e            headless
//   npm run e2e -- --ui    interactive
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  }
});
