import { test, expect } from '@playwright/test';

test.describe('Superadmin Portal Validation', () => {
  test('Superadmin can log in and see tenant creation feature', async ({ page }) => {
    await page.goto('http://localhost:5177/login');

    // Select Platform Governance Center
    await page.locator('select[name="tenantId"]').selectOption('superadmin');
    
    // Fill credentials
    await page.locator('input[type="email"]').fill('superadmin@emr.local');
    await page.locator('input[type="password"]').fill('Admin@123');
    
    // Submit
    await page.getByRole('button', { name: /Authorize Entry/i }).click();

    // Verify redirect to Superadmin Page
    await expect(page.getByText('Platform Control', { exact: false })).toBeVisible({ timeout: 15000 });
    
    // Check for Tenant Creation Form
    await expect(page.getByRole('heading', { name: /Provision New Tenant/i })).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Superadmin successfully validated with Tenant Creation feature.');
  });
});
