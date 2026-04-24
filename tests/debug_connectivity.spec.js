
import { test, expect } from '@playwright/test';

test('Debug Frontend API Proxy and Logs', async ({ page }) => {
    // 1. Listen to console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));
    page.on('requestfailed', req => console.log(`REQUEST FAILED: ${req.url()} ${req.failure().errorText}`));

    // 2. Check if API is accessible via proxy
    const response = await page.request.get('/api/tenants');
    console.log(`API PROXY STATUS: ${response.status()}`);
    if (response.ok()) {
        const body = await response.json();
        console.log('API PROXY BODY:', JSON.stringify(body, null, 2));
    } else {
        console.log('API PROXY FAILED');
    }

    // 3. Load Login Page
    await page.goto('/');
    await page.waitForTimeout(5000);

    const options = await page.locator('select[name="tenantId"] option').allInnerTexts();
    console.log('OPTIONS FOUND:', options);
});
