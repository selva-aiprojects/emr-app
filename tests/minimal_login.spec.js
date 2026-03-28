import { test, expect } from '@playwright/test';

const TENANT_1_NAME = 'City General Hospital';
const STAFF = { email: 'jessica.taylor@citygen.local', password: 'Test@123', name: 'Staff Jessica Taylor' };

test('Minimal Login Test', async ({ page }) => {
    console.log('1. Navigating to login page...');
    await page.goto('/');

    console.log('2. Waiting for tenant select to be visible...');
    await page.locator('select[name="tenantId"]').waitFor({ state: 'visible', timeout: 10000 });

    console.log('3. Getting all tenant options...');
    const options = await page.locator('select[name="tenantId"] option').allInnerTexts();
    console.log('Available options:', options);

    console.log('4. Waiting for specific tenant option...');
    await page.locator('select[name="tenantId"]').locator(`option:text("${TENANT_1_NAME}")`).waitFor({ timeout: 10000 });

    console.log('5. Selecting tenant...');
    await page.locator('select[name="tenantId"]').selectOption({ label: TENANT_1_NAME });

    console.log('6. Filling email...');
    await page.locator('input[type="email"]').fill(STAFF.email);

    console.log('7. Filling password...');
    await page.locator('input[type="password"]').fill(STAFF.password);

    console.log('8. Clicking Sign In...');
    await page.getByRole('button', { name: /Sign in/i }).click();

    console.log('9. Waiting for user name to appear...');
    await expect(page.getByText(STAFF.name)).toBeVisible({ timeout: 10000 });

    console.log('✅ Login successful!');
});
