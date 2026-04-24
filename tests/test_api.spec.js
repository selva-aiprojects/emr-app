import { test } from '@playwright/test';

test('Test API Endpoint', async ({ page }) => {
    console.log('Testing /api/tenants endpoint...');

    // Navigate to the app first to establish the session
    await page.goto('/');

    // Wait a moment for any initial API calls
    await page.waitForTimeout(2000);

    // Try to call the API directly
    const response = await page.evaluate(async () => {
        try {
            const res = await fetch('/api/tenants');
            const data = await res.json();
            return { status: res.status, data };
        } catch (error) {
            return { error: error.message };
        }
    });

    console.log('API Response:', JSON.stringify(response, null, 2));

    // Also check what's in the select
    const options = await page.locator('select[name="tenantId"] option').allInnerTexts();
    console.log('Select options:', options);
});
