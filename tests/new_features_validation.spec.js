import { test, expect } from '@playwright/test';

const PASSWORD = 'Medflow@2026';

test.describe('EMR New Features Validation', () => {

  test('Superadmin: Access Platform Control', async ({ page }) => {
    await page.goto('/');
    
    // Login as Superadmin
    await page.locator('select[name="tenantId"]').selectOption({ label: 'Platform Governance Center' });
    await page.locator('input[type="email"]').fill('superadmin@emr.local');
    await page.locator('input[type="password"]').fill('Admin@123'); // Superadmin demo password
    await page.getByRole('button', { name: /Continue to Workflow/i }).click();

    // Verify Platform Control group in sidebar
    await expect(page.getByText(/Platform Control/i)).toBeVisible({ timeout: 15000 });
    
    // Verify Superadmin Page Content
    await expect(page.getByText(/Superadmin/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/INSTITUTIONAL CONSOLE/i)).toBeVisible();
    console.log('✅ Superadmin Access Verified');
  });

  test('Admin: Donor Hub Navigation & UI', async ({ page }) => {
    await page.goto('/');
    
    // Login as NAH Admin
    await page.locator('select[name="tenantId"]').selectOption({ label: 'New Age Hospital' });
    await page.locator('input[type="email"]').fill('admin@newage.hospital');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: /Continue to Workflow/i }).click();

    // Navigate to Donor Hub
    await page.getByText(/Blood Bank Hub \/ Donor Registry/i).first().click();

    // Verify Page Elements
    await expect(page.getByText(/Strategic donor registry/i)).toBeVisible();
    await expect(page.getByText(/Live Inventory Pulse/i)).toBeVisible();
    await expect(page.getByText(/Active Donors/i)).toBeVisible();
    console.log('✅ Donor Hub E2E Verified');
  });

  test('Admin: Staff Collaboration Hub', async ({ page }) => {
    await page.goto('/');
    
    // Login as NAH Admin
    await page.locator('select[name="tenantId"]').selectOption({ label: 'New Age Hospital' });
    await page.locator('input[type="email"]').fill('admin@newage.hospital');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: /Continue to Workflow/i }).click();

    // Navigate to Chat Hub
    await page.getByText(/Staff Collaborative Hub/i).first().click();

    // Verify Chat Elements
    await expect(page.getByText(/#Emergency Response/i)).toBeVisible();
    await expect(page.locator('input[placeholder*="#emergency-response"]')).toBeVisible();
    await expect(page.getByText(/End-to-end encrypted hub/i)).toBeVisible();
    console.log('✅ Collaboration Hub E2E Verified');
  });

});
