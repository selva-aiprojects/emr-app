import { test, expect } from '@playwright/test';

const CLIENT_URL = 'http://localhost:5174';

test.describe('UI Integrity & Login Tests', () => {

    test('Doctor Login and Dashboard', async ({ page }) => {
        console.log('Navigating to login...');
        await page.goto(CLIENT_URL);

        console.log('Filling credentials...');
        // Login
        await page.selectOption('select', 'EHS'); // Select Tenant
        await page.fill('input[type="email"]', 'doctor@ehs.local');
        await page.fill('input[type="password"]', 'Test@123');

        console.log('Clicking submit...');
        // Click login
        await page.click('button[type="submit"]');

        console.log('Waiting for dashboard...');
        // Expect dashboard elements (more robust than just header)
        await expect(page.getByText('Total Patients')).toBeVisible({ timeout: 30000 });
        await expect(page.getByText('Scheduled Visits')).toBeVisible();
        await expect(page.locator('.header-title')).toHaveText('Dashboard');

        console.log('Verifying elements...');
        // Check for specific elements
        await expect(page.getByText('Patients')).toBeVisible();
        await expect(page.getByText('Appointments')).toBeVisible();
        console.log('Doctor test passed.');
    });

    test('Support Staff Login and Dashboard', async ({ page }) => {
        console.log('Navigating to login (Support)...');
        await page.goto(CLIENT_URL);

        console.log('Filling credentials (Support)...');
        // Login
        await page.selectOption('select', 'EHS'); // Select Tenant
        await page.fill('input[type="email"]', 'support@ehs.local');
        await page.fill('input[type="password"]', 'Test@123');

        console.log('Clicking submit (Support)...');
        // Click login
        await page.click('button[type="submit"]');

        console.log('Waiting for dashboard (Support)...');
        // Expect dashboard elements
        await expect(page.getByText('Total Patients')).toBeVisible({ timeout: 30000 });
        await expect(page.locator('.header-title')).toHaveText('Dashboard');

        console.log('Verifying elements (Support)...');
        // Check for limited access (Support Staff shouldn't see Pharmacy?)
        // Actually, verifying they CAN see what they ARE supposed to see.
        await expect(page.getByText('Appointments')).toBeVisible();
        console.log('Support test passed.');
    });
});
