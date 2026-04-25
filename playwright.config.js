import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'list',
    use: {
        baseURL: process.env.UI_BASE_URL || 'http://127.0.0.1:5175',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        actionTimeout: 60000,
        navigationTimeout: 60000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://127.0.0.1:5175',
        reuseExistingServer: true,
        timeout: 300 * 1000,
    },
});
