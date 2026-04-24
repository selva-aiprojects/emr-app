import { test, expect } from '@playwright/test';

test('Simple Page Load', async ({ page }) => {
    console.log('Navigating to page...');
    await page.goto('/');
    console.log('Page loaded. Checking title...');
    await expect(page).toHaveTitle(/MedFlow/i);
    console.log('Title checked.');
});
