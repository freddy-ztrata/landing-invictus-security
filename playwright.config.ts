import { defineConfig, devices } from '@playwright/test';

// Requiere `npm run build` antes. Levanta dist/ con el servidor que imita a nginx (+ /api/lead simulado).
export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4321', trace: 'retain-on-failure' },
  webServer: {
    command: 'node scripts/serve-dist.mjs',
    url: 'http://localhost:4321/',
    reuseExistingServer: false,
    stdout: 'pipe',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
